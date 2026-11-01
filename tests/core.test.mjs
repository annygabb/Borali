import {test} from 'node:test';
import assert from 'node:assert/strict';
const core=await import('../dist/core.mjs').catch(()=>({}));
test('tempo ativo exclui pausas e congela ao finalizar',()=>{
 assert.equal(typeof core.createSession,'function');
 let s=core.createSession('outdoor',1000);core.transition(s,'pause',61000);core.transition(s,'resume',121000);core.transition(s,'finish',181000);
 assert.equal(core.elapsed(s,999999).active,120000);assert.equal(core.elapsed(s,999999).paused,60000);
});
test('retomada não conecta deslocamento durante pausa',()=>{
 assert.equal(typeof core.createSession,'function');let s=core.createSession('outdoor',0);
 core.addPoint(s,{lat:0,lng:0,accuracy:5,t:1000});core.transition(s,'pause',2000);core.transition(s,'resume',100000);
 core.addPoint(s,{lat:1,lng:1,accuracy:5,t:101000});assert.equal(core.distance(s),0);
});
test('GPS ruim, duplicado ou salto é descartado',()=>{
 assert.equal(typeof core.createSession,'function');let s=core.createSession('outdoor',0);
 assert.equal(core.addPoint(s,{lat:0,lng:0,accuracy:100,t:1000}),false);
 core.addPoint(s,{lat:0,lng:0,accuracy:5,t:2000});assert.equal(core.addPoint(s,{lat:1,lng:1,accuracy:5,t:3000}),false);
 assert.equal(core.addPoint(s,{lat:0,lng:0,accuracy:5,t:2000}),false);assert.equal(core.distance(s),0);
});
test('lacuna temporal não vira distância e amostra válida soma',()=>{
 assert.equal(typeof core.createSession,'function');let s=core.createSession('outdoor',0);
 core.addPoint(s,{lat:0,lng:0,accuracy:5,t:1000});core.addPoint(s,{lat:0,lng:0.0001,accuracy:5,t:11000});assert.ok(core.distance(s)>10);
 core.addPoint(s,{lat:0,lng:0.01,accuracy:5,t:200000});assert.ok(core.distance(s)<12);
});
test('identificador funciona em preview sem randomUUID',()=>{assert.equal(typeof core.sessionId,'function');let id=core.sessionId({getRandomValues:a=>{a.fill(7);return a;}});assert.equal(typeof id,'string');assert.ok(id.length>=32);});
test('amostras regulares parado não criam lacunas de coleta',()=>{let s=core.createSession('outdoor',0);for(let t=1000;t<=100000;t+=1000)core.addPoint(s,{lat:0,lng:0,accuracy:5,t});assert.equal(s.gaps.length,0);assert.equal(core.distance(s),0);});
test('percurso sintético conhecido de um quilômetro é contabilizado',()=>{let s=core.createSession('outdoor',0);for(let i=0;i<=100;i++)core.addPoint(s,{lat:0,lng:i*.00008993216,accuracy:5,t:1000+i*10000});assert.ok(Math.abs(core.distance(s)-1000)<1);});
