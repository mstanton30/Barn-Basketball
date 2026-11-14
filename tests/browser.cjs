const {chromium,webkit}=require('playwright'),fs=require('fs'),path=require('path'),assert=require('assert/strict');
(async()=>{for(const [name,type] of Object.entries({chromium,webkit})){
const browser=await type.launch(name==='chromium'&&process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{});
try{const page=await browser.newPage({viewport:{width:402,height:812},isMobile:true,hasTouch:true});
await page.route('http://barn.test/**',r=>{const file=path.basename(new URL(r.request().url()).pathname)||'index.html';return fs.existsSync(file)?r.fulfill({path:file}):r.abort()});
await page.goto('http://barn.test/');
await page.getByRole('button',{name:'Settings',exact:true}).click();
const saved=await page.evaluate(()=>JSON.stringify(localStorage));
await page.getByRole('button',{name:'Preview SD-style bottom bar',exact:true}).click();
const pinned=async()=>{const g=await page.evaluate(()=>{const n=document.querySelector('.tabs'),r=n.getBoundingClientRect(),s=document.getElementById('appScroll').getBoundingClientRect();return {parent:n.parentElement.tagName,bottom:r.bottom,top:r.top,scrollBottom:s.bottom,vh:visualViewport.height,offset:visualViewport.offsetTop,position:getComputedStyle(n).position,labels:[...n.querySelectorAll('span')].map(x=>x.getBoundingClientRect().bottom)}});assert.equal(g.parent,'BODY');assert.equal(g.position,'fixed');assert.ok(Math.abs(g.bottom-g.vh-g.offset)<2,JSON.stringify(g));assert.ok(g.scrollBottom<=g.top+1,JSON.stringify(g));assert.ok(g.labels.every(y=>y<=g.bottom),JSON.stringify(g))};
await pinned();assert.equal(await page.evaluate(()=>JSON.stringify(localStorage)),saved);
for(let i=0;i<3;i++){
await page.getByRole('button',{name:'Home',exact:true}).click();
await page.evaluate(()=>document.addEventListener('click',e=>{if(e.target.closest('a[href^="sms:"]'))e.preventDefault()},{capture:true,once:true}));
const invite=page.locator('a[data-action="batch-next-direct"],a[data-action="batch-start-invite"]').first();assert.equal(await invite.count(),1);await invite.click();
await page.evaluate(()=>{document.dispatchEvent(new Event('visibilitychange'));window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}));window.dispatchEvent(new Event('focus'))});await page.waitForTimeout(450);await pinned();
await page.getByRole('button',{name:'Settings',exact:true}).click();await page.locator('#gameDate').focus();await page.setViewportSize({width:402,height:480});await page.waitForTimeout(450);await pinned();
await page.locator('#gameDate').blur();await page.setViewportSize({width:874,height:402});await page.waitForTimeout(450);await pinned();
await page.setViewportSize({width:402,height:812});await page.waitForTimeout(450);await pinned();
}
const beforeReset=await page.evaluate(()=>JSON.stringify(localStorage));
await page.getByRole('button',{name:'Reset tab position',exact:true}).click();
assert.equal(await page.locator('.tabs').evaluate(n=>n.parentElement.id),'appFrame');assert.equal(await page.evaluate(()=>JSON.stringify(localStorage)),beforeReset);
await page.getByRole('button',{name:'Preview SD-style bottom bar',exact:true}).click();await page.reload();assert.equal(await page.locator('.tabs').evaluate(n=>n.parentElement.id),'appFrame');
console.log('PASS',name,'SD preview layout, invite/resume, keyboard-size/rotation, reset/reload; simulated browser only');
}finally{await browser.close()}}
})().catch(e=>{console.error(e);process.exitCode=1});
