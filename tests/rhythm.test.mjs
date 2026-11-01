import {test} from 'node:test';import assert from 'node:assert/strict';const r=await import('../dist/rhythm.mjs').catch(()=>({}));
test('ritmo livre calcula pace a partir de km e minutos',()=>{assert.equal(typeof r.resolveRhythm,'function');const v=r.resolveRhythm({distance:'2.4',minutes:'30'});assert.equal(v.paceSeconds,750);assert.equal(v.speed,4.8);});
test('pace opcional pode completar tempo a partir da distância',()=>{const v=r.resolveRhythm({distance:3,pace:'10:00'});assert.equal(v.minutes,30);});
test('pace não pode contradizer distância e tempo',()=>{assert.throws(()=>r.resolveRhythm({distance:3,minutes:30,pace:'05:00'}),/compat/);});
test('entradas vazias são opcionais; incompletas e não finitas são rejeitadas',()=>{assert.equal(r.resolveRhythm({}),null);assert.throws(()=>r.resolveRhythm({distance:1}),/dois/);assert.throws(()=>r.resolveRhythm({distance:1,minutes:Infinity}));});
test('formatação de pace usa minutos e segundos',()=>{assert.equal(r.formatPace(750),'12:30');});
