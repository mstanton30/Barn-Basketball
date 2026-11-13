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
 await page.getByRole('button',{name:'Settings',exact:true}).click();await page.waitForFunction(()=>document.getElementById('appScroll').scrollTop<1);await pinned();
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
 // Reproduce the installed-iOS metric mismatch: visualViewport is 62px
 // shorter AND CSS vh is short. Native edge anchoring must fill the screen.
 await page.evaluate(()=>{
   Object.defineProperty(navigator,'standalone',{configurable:true,value:true});
   window.__testViewportHeight=innerHeight-62;
   Object.defineProperty(visualViewport,'height',{configurable:true,get(){return window.__testViewportHeight}});
   document.getElementById('viewportMeasure').style.height='calc(100vh - 62px)';
   document.activeElement.blur();
   document.querySelector('.tabs').style.paddingBottom='42px';
   window.dispatchEvent(new Event('pageshow'));
 });
 await page.waitForTimeout(450);
 const standalone=await page.evaluate(()=>{const nav=document.querySelector('.tabs');return {bottom:nav.getBoundingClientRect().bottom,full:innerHeight,padding:getComputedStyle(nav).paddingBottom,buttonBottom:nav.lastElementChild.getBoundingClientRect().bottom}});
 assert.ok(Math.abs(standalone.bottom-standalone.full)<2,JSON.stringify(standalone));
 assert.equal(standalone.padding,'42px');assert.ok(standalone.bottom-standalone.buttonBottom>=41);
 for(let i=0;i<3;i++){
   await page.getByRole('button',{name:'Settings',exact:true}).click();await page.locator('#gameDate').focus();
   await page.evaluate(()=>{window.__testViewportHeight=480;visualViewport.dispatchEvent(new Event('resize'))});await page.waitForTimeout(150);
   assert.equal(await page.locator('#appFrame').evaluate(e=>e.classList.contains('standalone-edges')),false);await pinned();
   await page.locator('#gameDate').blur();
   await page.evaluate(()=>{window.__testViewportHeight=innerHeight-62;window.dispatchEvent(new Event('pageshow'));document.dispatchEvent(new Event('visibilitychange'))});await page.waitForTimeout(450);
   assert.equal(await page.locator('#appFrame').evaluate(e=>e.classList.contains('standalone-edges')),true);
   assert.ok(await page.locator('.tabs').evaluate(e=>Math.abs(e.getBoundingClientRect().bottom-innerHeight)<2));
 }

 await page.evaluate(()=>{delete navigator.standalone;delete visualViewport.height;document.getElementById('viewportMeasure').style.removeProperty('height');document.querySelector('.tabs').style.removeProperty('padding-bottom');window.dispatchEvent(new Event('pageshow'))});await page.waitForTimeout(450);await pinned();
 // Reproduce actual device geometry, including a physically shorter browser
 // viewport. Compact controls must stay inside its clickable 812px area.
 await page.setViewportSize({width:402,height:812});
 await page.evaluate(()=>{
   Object.defineProperty(navigator,'standalone',{configurable:true,value:true});
   Object.defineProperty(screen,'width',{configurable:true,value:402});Object.defineProperty(screen,'height',{configurable:true,value:874});
   const p=document.getElementById('viewportMeasure');p.style.setProperty('--safe-top','62px');p.style.setProperty('--safe-bottom','34px');
   window.dispatchEvent(new Event('pageshow'));
 });await page.waitForTimeout(450);
 const compact=await page.locator('.tabs').evaluate(e=>({bottom:e.getBoundingClientRect().bottom,padding:getComputedStyle(e).paddingBottom,buttonBottom:e.lastElementChild.getBoundingClientRect().bottom}));
 assert.equal(compact.padding,'8px');assert.ok(Math.abs(compact.bottom-812)<2);assert.ok(compact.buttonBottom<=804);
 for(const label of ['Players','Stats','Settings','Home'])await page.getByRole('button',{name:label,exact:true}).click();
 await page.evaluate(()=>{delete navigator.standalone;delete screen.width;delete screen.height;const p=document.getElementById('viewportMeasure');p.style.removeProperty('--safe-top');p.style.removeProperty('--safe-bottom');window.dispatchEvent(new Event('pageshow'))});await page.waitForTimeout(450);
 assert.equal(await page.locator('#appFrame').evaluate(e=>e.classList.contains('native-bottom-gutter')),false);
 const storageBefore=await page.evaluate(()=>JSON.stringify(localStorage));
 const boxBefore=await page.locator('.tabs').boundingBox();
 let reports=[];page.on('dialog',async d=>{reports.push(d.message());await d.dismiss()});
 for(let i=0;i<4;i++)await page.locator('.brand').click();
 assert.equal(reports.length,0,'Diagnostic must stay hidden before five taps');
 await page.locator('.brand').click();await page.waitForTimeout(100);
 assert.equal(reports.length,1);assert.ok(reports[0].includes('Barn layout diagnostic 1'));assert.ok(reports[0].includes('Fixed probe:'));
 assert.ok(!reports[0].includes('Test 0'));assert.ok(!reports[0].includes('+1555'));
 assert.equal(await page.evaluate(()=>JSON.stringify(localStorage)),storageBefore,'Diagnostic leaves all saved data unchanged');
 assert.deepEqual(await page.locator('.tabs').boundingBox(),boxBefore,'Diagnostic leaves layout unchanged');
 for(let i=0;i<5;i++)await page.locator('.brand').click();await page.waitForTimeout(100);assert.equal(reports.length,2,'Diagnostic can reopen');
 const now=await page.evaluate(()=>JSON.parse(localStorage.getItem('barn-basketball-local-v1')));assert.deepEqual(now.players,JSON.parse(saved).players);assert.deepEqual(errors,[]);
 await page.getByRole('button',{name:'Home',exact:true}).click();await page.screenshot({path:`/tmp/barn-${name}.png`});console.log('PASS '+name+': scrolling, tab changes, app resume, keyboard-size viewport, rotation, repeated flows and saved players');
 }finally{await browser.close()}
}})().catch(e=>{console.error(e);process.exit(1)});
