"use client";
import {useEffect,useMemo,useState} from "react";
import {Wrench,ArrowUpRight,Plus,Check,Trash2,Save,Share2,Printer,RotateCcw,Search,SlidersHorizontal,ChevronRight,TriangleAlert,Info,FolderOpen,ArrowLeft,LoaderCircle,Mountain,Settings2,CircleDot,MoveVertical,Shield,Anchor,PanelTop,CheckCheck} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Select,SelectTrigger,SelectContent,SelectItem,SelectValue} from "@/components/ui/select";
import {Tabs,TabsList,TabsTrigger} from "@/components/ui/tabs";
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription,DialogFooter} from "@/components/ui/dialog";
import {AlertDialog,AlertDialogContent,AlertDialogHeader,AlertDialogTitle,AlertDialogDescription,AlertDialogFooter,AlertDialogCancel,AlertDialogAction} from "@/components/ui/alert-dialog";
import {Textarea} from "@/components/ui/textarea";
import {toast,Toaster} from "sonner";
import {baseCatalog,categories,categoryNames,initialState,stateSchema,selectedParts,totalFor,quantityFor,fitsVehicle,buildIssues,money,type BuildState,type Part,type Category,type SavedBuild,type Trim} from "@/lib/model";

const icons={wheels:CircleDot,tires:CircleDot,lift:MoveVertical,bumpers:PanelTop,winches:Anchor,armor:Shield};
function Choice({label,value,onChange,options}:{label:string;value:string;onChange:(v:string)=>void;options:{value:string;label:string}[]}){
 return <div className="field"><Label>{label}</Label><Select value={value} onValueChange={onChange}><SelectTrigger aria-label={label}><SelectValue/></SelectTrigger><SelectContent>{options.map(o=><SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select></div>;
}
function CashField({label,value,onChange}:{label:string;value:number;onChange:(n:number)=>void}){
 return <div className="field"><Label htmlFor={label}>{label}</Label><div className="cash-input"><span>$</span><Input id={label} type="number" min={0} max={100000} step="0.01" value={value/100} onChange={e=>onChange(Math.min(10000000,Math.max(0,Math.round(Number(e.target.value)*100)||0)))}/></div></div>;
}
function Preview({state,parts,stock=false}:{state:BuildState;parts:Part[];stock?:boolean}){
 const selected=selectedParts(state,parts);
 const wheel=stock?undefined:selected.find(p=>p.category==="wheels");
 const tire=stock?undefined:selected.find(p=>p.category==="tires");
 const lift=stock?0:selected.find(p=>p.category==="lift")?.specs.lift??0;
 const diameter=tire?.specs.diameter??state.stockTire;
 const finish=wheel?.specs.finish==="bronze"?"bronze":"charcoal";
 const size=21.25*diameter/32;
 const bodyRaise=(lift+(diameter-state.stockTire)/2)*.88;
 const wheelY=65.5-(diameter-state.stockTire)/2*.88;
 return <div className="jeep-canvas" role="img" aria-label={`Illustrative silver Wrangler JL with ${diameter}-inch tires, ${lift}-inch lift and ${finish} wheels. Bumpers, winches and armor are not shown.`}>
  {[17.3,79.4].map((x,i)=><img key={i} className="jeep-wheel" src={`/assets/wheel-${finish}.png`} alt="" draggable={false} style={{left:x+"%",top:wheelY+"%",width:size+"%"}}/>)}
  <img className="jeep-body" src="/assets/jeep-body.png" alt="" draggable={false} style={{transform:`translateY(-${bodyRaise}%)`}}/>
 </div>;
}
export default function Builder(){
 const [state,setState]=useState<BuildState>(initialState);
 const [parts,setParts]=useState<Part[]>(baseCatalog);
 const [category,setCategory]=useState<Category>("wheels");
 const [view,setView]=useState("builder");
 const [query,setQuery]=useState("");
 const [sort,setSort]=useState("curated");
 const [name,setName]=useState("My JL build");
 const [notes,setNotes]=useState("");
 const [id,setId]=useState<string>();
 const [dirty,setDirty]=useState(false);
 const [compare,setCompare]=useState(false);
 const [saveOpen,setSaveOpen]=useState(false);
 const [saveCopy,setSaveCopy]=useState(false);
 const [saving,setSaving]=useState(false);
 const [garage,setGarage]=useState<SavedBuild[]>([]);
 const [garageBusy,setGarageBusy]=useState(false);
 const [garageError,setGarageError]=useState("");
 const [vehicleOpen,setVehicleOpen]=useState(false);
 const [detail,setDetail]=useState<Part|null>(null);
 const [price,setPrice]=useState(0);
 const [priceBusy,setPriceBusy]=useState(false);
 const [confirm,setConfirm]=useState<{kind:"reset"|"load"|"delete";build?:SavedBuild}|null>(null);
 const [busyDelete,setBusyDelete]=useState(false);
 const [linkOpen,setLinkOpen]=useState(false);
 const [shareUrl,setShareUrl]=useState("");
 const [catalogWarning,setCatalogWarning]=useState("");
 const selected=useMemo(()=>selectedParts(state,parts),[state,parts]);
 const issues=useMemo(()=>buildIssues(state,parts),[state,parts]);
 const {subtotal,total}=totalFor(state,parts);
 const errors=issues.filter(i=>i.level==="error");
 const tire=selected.find(p=>p.category==="tires"),wheel=selected.find(p=>p.category==="wheels"),lift=selected.find(p=>p.category==="lift");
 const filtered=parts.filter(p=>p.category===category&&fitsVehicle(p,state)&&`${p.brand} ${p.name} ${p.variant} ${p.reference}`.toLowerCase().includes(query.toLowerCase())).sort((a,b)=>sort==="low"?a.priceCents-b.priceCents:sort==="high"?b.priceCents-a.priceCents:0);
 const modified=(next:BuildState)=>{setState(next);setDirty(true);setCompare(false);};
 const update=(patch:Partial<BuildState>)=>modified({...state,...patch});
 useEffect(()=>{
  fetch("/api/catalog").then(async r=>{const data=await r.json() as {error?:string;parts:Part[];builds:SavedBuild[];id:string};if(!r.ok)throw new Error(data.error);setParts(data.parts);}).catch((e:Error)=>setCatalogWarning(e.message));
  if(window.location.hash.startsWith("#build=")){
   try{const raw=decodeURIComponent(window.location.hash.slice(7));if(raw.length>5000)throw new Error();const parsed=stateSchema.safeParse(JSON.parse(raw));if(!parsed.success)throw new Error();setState(parsed.data);setName("Linked JL build");setDirty(true);toast.success("Build loaded from link.");}catch{toast.error("This build link is invalid or uses unsupported parts.");}
  }
 },[]);
 useEffect(()=>{if(!dirty)return;const handler=(e:BeforeUnloadEvent)=>{e.preventDefault();};window.addEventListener("beforeunload",handler);return()=>window.removeEventListener("beforeunload",handler);},[dirty]);
 async function loadGarage(){setGarageBusy(true);setGarageError("");try{const r=await fetch("/api/builds");const data=await r.json() as {error?:string;parts:Part[];builds:SavedBuild[];id:string};if(!r.ok)throw new Error(data.error);setGarage(data.builds);}catch(e){setGarageError(e instanceof Error?e.message:"Could not load garage.");}finally{setGarageBusy(false);}}
 function selectPart(p:Part){const picks={...state.picks};if(picks[p.category]===p.id)delete picks[p.category];else picks[p.category]=p.id;update({picks});}
 function removePart(c:Category){const picks={...state.picks};delete picks[c];update({picks});}
 async function saveBuild(){if(!name.trim())return;setSaving(true);try{const r=await fetch("/api/builds",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:saveCopy?undefined:id,name:name.trim(),notes,state})});const data=await r.json() as {error?:string;parts:Part[];builds:SavedBuild[];id:string};if(!r.ok)throw new Error(data.error);setId(data.id);setDirty(false);setSaveOpen(false);toast.success("Build saved to your garage.");}catch(e){toast.error(e instanceof Error?e.message:"Could not save build.");}finally{setSaving(false);}}
 function loadBuild(b:SavedBuild){const parsed=stateSchema.safeParse(b.state);if(!parsed.success){toast.error("This saved build has unsupported data.");return;}setState(parsed.data);setId(b.id);setName(b.name);setNotes(b.notes);setDirty(false);setView("builder");setCompare(false);history.replaceState(null,"",location.pathname);toast.success("Build opened.");}
 function reset(){setState({...initialState,picks:{}});setId(undefined);setName("My JL build");setNotes("");setDirty(false);setCompare(false);setView("builder");history.replaceState(null,"",location.pathname);}
 async function confirmed(){
  if(confirm?.kind==="delete"&&confirm.build){setBusyDelete(true);try{const r=await fetch("/api/builds?id="+encodeURIComponent(confirm.build.id),{method:"DELETE"});const d=await r.json() as {error?:string;parts:Part[]};if(!r.ok)throw new Error(d.error);if(id===confirm.build.id){setId(undefined);setDirty(true);}setGarage(v=>v.filter(b=>b.id!==confirm.build!.id));toast.success("Build deleted.");}catch(e){toast.error(e instanceof Error?e.message:"Could not delete build.");}finally{setBusyDelete(false);setConfirm(null);}}
  else{if(confirm?.kind==="load"&&confirm.build)loadBuild(confirm.build);else reset();setConfirm(null);}
 }
 async function share(){const url=location.origin+location.pathname+"#build="+encodeURIComponent(JSON.stringify(state));setShareUrl(url);setLinkOpen(true);try{await navigator.clipboard.writeText(url);toast.success("Build link copied.");}catch{/* The selectable link is the clipboard fallback. */}}
 async function savePrice(resetPrice=false){if(!detail)return;setPriceBusy(true);try{const r=await fetch("/api/catalog"+(resetPrice?"?partId="+encodeURIComponent(detail.id):""),{method:resetPrice?"DELETE":"PUT",headers:{"Content-Type":"application/json"},...(resetPrice?{}:{body:JSON.stringify({partId:detail.id,priceCents:price})})});const d=await r.json() as {error?:string;parts:Part[]};if(!r.ok)throw new Error(d.error);setParts(d.parts);setDetail(d.parts.find((p:Part)=>p.id===detail.id)??null);setDirty(true);toast.success(resetPrice?"Source price restored.":"Your price note was saved.");}catch(e){toast.error(e instanceof Error?e.message:"Could not save price.");}finally{setPriceBusy(false);}}
 function openDetail(p:Part){setDetail(p);setPrice(p.priceCents);}
 function exportCSV(){
  const rows=[["Jeep Build Lab",name],["Vehicle",`${state.year} Wrangler JL 4-door ${state.trim}, 3.6L`],["Category","Brand","Product","Variant","Reference","Quantity","Unit USD","Line USD","Source","Price date","Price type"],...selected.map(p=>[categoryNames[p.category],p.brand,p.name,p.variant,p.reference,quantityFor(p,state),p.priceCents/100,p.priceCents*quantityFor(p,state)/100,p.url,p.checkedAt,p.customPrice?"Personal price":"Source snapshot"]),["Parts subtotal",subtotal/100],["Labor allowance",state.labor/100],["Tax, shipping and extras allowance",state.extras/100],["Estimated total",total/100],["Notes",notes],...issues.map(i=>["Fitment "+i.level,i.message])];
  const csv=rows.map(row=>row.map(v=>'"'+String(v).replace(/^[=+@-]/,"'$&").replaceAll('"','""')+'"').join(",")).join("\r\n");const url=URL.createObjectURL(new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8"}));const a=document.createElement("a");a.href=url;a.download="jeep-build-parts.csv";a.click();URL.revokeObjectURL(url);
 }
 return <div className="app-shell">
 <Toaster theme="dark" position="bottom-center" richColors/>
 <header className="topbar"><a className="brand" href="/" aria-label="Jeep Build Lab home" onClick={e=>{e.preventDefault();setView("builder");}}><span className="brand-mark"><Wrench size={21}/></span><span>JEEP<span className="brand-light">BUILD LAB</span></span><span className="alpha-tag">EARLY ACCESS</span></a>
 <Tabs value={view} onValueChange={v=>{setView(v);if(v==="garage")void loadGarage();}}><TabsList className="nav-tabs"><TabsTrigger value="builder"><Wrench size={15}/>Builder</TabsTrigger><TabsTrigger value="garage"><FolderOpen size={15}/>My garage</TabsTrigger></TabsList></Tabs>
 <span className="private-label"><span/>Private workspace</span></header>
 <main className="workshop">
 {view==="builder"?<>
 <section className="page-heading"><div><div className="eyebrow">YOUR NEXT ADVENTURE STARTS HERE</div><h1>Make it yours<span>.</span></h1><p>Real parts. Your vision. One build at a time.</p></div><div className="heading-actions"><Button variant="outline" onClick={()=>setConfirm({kind:"reset"})}><RotateCcw size={16}/><span>New build</span></Button><Button onClick={()=>{setSaveCopy(false);setSaveOpen(true);}}><Save size={16}/>Save build</Button></div></section>
 <section className="vehicle-bar" aria-label="Your vehicle"><span className="vehicle-number">01</span><div className="vehicle-title"><span className="eyebrow">YOUR VEHICLE</span><strong>{state.year} Wrangler JL <span>Unlimited · 4-door</span></strong></div><div className="vehicle-tags"><span>{state.trim}</span><span>3.6L V6</span></div><Button variant="ghost" className="change-vehicle" onClick={()=>setVehicleOpen(true)}>Edit vehicle<Settings2 size={16}/></Button></section>
 <div className="build-grid"><div className="build-main">
 <section className="preview-panel">
 <div className="preview-top"><span className="preview-status"><span/>{compare?"STOCK COMPARISON":"BUILD PREVIEW"}</span><div className="preview-toggle"><button className={compare?"":"active"} onClick={()=>setCompare(false)}>Your build</button><button className={compare?"active":""} onClick={()=>setCompare(true)}>Stock</button></div></div>
 <div className="preview-stage"><span className="studio-word" aria-hidden="true">WRANGLER</span><Preview state={state} parts={parts} stock={compare}/><span className="stage-label">JL / 4-DOOR</span><span className="stage-side">SIDE PROFILE</span></div>
 <div className="preview-specs"><div><span>TIRES</span><strong>{compare?state.stockTire:tire?.specs.diameter??state.stockTire}<small>″</small></strong></div><div><span>LIFT</span><strong>{compare?0:lift?.specs.lift??0}<small>″</small></strong></div><div><span>WHEELS</span><strong>{compare?state.stockRim:wheel?.specs.rim??state.stockRim}<small>″</small></strong></div><div className="preview-finish"><span>FINISH</span><strong><i/>Silver</strong></div></div>
 <p className="preview-disclaimer"><Info size={14}/>Illustrative preview. Wheel designs are generic; bumpers, winches and armor are listed only. Dimensions are approximate.</p>
 </section>
 <section className="parts-section" aria-labelledby="parts-heading">
 <div className="section-heading"><div><span className="eyebrow">THE GOOD STUFF</span><h2 id="parts-heading">Choose your upgrades</h2></div><span className="catalog-count">{parts.length} curated variants</span></div>
 <Tabs value={category} onValueChange={v=>{setCategory(v as Category);setQuery("");}}><TabsList className="category-tabs">{categories.map(c=>{const Icon=icons[c];return <TabsTrigger key={c} value={c}><Icon size={16}/>{categoryNames[c]}{state.picks[c]&&<span className="tab-dot"/>}</TabsTrigger>;})}</TabsList></Tabs>
 <div className="catalog-toolbar"><div className="search-box"><Search size={17}/><Input aria-label="Search parts" placeholder={`Search ${categoryNames[category].toLowerCase()}…`} value={query} onChange={e=>setQuery(e.target.value)}/></div><Select value={sort} onValueChange={setSort}><SelectTrigger aria-label="Sort parts"><SlidersHorizontal size={14}/><SelectValue/></SelectTrigger><SelectContent><SelectItem value="curated">Curated order</SelectItem><SelectItem value="low">Price: low to high</SelectItem><SelectItem value="high">Price: high to low</SelectItem></SelectContent></Select></div>
 <div className="catalog-subtitle"><span>{filtered.length} variants for your {state.trim}</span><span>USD · Tires & wheels priced individually</span></div>
 {catalogWarning&&<div className="inline-warning"><TriangleAlert size={16}/>{catalogWarning}</div>}
 {category==="tires"&&<p className="category-note">Choose a tire with the same wheel diameter as your build: <strong>{wheel?.specs.rim??state.stockRim} inches.</strong></p>}
 <div className="parts-grid">{filtered.map(p=>{const Icon=icons[p.category];const active=state.picks[p.category]===p.id;return <article className={`part-card ${active?"selected":""}`} key={p.id}>
 <div className="part-card-top"><span className="part-brand">{p.brand}</span><span className="part-type">{p.category==="tires"?"SIZE CHECK NEEDED":"JL LISTING"}</span></div>
 <div className="part-content"><div className="part-art" aria-hidden="true">{p.category==="wheels"||p.category==="tires"?<img src={`/assets/wheel-${p.specs.finish==="bronze"?"bronze":"charcoal"}.png`} alt=""/>:<Icon size={36} strokeWidth={1.2}/>}</div><div><h3>{p.name}</h3><p>{p.variant}</p><span className="part-reference">{p.reference}</span></div></div>
 <button className="details-link" onClick={()=>openDetail(p)}>Specs & fitment notes<ArrowUpRight size={13}/></button>
 <div className="part-bottom"><div><strong>{money(p.priceCents)}</strong><span> / {p.category==="wheels"||p.category==="tires"?"each":p.category==="armor"?"pair":"kit"}</span>{p.customPrice&&<small>Your price note</small>}</div><Button size="sm" variant={active?"secondary":"outline"} onClick={()=>selectPart(p)}>{active?<><Check size={15}/>Added</>:<><Plus size={15}/>Add</>}</Button></div>
 </article>;})}</div>
 {!filtered.length&&<div className="empty-state"><Search/><h3>No matching parts</h3><p>Try a brand, size or part number.</p><Button variant="outline" onClick={()=>setQuery("")}>Clear search</Button></div>}
 <p className="catalog-footnote">Source prices checked September 8, 2026. Prices and availability may change. Product artwork is illustrative. Lighting, tops and interior parts are planned for a later catalog.</p>
 </section>
 </div>
 <aside className="build-sidebar" id="build-summary"><div className="summary-card">
 <div className="summary-heading"><span className="eyebrow">YOUR BUILD SHEET</span><span className="count-badge">{selected.length}</span></div>
 <h2>{name}</h2><p className="save-state">{dirty?"Unsaved changes":id?"Saved in your garage":"A blank canvas. All yours."}</p>
 <div className="summary-list">{selected.length?selected.map(p=><div className="summary-item" key={p.id}><div><span>{categoryNames[p.category]}{quantityFor(p,state)>1?` × ${quantityFor(p,state)}`:""}</span><button onClick={()=>openDetail(p)}>{p.brand} {p.name}</button><small>{p.variant}</small></div><div><strong>{money(p.priceCents*quantityFor(p,state))}</strong><button className="remove-button" aria-label={`Remove ${p.name}`} onClick={()=>removePart(p.category)}><Trash2 size={14}/></button></div></div>):<div className="build-empty"><Plus size={22}/><p>Your next upgrade goes here.</p><span>Pick a part below the preview to start building.</span></div>}</div>
 <div className="quantity-row"><div><strong>Matching spare</strong><span>Wheel & tire quantity</span></div><div className="quantity-control" role="group" aria-label="Wheel and tire quantity">{[4,5].map(q=><button key={q} aria-pressed={state.quantity===q} className={state.quantity===q?"active":""} onClick={()=>update({quantity:q as 4|5})}>{q}</button>)}</div></div>
 <div className="budget-fields"><CashField label="Build budget" value={state.budget} onChange={n=>update({budget:n})}/><div className="budget-two"><CashField label="Labor allowance" value={state.labor} onChange={n=>update({labor:n})}/><CashField label="Tax, shipping & extras" value={state.extras} onChange={n=>update({extras:n})}/></div></div>
 <div className="totals"><div><span>Parts subtotal</span><span>{money(subtotal)}</span></div><div><span>Added allowances</span><span>{money(state.labor+state.extras)}</span></div><div className="grand-total"><span>Estimated total</span><strong aria-live="polite">{money(total)}</strong></div></div>
 {state.budget>0&&<div className={`budget-meter ${total>state.budget?"over":""}`}><div><span style={{width:Math.min(total/state.budget*100,100)+"%"}}/></div><p>{total>state.budget?`${money(total-state.budget)} over budget`:`${money(state.budget-total)} left in your budget`}</p></div>}
 <p className="price-note">Vehicle cost excluded. Tax, shipping, labor and supporting parts are excluded unless you add allowances.</p>
 <Button className="save-full" onClick={()=>{setSaveCopy(false);setSaveOpen(true);}}><Save size={16}/>{id?"Save changes":"Save to my garage"}</Button>
 <div className="export-buttons"><Button variant="ghost" onClick={share}><Share2 size={15}/>Copy link</Button><Button variant="ghost" onClick={()=>window.print()}><Printer size={15}/>Print list</Button></div>
 <button className="csv-link" onClick={exportCSV}>Download parts CSV<ArrowUpRight size={13}/></button>
 </div>
 <div className="fitment-card"><div><TriangleAlert size={18}/><h3>{errors.length?`${errors.length} fitment conflict${errors.length>1?"s":""}`:"Before you buy"}</h3></div><p>Vehicle listings are a starting point. Have a shop confirm the complete combination.</p>{issues.map((i,n)=><div className={`fitment-issue ${i.level}`} key={n}><span>{i.level==="error"?"!":"•"}</span><p>{i.message}</p></div>)}{!issues.length&&<small>Add parts to see combination checks here.</small>}</div>
 <div className="field-note"><Mountain size={20}/><p>Plan it here.<br/><strong>Build it out there.</strong></p></div>
 </aside></div>
 <div className="mobile-total"><div><span>{selected.length} upgrades · Estimated total</span><strong>{money(total)}</strong></div><Button onClick={()=>document.getElementById("build-summary")?.scrollIntoView({behavior:"smooth"})}>Build sheet<ChevronRight size={16}/></Button></div>
 </>:<>
 <section className="page-heading"><div><div className="eyebrow">PARK YOUR IDEAS HERE</div><h1>My garage<span>.</span></h1><p>Revisit a build. Refine the details. Make it happen.</p></div><Button onClick={()=>dirty?setConfirm({kind:"reset"}):reset()}><Plus size={16}/>New build</Button></section>
 <Button variant="ghost" className="back-builder" onClick={()=>setView("builder")}><ArrowLeft size={16}/>Back to current build</Button>
 {garageBusy?<div className="empty-state"><LoaderCircle className="spin"/><p>Opening your garage…</p></div>:garageError?<div className="empty-state"><TriangleAlert/><h3>Garage unavailable</h3><p>{garageError}</p><Button onClick={loadGarage}>Try again</Button></div>:garage.length?<div className="garage-grid">{garage.map(b=><article className="garage-card" key={b.id}><div className="garage-preview"><Preview state={b.state} parts={parts}/></div><div className="garage-info"><span className="eyebrow">{b.state.year} JL · {b.state.trim}</span><h2>{b.name}</h2><p>{Object.values(b.state.picks).length} upgrades · Saved {new Date(b.updatedAt).toLocaleDateString("en-US")}</p>{b.notes&&<p className="garage-notes">{b.notes}</p>}<div><strong>{money(b.savedTotal)}<small>at time of save</small></strong><Button onClick={()=>dirty?setConfirm({kind:"load",build:b}):loadBuild(b)}>Open build<ChevronRight size={15}/></Button><Button variant="ghost" size="icon" aria-label={`Delete ${b.name}`} onClick={()=>setConfirm({kind:"delete",build:b})}><Trash2 size={16}/></Button></div></div></article>)}</div>:<div className="empty-state garage-empty"><FolderOpen size={42}/><h2>A garage full of possibility.</h2><p>Save your first build and it will be waiting here.</p><Button onClick={()=>setView("builder")}>Start building<ChevronRight size={16}/></Button></div>}
 </>}
 <footer className="site-footer"><span><Wrench size={14}/>JEEP BUILD LAB</span><p>Independent build planner. Not affiliated with Jeep or the listed brands.</p><span>Made for the next adventure.</span></footer>
 </main>
 <section className="print-sheet"><h1>{name}</h1><p>{state.year} Wrangler JL Unlimited 4-door · {state.trim} · 3.6L V6</p><p>Jeep Build Lab · Planning estimate · {new Date().toLocaleDateString("en-US")}</p><table><thead><tr><th>Part / variant</th><th>Qty</th><th>Unit</th><th>Total</th></tr></thead><tbody>{selected.map(p=><tr key={p.id}><td><strong>{p.brand} {p.name}</strong><br/>{p.variant} · {p.reference}<br/><small>{p.url}<br/>{p.customPrice?"Personal price":"Source price"} · {p.checkedAt}</small></td><td>{quantityFor(p,state)}</td><td>{money(p.priceCents)}</td><td>{money(p.priceCents*quantityFor(p,state))}</td></tr>)}</tbody></table><p>Parts: {money(subtotal)} · Labor allowance: {money(state.labor)} · Tax, shipping & extras allowance: {money(state.extras)}</p><h2>Estimated total: {money(total)}</h2><p>Vehicle excluded. Additional costs are included only to the extent of the entered allowances.</p><h3>Fitment notes</h3><p>Have an installer confirm the complete combination before purchase.</p><ul>{issues.map((i,n)=><li key={n}>{i.message}</li>)}{selected.map(p=><li key={p.id}>{p.name}: {p.notes}</li>)}</ul>{notes&&<><h3>Your notes</h3><p>{notes}</p></>}</section>
 <Dialog open={vehicleOpen} onOpenChange={setVehicleOpen}><DialogContent><DialogHeader><DialogTitle>Your starting point</DialogTitle><DialogDescription>This first catalog covers 2018–2023 Wrangler JL Unlimited, four-door, 3.6L gasoline models with standard factory suspension.</DialogDescription></DialogHeader><div className="vehicle-dialog-fields"><div className="model-locked"><strong>Wrangler JL</strong><span>4-door · 3.6L V6</span></div><div className="two-fields"><Choice label="Model year" value={String(state.year)} onChange={v=>update({year:Number(v)})} options={[2018,2019,2020,2021,2022,2023].map(v=>({value:String(v),label:String(v)}))}/><Choice label="Trim" value={state.trim} onChange={v=>update({trim:v as Trim,stockRim:v==="Sahara"?18:17,stockTire:v==="Rubicon"?33:32})} options={["Sport","Sahara","Rubicon"].map(v=>({value:v,label:v}))}/></div><div className="two-fields"><Choice label="Current wheel diameter" value={String(state.stockRim)} onChange={v=>update({stockRim:Number(v) as 17|18})} options={[17,18].map(v=>({value:String(v),label:v+" inches"}))}/><div className="field"><Label htmlFor="stock-tire">Current tire diameter (in)</Label><Input id="stock-tire" type="number" min={30} max={35} step={0.1} value={state.stockTire} onChange={e=>update({stockTire:Math.max(30,Math.min(35,Number(e.target.value)||30))})}/></div></div><p className="dialog-note">Confirm your current sizes from your Jeep. Defaults are approximate. TJ, JK, JT, 2-door, 4xe, diesel, 392 and Xtreme Recon are not supported yet. Changing trim keeps your parts and flags conflicts for review.</p></div><DialogFooter><Button onClick={()=>setVehicleOpen(false)}>Continue building<ChevronRight size={16}/></Button></DialogFooter></DialogContent></Dialog>
 <Dialog open={saveOpen} onOpenChange={v=>!saving&&setSaveOpen(v)}><DialogContent><DialogHeader><DialogTitle>{saveCopy?"Save a new copy":"Save your build"}</DialogTitle><DialogDescription>Keep this configuration and your notes in your private garage. Opening it later uses your current catalog prices.</DialogDescription></DialogHeader><div className="field"><Label htmlFor="build-name">Build name</Label><Input id="build-name" maxLength={80} value={name} onChange={e=>{setName(e.target.value);setDirty(true);}} placeholder="Weekend trail runner"/></div><div className="field"><Label htmlFor="build-notes">Notes (optional)</Label><Textarea id="build-notes" maxLength={1500} value={notes} onChange={e=>{setNotes(e.target.value);setDirty(true);}} placeholder="What are you building toward?"/></div>{errors.length>0&&<p className="inline-warning">This build has {errors.length} unresolved fitment conflicts. You can save it as a plan.</p>}<DialogFooter>{id&&!saveCopy&&<Button variant="outline" disabled={saving} onClick={()=>setSaveCopy(true)}>Save as a copy</Button>}<Button disabled={saving||!name.trim()} onClick={saveBuild}>{saving?<LoaderCircle className="spin" size={16}/>:<Save size={16}/>}Save build</Button></DialogFooter></DialogContent></Dialog>
 <Dialog open={!!detail} onOpenChange={v=>!priceBusy&&!v&&setDetail(null)}><DialogContent className="part-dialog"><DialogHeader><DialogTitle>{detail?.brand} {detail?.name}</DialogTitle><DialogDescription>{detail?.variant} · {detail?.reference}</DialogDescription></DialogHeader>{detail&&<><div className="detail-specs">{detail.specs.rim&&<span>Wheel diameter<strong>{detail.specs.rim}″</strong></span>}{detail.specs.diameter&&<span>Nominal tire diameter<strong>{detail.specs.diameter}″</strong></span>}{detail.specs.width&&<span>Wheel width<strong>{detail.specs.width}″</strong></span>}{detail.specs.offset!==undefined&&<span>Offset<strong>{detail.specs.offset} mm</strong></span>}{detail.specs.backspacing&&<span>Backspacing<strong>{detail.specs.backspacing}″</strong></span>}{detail.specs.lift&&<span>Lift height<strong>{detail.specs.lift}″</strong></span>}</div><div className="detail-note"><Info size={18}/><p>{detail.notes}</p></div><p className="dialog-note">Planner coverage: {detail.yearFrom}–{detail.yearTo} JL four-door · {detail.trims.join(", ")}. A vehicle listing does not verify the whole build.</p><a className="source-link" href={detail.url} target="_blank" rel="noopener noreferrer">View product at {detail.retailer}<ArrowUpRight size={17}/></a><p className="dialog-note">Select the exact variant above on the retailer page. These are ordinary retailer links; affiliate tracking is not enabled.</p><div className="price-editor"><h3>Your price note</h3><p>Record a quote or updated price for your own builds. This does not change product specifications.</p><CashField label="Unit price (USD)" value={price} onChange={setPrice}/><p className="dialog-note">{detail.customPrice?"Personal price updated":"Source price checked"} {detail.checkedAt}. {detail.customPrice?"This amount has not been verified with the retailer.":"Price is a dated snapshot, not a live quote."}</p><div className="price-actions">{detail.customPrice&&<Button variant="outline" disabled={priceBusy} onClick={()=>savePrice(true)}>Restore source price</Button>}<Button disabled={priceBusy} onClick={()=>savePrice()}>{priceBusy?<LoaderCircle className="spin" size={15}/>:<CheckCheck size={15}/>}Save price</Button></div></div></>}</DialogContent></Dialog>
 <Dialog open={linkOpen} onOpenChange={setLinkOpen}><DialogContent><DialogHeader><DialogTitle>Your build link</DialogTitle><DialogDescription>The link contains this vehicle and its selected parts. Your name, personal notes and price overrides are not included. This site is currently private, so only you can open it.</DialogDescription></DialogHeader><Input aria-label="Build link" value={shareUrl} readOnly onFocus={e=>e.target.select()}/><DialogFooter><Button onClick={async()=>{try{await navigator.clipboard.writeText(shareUrl);toast.success("Link copied.");}catch{toast.info("Select and copy the link above.");}}}><Share2 size={15}/>Copy link</Button></DialogFooter></DialogContent></Dialog>
 <AlertDialog open={!!confirm} onOpenChange={v=>!busyDelete&&!v&&setConfirm(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{confirm?.kind==="delete"?"Delete this saved build?":"Leave the current build?"}</AlertDialogTitle><AlertDialogDescription>{confirm?.kind==="delete"?`“${confirm.build?.name}” will be removed from your garage.`:"Unsaved changes will be lost. Your other saved builds stay in your garage."}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={busyDelete}>Cancel</AlertDialogCancel><AlertDialogAction disabled={busyDelete} onClick={e=>{e.preventDefault();void confirmed();}}>{busyDelete?"Deleting…":confirm?.kind==="delete"?"Delete build":"Continue"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
 </div>;
}
