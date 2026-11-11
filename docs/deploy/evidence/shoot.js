const { chromium } = require('playwright');
const fs = require('fs'); const path = require('path');
const [,, listFile, outDir, textDir, metaFile] = process.argv;
const urls = fs.readFileSync(listFile,'utf8').split('\n').map(s=>s.trim()).filter(Boolean);
const slug = u => { const x = new URL(u); return (x.hostname.replace(/\./g,'-') + x.pathname.replace(/\/$/,'').replace(/[^a-zA-Z0-9]+/g,'_') || 'home').replace(/_$/,''); };
(async () => {
  const browser = await chromium.launch({ proxy: { server: process.env.HTTPS_PROXY } });
  const meta = fs.existsSync(metaFile) ? JSON.parse(fs.readFileSync(metaFile)) : {};
  for (const u of urls) {
    const name = slug(u);
    if (meta[u] && meta[u].ok) continue;
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    const hosts = {}; const apis = new Set();
    page.on('request', r => { try { const x = new URL(r.url()); hosts[x.hostname] = (hosts[x.hostname]||0)+1; const t = r.resourceType(); if (t==='xhr'||t==='fetch') apis.add(r.method()+' '+x.origin+x.pathname); } catch {} });
    const rec = { name };
    try {
      const resp = await page.goto(u, { waitUntil: 'domcontentloaded', timeout: 45000 });
      rec.status = resp.status(); rec.finalUrl = page.url();
      const h = resp.headers(); rec.headers = Object.fromEntries(Object.entries(h).filter(([k]) => !/cookie/i.test(k)));
      await page.waitForLoadState('networkidle', { timeout: 12000 }).catch(()=>{});
      // trigger lazy content
      await page.evaluate(async () => { const st = 700; for (let y=0; y<document.body.scrollHeight && y<30000; y+=st) { window.scrollTo(0,y); await new Promise(r=>setTimeout(r,90)); } window.scrollTo(0,0); });
      await page.waitForTimeout(700);
      rec.title = await page.title();
      Object.assign(rec, await page.evaluate(() => ({
        h1: [...document.querySelectorAll('h1')].map(e=>e.innerText.trim()).slice(0,3),
        h2: [...document.querySelectorAll('h2')].map(e=>e.innerText.trim()).slice(0,40),
        desc: document.querySelector('meta[name=description]')?.content || '',
        generator: document.querySelector('meta[name=generator]')?.content || '',
        height: document.documentElement.scrollHeight,
        tabs: [...document.querySelectorAll('[role=tab]')].map(e=>e.innerText.trim()).filter(Boolean).slice(0,30),
        forms: [...document.querySelectorAll('form')].map(f=>({action:f.getAttribute('action'),method:f.getAttribute('method'),fields:[...f.querySelectorAll('input,select,textarea')].map(i=>i.name||i.type).slice(0,20)})).slice(0,6),
        islands: [...new Set([...document.querySelectorAll('astro-island')].map(e=>(e.getAttribute('component-url')||'').split('/').pop().split('.')[0]))].slice(0,60),
        jsonld: [...document.querySelectorAll('script[type="application/ld+json"]')].map(s=>{try{const j=JSON.parse(s.textContent);return [].concat(j['@graph']||j).map(x=>x['@type']).flat()}catch{return 'bad'}}).flat(),
        buttons: [...new Set([...document.querySelectorAll('header a, header button, nav a')].map(e=>e.innerText.trim()).filter(Boolean))].slice(0,60),
      })));
      fs.writeFileSync(path.join(textDir, name+'.txt'), await page.evaluate(()=>document.body.innerText));
      const hgt = Math.min(rec.height, 9000);
      await page.screenshot({ path: path.join(outDir, name+'.jpg'), type:'jpeg', quality: 52, fullPage: false, clip: { x:0, y:0, width:1280, height:hgt } , captureBeyondViewport: true});
      // tab states
      const n = await page.locator('[role=tab]').count(); rec.tabShots = [];
      for (let i=0; i<Math.min(n,8); i++) {
        try { const t = page.locator('[role=tab]').nth(i); if (!(await t.isVisible())) continue; const label = (await t.innerText()).trim().slice(0,30).replace(/[^a-zA-Z0-9]+/g,'-');
          await t.scrollIntoViewIfNeeded({timeout:3000}); await t.click({timeout:3000}); await page.waitForTimeout(450);
          const f = `${name}__tab${i+1}_${label}.jpg`; await page.screenshot({ path: path.join(outDir, f), type:'jpeg', quality: 52 }); rec.tabShots.push(f);
        } catch(e) {}
      }
      rec.hosts = hosts; rec.apis = [...apis].slice(0,60); rec.ok = true;
    } catch (e) { rec.error = String(e).slice(0,200); }
    meta[u] = rec; fs.writeFileSync(metaFile, JSON.stringify(meta,null,1));
    console.log(rec.ok?'OK ':'ERR', rec.status||'', u, rec.height||'', (rec.tabs||[]).length+' tabs', rec.error||'');
    await ctx.close();
  }
  await browser.close();
})();
