import test from 'node:test';
import assert from 'node:assert/strict';
import {replenishment} from '../catalog-policy/lib/market-features.mjs';
test('shared replenishment retains 10g precision without changing whole package quantities',()=>{const p={id:1,name:'Test-only weighted selection',unit:'kg',stock:0,minimumStock:0},buys=[{productId:1,quantity:.1,purchasedAt:'2026-09-01'},{productId:1,quantity:.1,purchasedAt:'2026-09-15'}];assert.equal(replenishment([p],buys,14)[0].quantity,.1);assert.equal(replenishment([{...p,stock:.09}],buys,14)[0].quantity,.01);assert.equal(replenishment([{...p,unit:'unidad'}],buys,14)[0].quantity,1);});
