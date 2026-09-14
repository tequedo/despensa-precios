import test from 'node:test';
import assert from 'node:assert/strict';
import {notificationReceipt} from '../notification-receipt.mjs';
test('registrar una actualización para el resumen no demuestra envío de correo',async()=>{
 const result=await notificationReceipt(Response.json({kind:'sepa',status:'success',recorded:true,notified:false}),'sepa','success');
 assert.equal(result.recorded,true);assert.equal(result.notified,false);assert.equal(result.deliveryConfirmed,false);
 assert.equal(result.notificationStatus,'recorded_for_daily_summary');
});
test('distingue proveedor, reintento pendiente y evento duplicado',async()=>{
 for(const [recorded,notified,expected] of [[true,true,'accepted_by_email_provider'],[true,false,'pending_retry'],[false,false,'already_recorded']]){
  const result=await notificationReceipt(Response.json({kind:'sepa',status:'failed',recorded,notified}),'sepa','failed');
  assert.equal(result.notificationStatus,expected);assert.equal(result.deliveryConfirmed,false);
 }
});
test('un error HTTP o respuesta ajena al aviso no se registra como éxito',async()=>{
 await assert.rejects(notificationReceipt(new Response('',{status:503}),'sepa','success'));
 for(const value of [{},{kind:'sepa',status:'failed',recorded:true,notified:true}])await assert.rejects(notificationReceipt(Response.json(value),'sepa','success'));
});
