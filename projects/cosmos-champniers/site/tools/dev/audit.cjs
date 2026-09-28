// Audit global : erreurs console, overflow horizontal, positions des sections, hauteur totale.
const { chromium } = require('/Users/julien/julien-os/scripts/playwright/node_modules/playwright');
(async()=>{const b=await chromium.launch({headless:true});
for (const [w,h] of [[1440,900],[390,844]]) for (const url of ['http://localhost:5178/?jump=0','http://localhost:5178/evenements.html?jump=0']) {
 const p=await b.newPage({viewport:{width:w,height:h}});const errs=[];
 p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});p.on('pageerror',e=>errs.push('PAGEERR '+e.message));
 await p.goto(url);await p.waitForFunction(()=>window.__ready,null,{timeout:20000});
 const r=await p.evaluate(()=>({H:document.documentElement.scrollHeight,over:document.documentElement.scrollWidth-innerWidth,
   secs:[...document.querySelectorAll('[data-section]')].map(s=>s.id+':'+Math.round(s.getBoundingClientRect().top+scrollY)),
   h1:document.querySelectorAll('h1').length}));
 console.log(w,url.split('/').pop(),JSON.stringify(r),errs.length?'ERR '+errs.join(' | '):'0 err');await p.close();}
await b.close();})();
