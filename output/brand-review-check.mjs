import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
const browser = await chromium.launch({headless:true});
const page = await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[];
page.on('pageerror',e=>errors.push(e.message));
await fs.mkdir('output/brand-review',{recursive:true});
const results=[];
for (const [route,width] of [['/fr',1440],['/en/a-propos',1440],['/fr/a-propos',390],['/en',390],['/admin/login',390]]) {
  await page.setViewportSize({width,height:1000});
  const response=await page.goto('http://localhost:3001'+route,{waitUntil:'networkidle',timeout:120000});
  await page.locator('img').evaluateAll(async images=>Promise.all(images.map(img=>img.decode().catch(()=>{}))));
  const broken=await page.locator('img').evaluateAll(images=>images.filter(img=>!img.complete||img.naturalWidth===0).map(img=>img.src));
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth);
  await page.screenshot({path:`output/brand-review/${route.replaceAll('/','-')}-${width}.png`,fullPage:true});
  results.push({route,width,status:response.status(),broken,overflow});
  if(route==='/en' && width===390){
    await page.getByRole('button',{name:'Open menu',exact:true}).click();
    await page.getByRole('dialog').waitFor();
    const logo=page.getByRole('dialog').getByRole('img',{name:'HORA — Time. Redefined.',exact:true});
    results.push({mobileMenuLogoVisible:await logo.isVisible()});
    await page.screenshot({path:'output/brand-review/mobile-menu.png'});
  }
}
console.log(JSON.stringify({results,errors},null,2));
await browser.close();
if(errors.length||results.some(r=>r.status>=400||r.overflow||r.broken?.length))process.exitCode=1;
