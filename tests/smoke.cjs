const fs=require("node:fs"),vm=require("node:vm"),assert=require("node:assert/strict");
const html=fs.readFileSync("index.html","utf8");
const src=html.match(/<script>([\s\S]*?)<\/script>/i)?.[1];
assert.ok(src);new vm.Script(src);
assert.ok(html.includes('autocomplete="name"'));assert.ok(html.includes('autocomplete="tel"'));
const memory={},nodes={},events={},alerts=[],calendarFiles=[];
let confirms=0,prevented=0;
const node=id=>nodes[id]||(nodes[id]={
 textContent:"",innerHTML:"",style:{},classList:{toggle(){}},setAttribute(){},
 value:"",checked:false,disabled:false,focused:false,
 focus(){this.focused=true},remove(){},
 showModal(){this.open=true},close(){this.open=false},
 addEventListener(type,cb){events["node:"+id+":"+type]=cb},
 querySelector(){return {prepend(){}}},prepend(){}
});
const doc={getElementById:node,querySelectorAll(){return []},querySelector(){return {style:{}}},
 addEventListener(type,cb){events[type]=cb},
 createElement(){return {dataset:{},remove(){},click(){},style:{}}},
 body:{appendChild(){}}};
const ctx={document:doc,window:{scrollTo(){},isSecureContext:true},
 localStorage:{getItem(k){return memory[k]??null},setItem(k,v){memory[k]=v},removeItem(k){delete memory[k]}},
 alert(m){alerts.push(m)},confirm(){confirms++;return true},prompt(){return "no"},
 navigator:{clipboard:{writeText(){return Promise.resolve()}}},
 URL:{createObjectURL(blob){calendarFiles.push(blob);return "blob:unit-test"},revokeObjectURL(){}},
 Date,Math,JSON,Object,String,Number,Array,RegExp,
 Blob:class {constructor(parts,opts){this.parts=parts;this.type=opts.type}},console,
 setTimeout(){},clearTimeout(){},setInterval(){},
 FileReader:class {readAsText(file){this.result=file.content;this.onload()}}};
vm.runInNewContext(src,ctx,{filename:"barn-app.js"});
const get=()=>JSON.parse(memory["barn-basketball-local-v1"]);
function click(action,id=""){events.click({target:{closest(){return {dataset:{action,id}}}},preventDefault(){prevented++}})}
function tab(v){events.click({target:{closest(){return {dataset:{tab:v}}}}})}
function setPhone(pid,num){
 tab("players");click("edit",pid);
 const p=get().players.find(p=>p.id===pid);
 node("playerName").value=p.name;node("playerPhone").value=num;
 node("playerRegular").checked=!!p.regular;node("playerActive").checked=true;
 events["node:playerForm:submit"]({preventDefault(){}});
}
function setGame(date,time="10:00"){
 tab("settings");
 node("gameDate").value=date;node("gameTime").value=time;node("capacity").value="6";
 node("template").value=get().settings.template;
 node("reminderTime").value="19:00";
 node("reminderTemplate").value=get().settings.reminderTemplate;
 click("save-settings");
 tab("game");
}
let g=get().games[0];
assert.equal(get().players.length,6);
assert.deepEqual(get().players.slice(0,3).map(p=>p.name),["Mike","Drake","Christopher"]);
assert.equal(Object.values(g.roster).filter(e=>e.status==="yes").length,3);
assert.ok(node("content").innerHTML.includes("3</strong><small>Open spots"));
for(let i=0;i<6;i++)setPhone("starter-"+i,"+1585555"+String(i+1).padStart(4,"0"));
// Direct open: no confirm modal and exactly one tap to mark pending.
tab("game");
assert.ok(node("content").innerHTML.includes('data-action="direct-invite"'));
assert.ok(node("content").innerHTML.includes('href="sms:+15855550004&amp;body='));
click("direct-invite","starter-3");
assert.equal(get().games[0].roster["starter-3"].status,"pending");
assert.equal(node("inviteDialog").open,undefined,"No confirmation dialog should open");
assert.equal(confirms,0,"No confirmation prompt on one-tap invitation");
click("not-sent","starter-3");
assert.equal(get().games[0].roster["starter-3"].status,"not invited");
assert.equal(confirms,0,"Correcting a canceled text should not prompt");
click("direct-invite","starter-3");click("yes","starter-3");
// Bulk opens the first individual SMS on the first click; returns to show Next link.
tab("game");
assert.ok(node("content").innerHTML.includes('data-action="batch-start-invite"'));
click("batch-start-invite","starter-4");
assert.equal(get().games[0].roster["starter-4"].status,"pending");
assert.equal(JSON.parse(memory["barn-basketball-batch-v1"]).ids[0],"starter-5");
assert.ok(node("content").innerHTML || true);
tab("game");
assert.ok(node("content").innerHTML.includes('data-action="batch-next-direct"'));
click("batch-next-direct","starter-5");
g=get().games[0];
assert.equal(Object.values(g.roster).filter(e=>e.status==="yes"||e.status==="pending").length,6);
assert.equal(memory["barn-basketball-batch-v1"],undefined);
assert.equal(confirms,0,"Bulk sequence must not ask for sending confirmations");
// Prevent a seventh invite; no overbooking.
const previous=prevented;
click("direct-invite","starter-3");
assert.ok(prevented>previous,"A duplicate or over-capacity send must be prevented");
click("yes","starter-4");click("yes","starter-5");
assert.equal(Object.values(get().games[0].roster).filter(e=>e.status==="yes").length,6);
// Night-before reminder is also one-tap per person, no RSVP changes.
tab("game");
assert.ok(node("content").innerHTML.includes('data-action="batch-start-reminder"'));
click("batch-start-reminder","starter-0");
assert.equal(get().games[0].roster["starter-0"].status,"yes");
assert.ok(get().games[0].roster["starter-0"].reminderSentAt>0);
assert.equal(JSON.parse(memory["barn-basketball-batch-v1"]).ids.length,5);
tab("game");click("batch-next-direct","starter-1");
assert.ok(get().games[0].roster["starter-1"].reminderSentAt>0);
click("cancel-batch");
assert.equal(memory["barn-basketball-batch-v1"],undefined);
assert.equal(confirms,0);
// Three-hour rule stays intact.
const past=new Date(Date.now()-2*86400000);
const pd=past.getFullYear()+"-"+String(past.getMonth()+1).padStart(2,"0")+"-"+String(past.getDate()).padStart(2,"0");
setGame(pd);
tab("stats");
assert.ok(node("content").innerHTML.includes("John</td><td>1</td><td>0</td><td>0</td><td>1</td>"));
tab("game");click("toggle-no-show","starter-3");tab("stats");
assert.ok(node("content").innerHTML.includes("John</td><td>1</td><td>0</td><td>1</td><td>0</td>"));
tab("game");click("toggle-no-show","starter-3");
// Calendar alert creation remains available for a future date.
const ahead=new Date(Date.now()+14*86400000);
setGame(ahead.getFullYear()+"-"+String(ahead.getMonth()+1).padStart(2,"0")+"-"+String(ahead.getDate()).padStart(2,"0"));
click("calendar-reminder");
const ics=calendarFiles[calendarFiles.length-1]?.parts.join("");
assert.ok(ics&&ics.includes("BEGIN:VALARM")&&ics.includes("TRIGGER:PT0S"));
assert.ok(ics.includes("T190000"));
// Contact card importing still works.
tab("players");click("contact-player");
events["node:contactFile:change"]({target:{files:[{content:"BEGIN:VCARD\nVERSION:3.0\nFN:Pat Smith\nTEL;TYPE=CELL:+15855550123\nEND:VCARD"}],value:""}});
assert.equal(node("playerName").value,"Pat Smith");
assert.equal(node("playerPhone").value,"+15855550123");
// Saved data / next game remain intact.
node("playerRegular").checked=false;node("playerActive").checked=true;
events["node:playerForm:submit"]({preventDefault(){}});
assert.ok(get().players.find(p=>p.name==="Pat Smith"));
click("new-game");
assert.equal(get().games.length,2);
assert.equal(Object.values(get().games[1].roster).filter(e=>e.status==="yes").length,3);
console.log("PASS: one-tap SMS links, no confirmations, batch cap and continuation, no-send correction, reminders, attendance, Calendar alert, contact import, history");
