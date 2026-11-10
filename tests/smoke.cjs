const fs = require("node:fs");
const vm = require("node:vm");
const assert = require("node:assert/strict");
const html = fs.readFileSync("index.html", "utf8");
assert.ok(html.includes('name="viewport"'),"Mobile viewport is present");
const match = html.match(/<script>([\s\S]*?)<\/script>/i);
assert.ok(match,"App JS exists");
new vm.Script(match[1],{filename:"barn-app.js"});

const memory = {};
const nodes = {};
const events = {};
const getNode = id => nodes[id] || (nodes[id] = {
  textContent:"",innerHTML:"",style:{},value:"",checked:false,
  showModal(){this.open=true},close(){this.open=false},
  addEventListener(type,fn){events["node:"+id+":"+type]=fn},
  querySelector(){return {prepend(){}}},
  prepend(){}
});
const doc = {
  getElementById:getNode,
  querySelectorAll(){return []},
  querySelector(){return {style:{}}},
  addEventListener(type,fn){events[type]=fn},
  createElement(){return {dataset:{},remove(){},click(){},style:{}}},
  body:{appendChild(){}}
};
const alerts=[];
const ctx={
  document:doc,window:{scrollTo(){},isSecureContext:false},localStorage:{
    getItem(key){return memory[key]??null},
    setItem(key,val){memory[key]=val}
  },
  alert(msg){alerts.push(msg)},confirm(){return true},prompt(){return "no"},
  navigator:{},URL,Date,Math,JSON,Object,String,Number,Array,RegExp,Blob,
  console,setTimeout(){},clearTimeout(){}
};
vm.runInNewContext(match[1],ctx,{filename:"barn-app.js"});
const KEY="barn-basketball-local-v1";
const getState=()=>JSON.parse(memory[KEY]);
function click(action,id=""){
  events.click({target:{closest(){return {dataset:{action,id}}}}});
}
function tab(tab){
  events.click({target:{closest(){return {dataset:{tab}}}}});
}
const initial=getState();
assert.equal(initial.players.length,6);
assert.deepEqual(Array.from(initial.players.slice(0,3),p=>p.name),["Mike","Drake","Christopher"]);
assert.equal(initial.settings.template,"Are you available to play some barn basketball at {time} on {day}?");
let g=initial.games[0];
assert.equal(g.capacity,6);assert.equal(g.time,"10:00");
assert.equal(Object.values(g.roster).filter(e=>e.status==="yes").length,3);
assert.ok(getNode("content").innerHTML.includes("3</strong><small>Open spots"));

// Invitation is only recorded after explicitly marking as sent.
click("invite","starter-3");
assert.equal(getState().games[0].roster["starter-3"],undefined);
click("sent-invite");
g=getState().games[0];
assert.equal(g.roster["starter-3"].status,"pending");
assert.ok(g.roster["starter-3"].invitedAt>0);
click("yes","starter-3");
assert.equal(getState().games[0].roster["starter-3"].status,"yes");
click("invite","starter-4");click("sent-invite");
click("no","starter-4");
click("invite","starter-5");click("sent-invite");
g=getState().games[0];
assert.equal(g.roster["starter-4"].status,"no");
assert.equal(g.roster["starter-5"].status,"pending");
const count=(g)=>Object.values(g.roster).filter(e=>e.status==="yes"||e.status==="pending").length;
assert.equal(count(g),5);

// Game history and statistics survive creation of the following week's game.
tab("stats");
assert.ok(getNode("content").innerHTML.includes("Player statistics"));
click("new-game");
const updated=getState();
assert.equal(updated.games.length,2);
assert.equal(Object.values(updated.games[1].roster).filter(e=>e.status==="yes").length,3);
assert.equal(updated.games[0].roster["starter-3"].status,"yes");
assert.equal(updated.games[0].roster["starter-4"].status,"no");
assert.ok(updated.activeGameId!==updated.games[0].id);
console.log("PASS: script syntax, startup, default roster, invitation, yes/no, stats and new game");
