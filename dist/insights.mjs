import {distance,elapsed} from './core.mjs';
import {analyze} from './physiology.mjs';
export function sessionMetrics(s,profile={}){return analyze(s,profile);}
export function weeklyActivity(sessions,now=new Date()){const days=Array.from({length:7},(_,i)=>{let d=new Date(now.getFullYear(),now.getMonth(),now.getDate()-6+i);return {key:d.toLocaleDateString('pt-BR'),label:d.toLocaleDateString('pt-BR',{weekday:'short'}).replace('.',''),date:d.getDate(),minutes:0,count:0};});for(const s of sessions){if(s.status!=='finished')continue;const row=days.find(d=>d.key===new Date(s.start).toLocaleDateString('pt-BR'));if(row){row.minutes+=sessionMetrics(s).active/60000;row.count++;}}return days;}
