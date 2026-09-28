const { chromium } = require('/Users/julien/julien-os/scripts/playwright/node_modules/playwright');
(async()=>{const b=await chromium.launch({headless:true});const p=await b.newPage();
await p.goto('http://localhost:5178/?jump=0');
const r=await p.evaluate(async()=>{const t0=performance.now();const link=document.querySelector('link[href*="fonts.googleapis"]');
const s=!!link.sheet; await document.fonts.ready; const t1=performance.now()-t0;
await new Promise(r=>{const i=setInterval(()=>{if(window.__ready){clearInterval(i);r()}},20)});
return {sheet:s,fontsReady:t1,status:document.fonts.status,readyAt:performance.now()}});
console.log(r);await b.close();})();
