const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('index.html','utf8');
const src=html.slice(html.indexOf('  var viewportFrame='),html.indexOf('  save();render();\n})();'));
const events={},props={},frames=[],timers=new Map();let nextTimer=1;
const target=prefix=>({addEventListener(name,fn){events[prefix+name]=fn}});
const vv={...target('vv:'),height:844,offsetTop:0,scale:1};
const window={...target('window:'),visualViewport:vv,innerHeight:844,requestAnimationFrame(fn){frames.push(fn);return frames.length}};
let fullHeight=844;
const document={...target('document:'),hidden:false,activeElement:null,getElementById(){return {getBoundingClientRect(){return {height:fullHeight}},style:{setProperty(k,v){props[k]=v}}}}};
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
assert.equal(props['--app-height'],'844px','Standalone must not shrink by safe area twice');
assert.equal(props['--app-top'],'0px');
document.activeElement={matches(){return true}};vv.height=480;vv.offsetTop=30;
events['vv:resize']();flush();assert.equal(props['--app-height'],'480px');assert.equal(props['--app-top'],'30px');
document.activeElement=null;vv.height=750;events['document:focusout']();flush();assert.equal(props['--app-height'],'844px');
fullHeight=390;vv.height=350;events['window:orientationchange']();flush();assert.equal(props['--app-height'],'390px');
assert.ok(html.includes('calc(8px + env(safe-area-inset-bottom))'),'Home indicator padding is preserved');
console.log('PASS: viewport keyboard, Messages resume, delayed metrics, rotation, zoom and fallback');
