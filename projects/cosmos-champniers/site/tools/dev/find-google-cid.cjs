const { chromium } = require('/Users/julien/julien-os/scripts/playwright/node_modules/playwright');
(async()=>{const b=await chromium.launch({headless:true});const p=await b.newPage({locale:'fr-FR'});
await p.goto('https://www.google.com/maps/search/Cosmos+restaurant+1156+route+de+la+Braconne+Champniers?hl=fr',{waitUntil:'domcontentloaded'});
await p.waitForTimeout(2500);
for(const l of ['Tout accepter','Accept all']){const x=p.getByRole('button',{name:l});if(await x.count()){await x.first().click();await p.waitForTimeout(3000);break;}}
await p.waitForTimeout(4000);
const links=await p.$$eval('a[href*="/maps/place/"]',as=>as.map(a=>a.href).slice(0,5));
console.log('URL',p.url());console.log(links.join('\n'));
console.log(await p.evaluate(()=>document.querySelector('h1')?.innerText+' | '+(document.querySelector('div.F7nice')?.innerText||'')));
await b.close();})();
