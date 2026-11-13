const {chromium,webkit}=require('playwright'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{for(const [name,type] of Object.entries({chromium,webkit})){
 const browser=await type.launch();try{
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('http://barn.test/**',route=>{const file=path.basename(new URL(route.request().url()).pathname)||'index.html';if(!fs.existsSync(file))return route.abort();return route.fulfill({path:file,contentType:file.endsWith('.html')?'text/html':file.endsWith('.svg')?'image/svg+xml':file.endsWith('.png')?'image/png':'image/jpeg'})});
 await page.goto('http://barn.test/');
 const pinned=async()=>{const g=await page.evaluate(()=>{const r=document.querySelector('.tabs').getBoundingClientRect(),s=document.getElementById('appScroll').getBoundingClientRect();return {bottom:r.bottom,top:r.top,scrollBottom:s.bottom,height:visualViewport.height,offset:visualViewport.offsetTop,position:getComputedStyle(document.querySelector('.tabs')).position}});assert.equal(g.position,'relative');assert.ok(Math.abs(g.bottom-(g.height+g.offset))<2,JSON.stringify(g));assert.ok(g.scrollBottom<=g.top+1,JSON.stringify(g))};
 await pinned();
 await page.evaluate(()=>{const k='barn-basketball-local-v1',s=JSON.parse(localStorage.getItem(k));for(let i=0;i<20;i++)s.players.push({id:'fixture-'+i,name:'Test '+i,phone:'+1555555'+String(i).padStart(4,'0'),active:true,regular:false});localStorage.setItem(k,JSON.stringify(s))});await page.reload();
 await page.getByRole('button',{name:'Players',exact:true}).click();await page.locator('#appScroll').evaluate(e=>e.scrollTop=e.scrollHeight);await pinned();
 await page.getByRole('button',{name:'Settings',exact:true}).click();await page.waitForTimeout(500);assert.equal(await page.locator('#appScroll').evaluate(e=>e.scrollTop),0);await pinned();
 const saved=await page.evaluate(()=>localStorage.getItem('barn-basketball-local-v1'));
 for(let i=0;i<3;i++){
 await page.getByRole('button',{name:'Home',exact:true}).click();
 await page.evaluate(()=>document.addEventListener('click',e=>{if(e.target.closest('a[href^="sms:"]'))e.preventDefault()},{capture:true,once:true}));
 const invite=page.locator('a[data-action="batch-next-direct"], a[data-action="batch-start-invite"]').first();
 assert.equal(await invite.count(),1,'Each iteration must actually prepare an invitation');await invite.click();
 await page.evaluate(()=>{document.dispatchEvent(new Event('visibilitychange'));window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}));window.dispatchEvent(new Event('focus'))});
 await page.waitForTimeout(450);await pinned();
 await page.getByRole('button',{name:'Settings',exact:true}).click();await page.locator('#gameDate').focus();await page.setViewportSize({width:390,height:480});await page.waitForTimeout(450);await pinned();
 await page.locator('#gameDate').blur();await page.setViewportSize({width:844,height:390});await page.waitForTimeout(450);await pinned();
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(450);await pinned();
 }
 const now=await page.evaluate(()=>JSON.parse(localStorage.getItem('barn-basketball-local-v1')));assert.deepEqual(now.players,JSON.parse(saved).players);assert.deepEqual(errors,[]);
 await page.getByRole('button',{name:'Home',exact:true}).click();await page.screenshot({path:`/tmp/barn-${name}.png`});console.log('PASS '+name+': scrolling, tab changes, app resume, keyboard-size viewport, rotation, repeated flows and saved players');
 }finally{await browser.close()}
}})().catch(e=>{console.error(e);process.exit(1)});
