import test from 'node:test';
import assert from 'node:assert/strict';
import { auditBenefit, buildPromotionMatrix } from '../promotion-coverage.mjs';

const generatedAt='2026-10-09T20:00:00Z';
const candidate={id:'test',chain:'ChangoMás',provider:'Banco ejemplo',title:'20%',kind:'reimbursement',status:'verified',calculationEligible:true,discountPercent:20,paymentRequirement:'Visa crédito',daysOfWeek:[5],validFrom:'2026-10-01',validTo:'2026-10-31',capAmount:10000,capPeriod:'month',capOwner:'account',capRule:'Mensual por cuenta',geographicScope:'San Juan',branchEligibilityVerified:true,accumulable:false,exclusionsVerified:true,termsHash:'abc',sourceUrl:'https://www.masonline.com.ar/promociones-bancarias',checkedAt:'2026-10-09T19:00:00Z'};
test('audit records fully evidenced conditions but never applies a promotion',()=>{
  const row=auditBenefit(candidate,generatedAt);
  assert.equal(row.auditableForCalculation,true); assert.equal(row.applied,false);
  assert.deepEqual(row.blockedReasons,[]);
});
test('a status label cannot bypass missing cap/period/branch or conflicting evidence',()=>{
  for(const delta of [{capAmount:null,capRule:null},{capPeriod:null},{capOwner:null},{branchEligibilityVerified:false},{exclusionsVerified:false},{status:'conflict'},{calculationEligible:false},{reasons:['Porcentaje contradictorio.']}]){
    const row=auditBenefit({...candidate,...delta},generatedAt);
    assert.equal(row.auditableForCalculation,false); assert.equal(row.applied,false);
  }
});
test('freshness is the real Argentine calendar day, not the report generation date',()=>{
  for(const checkedAt of ['2026-10-08T22:00:00Z','2026-10-09T02:59:59Z','2026-10-10T00:00:00Z','wrong']){
    const row=auditBenefit({...candidate,checkedAt},generatedAt);assert.equal(row.checkedToday,false);assert.equal(row.auditableForCalculation,false);
  }
});
test('a readable page with no extraction is not complete promotion coverage',()=>{
  const m=buildPromotionMatrix({generatedAt,sources:[{sourceId:'a',checkedAt:generatedAt,reachable:true,extractedCandidates:0},{sourceId:'b',checkedAt:generatedAt,reachable:true,extractedCandidates:2,failedSourceRecords:1},{sourceId:'c',checkedAt:generatedAt,reachable:false}],candidates:[{...candidate,status:'incomplete',calculationEligible:false}]});
  assert.equal(m.completeCoverage,false); assert.equal(m.summary.reachableSources,2);
  assert.equal(m.sources[0].extractionStatus,'no_conditions_extracted');assert.equal(m.sources[1].extractionStatus,'partial');assert.equal(m.sources[2].extractionStatus,'unavailable');
  assert.equal(m.summary.blocked,1);assert.equal(m.productOffers.reportAvailable,false);assert.equal(m.productOffers.reportCheckedToday,false);
});
test('a new bank check does not refresh an old product offer or manufacture 2x1/3x2',()=>{
  const m=buildPromotionMatrix({generatedAt,retailerReport:{generatedAt:'2026-10-08T20:00:00Z',sources:[{checkedAt:'2026-10-08T20:00:00Z',reachable:true}]},retailerVerified:{scope:'San Juan',promotions:[]}});
  assert.equal(m.summary.productPromotions,0);assert.equal(m.summary.productSourcesCheckedToday,0);assert.equal(m.productOffers.reportCheckedToday,false);assert.equal(m.completeCoverage,false);
});
