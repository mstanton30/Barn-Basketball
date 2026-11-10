const fs=require("node:fs"),vm=require("node:vm"),assert=require("node:assert/strict");
const html=fs.readFileSync("index.html","utf8");
const src=html.match(/<script>([\s\S]*?)<\/script>/i)?.[1];
assert.ok(src);new vm.Script(src);
assert.ok(html.includes('autocomplete="name"'));assert.ok(html.includes('autocomplete="tel"'));
const memory={},nodes={},events={},alerts=[];
const node=id=>nodes[id]||(nodes[id]={
  textContent:"",innerHTML:"",style:{},classList:{toggle(){}},setAttribute(){},value:"",checked:false,disabled:false,focused:false,
  focus(){this.focused=true},remove(){},
  showModal(){this.open=true},close(){this.open=false},
  addEventListener(type,cb){events["node:"+id+":"+type]=cb},
  querySelector(){return {prepend(){}}},prepend(){}
});
const doc={
  getElementById:node,querySelectorAll(){return []},querySelector(){return {style:{}}},
  addEventListener(type,cb){events[type]=cb},
  createElement(){return {dataset:{},remove(){},click(){},style:{}}},
  body:{appendChild(){}}
};
const ctx={
  document:doc,window:{scrollTo(){},isSecureContext:true},
  localStorage:{getItem(k){return memory[k]??null},setItem(k,v){memory[k]=v},removeItem(k){delete memory[k]}},
  alert(m){alerts.push(m)},confirm(){return true},prompt(){return "no"},
  navigator:{clipboard:{writeText(){return Promise.resolve()}}},URL,Date,Math,JSON,Object,String,Number,Array,RegExp,Blob,console,
  setTimeout(){},clearTimeout(){},setInterval(){},
  FileReader:class {readAsText(file){this.result=file.content;this.onload()}}
};
vm.runInNewContext(src,ctx,{filename:"barn-app.js"});
const get=()=>JSON.parse(memory["barn-basketball-local-v1"]);
function click(action,id=""){events.click({target:{closest(){return {dataset:{action,id}}}}})}
function tab(v){events.click({target:{closest(){return {dataset:{tab:v}}}}})}
let s=get(),g=s.games[0];
assert.equal(s.players.length,6);
assert.deepEqual(s.players.slice(0,3).map(p=>p.name),["Mike","Drake","Christopher"]);
assert.equal(g.capacity,6);assert.equal(g.time,"10:00");
assert.equal(Object.values(g.roster).filter(e=>e.status==="yes").length,3);
assert.ok(node("content").innerHTML.includes("3</strong><small>Open spots"));
click("invite","starter-3");
assert.equal(get().games[0].roster["starter-3"],undefined);
assert.equal(node("confirmSent").disabled,true,"Must not confirm before attempting Messages");
click("sent-invite");
assert.equal(get().games[0].roster["starter-3"],undefined,"Button cannot fake a sent SMS");
click("copy-invite");
assert.equal(node("confirmSent").disabled,false,"After copying, allow explicit manual send confirmation");
assert.equal(JSON.parse(memory["barn-basketball-unsent-draft-v1"]).attempted,true);
click("sent-invite");
assert.equal(get().games[0].roster["starter-3"].status,"pending");
assert.equal(memory["barn-basketball-unsent-draft-v1"],undefined);
click("yes","starter-3");
click("invite","starter-4");click("copy-invite");click("sent-invite");click("no","starter-4");
click("invite","starter-5");click("copy-invite");click("sent-invite");
g=get().games[0];
assert.equal(g.roster["starter-3"].status,"yes");
assert.equal(g.roster["starter-4"].status,"no");
assert.equal(g.roster["starter-5"].status,"pending");
click("not-sent","starter-5");
assert.equal(get().games[0].roster["starter-5"].status,"not invited","False sent invitation can be corrected");
click("invite","starter-5");click("copy-invite");click("sent-invite");
assert.equal(get().games[0].roster["starter-5"].status,"pending");
// Past date guarantees the three-hour cutoff has passed.
tab("settings");
const past=new Date(Date.now()-2*86400000);
const ds=past.getFullYear()+"-"+String(past.getMonth()+1).padStart(2,"0")+"-"+String(past.getDate()).padStart(2,"0");
node("gameDate").value=ds;
node("gameTime").value="10:00";
node("capacity").value="6";
node("template").value=get().settings.template;
click("save-settings");
tab("stats");
assert.ok(node("content").innerHTML.includes("<th>No-show</th>"));
assert.ok(node("content").innerHTML.includes("John</td><td>1</td><td>0</td><td>0</td><td>1</td>"),"John should be auto-counted as played");
tab("game");click("toggle-no-show","starter-3");tab("stats");
assert.ok(node("content").innerHTML.includes("John</td><td>1</td><td>0</td><td>1</td><td>0</td>"),"No-show must remove played credit");
tab("game");click("toggle-no-show","starter-3");tab("stats");
assert.ok(node("content").innerHTML.includes("John</td><td>1</td><td>0</td><td>0</td><td>1</td>"),"Undo restores played credit");
// iPhone contact-assisted path and single-person vCard import.
tab("players");click("contact-player");
assert.equal(node("playerDialog").open,true);
assert.equal(node("playerName").focused,true);
events["node:contactFile:change"]({target:{files:[{content:"BEGIN:VCARD\nVERSION:3.0\nFN:Pat Smith\nTEL;TYPE=CELL:+15855550123\nEND:VCARD"}],value:""}});
assert.equal(node("playerName").value,"Pat Smith");
assert.equal(node("playerPhone").value,"+15855550123");
node("playerRegular").checked=false;node("playerActive").checked=true;
events["node:playerForm:submit"]({preventDefault(){}});
assert.ok(get().players.some(p=>p.name==="Pat Smith"&&p.phone==="+15855550123"));
const pat=get().players.find(p=>p.name==="Pat Smith");
tab("game");click("invite",pat.id);
assert.ok(node("openMessages").href.startsWith("sms:+15855550123&body="),"SMS link should be addressed and have text");
assert.equal(node("openPlainMessages").href,"sms:+15855550123");
click("open-messages");assert.equal(node("confirmSent").disabled,false);
assert.equal(get().games[0].roster[pat.id],undefined,"Opening Messages does not mark invitation as sent");
click("sent-invite");
assert.equal(get().games[0].roster[pat.id].status,"pending","Explicit user confirmation logs sent invitation");
// A new game preserves earlier RSVPs and attendance history.
click("new-game");
s=get();assert.equal(s.games.length,2);
assert.equal(s.games[0].roster["starter-3"].status,"yes");
assert.equal(s.games[0].roster["starter-4"].status,"no");
assert.equal(Object.values(s.games[1].roster).filter(e=>e.status==="yes").length,3);
console.log("PASS: guarded SMS workflow, direct link, sent confirmation, not-sent correction, 3-hour attendance, vCard, history");
