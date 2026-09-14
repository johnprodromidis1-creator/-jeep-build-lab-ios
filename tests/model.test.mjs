import assert from "node:assert/strict";
import test, {after} from "node:test";
import {existsSync} from "node:fs";
import {readFile,readdir,mkdir,rm} from "node:fs/promises";
import {fileURLToPath,pathToFileURL} from "node:url";
import path from "node:path";
import {build} from "esbuild";
import {DatabaseSync} from "node:sqlite";
const root=fileURLToPath(new URL("..",import.meta.url));
const output=path.join(root,".sites-runtime","unit");
await mkdir(output,{recursive:true});
const sql=new DatabaseSync(":memory:");
for(const file of (await readdir(path.join(root,"drizzle"))).filter(f=>f.endsWith(".sql")).sort())sql.exec(await readFile(path.join(root,"drizzle",file),"utf8"));
const DB={prepare(query){const stmt=sql.prepare(query);const bound=(args=[])=>({bind(...a){return bound(a);},async all(){return{results:stmt.all(...args),success:true};},async first(){return stmt.get(...args)??null;},async run(){const r=stmt.run(...args);return{success:true,meta:{changes:Number(r.changes)}};}});return bound();}};
DB.batch=async(statements)=>{sql.exec('BEGIN');try{const result=[];for(const stmt of statements)result.push(await stmt.run());sql.exec('COMMIT');return result;}catch(error){sql.exec('ROLLBACK');throw error;}};
globalThis.__testEnv={DB};
function resolveLocal(specifier,resolveDir){
 const base=specifier.startsWith("@/")?path.join(root,specifier.slice(2)):path.resolve(resolveDir,specifier);
 for(const candidate of [base,base+".ts",base+".tsx",base+".json",path.join(base,"index.ts"),path.join(base,"index.tsx")]){
  if(existsSync(candidate))return candidate;
 }
 throw new Error(`Could not resolve ${specifier} from ${resolveDir}`);
}
async function module(file,name){
 const entry=path.join(root,file),outfile=path.join(output,name+".mjs");
 await build({absWorkingDir:root,stdin:{contents:await readFile(entry,"utf8"),sourcefile:path.basename(file),resolveDir:path.dirname(entry),loader:file.endsWith(".tsx")?"tsx":"ts"},outfile,bundle:true,format:"esm",platform:"node",plugins:[{name:"test-resolver",setup(b){
  b.onResolve({filter:/^cloudflare:workers$/},()=>({path:"env",namespace:"binding"}));
  b.onResolve({filter:/^@\//},args=>({path:resolveLocal(args.path,root)}));
  b.onResolve({filter:/^\./},args=>({path:resolveLocal(args.path,args.resolveDir)}));
  b.onResolve({filter:/^[^./]/},args=>({path:args.path,external:true}));
  b.onLoad({filter:/.*/,namespace:"binding"},()=>({contents:"export const env = globalThis.__testEnv;"}));
  b.onLoad({filter:/\.(ts|tsx)$/},async args=>({contents:await readFile(args.path,"utf8"),loader:args.path.endsWith(".tsx")?"tsx":"ts"}));
  b.onLoad({filter:/\.json$/},async args=>({contents:await readFile(args.path,"utf8"),loader:"json"}));
 }}]});
 return import(pathToFileURL(outfile).href);
}
const model=await module("lib/model.ts","model");
const api=await module("app/api/builds/route.ts","builds");
const drafts=await module("app/api/draft/route.ts","drafts");
const planning=await module("lib/planning.ts","planning");
const accountData=await module("app/api/data/route.ts","data");
const catalog=await module("app/api/catalog/route.ts","catalog");
const decimalInput=await module("lib/decimal-input.ts","decimal-input");
const catalogFilters=await module("lib/catalog-filters.ts","catalog-filters");
const garageFilters=await module("lib/garage-filters.ts","garage-filters");
const shopBrief=await module("lib/shop-brief.ts","shop-brief");
const {initialState,baseCatalog,totalFor,buildIssues,stateSchema,fitsVehicle,partCompatibility,publicBuildState,encodeSharedBuildState,decodeSharedBuildStatePayload,buildErrorsForOption,optionAddsBuildError}=model;
const {dimensionFilterOptions,hasCatalogFilter,matchesCatalogFilters}=catalogFilters;
const {allGarageFilter,filterGarageBuilds,garageConflictCount,garageSearchText,hasGarageFilter}=garageFilters;
const {buildShopBrief}=shopBrief;
const base=()=>structuredClone(initialState);
const req=(user,method="GET",body,origin="https://test.local",query="")=>new Request("https://test.local/api/builds"+query,{method,headers:{...(user?{"oai-authenticated-user-id":user}:{}),origin,"Content-Type":"application/json"},...(body?{body:JSON.stringify(body)}:{})});
const badJson=(path,method="POST")=>new Request("https://test.local/api/"+path,{method,headers:{"oai-authenticated-user-id":"alice",origin:"https://test.local","Content-Type":"application/json"},body:"{"});
const jsonBody=(path,method,body)=>new Request("https://test.local/api/"+path,{method,headers:{"oai-authenticated-user-id":"alice",origin:"https://test.local","Content-Type":"application/json"},body:JSON.stringify(body)});

test("catalog has 51 unique variants with positive cent prices and HTTPS sources",()=>{
 assert.equal(baseCatalog.length,51);assert.equal(new Set(baseCatalog.map(p=>p.id)).size,51);
 for(const p of baseCatalog){assert.ok(Number.isInteger(p.priceCents)&&p.priceCents>0);assert.equal(new URL(p.url).protocol,"https:");}
});
test("totals multiply individual wheels/tires, count kits once, and include allowances",()=>{
 const s=base();s.picks={wheels:"method-MR70178550900",tires:"nitto-217020",lift:"lift-16400-0073"};s.labor=50000;s.extras=30000;
 assert.equal(totalFor(s).subtotal,36600*5+43200*5+69995);
 assert.equal(totalFor(s).total,36600*5+43200*5+69995+80000);
 s.quantity=4;assert.equal(totalFor(s).subtotal,36600*4+43200*4+69995);
});
test("price entry preserves exact cents and rejects ambiguous or malformed amounts",()=>{
 for(const [text,cents] of [['0.29',29],['9.99',999],['.05',5],['1,234.56',123456],['100000.00',10000000],['12.',1200]]){
  assert.equal(decimalInput.parseDecimalUnits(text,2),cents);
  assert.equal(decimalInput.parseDecimalUnits(decimalInput.formatDecimalUnits(cents,2),2),cents);
 }
 for(const text of ['', '.', '-1', '1e4', '12,34', '1.234', 'Infinity', '12abc', '99999999999999999'])assert.equal(decimalInput.parseDecimalUnits(text,2),null);
});
test("finished tire and budget entries preserve valid previous values when input is incomplete or outside limits",()=>{
 const tire={places:1,min:300,max:350};
 assert.equal(decimalInput.finishDecimalInput('32.5',320,tire).value,325);
 for(const raw of ['', '3', '36', '32.55']){
  const result=decimalInput.finishDecimalInput(raw,320,tire);
  assert.equal(result.value,320);assert.match(result.message,/Kept 32.0/);
 }
 const dollars={places:2,min:0,max:10000000,emptyAsZero:true};
 assert.deepEqual(decimalInput.finishDecimalInput('',12999,dollars),{value:0,message:''});
 assert.equal(decimalInput.finishDecimalInput('100000.01',12999,dollars).value,12999);
 assert.deepEqual(decimalInput.finishDecimalInput('125.50',12999,dollars),{value:12550,message:''});
});
test("entered decimal allowances flow through the build total as integer cents",()=>{
 const state=base();state.picks={tires:'nitto-217020'};
 const options={places:2,min:0,max:10000000,emptyAsZero:true};
 state.labor=decimalInput.finishDecimalInput('1,250.29',state.labor,options).value;
 state.extras=decimalInput.finishDecimalInput('99.99',state.extras,options).value;
 assert.ok(stateSchema.safeParse(state).success);
 assert.equal(totalFor(state).total,43200*5+125029+9999);
});
test("18-inch tires on 17-inch wheels produce an explicit conflict",()=>{
 const s=base();s.picks={tires:"nitto-217130"};assert.ok(buildIssues(s).some(i=>i.level==="error"&&i.message.includes("diameter mismatch")));
 s.stockRim=18;assert.ok(!buildIssues(s).some(i=>i.message.includes("diameter mismatch")));
});
test("changing trim surfaces an existing incompatible lift variant",()=>{
 const s=base();s.trim="Rubicon";s.picks={lift:"lift-16400-0073"};assert.ok(buildIssues(s).some(i=>i.level==="error"&&i.message.includes("Sport, Sahara")));
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
 assert.equal(stateSchema.safeParse({...base(),year:2024,powertrain:"gas"}).success,false);
 assert.equal(stateSchema.safeParse({...base(),year:2024,trim:"Rubicon",powertrain:"4xe"}).success,false);
 assert.equal(stateSchema.safeParse({...base(),year:2023,trim:"Sahara",powertrain:"4xe"}).success,false);
 assert.equal(stateSchema.safeParse({...base(),stages:{wheels:"owned"}}).success,false);
});
test("shared build payload exposes only public build state",()=>{
 const state={...base(),year:2024,trim:"Sahara",powertrain:"4xe",stockRim:20,stockTire:32,budget:625000,labor:12550,extras:9999,picks:{tires:"nitto-217310-4xe",lift:"mopar-77072522ae-4xe"},stages:{tires:"now",lift:"later"},name:"Private trail name",notes:"secret notes",ownerId:"owner-1",savedTotal:1,prices:[{partId:"nitto-217310-4xe",priceCents:1}],customPrice:true};
 const payload=encodeSharedBuildState(state),json=decodeURIComponent(payload),parsed=JSON.parse(json);
 assert.deepEqual(Object.keys(parsed).sort(),["budget","extras","labor","picks","powertrain","quantity","stages","stockRim","stockTire","trim","vehicleCost","year"].sort());
 assert.doesNotMatch(json,/Private trail name|secret notes|ownerId|savedTotal|prices|customPrice/);
 assert.deepEqual(decodeSharedBuildStatePayload(payload),publicBuildState(state));
});
test("2024 Sahara 4xe keeps powertrain fitment explicit and supports 20-inch starting wheels",()=>{
 const s={...base(),year:2024,trim:"Sahara",powertrain:"4xe",stockRim:20,stockTire:32,picks:{}};
 assert.equal(stateSchema.safeParse(s).success,true);
 assert.equal(fitsVehicle(baseCatalog.find(p=>p.id==="nitto-217330-4xe"),s),true);
 assert.equal(fitsVehicle(baseCatalog.find(p=>p.id==="mopar-77072522ae-4xe"),s),true);
 assert.equal(fitsVehicle(baseCatalog.find(p=>p.id==="method-MR70178550900"),s),false);
 assert.match(partCompatibility(baseCatalog.find(p=>p.id==="method-MR70178550900"),s),/2024/);
 const build={...s,picks:{tires:"nitto-217310-4xe",lift:"mopar-77072522ae-4xe"},stages:{tires:"now",lift:"later"}};
 assert.equal(totalFor(build).subtotal,46300*5+183540);
 assert.ok(!buildIssues(build).some(issue=>issue.level==="error"));
});
test("catalog recommendations distinguish vehicle fit from current-build conflicts",()=>{
 const state={...base(),year:2024,trim:"Sahara",powertrain:"4xe",stockRim:20,stockTire:32,picks:{tires:"nitto-217310-4xe",lift:"mopar-77072522ae-4xe"},stages:{tires:"now",lift:"later"}};
 const wheel17=baseCatalog.find(p=>p.id==="morphic-92615-3835");
 const tire20=baseCatalog.find(p=>p.id==="nitto-217330-4xe");
 assert.equal(fitsVehicle(wheel17,state),true);
 assert.equal(optionAddsBuildError(wheel17,state,baseCatalog),true);
 assert.match(buildErrorsForOption(wheel17,state,baseCatalog)[0].message,/Wheel diameter mismatch/);
 assert.equal(optionAddsBuildError(tire20,state,baseCatalog),false);
});
test("catalog filters combine brand, line price, search terms and dimensions",()=>{
 const state={...base(),year:2024,trim:"Sahara",powertrain:"4xe",stockRim:20,stockTire:32,quantity:5,picks:{}};
 const tire=baseCatalog.find(p=>p.id==="nitto-217310-4xe");
 assert.equal(hasCatalogFilter({query:"ridge 217310",brand:"Nitto",price:"1000-2500",dimension:"rim:20"}),true);
 assert.equal(matchesCatalogFilters(tire,state,{category:"tires",query:"ridge 217310",brand:"Nitto",price:"1000-2500",dimension:"rim:20"}),true);
 assert.equal(matchesCatalogFilters(tire,state,{category:"tires",query:"ridge",brand:"BFGoodrich",price:"1000-2500",dimension:"rim:20"}),false);
 assert.equal(matchesCatalogFilters(tire,state,{category:"tires",query:"ridge",brand:"Nitto",price:"under-500",dimension:"rim:20"}),false);
 assert.equal(matchesCatalogFilters(tire,state,{category:"tires",query:"ridge",brand:"Nitto",price:"1000-2500",dimension:"rim:17"}),false);
 const options=dimensionFilterOptions(baseCatalog.filter(p=>p.category==="tires"),"tires");
 assert.ok(options.some(option=>option.value==="rim:20"&&/20-inch/.test(option.label)));
});
test("garage filters search saved builds by vehicle, notes, parts, status and value",()=>{
 const mismatch={...base(),trim:"Sahara",stockRim:18,picks:{wheels:"method-MR70178550900"}};
 const hybrid={...base(),year:2024,trim:"Sahara",powertrain:"4xe",stockRim:20,stockTire:32,picks:{tires:"nitto-217310-4xe",lift:"mopar-77072522ae-4xe"},stages:{tires:"now",lift:"later"}};
 const stock=base();
 const builds=[
  {id:"gas-conflict",name:"17s on Sahara",notes:"Needs matching tires",state:mismatch,updatedAt:"2026-09-10T10:00:00.000Z",savedTotal:123000},
  {id:"hybrid",name:"Sahara 4xe beach plan",notes:"Ridge Grappler and Mopar lift",state:hybrid,updatedAt:"2026-09-13T10:00:00.000Z",savedTotal:415040},
  {id:"stock",name:"Baseline daily",notes:"No upgrades yet",state:stock,updatedAt:"2026-09-12T10:00:00.000Z",savedTotal:0},
 ];
 assert.equal(hasGarageFilter({query:"",powertrain:allGarageFilter,conflicts:allGarageFilter}),false);
 assert.ok(garageSearchText(builds[1],baseCatalog).includes("ridge grappler"));
 assert.equal(garageConflictCount(builds[0],baseCatalog),1);
 assert.deepEqual(filterGarageBuilds(builds,baseCatalog,{query:"ridge mopar",powertrain:"4xe",conflicts:"clean",sort:"updated-desc"}).map(b=>b.id),["hybrid"]);
 assert.deepEqual(filterGarageBuilds(builds,baseCatalog,{query:"",powertrain:allGarageFilter,conflicts:"needs-review",sort:"value-desc"}).map(b=>b.id),["gas-conflict"]);
 assert.deepEqual(filterGarageBuilds(builds,baseCatalog,{query:"",powertrain:allGarageFilter,conflicts:allGarageFilter,sort:"value-desc"}).map(b=>b.id),["hybrid","gas-conflict","stock"]);
 assert.deepEqual(filterGarageBuilds(builds,baseCatalog,{query:"",powertrain:allGarageFilter,conflicts:allGarageFilter,sort:"updated-asc"}).map(b=>b.id),["gas-conflict","stock","hybrid"]);
});
test("shop brief export groups staged parts, totals, source links and fitment notes",()=>{
 const state=base();state.picks={tires:"nitto-217020",lift:"aev-spacer"};state.stages={tires:"now",lift:"owned"};state.labor=12500;state.extras=5000;
 const brief=buildShopBrief({name:"Trail quote",notes:"Ask about alignment timing.",state,parts:baseCatalog,generatedAt:"2026-09-14T12:00:00.000Z"});
 assert.match(brief,/Jeep Build Lab shop brief/);
 assert.match(brief,/Build: Trail quote/);
 assert.match(brief,/Generated: 2026-09-14/);
 assert.match(brief,/2021 Wrangler JL Unlimited 4-door Sport/);
 assert.match(brief,/Buy now\n- Tires: Nitto Ridge Grappler/);
 assert.match(brief,/Already owned\n- Suspension: AEV 2/);
 assert.match(brief,/Price: \$432.00 x 5 = \$2,160.00/);
 assert.match(brief,/Upgrades left to fund: \$2,335.00/);
 assert.match(brief,/Source: Quadratec - https:\/\/www\.quadratec\.com\/p\/nitto\/ridge-grappler-tire/);
 assert.match(brief,/Fitment conflicts \(0\)/);
 assert.match(brief,/No blocking fitment conflicts detected/);
 assert.match(brief,/Shop confirmation checks \([1-9]/);
 assert.match(brief,/Owner notes\nAsk about alignment timing\./);
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
test("mutating API routes report malformed JSON as client errors",async()=>{
 assert.equal((await api.POST(badJson("builds"))).status,400);
 assert.equal((await catalog.PUT(badJson("catalog","PUT"))).status,400);
 assert.equal((await drafts.PUT(badJson("draft","PUT"))).status,400);
 assert.equal((await accountData.DELETE(badJson("data","DELETE"))).status,400);
 assert.equal((await accountData.DELETE(jsonBody("data","DELETE",null))).status,400);
});
test("new 17-inch wheels conflict with retained 18-inch tires until matching tires are added",()=>{
 const state=base();state.trim="Sahara";state.stockRim=18;state.picks={wheels:"method-MR70178550900"};
 assert.ok(buildIssues(state).some(issue=>issue.level==="error"&&issue.message.includes("current tires fit 18")));
 state.picks.tires="nitto-217020";
 assert.ok(!buildIssues(state).some(issue=>issue.level==="error"&&issue.message.includes("diameter mismatch")));
});
test("purchase stages exclude owned items without hiding parts from final-build fitment",()=>{
 const state=base();state.picks={wheels:"method-MR70178550900",tires:"nitto-217130",lift:"aev-spacer"};
 state.stages={wheels:"owned",tires:"later",lift:"installed"};state.labor=60000;state.extras=15000;state.vehicleCost=3500000;
 const costs=planning.costPlan(state,baseCatalog);
 assert.equal(costs.now,0);assert.equal(costs.later,47200*5);assert.equal(costs.covered,36600*5+48900);
 assert.equal(costs.remaining,47200*5+75000);assert.equal(costs.dueNow,75000);assert.equal(costs.project,costs.remaining+3500000);
 assert.ok(buildIssues(state).some(i=>i.level==="error"&&i.message.includes("diameter mismatch")));
 state.stages.wheels="now";assert.equal(planning.costPlan(state,baseCatalog).dueNow,36600*5+75000);
});
test("legacy saved configurations gain defaults and comparisons include quantity and purchase stage",()=>{
 const legacy=base();delete legacy.stages;delete legacy.vehicleCost;delete legacy.powertrain;
 const restored=stateSchema.parse(legacy);assert.deepEqual(restored.stages,{});assert.equal(restored.vehicleCost,0);assert.equal(restored.powertrain,"gas");
 restored.picks={tires:"nitto-217020"};const other=structuredClone(restored);other.quantity=4;
 const rows=planning.compareRows(restored,other,baseCatalog);assert.equal(rows.filter(r=>r.changed).length,1);assert.equal(rows.find(r=>r.category==="tires").leftCost,43200*5);
 other.quantity=5;other.stages.tires="owned";assert.equal(planning.compareRows(restored,other,baseCatalog).find(r=>r.category==="tires").changed,true);
 assert.equal(planning.groupParts(baseCatalog).reduce((n,g)=>n+g.variants.length,0),51);
 assert.equal(stateSchema.safeParse({...base(),stages:{wheels:"free"}}).success,false);
 assert.equal(stateSchema.safeParse({...base(),picks:{tires:"nitto-217020"},stages:{tires:"owned"}}).success,true);
});
test("draft recovery keeps owners isolated and rejects stale concurrent writes",async()=>{
 const draft={name:"Trail draft",notes:"Still choosing",state:base(),buildId:null,lastSavedTotal:null};
 assert.equal((await drafts.GET(req(null))).status,401);
 assert.equal((await drafts.PUT(req("draft-a","PUT",{revision:0,draft},"https://evil.example"))).status,403);
 assert.equal((await drafts.PUT(req("draft-a","PUT",{revision:0,draft}))).status,200);
 const first=await (await drafts.GET(req("draft-a"))).json();assert.equal(first.revision,1);assert.equal(first.draft.name,"Trail draft");
 assert.equal((await (await drafts.GET(req("draft-b"))).json()).draft,null);
 assert.equal((await drafts.PUT(req("draft-a","PUT",{revision:0,draft:{...draft,name:"Stale first write"}}))).status,409);
 assert.equal((await drafts.PUT(req("draft-a","PUT",{revision:1,draft:{...draft,name:"Newest draft"}}))).status,200);
 assert.equal((await drafts.PUT(req("draft-a","PUT",{revision:1,draft:{...draft,name:"Stale update"}}))).status,409);
 assert.equal((await (await drafts.GET(req("draft-a"))).json()).draft.name,"Newest draft");
 assert.equal((await drafts.PUT(req("draft-a","PUT",{revision:2,draft:{...draft,state:{...base(),picks:{tires:"fictional"}}}}))).status,400);
});
test("guest catalog excludes personal prices and private data export/deletion stay owner scoped",async()=>{
 const state=base();state.picks={tires:"nitto-217020"};
 await api.POST(req("export-a","POST",{name:"Private A",notes:"Personal",state}));
 await api.POST(req("export-b","POST",{name:"Private B",notes:"Other",state}));
 await catalog.PUT(req("export-a","PUT",{partId:"nitto-217020",priceCents:12345}));
 const publicCatalog=await catalog.GET(req(null));assert.equal(publicCatalog.status,200);
 assert.equal((await publicCatalog.json()).parts.find(p=>p.id==="nitto-217020").priceCents,43200);
 assert.equal((await accountData.GET(req(null))).status,401);
 const backup=await (await accountData.GET(req("export-a"))).json();
 assert.equal(backup.builds.length,1);assert.equal(backup.builds[0].name,"Private A");assert.equal(backup.prices[0].priceCents,12345);
 assert.equal((await accountData.DELETE(req("export-a","DELETE",{confirm:"NO"}))).status,400);
 assert.equal((await accountData.DELETE(req("export-a","DELETE",{confirm:"DELETE MY APP DATA"},"https://evil.example"))).status,403);
 assert.equal((await accountData.DELETE(req("export-a","DELETE",{confirm:"DELETE MY APP DATA"}))).status,200);
 const erased=await (await accountData.GET(req("export-a"))).json();assert.equal(erased.builds.length,0);assert.equal(erased.prices.length,0);assert.equal(erased.draft,null);
 assert.equal((await (await accountData.GET(req("export-b"))).json()).builds[0].name,"Private B");
});
after(async()=>{sql.close();delete globalThis.__testEnv;await rm(output,{recursive:true,force:true});});
