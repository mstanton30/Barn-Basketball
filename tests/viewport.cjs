const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('index.html','utf8');
const src=html.slice(html.indexOf('  var viewportFrame='),html.indexOf('  save();render();\n})();'));
const events={},props={},classes={},frames=[],timers=new Map();let nextTimer=1;
const target=prefix=>({addEventListener(name,fn){events[prefix+name]=fn}});
const vv={...target('vv:'),height:844,offsetTop:0,scale:1};
const window={getComputedStyle(){return {getPropertyValue(k){return k==='--safe-top'?safeTop+'px':safeBottom+'px'}}},...target('window:'),visualViewport:vv,innerHeight:844,requestAnimationFrame(fn){frames.push(fn);return frames.length}};
let fullHeight=844,safeTop=0,safeBottom=0;
const document={body:{classList:{contains(){return false}}},...target('document:'),hidden:false,activeElement:null,getElementById(){return {classList:{toggle(name,on){classes[name]=on}},getBoundingClientRect(){return {height:fullHeight}},style:{setProperty(k,v){props[k]=v}}}}};
const navigator={standalone:false};
const ctx={window,document,navigator,Math,setTimeout(fn){const id=nextTimer++;timers.set(id,fn);return id},clearTimeout(id){timers.delete(id)}};
vm.runInNewContext(src,ctx);
const flush=()=>{while(frames.length)frames.shift()()};
assert.equal(props['--app-height'],'844px');
// Keyboard opens and pans, then closes without a page reload.
vv.height=480;vv.offsetTop=40;events['vv:resize']();events['vv:scroll']();flush();
assert.equal(props['--app-height'],'480px');assert.equal(props['--app-top'],'40px');
vv.height=844;vv.offsetTop=0;events['document:focusout']();flush();
assert.equal(props['--app-height'],'844px');assert.equal(props['--app-top'],'0px');
// App switch, bfcache restore, orientation changes and delayed geometry updates.
for(const event of ['document:visibilitychange','window:pageshow','window:focus','window:orientationchange']){
 vv.height=390;events[event]();flush();assert.equal(props['--app-height'],'390px');
 vv.height=844;for(const fn of [...timers.values()])fn();flush();assert.equal(props['--app-height'],'844px');
}
assert.equal(timers.size,2,'Resume retries replace old retries instead of accumulating');
vv.scale=2;vv.height=422;events['vv:resize']();flush();assert.equal(props['--app-height'],'844px','Pinch zoom must not rearrange the application');
vv.scale=1;vv.height=0;window.innerHeight=0;events['vv:resize']();flush();assert.equal(props['--app-height'],'844px','Suspended zero metrics must not collapse navigation');
window.visualViewport=null;window.innerHeight=700;events['window:resize']();flush();assert.equal(props['--app-height'],'700px');
// Installed iOS: visual viewport excludes safe areas; CSS vh still covers the
// usable screen. Keep the nav at the full edge without changing its padding.
window.visualViewport=vv;vv.height=750;vv.offsetTop=0;window.innerHeight=750;
navigator.standalone=true;events['window:pageshow']();flush();
assert.equal(classes['standalone-edges'],true,'Standalone fills fixed edges regardless of reported height');
assert.equal(props['--app-height'],'844px','Standalone fallback must not shrink by safe area twice');
assert.equal(props['--app-top'],'0px');
document.activeElement={matches(){return true}};vv.height=480;vv.offsetTop=30;
events['vv:resize']();flush();assert.equal(props['--app-height'],'480px');assert.equal(props['--app-top'],'30px');assert.equal(classes['standalone-edges'],false);
document.activeElement=null;vv.height=750;events['document:focusout']();flush();assert.equal(props['--app-height'],'844px');
fullHeight=390;vv.height=350;events['window:orientationchange']();flush();assert.equal(props['--app-height'],'390px');
fullHeight=750;vv.height=750;events['window:pageshow']();flush();assert.equal(classes['standalone-edges'],true,'Even CSS vh underreporting must leave edge anchoring enabled');
assert.ok(html.includes('.app-frame.standalone-edges{position:fixed;inset:0;height:auto}'),'Standalone ignores shortened CSS and JS heights');
assert.ok(html.includes('calc(8px + env(safe-area-inset-bottom))'),'Home indicator padding is preserved');
console.log('PASS: viewport keyboard, Messages resume, delayed metrics, rotation, zoom and fallback');

vv.offsetTop=0;window.screen={width:402,height:874};window.innerWidth=402;window.innerHeight=812;vv.height=812;fullHeight=812;safeTop=62;safeBottom=34;events['window:pageshow']();flush();assert.equal(classes['native-bottom-gutter'],true);
vv.height=480;document.activeElement={matches(){return true}};events['vv:resize']();flush();assert.equal(classes['native-bottom-gutter'],false);
document.activeElement=null;vv.height=812;safeTop=0;events['window:pageshow']();flush();assert.equal(classes['native-bottom-gutter'],false);
safeTop=62;window.innerHeight=874;vv.height=874;events['window:pageshow']();flush();assert.equal(classes['native-bottom-gutter'],false);
console.log('PASS: compact padding only for measured native gutter, not keyboard or normal viewport');
// Preview nav geometry is recalculated during keyboard/resume, with no CSS
// claim about the physical area below a native iPhone viewport.
const navStyle={removeProperty(k){delete this[k]}};
document.querySelector=()=>({style:navStyle,getBoundingClientRect:()=>({height:80})});
document.body.classList={contains:()=>true,toggle(){}};
window.innerHeight=812;window.innerWidth=402;fullHeight=812;vv.height=812;vv.offsetTop=0;safeTop=62;safeBottom=34;navigator.standalone=true;document.activeElement=null;
events['window:pageshow']();flush();
assert.equal(props['--preview-nav-height'],'80px');assert.equal(navStyle.top,undefined);assert.equal(navStyle.bottom,undefined);
document.activeElement={matches(){return true}};vv.height=480;vv.offsetTop=30;events['vv:resize']();flush();
assert.equal(navStyle.top,'430px');assert.equal(navStyle.bottom,'auto');
document.activeElement=null;vv.height=812;vv.offsetTop=0;
for(const e of ['window:pageshow','document:visibilitychange','window:focus']){events[e]();flush();assert.equal(navStyle.top,undefined);assert.equal(navStyle.bottom,undefined)}
console.log('PASS: SD preview keyboard positioning and native-bottom restoration on resume');
