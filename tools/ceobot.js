// CEO bot: runs each business type for 12 years run by me vs a great CEO (all stats 82+), with a moving economy,
// and flags suspicious CEO decisions. Usage: node tools/ceobot.js [types comma-separated] [seeds]
const {JSDOM}=require('jsdom');const html=require('fs').readFileSync(require('path').join(__dirname,'..','index.html'),'utf8');
const types=(process.argv[2]||'cafe,restaurant,bar,truck,fashion,gym,salon,farm').split(',');const SEEDS=+(process.argv[3]||4);
const agg={};const flags={};
for(const type of types)for(const mode of ['me','ceo'])for(let seed=1;seed<=SEEDS;seed++){
const d=new JSDOM(html,{runScripts:'dangerously',url:'https://x.test/',beforeParse(w){w.AudioContext=undefined;}});const w=d.window;w.onerror=e=>console.log('ERR',e);
const r=JSON.parse(w.eval(`closeSheet();newLife({seed:${seed*13+7},city:'Austin, USA',age:30,money:3000000});S.st.smarts=80;S.st.looks=70;
mTab='biz';openSheet(drawMoney);startBiz('${type}');[...document.querySelectorAll('#sheet button.choice')].find(x=>/Launch/.test(x.textContent)).click();closeSheet();
const b=S.biz[0];const hire=()=>{b.ceo=makeCEO(b,82,95);b.ceo.integ=R(82,95);b.ceo.loyal=90;b.ceo.pers='steady';};
if('${mode}'==='ceo'){b.life='delegate';hire();b.mand='bal';b.ceoLim=250000;}else b.life='hands';
let tot=0,loss=0,bad=[];const snap=()=>JSON.stringify({locs:b.locs,prods:(b.products||[]).map(p=>({id:p.id,price:p.price,last:p.last,sup:supOf(p)}))});
for(let y=0;y<12&&S.biz.includes(b);y++){S.used={};if('${mode}'==='ceo'&&!b.ceo)hire();
 if(S.econ){countryEconYear&&0;}
 const before=JSON.parse(snap()),pre0=b.lastPre,rev0=b.lastRev;
 simBiz(b);
 while(Q.length){const e=Q.shift();const ch=typeof e.ch==='function'?e.ch():e.ch;const o=ch.filter(x=>!(x[2]&&x[2]()));(o.find(x=>/Approve|Keep them|Match it|Bank loan|Pay the|Cover it|Put in all|Vote against|Fight/.test(x[0]))||o[0])[1]();}
 if(!S.biz.includes(b))break;
 tot+=b.lastPre;if(b.lastPre<0)loss++;
 const note=(S.log[S.log.length-1].lines.map(l=>l.t).filter(t=>t.includes('mandate)'))[0]||'');
 // suspicious decisions
 (b.products||[]).forEach(p=>{const L=p.last;if(!L)return;const bp0=before.prods.find(x=>x.id===p.id);if(!bp0)return;
   if(L.dem>L.sold*1.1&&p.price<bp0.price*0.99)bad.push('y'+y+' lowered price of sold-out '+p.id);
   if((L.waste>L.sold*.2||(p.inv||0)>L.sold*.3)&&p.price>bp0.price*1.01)bad.push('y'+y+' raised price with leftovers '+p.id);});
 if(/closed a losing outlet/.test(note)&&b.lastPre>0)bad.push('y'+y+' closed outlet while profitable');
 if(/retired/.test(note)&&b.lastPre>0&&(b.products||[]).length===0)bad.push('y'+y+' retired last product');
 if(/marketing .* → strong|→ heavy/.test(note)&&b.lastPre/Math.max(1,b.lastRev)<.1)bad.push('y'+y+' raised marketing on thin margin');
 if(b.cash<0)bad.push('y'+y+' cash negative '+Math.round(b.cash));
 // try each economy: randomise
 for(const k in S.cecon)S.cecon[k].phase=['boom','normal','normal','recession'][Math.floor(rnd()*4)];
}
JSON.stringify({tot:Math.round(tot/1000),loss,alive:S.biz.includes(b),locs:S.biz.includes(b)?b.locs:0,bad})`));
const k=type+' '+mode;(agg[k]=agg[k]||[]).push(r);r.bad.forEach(x=>{const t=x.replace(/^y\d+ /,'').replace(/ -?\d+$/,'').replace(/ \w+$/,m=>/sold-out|leftovers/.test(x)?'':m);flags[t]=(flags[t]||0)+1;});}
for(const t of types){const m=agg[t+' me'],c=agg[t+' ceo'];const f=a=>a.map(x=>(x.alive?'':'💀')+x.tot+'k').join(' ');
 console.log(t.padEnd(11),'ME ',f(m).padEnd(40),'CEO',f(c),' lossyrs me',m.reduce((a,x)=>a+x.loss,0),'ceo',c.reduce((a,x)=>a+x.loss,0));}
console.log('FLAGS',JSON.stringify(flags));
