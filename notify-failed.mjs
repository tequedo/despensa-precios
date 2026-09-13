const endpoint=process.env.NOTIFICATION_ENDPOINT,token=process.env.PRICE_INGEST_TOKEN;
if(!endpoint||!token)throw new Error('Falta la configuración de avisos');
const response=await fetch(endpoint,{method:'POST',headers:{authorization:`Bearer ${token}`,'content-type':'application/json'},body:JSON.stringify({kind:'sepa',status:'failed',runId:process.env.NOTIFICATION_RUN_ID,runUrl:process.env.NOTIFICATION_RUN_URL,details:['La actualización de precios de Argentina no terminó. Revisar el proceso; conservar los últimos datos completos y su fecha real.']}),signal:AbortSignal.timeout(20000)});
if(!response.ok)throw new Error(`No se pudo entregar el aviso de error: HTTP ${response.status}`);
console.log('Aviso de fallo registrado');
