// Parcourt toute la page par ?jump= et assemble une planche contact.
const { chromium } = require('/Users/julien/julien-os/scripts/playwright/node_modules/playwright');
const [,, W, H, STEP, TAG, PAGE] = process.argv;
(async()=>{const b=await chromium.launch({headless:true});
 const p=await b.newPage({viewport:{width:+W,height:+H}});
 const base='http://localhost:5178/'+(PAGE||'');
 await p.goto(base+'?jump=0');await p.waitForFunction(()=>window.__ready);
 const total=await p.evaluate(()=>document.documentElement.scrollHeight-innerHeight);
 let i=0;for(let y=0;y<=total+1;y+=+STEP){
  await p.goto(base+'?jump='+y);await p.waitForFunction(()=>window.__ready,null,{timeout:20000});await p.waitForTimeout(350);
  await p.screenshot({path:`${__dirname}/${TAG}-${String(i++).padStart(2,'0')}-${y}.jpg`,type:'jpeg',quality:70});
 }
 console.log(TAG,i,'captures, total',total);await b.close();})();
