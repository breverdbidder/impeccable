const { chromium, devices } = require('playwright');
const out = process.argv[2];
(async () => {
  const b = await chromium.launch({ proxy: { server: process.env.HTTPS_PROXY } });
  let c = await b.newContext({ viewport: { width: 1280, height: 900 } }); let p = await c.newPage();
  await p.goto('https://ploy.ai/auth/sign-up', { waitUntil: 'networkidle', timeout: 45000 }).catch(()=>{});
  await p.screenshot({ path: out + '/ploy-ai_auth_sign-up.jpg', type: 'jpeg', quality: 55 }); console.log('signup', p.url(), await p.title());
  await p.goto('https://ploy.ai/pricing', { waitUntil: 'networkidle', timeout: 45000 }).catch(()=>{});
  for (const label of ['Annual', 'Monthly']) { const t = p.getByText(label, { exact: true }).first(); try { await t.click({ timeout: 4000 }); await p.waitForTimeout(500); await p.screenshot({ path: `${out}/ploy-ai_pricing__toggle_${label}.jpg`, type: 'jpeg', quality: 55 }); console.log('pricing', label); } catch (e) { console.log('no', label) } }
  await p.goto('https://ploy.ai/', { waitUntil: 'networkidle', timeout: 45000 }).catch(()=>{});
  for (const label of ['Product', 'Solutions', 'Resources']) { try { await p.locator('header').getByText(label, { exact: true }).first().hover({ timeout: 4000 }); await p.waitForTimeout(600); await p.screenshot({ path: `${out}/ploy-ai__nav_${label}.jpg`, type: 'jpeg', quality: 55 }); console.log('nav', label, (await p.locator('header').innerText()).replace(/\n+/g,' | ').slice(0,900)); } catch (e) { console.log('no nav', label) } }
  const tok = await p.evaluate(() => { const cs = getComputedStyle(document.body); const h = document.querySelector('h1'); const btn = [...document.querySelectorAll('a,button')].find(e => /Start Free/i.test(e.innerText)); const g = e => { const s = getComputedStyle(e); return { font: s.fontFamily.slice(0,80), size: s.fontSize, weight: s.fontWeight, color: s.color, bg: s.backgroundColor, radius: s.borderRadius, transform: s.textTransform, ls: s.letterSpacing } }; const vars = {}; for (const sh of document.styleSheets) { try { for (const r of sh.cssRules) if (r.selectorText === ':root' || r.selectorText === ':root, :host') for (const n of r.style) if (n.startsWith('--') && Object.keys(vars).length < 70) vars[n] = r.style.getPropertyValue(n).trim().slice(0,50); } catch {} } return { body: g(document.body), h1: h && g(h), btn: btn && g(btn), vars } });
  console.log(JSON.stringify(tok));
  await c.close();
  c = await b.newContext({ ...devices['iPhone 14'] }); p = await c.newPage();
  await p.goto('https://ploy.ai/', { waitUntil: 'networkidle', timeout: 45000 }).catch(()=>{});
  await p.screenshot({ path: out + '/ploy-ai__mobile.jpg', type: 'jpeg', quality: 55 }); console.log('mobile');
  await b.close();
})();
