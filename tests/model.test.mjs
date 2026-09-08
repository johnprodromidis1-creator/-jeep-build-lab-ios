import assert from "node:assert/strict";
import test, {after} from "node:test";
import {readFile,mkdir,rm} from "node:fs/promises";
import {build} from "esbuild";
import {DatabaseSync} from "node:sqlite";
const root=new URL("..",import.meta.url).pathname;
const output=root+"/.sites-runtime/unit/";
await mkdir(output,{recursive:true});
const sql=new DatabaseSync(":memory:");
sql.exec(await readFile(root+"/drizzle/0000_blue_captain_stacy.sql","utf8"));
const DB={prepare(query){const stmt=sql.prepare(query);const bound=(args=[])=>({bind(...a){return bound(a);},async all(){return{results:stmt.all(...args),success:true};},async first(){return stmt.get(...args)??null;},async run(){const r=stmt.run(...args);return{success:true,meta:{changes:Number(r.changes)}};}});return bound();}};
globalThis.__testEnv={DB};
async function module(file,name){await build({entryPoints:[root+"/"+file],outfile:output+name+".mjs",bundle:true,format:"esm",platform:"node",plugins:[{name:"test-binding",setup(b){b.onResolve({filter:/^cloudflare:workers$/},()=>({path:"env",namespace:"binding"}));b.onLoad({filter:/.*/,namespace:"binding"},()=>({contents:"export const env = globalThis.__testEnv;"}));}}]});return import(output+name+".mjs");}
const model=await module("lib/model.ts","model");
const api=await module("app/api/builds/route.ts","builds");
const catalog=await module("app/api/catalog/route.ts","catalog");
const {initialState,baseCatalog,totalFor,buildIssues,stateSchema}=model;
const base=()=>structuredClone(initialState);
const req=(user,method="GET",body,origin="https://test.local",query="")=>new Request("https://test.local/api/builds"+query,{method,headers:{...(user?{"oai-authenticated-user-id":user}:{}),origin,"Content-Type":"application/json"},...(body?{body:JSON.stringify(body)}:{})});

test("catalog has 43 unique variants with positive cent prices and HTTPS sources",()=>{
 assert.equal(baseCatalog.length,43);assert.equal(new Set(baseCatalog.map(p=>p.id)).size,43);
 for(const p of baseCatalog){assert.ok(Number.isInteger(p.priceCents)&&p.priceCents>0);assert.equal(new URL(p.url).protocol,"https:");}
});
test("totals multiply individual wheels/tires, count kits once, and include allowances",()=>{
 const s=base();s.picks={wheels:"method-MR70178550900",tires:"nitto-217020",lift:"lift-16400-0073"};s.labor=50000;s.extras=30000;
 assert.equal(totalFor(s).subtotal,36600*5+43200*5+69995);
 assert.equal(totalFor(s).total,36600*5+43200*5+69995+80000);
 s.quantity=4;assert.equal(totalFor(s).subtotal,36600*4+43200*4+69995);
});
test("18-inch tires on 17-inch wheels produce an explicit conflict",()=>{
 const s=base();s.picks={tires:"nitto-217130"};assert.ok(buildIssues(s).some(i=>i.level==="error"&&i.message.includes("diameter mismatch")));
 s.stockRim=18;assert.ok(!buildIssues(s).some(i=>i.message.includes("diameter mismatch")));
});
test("changing trim surfaces an existing incompatible lift variant",()=>{
 const s=base();s.trim="Rubicon";s.picks={lift:"lift-16400-0073"};assert.ok(buildIssues(s).some(i=>i.level==="error"&&i.message.includes("variant")));
});
test("a tire above the source lift limit conflicts while other mechanical checks remain",()=>{
 const s=base();s.picks={tires:"nitto-217050",lift:"aev-spacer"};assert.ok(buildIssues(s).some(i=>i.level==="error"&&i.message.includes("limit")));
 s.trim="Rubicon";assert.ok(!buildIssues(s).some(i=>i.message.includes("limit")));assert.ok(buildIssues(s).some(i=>i.message.includes("rim width")));
});
test("malformed or fabricated shared state is rejected",()=>{
 assert.equal(stateSchema.safeParse({...base(),picks:{tires:"made-up"}}).success,false);
 assert.equal(stateSchema.safeParse({...base(),picks:{lift:"nitto-217050"}}).success,false);
 assert.equal(stateSchema.safeParse({...base(),labor:-1}).success,false);
 assert.equal(stateSchema.safeParse({...base(),quantity:999}).success,false);
});
test("D1 route round-trip, price isolation, update ownership and delete ownership",async()=>{
 assert.equal((await api.GET(req(null))).status,401);
 assert.equal((await api.POST(req("alice","POST",{name:"A",notes:"",state:base()},"https://evil.example"))).status,403);
 const state=base();state.picks={tires:"nitto-217020"};
 const saved=await api.POST(req("alice","POST",{name:"Trail build",notes:"Weekend plan",state}));assert.equal(saved.status,200);const data=await saved.json();
 assert.equal(data.savedTotal,43200*5);
 assert.equal((await (await api.GET(req("alice"))).json()).builds[0].notes,"Weekend plan");
 assert.deepEqual((await (await api.GET(req("bob"))).json()).builds,[]);
 assert.equal((await api.POST(req("bob","POST",{id:data.id,name:"Stolen",notes:"",state}))).status,404);
 await api.DELETE(req("bob","DELETE",undefined,undefined,"?id="+data.id));
 assert.equal((await (await api.GET(req("alice"))).json()).builds.length,1);
 const quote=await catalog.PUT(req("alice","PUT",{partId:"nitto-217020",priceCents:40000}));assert.equal(quote.status,200);
 assert.equal((await (await catalog.GET(req("alice"))).json()).parts.find(p=>p.id==="nitto-217020").priceCents,40000);
 assert.equal((await (await catalog.GET(req("bob"))).json()).parts.find(p=>p.id==="nitto-217020").priceCents,43200);
 const updated=await api.POST(req("alice","POST",{id:data.id,name:"Updated",notes:"Fresh quote",state}));assert.equal(updated.status,200);assert.equal((await updated.json()).savedTotal,200000);
 assert.equal((await api.POST(req("alice","POST",{name:"Invalid",notes:"",state:{...state,picks:{wheels:"nitto-217020"}}}))).status,400);
 await catalog.DELETE(req("alice","DELETE",undefined,undefined,"?partId=nitto-217020"));
 assert.equal((await (await catalog.GET(req("alice"))).json()).parts.find(p=>p.id==="nitto-217020").priceCents,43200);
 await api.DELETE(req("alice","DELETE",undefined,undefined,"?id="+data.id));
 assert.deepEqual((await (await api.GET(req("alice"))).json()).builds,[]);
});
after(async()=>{sql.close();delete globalThis.__testEnv;await rm(output,{recursive:true,force:true});});
