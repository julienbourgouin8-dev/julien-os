const { chromium } = require('/Users/julien/julien-os/scripts/playwright/node_modules/playwright');
(async()=>{const b=await chromium.launch({headless:true});const p=await b.newPage({locale:'fr-FR',userAgent:'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128 Safari/537.36'});
for (const u of ['https://www.instagram.com/cosmos.champniers/','https://www.facebook.com/search/top?q=cosmos%20champniers']){
 try{await p.goto(u,{waitUntil:'domcontentloaded',timeout:20000});await p.waitForTimeout(3000);
 const og=await p.$$eval('meta[property="og:image"]',m=>m.map(x=>x.content));console.log(u,'\n',og.join('\n'));}catch(e){console.log(u,'ERR',e.message)}}
await b.close();})();
