import {createHash} from 'node:crypto';
const plain=value=>String(value??'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
const normalized=value=>plain(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
const days=[['DOMINGO',0],['LUNES',1],['MARTES',2],['MIERCOLES',3],['JUEVES',4],['VIERNES',5],['SABADO',6]];
const date=value=>{const m=String(value??'').match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);if(!m)return null;const y=m[3].length===2?'20'+m[3]:m[3],iso=`${y}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`,parsed=new Date(iso+'T12:00:00Z');return Number.isFinite(parsed.getTime())&&parsed.toISOString().slice(0,10)===iso?iso:null;};
export function discoverBankPromotion({id,title,terms,provider,chain,sourceUrl,checkedAt}) {
 const original=plain(terms), text=normalized(original), summary=plain(title), header=normalized(summary);
 if(!original)return null;
 const match=text.match(/(?:VALID[OA]|VIGENCIA)(?:\s+(?:DESDE|DEL))?(?:\s+EL)?\s*(\d{1,2}\/\d{1,2}\/\d{2,4})\s*(?:AL|HASTA(?:\s+EL)?)\s*(\d{1,2}\/\d{1,2}\/\d{2,4})/);
 const range=match?{validFrom:date(match[1]),validTo:date(match[2])}:{validFrom:null,validTo:null};
 const percent=header.match(/(\d{1,2}(?:[.,]\d+)?)\s*%/), daysOfWeek=days.filter(([name])=>new RegExp('\\b'+name+'\\b').test(header)).map(([,n])=>n);
 const retiredOnly=/JUBILAD|PENSIONAD/.test(header);
 const issuer=plain(provider)||(/MODO/.test(header)?'MODO':retiredOnly?'Jubilados y pensionados':'Banco o tarjeta: ver condiciones');
 const today=new Date(new Date(checkedAt).getTime()-3*3600000).toISOString().slice(0,10);
 return {id:'bank-'+chain+'-'+(id||createHash('sha256').update(original).digest('hex').slice(0,20)),provider:issuer,chain,title:summary||issuer,kind:/CUOTAS/.test(header)&&!percent?'installments':/REINTEGRO/.test(text)?'reimbursement':'discount',discountPercent:percent?Number(percent[1].replace(',','.')):null,daysOfWeek,dayLabels:days.filter(([,n])=>daysOfWeek.includes(n)).map(([name])=>name.toLowerCase()),...range,retiredOnly,paymentRequirement:summary,capRule:'Consultar tope y período en las condiciones oficiales',geographicScope:null,exclusionsVerified:false,accumulable:false,sourceUrl,checkedAt,sourceRecordId:id??null,termsText:original.slice(0,16000),termsHash:createHash('sha256').update(original).digest('hex'),status:range.validTo&&range.validTo<today?'expired':'incomplete',calculationEligible:false,calculationBlockedReason:'Información oficial encontrada; faltan validar en forma estructurada el medio de pago, alcance, topes y exclusiones. No se aplica al total.',reasons:['Condiciones pendientes de validación completa']};
}
