const fs=require("node:fs"),vm=require("node:vm"),assert=require("node:assert/strict");
const html=fs.readFileSync("index.html","utf8");
const src=html.match(/<script>([\s\S]*?)<\/script>/i)?.[1];
assert.ok(src);new vm.Script(src);
assert.ok(html.includes('autocomplete="name"'));
assert.ok(html.indexOf('</main>')<html.indexOf('<nav class="tabs"'),"Tab bar must be outside the scrolling main");
assert.ok(html.includes('position:fixed!important;inset:auto 0 0 0!important'),"Bottom bar is fixed to viewport");
assert.ok(html.includes('transform:none!important'),"Avoid iOS transformed fixed bar");
assert.ok(html.includes('z-index:9999!important'),"Tab bar remains above content");assert.ok(html.includes('autocomplete="tel"'));
assert.ok(html.includes('viewBox="0 0 144 62"'),"Top basketball logo has corrected geometry");
assert.ok(html.includes('M9 61 A63 63 0 0 1 135 61'),"Realistic basketball arc is present");
assert.ok(html.includes('src="barn-hoop-scoreboard.jpg"'),"Hoop is an explicit image, not a CSS background");
assert.ok(html.includes('class="hero-picture-overlay"'),"Readable text overlay is present");
assert.ok(fs.existsSync("barn-hoop-scoreboard.jpg"),"Hoop image asset exists");
const jpeg=fs.readFileSync("barn-hoop-scoreboard.jpg");
assert.ok(jpeg.length>1000&&jpeg[0]===0xff&&jpeg[1]===0xd8&&jpeg.at(-2)===0xff&&jpeg.at(-1)===0xd9,"Hoop JPG is complete");

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
assert.equal(get().players.length,3,"New installation should contain the real regulars, not sample players");
assert.deepEqual(get().players.map(p=>p.name),["Mike","Drake","Christopher"]);
assert.ok(get().liveLaunchResetDone,"New installation must not trigger future launch reset");
// Add temporary test-only players in local storage. They are never in shipped app defaults.
let fixture=get();
["John","Dave","Steve"].forEach((name,i)=>fixture.players.push({id:"starter-"+(i+3),name,phone:"",regular:false,active:true}));
memory["barn-basketball-local-v1"]=JSON.stringify(fixture);
vm.runInNewContext(src,ctx,{filename:"barn-fixture-app.js"});
let g=get().games[0];
assert.equal(get().players.length,6);
assert.deepEqual(get().players.slice(0,3).map(p=>p.name),["Mike","Drake","Christopher"]);
assert.equal(Object.values(g.roster).filter(e=>e.status==="yes").length,3);
assert.ok(node("content").innerHTML.includes("3 open"),"Dashboard shows available slots");
assert.ok(node("content").innerHTML.includes('class="hero-panel"'),"Next Game hero panel renders");
assert.ok(node("content").innerHTML.includes('class="snapshot-panel"'),"Player snapshot renders");
assert.ok(!node("content").innerHTML.includes('snapshot-name">John</span>'),"Uninvited players do not crowd the response dashboard");

assert.ok(node("content").innerHTML.includes("Saturday") || node("content").innerHTML.includes("Upcoming"),"Next game data is rendered");
assert.ok(!node("content").innerHTML.includes("#1 Priority"),"No priority label is shown under player names");
assert.ok(html.includes('court-lines.svg'),"Subtle court watermark asset is referenced");

assert.ok(html.includes('data-tab="game" aria-label="Home"'),"Bottom Home navigation is present");

for(let i=0;i<6;i++)setPhone("starter-"+i,"+1585555"+String(i+1).padStart(4,"0"));
// Direct open: no confirm modal and exactly one tap to mark pending.
tab("game");
assert.ok(node("content").innerHTML.includes('data-action="direct-invite"'));
assert.ok(node("content").innerHTML.includes('href="sms:+15855550004&amp;body='));
click("direct-invite","starter-3");
assert.equal(get().games[0].roster["starter-3"].status,"pending");
assert.equal(node("inviteDialog").open,undefined,"No confirmation dialog should open");
assert.equal(confirms,0,"No confirmation prompt on one-tap invitation");
tab("game");
assert.ok(node("content").innerHTML.includes('data-action="reset-last-invite"'),"Reset Invite must appear alongside main button");
click("reset-last-invite");
assert.equal(get().games[0].roster["starter-3"],undefined,"Reset Invite releases the most recent accidental invitation");
assert.equal(memory["barn-basketball-batch-v1"],undefined,"No leftover invite series");
assert.equal(confirms,0,"Reset Invite must be one tap, without confirmation");
click("direct-invite","starter-3");
click("not-sent","starter-3");
assert.equal(get().games[0].roster["starter-3"].status,"not invited");
assert.equal(confirms,0,"Correcting a canceled text should not prompt");
click("direct-invite","starter-3");click("yes","starter-3");
tab("game");
assert.ok(node("content").innerHTML.includes('snapshot-name">John</span>'),"Newly confirmed player appears on dashboard");

// Bulk opens the first individual SMS on the first click; returns to show Next link.
tab("game");
assert.ok(node("content").innerHTML.includes('data-action="batch-start-invite"'));
click("batch-start-invite","starter-4");
assert.equal(get().games[0].roster["starter-4"].status,"pending");
assert.equal(JSON.parse(memory["barn-basketball-batch-v1"]).ids[0],"starter-5");
tab("game");
click("reset-last-invite");
assert.equal(get().games[0].roster["starter-4"],undefined,"Reset cancels accidental first batch tap");
assert.equal(memory["barn-basketball-batch-v1"],undefined,"Reset cancels the whole active invite sequence");
assert.equal(get().games[0].roster["starter-3"].status,"yes","Prior confirmed player must be preserved");
click("batch-start-invite","starter-4");
assert.equal(get().games[0].roster["starter-4"].status,"pending");
assert.equal(JSON.parse(memory["barn-basketball-batch-v1"]).ids[0],"starter-5");
tab("game");
assert.ok(node("content").innerHTML.includes('data-action="batch-next-direct"'));
click("batch-next-direct","starter-5");
g=get().games[0];
assert.equal(Object.values(g.roster).filter(e=>e.status==="yes"||e.status==="pending").length,6);
assert.equal(memory["barn-basketball-batch-v1"],undefined);
tab("game");click("reset-last-invite");
g=get().games[0];
assert.equal(g.roster["starter-5"],undefined,"Can reset most recent invite even after a series ends");
assert.equal(g.roster["starter-4"].status,"pending","Reset must not erase earlier legitimate pending invitations");
assert.equal(Object.values(g.roster).filter(e=>e.status==="yes"||e.status==="pending").length,5);
click("direct-invite","starter-5");
g=get().games[0];
assert.equal(Object.values(g.roster).filter(e=>e.status==="yes"||e.status==="pending").length,6);
assert.equal(confirms,0,"Bulk sequence and Reset Invite must not ask for sending confirmations");
// Prevent a seventh invite; no overbooking.
const previous=prevented;
click("direct-invite","starter-3");
assert.ok(prevented>previous,"A duplicate or over-capacity send must be prevented");
click("yes","starter-4");click("yes","starter-5");
tab("game");
assert.equal((node("content").innerHTML.match(/class="snapshot-row"/g)||[]).length,6,"All six confirmed players display, not just four");
click("no","starter-5");
tab("game");
assert.ok(node("content").innerHTML.includes('snapshot-name">Steve</span>'),"Declined player remains in dashboard");
assert.ok(node("content").innerHTML.includes('>Declined</span>'),"Dashboard shows decline status");
click("yes","starter-5");

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
tab("players");assert.ok(node("content").innerHTML.includes("Manage Players"),"Players tab is present");
tab("stats");assert.ok(node("content").innerHTML.includes("Player statistics"),"Stats tab preserved");
tab("settings");assert.ok(node("content").innerHTML.includes("Game & message"),"Settings tab preserved");

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
// Legacy launch migration must preserve every saved contact, order and old game,
// clear ONLY the current game's trial replies, and never repeat after first launch.
const source=get();
const priorGame={id:"older-actual-game",date:source.games[0].date,time:"10:00",capacity:6,
  roster:{"starter-0":{status:"yes",regular:true,invitedAt:null},
          "starter-3":{status:"no",invitedAt:1}},finished:true};
const trialGame={id:"trial-active-game",date:source.games[0].date,time:"10:00",capacity:6,
  roster:{"starter-0":{status:"yes",regular:true,invitedAt:null},
          "starter-1":{status:"yes",regular:true,invitedAt:null},
          "starter-2":{status:"yes",regular:true,invitedAt:null},
          "starter-3":{status:"no",invitedAt:111},
          "starter-4":{status:"pending",invitedAt:222},
          "starter-5":{status:"no",invitedAt:null}},finished:false};
const oldData={...source,activeGameId:"trial-active-game",
  games:[priorGame,trialGame],liveLaunchResetDone:false};
const savedPlayers=JSON.stringify(oldData.players);
const legacyStore={"barn-basketball-local-v1":JSON.stringify(oldData),
  "barn-basketball-batch-v1":"legacy","barn-basketball-unsent-draft-v1":"legacy"};
const legacyCtx={...ctx,localStorage:{
  getItem(k){return legacyStore[k]??null},
  setItem(k,v){legacyStore[k]=v},
  removeItem(k){delete legacyStore[k]}
}};
vm.runInNewContext(src,legacyCtx,{filename:"barn-legacy-app.js"});
let migrated=JSON.parse(legacyStore["barn-basketball-local-v1"]);
assert.equal(migrated.liveLaunchResetDone,true);
assert.equal(JSON.stringify(migrated.players),savedPlayers,"Contact details and player order must not be changed");
assert.equal(JSON.stringify(migrated.games[0].roster["starter-3"]),JSON.stringify(priorGame.roster["starter-3"]),"Older history must remain");
assert.equal(Object.values(migrated.games[1].roster).filter(x=>x.status==="yes").length,3,"Regulars stay confirmed");
assert.equal(migrated.games[1].roster["starter-3"],undefined,"Trial decline cleared");
assert.equal(migrated.games[1].roster["starter-4"],undefined,"Trial pending cleared");
assert.equal(migrated.games[1].roster["starter-5"],undefined,"Uninvited No cleared");
assert.equal(legacyStore["barn-basketball-batch-v1"],undefined,"Old text batch cleared");
assert.equal(legacyStore["barn-basketball-unsent-draft-v1"],undefined,"Old draft cleared");
// Legacy no without invitation must not show Declined or count in the No column.
migrated.games[1].roster["starter-5"]={status:"no",invitedAt:null};
legacyStore["barn-basketball-local-v1"]=JSON.stringify(migrated);
vm.runInNewContext(src,legacyCtx,{filename:"barn-restart-app.js"});
assert.ok(node("content").innerHTML.includes("Not invited"),"Uninvited No must be shown as Not invited");
let restart=JSON.parse(legacyStore["barn-basketball-local-v1"]);
assert.equal(restart.games[1].roster["starter-5"].status,"no","One-time cleanup must not repeat on restart");
assert.ok(!html.includes("About this test")&&!html.includes("Reset sample data")&&!html.includes("optional in testing"),"Production UI must have no beta language");
assert.ok(html.includes("Clear current game invitations"),"Safe manual reset of current game is available");
console.log("PASS: Reset Invite cancels mistaken open and sequence, preserves earlier pending, production migration, one-tap SMS, six-player cap, reminders, attendance and Calendar");
