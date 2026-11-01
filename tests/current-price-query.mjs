const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const failure = (message, kind, status = null) => Object.assign(new Error(message), {kind, status});
const statusKind = status => status === 401 || status === 403 ? 'auth'
  : status === 429 ? 'rate_limit' : status >= 500 ? 'server' : 'http';

// Prepare exactly the frozen source generation checked by the smoke. Never
// replace that expectation with a newer generation without its source shards.
export function createCurrentPriceQuery({origin, headers = () => ({}), fetcher = fetch,
  pause = wait, clock = Date.now, maxAttempts = 13, intervalMs = 15000,
  preparationBudgetMs = 300000, policyVersion = ''} = {}) {
  const prepared = new Map();
  const scopeFor = (scope, parameters) => {
    const raw = parameters.storeIds ?? scope.storeIds;
    const storeIds = [...new Set((Array.isArray(raw) ? raw : String(raw ?? '').split(','))
      .map(String).map(value => value.trim()).filter(Boolean))].sort();
    return {province:scope.province, ...(scope.locality ? {locality:scope.locality} : {}),
      ...(scope.lat != null ? {lat:scope.lat} : {}), ...(scope.lon != null ? {lon:scope.lon} : {}),
      ...(scope.radiusKm != null ? {radiusKm:scope.radiusKm} : {}),
      ...(storeIds.length ? {storeIds} : {})};
  };
  const requestJson = async (url, init, phase) => {
    let response;
    try { response = await fetcher(url, init); }
    catch (error) {
      throw failure(`${phase}: no se completó la solicitud.`,
        ['TimeoutError','AbortError'].includes(error?.name) ? 'timeout' : 'network');
    }
    if (![200,202,409].includes(response.status))
      throw failure(`${phase}: HTTP ${response.status}.`, statusKind(response.status), response.status);
    let body;
    try { body = await response.json(); }
    catch { throw failure(`${phase}: respuesta JSON inválida.`, 'invalid_response', response.status); }
    return {response, body};
  };
  const prepare = async (scope, generation, key) => {
    if (prepared.has(key)) return prepared.get(key);
    const pending = (async () => {
      const started = clock();
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const remaining = preparationBudgetMs - (clock() - started);
        if (remaining <= 0) break;
        const {response, body} = await requestJson(origin+'/api/public-prices/prepare', {
          method:'POST', headers:{'content-type':'application/json'}, redirect:'error',
          body:JSON.stringify({...scope, expectedGeneration:generation}),
          signal:AbortSignal.timeout(Math.max(1,Math.min(90000,remaining))),
        }, 'Preparación del catálogo');
        if (response.status === 200 && body.ready === true && body.generation === generation) return;
        if (typeof body.generation === 'string' && body.generation > generation)
          throw failure('La generación cambió durante la verificación; hace falta su nueva fuente.', 'generation_changed', response.status);
        // Contract: 202 is an active preparation; 409 says the source CDN
        // has not propagated expectedGeneration. A contradictory 200 fails.
        if (![202,409].includes(response.status))
          throw failure('El catálogo no confirmó la generación esperada.', 'generation_mismatch', response.status);
        const budget = preparationBudgetMs - (clock() - started);
        if (attempt + 1 < maxAttempts && budget > 0) await pause(Math.min(intervalMs,budget));
      }
      throw failure('La nueva generación no quedó preparada dentro del plazo.', 'timeout');
    })();
    prepared.set(key,pending);
    try { await pending; } catch (error) { prepared.delete(key); throw error; }
  };
  return async (scope, parameters, expectedGeneration) => {
    if (typeof expectedGeneration !== 'string' || !Number.isFinite(Date.parse(expectedGeneration)))
      throw failure('Falta una generación válida de la fuente congelada.', 'invalid_source');
    const target = scopeFor(scope,parameters), key = JSON.stringify([policyVersion,target,expectedGeneration]);
    const search = new URLSearchParams({...scope,best:'producto',...parameters,
      ...(target.storeIds ? {storeIds:target.storeIds.join(',')} : {})});
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await prepare(target,expectedGeneration,key);
      const {response,body} = await requestJson(origin+'/api/prices?'+search, {
        headers:typeof headers === 'function' ? headers() : headers,
        redirect:'error', signal:AbortSignal.timeout(45000),
      }, 'Lectura de precios');
      const coverage = body.coverage;
      if (response.status === 200 && coverage?.generatedAt === expectedGeneration
        && coverage.updating !== true && coverage.preparingIndex !== true) return body;
      if ([coverage?.generatedAt,coverage?.latestGeneratedAt].some(value => typeof value === 'string' && value > expectedGeneration))
        throw failure('La generación cambió durante la verificación; hace falta su nueva fuente.', 'generation_changed', response.status);
      if (response.status !== 200)
        throw failure(`Lectura de precios: HTTP ${response.status}.`, statusKind(response.status), response.status);
      prepared.delete(key);
      if (attempt + 1 < maxAttempts) await pause(intervalMs);
    }
    throw failure('La app no leyó la generación preparada de la fuente.', 'generation_mismatch');
  };
}
