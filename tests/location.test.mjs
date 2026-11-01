import {test} from 'node:test';import assert from 'node:assert/strict';const m=await import('../dist/location.mjs').catch(()=>({}));
test('posição normalizada preserva precisão e horário',()=>{assert.equal(typeof m.positionFix,'function');assert.deepEqual(m.positionFix({coords:{latitude:-16,longitude:-48,accuracy:12},timestamp:1000}),{lat:-16,lng:-48,accuracy:12,t:1000});});
test('erro de permissão orienta a liberar localização',()=>{assert.match(m.locationError({code:1}),/permissão/i);});
test('coordenada inválida não vira localização fictícia',()=>{assert.equal(typeof m.positionFix,'function');assert.throws(()=>m.positionFix({coords:{latitude:999,longitude:0,accuracy:5},timestamp:1}));});
