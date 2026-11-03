import {distance,elapsed} from './core.mjs';
export const SOURCES=[['Compêndio 2024 — caminhada e escadas','https://pacompendium.com/walking/'],['Definição de MET','https://pacompendium.com/'],['Equação ACSM e limites de velocidade','https://pmc.ncbi.nlm.nih.gov/articles/PMC7896743/'],['Relação entre passada, altura e velocidade','https://pubmed.ncbi.nlm.nih.gov/8225138/'],['Razões empíricas altura/passo; variabilidade populacional','https://www.sciencedirect.com/science/article/pii/S1752928X17301208']];
function walkingMet(rounded){return rounded<3.2?{met:2.3,code:'17151'}:rounded<=3.9?{met:2.8,code:'17152'}:rounded===4?{met:3,code:'17170'}:rounded>=4.5&&rounded<=5.5?{met:3.8,code:'17190'}:rounded>=5.6&&rounded<=6.3?{met:4.8,code:'17200'}:rounded>=6.4&&rounded<=7.1?{met:5.5,code:'17220'}:null;}
export function analyze(s,provided={}){
 const p=s.profileSnapshot??provided,original=elapsed(s).active,active=Number.isFinite(s.correctedMinutes)&&s.correctedMinutes>0?s.correctedMinutes*60000+Math.max(0,original-(s.correctionOriginalActive??original)):original,minutes=active/60000;
 let km=s.segments.some(seg=>seg.length>1)?distance(s)/1000:null,kmSource=km===null?'não registrada':'GPS';const issues=[],parts=[],stairs=s.stairs||[],stairCount=stairs.reduce((sum,e)=>sum+(e.flights||[]).reduce((a,n)=>a+(Number.isInteger(n)&&n>0?n:0),0),0);
 let stride=Number(p.stride)>=20&&Number(p.stride)<=150?Number(p.stride):null,stepMethod=stride?'Calibração pessoal: distância ÷ passos contados':null;
 if(!stride&&Number(p.height)>=100&&Number(p.height)<=230&&['female','male'].includes(p.sex)){stride=Number(p.height)*(p.sex==='female'?.413:.415);stepMethod='Aproximação empírica: altura × '+(p.sex==='female'?'0,413':'0,415')+'. Não se ajusta automaticamente ao ritmo; prefira calibração.';}
 if(!stride&&Number(p.height)>=100&&Number(p.height)<=230){stride=Number(p.height)*.414;stepMethod='Passo aproximado pela altura (0,414 × altura). Informe seu passo medido para personalizar.';}
 const base={slow:{speedRange:[3.2,3.9],met:2.8,code:'17152',name:'Lenta, 3,2–3,9 km/h'},moderate:{speedRange:[4.5,5.5],met:3.8,code:'17190',name:'Moderada, 4,5–5,5 km/h'},brisk:{speedRange:[5.6,6.3],met:4.8,code:'17200',name:'Rápida, 5,6–6,3 km/h'}}[s.pace];
 let used=0,energy=0,gross=0,complete=true;const weight=Number(p.weight),age=Number(p.age),validProfile=weight>=20&&weight<=350&&age>=19&&age<=59;
 const add=(met,duration,label,formula)=>{if(!(duration>=0&&Number.isFinite(duration)&&Number.isFinite(met))){complete=false;return;}used+=duration;energy+=(met-1)*weight*duration/60;gross+=met*weight*duration/60;parts.push({label,minutes:duration,met,formula});};
 if(s.kind==='treadmill'){
  const segments=s.treadmill||[];let distanceTotal=0;
  for(const t of segments){const speed=Number(t.speed),duration=Number(t.minutes),incline=Number(t.incline||0);if(!(speed>0&&Number.isFinite(speed)&&duration>0&&incline>=0&&incline<=30)){complete=false;continue;}distanceTotal+=speed*duration/60;
   if(speed<3.2||speed>5.6){complete=false;issues.push('Trecho fora de 3,2–5,6 km/h: sem estimativa ACSM nesta versão.');used+=duration;continue;}
   const vo2=3.5+.1*(speed*1000/60)+1.8*(speed*1000/60)*(incline/100),met=vo2/3.5;add(met,duration,'Esteira · '+speed+' km/h · '+incline+'%', 'ACSM: VO₂ = 3,5 + 0,1v + 1,8vG; MET = VO₂/3,5. v em m/min; G = inclinação/100.');
  }
  if(segments.length){km=distanceTotal;kmSource='velocidade × tempo dos trechos';}else{km=null;complete=false;}
  if(Number.isFinite(s.manualKm)&&s.manualKm>=0){km=s.manualKm;kmSource='painel da esteira, informado';}
 } else {
  let stairMinutes=0;for(const e of stairs){const d=Number(e.minutes);if(e.minutes===null||e.minutes===''||!(d>0)){complete=false;issues.push('Escada sem duração: calorias indisponíveis.');continue;}stairMinutes+=d;add(e.direction==='down'?3.5:6.8,d,e.direction==='down'?'Escadas · descida · código 17070':'Escadas · subida geral · código 17131','MET do Compêndio 2024.');}
  if(s.efforts?.length){let totalKm=0;for(const t of s.efforts){const d=Number(t.distance),duration=Number(t.minutes),speed=d/duration*60;if(!(d>0&&duration>0&&Number.isFinite(speed))){complete=false;continue;}totalKm+=d;const rounded=Math.round(speed*10)/10;const entry=walkingMet(rounded);if(entry)add(entry.met,duration,'Caminhada informada · '+d+' km em '+duration+' min · código '+entry.code,'Velocidade = distância ÷ tempo; MET do Compêndio 2024 para faixa correspondente.');else{used+=duration;complete=false;issues.push('Velocidade informada sem faixa de referência implementada: sem estimativa energética total.');}}if(km===null){km=totalKm;kmSource='trechos realizados, informados';}}
  else if(kmSource==='GPS'&&km>0&&stairs.length===0){
   const gpsMinutes=s.segments.reduce((sum,segment)=>sum+segment.slice(1).reduce((duration,point,index)=>{
    const delta=point.t-segment[index].t;
    return duration+(delta>0&&delta<=45000?delta/60000:0);
   },0),0);
   const duration=Math.min(minutes,gpsMinutes);
   if(duration>0){
    const entry=walkingMet(Math.round(km/duration*600)/10)??{met:3.5,code:'17160'};
    add(entry.met,duration,'Caminhada por GPS · código '+entry.code,'MET do Compêndio 2024 aplicado ao tempo entre pontos registrados.');
   }
  }
  else if(base)add(base.met,Math.max(0,minutes-stairMinutes),'Caminhada '+base.name+' · código '+base.code,'MET do Compêndio 2024 por ritmo informado.');else{complete=false;issues.push('Confirme os quilômetros e o tempo realizados nos detalhes para estimar calorias.');}
 }
 if(Math.abs(used-minutes)>.1&&!(kmSource==='GPS'&&parts.some(part=>part.label.startsWith('Caminhada por GPS')))){complete=false;issues.push('A duração dos trechos deve cobrir o tempo ativo sem ultrapassá-lo.');}
 if(!validProfile)issues.push('Calorias exigem peso e idade de 19–59 anos; outras faixas precisam de referência própria.');
 if(s.interval&&s.kind!=='treadmill'&&!s.efforts?.length)issues.push('Caminhada intervalada: estimativa pelo ritmo geral informado, sem multiplicador adicional.');
 if(s.gaps?.length)issues.push('Há lacunas na coleta. Duração não comprova movimento; confira o tempo ativo.');
 const stairTime=stairs.reduce((a,t)=>a+(Number(t.minutes)||0),0),stepsRange=km===null&&stride&&base&&s.kind!=='treadmill'&&!stairs.some(t=>!(Number(t.minutes)>0))?base.speedRange.map(v=>Math.round(v*1000*Math.max(0,minutes-stairTime)/60/(stride/100))):null;
 if(stepsRange)issues.push('Faixa de passos no plano derivada do ritmo informado e do tempo; não é contagem por sensor nem distância medida.');
 return {stepsRange,active,paused:elapsed(s).paused,originalActive:original,km,kmSource,steps:km!==null&&stride?Math.round(km*1000/(stride/100)):null,stepCm:stride,stepMethod,stairCount,kcal:complete&&validProfile&&parts.length?energy:null,grossKcal:complete&&validProfile&&parts.length?gross:null,parts,issues,method:'MET: kcal totais ≈ MET × peso(kg) × tempo(h); kcal ativas ≈ (MET − 1) × peso × tempo. Conversão convencional de 1 MET ≈ 1 kcal/kg/h.',version:'borali-2024-v2',profileUsed:{weight:p.weight??null,height:p.height??null,age:p.age??null},sources:SOURCES};
}
