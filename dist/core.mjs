export function sessionId(c=globalThis.crypto){if(c.randomUUID)return c.randomUUID();return Array.from(c.getRandomValues(new Uint8Array(16)),b=>b.toString(16).padStart(2,"0")).join("");}
export function createSession(kind,now=Date.now()) {return {id:sessionId(),kind,status:'active',start:now,end:null,events:[{type:'start',t:now}],segments:[[]],gaps:[],notes:''};}
export function transition(s,action,t=Date.now()) {
 if(s.status==='finished')return;
 if(action==='pause'&&s.status==='active'){s.status='paused';s.events.push({type:'pause',t});}
 if(action==='resume'&&s.status==='paused'){s.status='active';s.events.push({type:'resume',t});s.segments.push([]);}
 if(action==='finish'){s.status='finished';s.end=t;s.events.push({type:'finish',t});}
}
export function elapsed(s,now=Date.now()) {let active=0,paused=0;for(let i=0;i<s.events.length;i++){let e=s.events[i],end=s.events[i+1]?.t??s.end??now,d=Math.max(0,end-e.t);if(e.type==='start'||e.type==='resume')active+=d;if(e.type==='pause')paused+=d;}return {active,paused};}
export function metres(a,b){let rad=Math.PI/180,dlat=(b.lat-a.lat)*rad,dlng=(b.lng-a.lng)*rad,x=Math.sin(dlat/2)**2+Math.cos(a.lat*rad)*Math.cos(b.lat*rad)*Math.sin(dlng/2)**2;return 6371000*2*Math.atan2(Math.sqrt(x),Math.sqrt(Math.max(0,1-x)));}
export function addPoint(s,p){if(s.status!=='active'||![p.lat,p.lng,p.accuracy,p.t].every(Number.isFinite)||Math.abs(p.lat)>90||Math.abs(p.lng)>180||p.accuracy<0||p.accuracy>35)return false;let seg=s.segments.at(-1),prev=seg.at(-1);if(prev){let dt=(p.t-prev.t)/1000,d=metres(prev,p);if(dt<=0)return false;if(p.t-(s.lastSampleAt??prev.t)>45000){s.gaps.push({from:s.lastSampleAt??prev.t,to:p.t});s.segments.push([]);seg=s.segments.at(-1);}else {if(d/dt>4.5)return false;if(d<Math.max(3,Math.min(prev.accuracy,p.accuracy)*0.5)){s.lastSampleAt=p.t;return false;}}}s.lastSampleAt=p.t;seg.push(p);return true;}
export function distance(s){return s.segments.reduce((sum,seg)=>sum+seg.slice(1).reduce((n,p,i)=>n+metres(seg[i],p),0),0);}
