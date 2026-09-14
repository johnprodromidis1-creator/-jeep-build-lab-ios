"use client";
import {useEffect,useId,useMemo,useRef,useState} from "react";
import {Wrench,ArrowUpRight,Plus,Trash2,Save,Share2,Printer,RotateCcw,Search,SlidersHorizontal,ChevronRight,TriangleAlert,Info,FolderOpen,ArrowLeft,LoaderCircle,Settings2,CircleDot,MoveVertical,Shield,Anchor,PanelTop,CheckCheck,Undo2,GitCompareArrows,Tag,DollarSign,Ruler,X} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Select,SelectTrigger,SelectContent,SelectItem,SelectValue} from "@/components/ui/select";
import {Tabs,TabsList,TabsTrigger} from "@/components/ui/tabs";
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription,DialogFooter} from "@/components/ui/dialog";
import {AlertDialog,AlertDialogContent,AlertDialogHeader,AlertDialogTitle,AlertDialogDescription,AlertDialogFooter,AlertDialogCancel,AlertDialogAction} from "@/components/ui/alert-dialog";
import {Textarea} from "@/components/ui/textarea";
import {toast,Toaster} from "sonner";
import {baseCatalog,categories,categoryNames,initialState,stateSchema,selectedParts,totalFor,quantityFor,fitsVehicle,buildIssues,partCompatibility,partCoverage,defaultEquipment,vehicleDescription,powertrainNames,money,encodeSharedBuildState,decodeSharedBuildStatePayload,optionAddsBuildError,type BuildState,type Part,type Category,type SavedBuild,type Trim,type Powertrain} from "@/lib/model";
import {allCatalogFilter,dimensionFilterOptions,hasCatalogFilter,matchesCatalogFilters,priceBandOptions} from "@/lib/catalog-filters";

import {costPlan,groupParts,stageFor,stageNames,type Stage} from '@/lib/planning';
import {useBuildDraft,type Draft} from './components/use-build-draft';
import {PartFamily} from './components/part-family';
import {BuildComparison} from './components/build-comparison';
import {deviceStorage} from '@/lib/storage/device';
import {cloudStorage} from '@/lib/storage/cloud';
import {isNative,publicOrigin,exportFile,shareLink,openExternal} from '@/lib/platform';
import {AppSettings} from './components/app-settings';
import {DecimalInput} from './components/decimal-input';

const icons={wheels:CircleDot,tires:CircleDot,lift:MoveVertical,bumpers:PanelTop,winches:Anchor,armor:Shield};
const starter4xeName="2024 Sahara 4xe starter";
const starter4xeNotes="Sample plan using the sourced Mopar 2-inch 4xe lift and a 33-inch Ridge Grappler for stock 20-inch wheels. Confirm the complete combination before buying.";
const starter4xeState:BuildState={...initialState,year:2024,trim:"Sahara",powertrain:"4xe",stockRim:20,stockTire:32,stages:{tires:"now",lift:"later"},picks:{tires:"nitto-217310-4xe",lift:"mopar-77072522ae-4xe"}};
function Choice({label,value,onChange,options}:{label:string;value:string;onChange:(v:string)=>void;options:{value:string;label:string}[]}){
 return <div className="field"><Label>{label}</Label><Select value={value} onValueChange={onChange}><SelectTrigger aria-label={label}><SelectValue/></SelectTrigger><SelectContent>{options.map(o=><SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select></div>;
}
function CashField({label,value,onChange,disabled}:{label:string;value:number;onChange:(n:number)=>void;disabled?:boolean}){
 const inputId=useId();
 return <div className="field"><Label htmlFor={inputId}>{label}</Label><div className="cash-input"><span aria-hidden="true">$</span><DecimalInput id={inputId} value={value} onChange={onChange} places={2} min={0} max={10000000} emptyAsZero disabled={disabled}/></div></div>;
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
export default function Builder({storageMode='device'}:{storageMode?:'device'|'cloud'}){
 const storage=storageMode==='cloud'?cloudStorage:deviceStorage;
 const [settingsOpen,setSettingsOpen]=useState(false);
 const touched=useRef(false),undoHistory=useRef<BuildState[]>([]);
 const [touchedDraft,setTouchedDraft]=useState(false);
 const [undoCount,setUndoCount]=useState(0);
 const [compareOpen,setCompareOpen]=useState(false);
 const [lastSavedTotal,setLastSavedTotal]=useState<number|null>(null);
 const [state,setState]=useState<BuildState>(initialState);
 const [parts,setParts]=useState<Part[]>(baseCatalog);
 const [category,setCategory]=useState<Category>("wheels");
 const [view,setView]=useState("builder");
 const [query,setQuery]=useState("");
 const [brandFilter,setBrandFilter]=useState(allCatalogFilter);
 const [priceFilter,setPriceFilter]=useState(allCatalogFilter);
 const [dimensionFilter,setDimensionFilter]=useState(allCatalogFilter);
 const [sort,setSort]=useState("curated");
 const [showBuildConflicts,setShowBuildConflicts]=useState(false);
 const [showExcluded,setShowExcluded]=useState(false);
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
 const [confirm,setConfirm]=useState<{kind:"reset"|"load"|"delete"|"starter";build?:SavedBuild}|null>(null);
 const [busyDelete,setBusyDelete]=useState(false);
 const [linkOpen,setLinkOpen]=useState(false);
 const [shareUrl,setShareUrl]=useState("");
 const [catalogWarning,setCatalogWarning]=useState("");
 const currentDraft={name,notes,state,buildId:id??null,lastSavedTotal};
 const draft=useBuildDraft(storage,currentDraft,(value:Draft)=>{
  if(touched.current||window.location.hash.startsWith('#build='))return false;
  setState(value.state);setName(value.name);setNotes(value.notes);setId(value.buildId??undefined);setLastSavedTotal(value.lastSavedTotal);setDirty(true);toast.success('Your latest draft was restored.');return true;
 // A deliberate reset is still a draft change, even when the new build is empty.
 },dirty||!!id||touchedDraft);
 const selected=useMemo(()=>selectedParts(state,parts),[state,parts]);
 const issues=useMemo(()=>buildIssues(state,parts),[state,parts]);
 const {subtotal,total}=totalFor(state,parts);
 const plan=costPlan(state,parts);
 const errors=issues.filter(i=>i.level==="error");
 const tire=selected.find(p=>p.category==="tires"),wheel=selected.find(p=>p.category==="wheels"),lift=selected.find(p=>p.category==="lift");
 const vehicleText=vehicleDescription(state);
 const yearOptions=state.powertrain==="4xe"?[2024]:[2018,2019,2020,2021,2022,2023];
 const trimOptions=(state.powertrain==="4xe"?["Sahara"]:["Sport","Sahara","Rubicon"]) as Trim[];
 const categoryPool=parts.filter(p=>p.category===category);
 const brandOptions=Array.from(new Set(categoryPool.map(p=>p.brand))).sort((a,b)=>a.localeCompare(b));
 const dimensionOptions=dimensionFilterOptions(categoryPool,category);
 const catalogFilters={category,query,brand:brandFilter,price:priceFilter,dimension:dimensionFilter};
 const activeCatalogFilter=hasCatalogFilter(catalogFilters);
 const categoryMatches=categoryPool.filter(p=>matchesCatalogFilters(p,state,catalogFilters));
 const compatible=categoryMatches.filter(p=>fitsVehicle(p,state));
 const pickedIds=new Set(Object.values(state.picks));
 const buildConflicting=compatible.filter(p=>!pickedIds.has(p.id)&&optionAddsBuildError(p,state,parts));
 const buildReady=compatible.filter(p=>pickedIds.has(p.id)||!optionAddsBuildError(p,state,parts));
 const excluded=categoryMatches.filter(p=>!fitsVehicle(p,state));
 const filtered=[...(showExcluded?categoryMatches:showBuildConflicts?compatible:buildReady)].sort((a,b)=>sort==="low"?a.priceCents*quantityFor(a,state)-b.priceCents*quantityFor(b,state):sort==="high"?b.priceCents*quantityFor(b,state)-a.priceCents*quantityFor(a,state):0);
 const families=groupParts(filtered);
 function markTouched(){touched.current=true;setTouchedDraft(true);}
 function clearCatalogFilters(){setQuery("");setBrandFilter(allCatalogFilter);setPriceFilter(allCatalogFilter);setDimensionFilter(allCatalogFilter);}
 function changeCategory(c:Category){setCategory(c);clearCatalogFilters();}
 const modified=(next:BuildState)=>{markTouched();undoHistory.current=[...undoHistory.current.slice(-19),state];setUndoCount(undoHistory.current.length);setState(next);setDirty(true);setCompare(false);};
 function undo(){const previous=undoHistory.current.pop();if(!previous)return;markTouched();setState(previous);setUndoCount(undoHistory.current.length);setDirty(true);setCompare(false);}
 function reviewCategory(c:Category){changeCategory(c);document.getElementById('parts-heading')?.focus({preventScroll:true});document.getElementById('parts-section')?.scrollIntoView({behavior:'smooth'});}
 function clearUndo(){undoHistory.current=[];setUndoCount(0);markTouched();}
 const update=(patch:Partial<BuildState>)=>modified({...state,...patch});
 function updatePowertrain(powertrain:Powertrain){
  const trim=powertrain==="4xe"?"Sahara":state.trim;
  const year=powertrain==="4xe"?2024:Math.min(state.year,2023);
  update({powertrain,trim,year,...defaultEquipment(trim,powertrain)});
 }
 function updateTrim(trim:Trim){update({trim,...defaultEquipment(trim,state.powertrain)});}
 useEffect(()=>{
 storage.catalog().then(setParts).catch((e:Error)=>setCatalogWarning(e.message));
 if(window.location.hash.startsWith("#build=")){
   try{const raw=window.location.hash.slice(7);if(raw.length>5000)throw new Error();const parsed=decodeSharedBuildStatePayload(raw);queueMicrotask(()=>{setState(parsed);setName("Linked JL build");setDirty(true);toast.success("Build loaded from link.");});}catch{toast.error("This build link is invalid or uses unsupported parts.");}
  }
 },[storage]);
 useEffect(()=>{if(!dirty||draft.status==="saved")return;const handler=(e:BeforeUnloadEvent)=>{e.preventDefault();};window.addEventListener("beforeunload",handler);return()=>window.removeEventListener("beforeunload",handler);},[dirty,draft.status]);
 async function loadGarage(){setGarageBusy(true);setGarageError('');try{setGarage(await storage.list());}catch(e){setGarageError(e instanceof Error?e.message:'Could not load garage.');}finally{setGarageBusy(false);}}
 function selectPart(p:Part){const picks={...state.picks},stages={...state.stages};if(picks[p.category]===p.id){delete picks[p.category];delete stages[p.category];}else{picks[p.category]=p.id;stages[p.category]='now';}update({picks,stages});}
 function removePart(c:Category){const picks={...state.picks},stages={...state.stages};delete picks[c];delete stages[c];update({picks,stages});}
 async function saveBuild(){if(!name.trim())return;setSaving(true);try{const data=await storage.save({id:saveCopy?undefined:id,name:name.trim(),notes,state});setId(data.id);setLastSavedTotal(data.savedTotal);setName(name.trim());markTouched();setDirty(false);setSaveOpen(false);toast.success(storage.mode==='device'?'Build saved on this device.':'Build saved in your cloud garage.');}catch(e){toast.error(e instanceof Error?e.message:'Could not save build.');}finally{setSaving(false);}}
 function loadBuild(b:SavedBuild){const parsed=stateSchema.safeParse(b.state);if(!parsed.success){toast.error("This saved build has unsupported data.");return;}clearUndo();setState(parsed.data);setLastSavedTotal(b.savedTotal);setId(b.id);setName(b.name);setNotes(b.notes);setDirty(false);setView("builder");setCompare(false);history.replaceState(null,"",location.pathname);toast.success("Build opened.");}
 function loadStarterBuild(){clearUndo();setLastSavedTotal(null);setState(structuredClone(starter4xeState));setId(undefined);setName(starter4xeName);setNotes(starter4xeNotes);setDirty(true);setCompare(false);setView("builder");setCategory("tires");clearCatalogFilters();setShowBuildConflicts(false);setShowExcluded(false);history.replaceState(null,"",location.pathname);toast.success("Starter 4xe build loaded.");}
 function requestStarterBuild(){if(dirty)setConfirm({kind:"starter"});else loadStarterBuild();}
 function reset(){clearUndo();setLastSavedTotal(null);setState({...initialState,picks:{}});setId(undefined);setName("My JL build");setNotes("");setDirty(false);setCompare(false);setView("builder");history.replaceState(null,"",location.pathname);}
 async function confirmed(){
  if(confirm?.kind==="delete"&&confirm.build){setBusyDelete(true);try{await storage.remove(confirm.build.id);if(id===confirm.build.id){setId(undefined);setDirty(true);}setGarage(v=>v.filter(b=>b.id!==confirm.build!.id));toast.success("Build deleted.");}catch(e){toast.error(e instanceof Error?e.message:"Could not delete build.");}finally{setBusyDelete(false);setConfirm(null);}}
  else{if(confirm?.kind==="load"&&confirm.build)loadBuild(confirm.build);else if(confirm?.kind==="starter")loadStarterBuild();else reset();setConfirm(null);}
 }
 async function share(){const url=publicOrigin+'/#build='+encodeSharedBuildState(state);setShareUrl(url);setLinkOpen(true);}
 async function savePrice(resetPrice=false){if(!detail)return;setPriceBusy(true);try{const updated=await storage.price(detail.id,resetPrice?null:price);setParts(updated);setDetail(updated.find(p=>p.id===detail.id)??null);setDirty(true);toast.success(resetPrice?'Source price restored.':'Your price note was saved.');}catch(e){toast.error(e instanceof Error?e.message:'Could not save price.');}finally{setPriceBusy(false);}}
 function openDetail(p:Part){setDetail(p);setPrice(p.priceCents);}
 async function exportCSV(){
  const rows=[["Jeep Build Lab",name],["Vehicle",vehicleText],["Category","Brand","Product","Variant","Reference","Quantity","Unit USD","Line USD","Source","Price date","Price type","Purchase stage"],...selected.map(p=>[categoryNames[p.category],p.brand,p.name,p.variant,p.reference,quantityFor(p,state),p.priceCents/100,p.priceCents*quantityFor(p,state)/100,p.url,p.checkedAt,p.customPrice?"Personal price":"Source snapshot",stageNames[stageFor(state,p.category)]]),["Parts subtotal",subtotal/100],["Labor allowance",state.labor/100],["Tax, shipping and extras allowance",state.extras/100],["Full selection value incl. allowances",total/100],["Already owned / installed selection value",plan.covered/100],["Buy now parts",plan.now/100],["Buy later parts",plan.later/100],["Upgrades left to fund incl. allowances",plan.remaining/100],["Entered vehicle price",state.vehicleCost/100],["Vehicle plus unfunded upgrades",plan.project/100],["Notes",notes],...issues.map(i=>["Fitment "+i.level,i.message])];
  const csv=rows.map(row=>row.map(v=>'"'+String(v).replace(/^[=+@-]/,"'$&").replaceAll('"','""')+'"').join(",")).join("\r\n");try{await exportFile('jeep-build-parts.csv','\uFEFF'+csv,'text/csv;charset=utf-8');}catch(e){toast.error(e instanceof Error?e.message:'The parts list could not be exported.');}
 }
 const confirmTitle=confirm?.kind==="delete"?"Delete this saved build?":confirm?.kind==="starter"?"Load the 4xe starter build?":"Leave the current build?";
 const confirmDescription=confirm?.kind==="delete"?`“${confirm.build?.name}” will be removed from your garage.`:confirm?.kind==="starter"?"This replaces your current draft with a sample 2024 Sahara 4xe plan. Save a named version first if you want to keep your current draft. Other saved builds stay in your garage.":"Continuing replaces your current draft. Save a named version first if you want to keep it. Other saved builds stay in your garage.";
 const confirmAction=busyDelete?"Deleting…":confirm?.kind==="delete"?"Delete build":confirm?.kind==="starter"?"Load starter build":"Continue";
 return <div className="app-shell">
 <Toaster theme="dark" position="bottom-center" richColors mobileOffset={{bottom:"calc(92px + env(safe-area-inset-bottom))",left:"16px",right:"16px"}}/>
 <header className="topbar"><button className="brand" type="button" aria-label="Jeep Build Lab home" onClick={()=>setView("builder")}><span className="brand-mark"><Wrench size={21}/></span><span>JEEP<span className="brand-light">BUILD LAB</span></span><span className="alpha-tag">JL PLANNER</span></button>
 <Tabs value={view} onValueChange={v=>{setView(v);if(v==="garage")void loadGarage();}}><TabsList className="nav-tabs"><TabsTrigger value="builder"><Wrench size={15}/>Builder</TabsTrigger><TabsTrigger value="garage"><FolderOpen size={15}/>My garage</TabsTrigger></TabsList></Tabs>
 <Button variant="ghost" className="settings-button" onClick={()=>setSettingsOpen(true)} aria-label="Settings, privacy and support"><Settings2 size={18}/><span>Settings</span></Button></header>
 <main className="workshop">
 {view==="builder"?<>
 <section className="page-heading compact-heading"><div><h1>Build & price your Jeep<span>.</span></h1><p>Choose upgrades. Compare options. Plan your budget.</p></div><div className="heading-actions"><Button variant="outline" disabled={!undoCount} onClick={undo}><Undo2 size={16}/>Undo</Button><Button variant="outline" onClick={()=>{setCompareOpen(true);void loadGarage();}}><GitCompareArrows size={16}/>Compare builds</Button><Button variant="outline" onClick={()=>setConfirm({kind:"reset"})}><RotateCcw size={16}/><span>New build</span></Button></div></section>
 <div className="draft-status" role="status"><span>{draft.status==='saved'?`Draft saved ${storage.mode==='device'?'on this device':'in your cloud garage'}`:draft.status==='idle'?`Autosave ${storage.mode==='device'?'on this device':'to your cloud garage'} starts when you make a change`:draft.status==='loading'?'Checking for your latest draft…':draft.status==='saving'?'Protecting your draft…':draft.status==='pending'?'Draft changes pending…':draft.error}</span>{draft.status==='error'&&<Button size="sm" variant="ghost" onClick={draft.retry}>Retry draft</Button>}{draft.status==='conflict'&&<Button size="sm" variant="outline" onClick={()=>{setSaveCopy(true);setSaveOpen(true);}}>Save current plan as a copy</Button>}</div>
 <p className="storage-label">{storage.mode==='device'?'Device garage · no account needed · export a backup before changing devices':'Cloud garage · private to your signed-in account'}</p>
 <section className="starter-strip" aria-label="Starter build"><div><span className="eyebrow">STARTER BUILD</span><strong>Load a 2024 Sahara 4xe sample</strong><p>Mopar 2-inch 4xe lift, 33-inch Ridge Grappler tires and stock 20-inch wheels.</p></div><Button variant="outline" onClick={requestStarterBuild}><Plus size={16}/>Load starter</Button></section>
 <nav className="build-steps" aria-label="Build steps"><button type="button" onClick={()=>setVehicleOpen(true)}><span>1</span>Your Jeep<small>Year, trim & current equipment</small></button><button type="button" onClick={()=>reviewCategory(category)}><span>2</span>Choose parts<small>{selected.length} categories selected</small></button><button type="button" onClick={()=>document.getElementById('build-summary')?.scrollIntoView({behavior:'smooth'})}><span>3</span>Plan & price<small>{money(plan.remaining)} left to fund</small></button></nav>
 <section className="vehicle-bar" aria-label="Your vehicle"><span className="vehicle-number">01</span><div className="vehicle-title"><span className="eyebrow">YOUR VEHICLE</span><strong>{state.year} Wrangler JL <span>Unlimited · 4-door</span></strong></div><div className="vehicle-tags"><span>{state.trim}</span><span>{powertrainNames[state.powertrain]}</span></div><Button variant="ghost" className="change-vehicle" onClick={()=>setVehicleOpen(true)}>Edit vehicle<Settings2 size={16}/></Button></section>
 <section className={`fitment-inline ${errors.length?'has-conflict':''}`} aria-label="Fitment checks" id="fitment-status">
 <div className="fitment-inline-heading"><TriangleAlert size={18}/><strong>{errors.length?`${errors.length} fitment conflict${errors.length===1?'':'s'} to resolve`:selected.length?'No conflicts detected by the current checks':'Fitment checks appear as you build'}</strong></div>
 {errors.map((issue,index)=><div className="fitment-inline-error" key={index}><p>{issue.message}</p>{issue.category&&<Button size="sm" variant="outline" onClick={()=>reviewCategory(issue.category!)}>Review {categoryNames[issue.category].toLowerCase()}</Button>}</div>)}
 <details><summary>{issues.filter(i=>i.level==='note').length} checks still need confirmation</summary><p>Checks apply to the final combination, including parts marked for later. A shop must confirm fitment and installation order.</p>{issues.filter(i=>i.level==='note').map((issue,index)=><p key={index}>• {issue.message}</p>)}{!selected.length&&<p>Add a part to see its fitment checks.</p>}</details>
 </section>
 <div className="build-grid"><div className="build-main">
 <section className="preview-panel">
 <div className="preview-top"><span className="preview-status"><span/>{compare?"STOCK COMPARISON":"BUILD PREVIEW"}</span><div className="preview-toggle"><button type="button" aria-pressed={!compare} className={compare?"":"active"} onClick={()=>setCompare(false)}>Your build</button><button type="button" aria-pressed={compare} className={compare?"active":""} onClick={()=>setCompare(true)}>Stock</button></div></div>
 <div className="preview-stage"><span className="studio-word" aria-hidden="true">WRANGLER</span><Preview state={state} parts={parts} stock={compare}/><span className="stage-label">JL / 4-DOOR</span><span className="stage-side">SIDE PROFILE</span></div>
 <div className="preview-specs"><div><span>TIRES</span><strong>{compare?state.stockTire:tire?.specs.diameter??state.stockTire}<small>″</small></strong></div><div><span>LIFT</span><strong>{compare?0:lift?.specs.lift??0}<small>″</small></strong></div><div><span>WHEELS</span><strong>{compare?state.stockRim:wheel?.specs.rim??state.stockRim}<small>″</small></strong></div><div className="preview-finish"><span>FINISH</span><strong><i/>Silver</strong></div></div>
 <p className="preview-disclaimer"><Info size={14}/>Illustrative preview. Wheel designs are generic; bumpers, winches and armor are listed only. Dimensions are approximate.</p>
 </section>
 <section id="parts-section" className="parts-section" aria-labelledby="parts-heading">
 <div className="section-heading"><div><span className="eyebrow">AFTERMARKET PARTS</span><h2 id="parts-heading" tabIndex={-1}>Choose your upgrades</h2></div><span className="catalog-count">{parts.length} curated variants</span></div>
 <Tabs value={category} onValueChange={v=>changeCategory(v as Category)}><TabsList className="category-tabs">{categories.map(c=>{const Icon=icons[c];return <TabsTrigger key={c} value={c}><Icon size={16}/>{categoryNames[c]}{state.picks[c]&&<span className="tab-dot"/>}</TabsTrigger>;})}</TabsList></Tabs>
 <div className="catalog-toolbar"><div className="search-box"><Search size={17}/><Input aria-label="Search parts" placeholder={`Search ${categoryNames[category].toLowerCase()}…`} value={query} onChange={e=>setQuery(e.target.value)}/></div><Select value={sort} onValueChange={setSort}><SelectTrigger aria-label="Sort parts"><SlidersHorizontal size={14}/><SelectValue/></SelectTrigger><SelectContent><SelectItem value="curated">Curated order</SelectItem><SelectItem value="low">Price: low to high</SelectItem><SelectItem value="high">Price: high to low</SelectItem></SelectContent></Select><label className="catalog-toggle"><input type="checkbox" checked={showBuildConflicts} onChange={e=>setShowBuildConflicts(e.target.checked)}/><span>Show conflicts</span>{buildConflicting.length>0&&<strong>{buildConflicting.length}</strong>}</label><label className="catalog-toggle"><input type="checkbox" checked={showExcluded} onChange={e=>setShowExcluded(e.target.checked)}/><span>Show excluded</span>{excluded.length>0&&<strong>{excluded.length}</strong>}</label></div>
 <div className="catalog-filters" aria-label="Catalog filters"><Select value={brandFilter} onValueChange={setBrandFilter}><SelectTrigger aria-label="Filter by brand"><Tag size={14}/><SelectValue/></SelectTrigger><SelectContent><SelectItem value={allCatalogFilter}>All brands</SelectItem>{brandOptions.map(brand=><SelectItem key={brand} value={brand}>{brand}</SelectItem>)}</SelectContent></Select><Select value={priceFilter} onValueChange={setPriceFilter}><SelectTrigger aria-label="Filter by price"><DollarSign size={14}/><SelectValue/></SelectTrigger><SelectContent>{priceBandOptions.map(option=><SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select>{dimensionOptions.length>1&&<Select value={dimensionFilter} onValueChange={setDimensionFilter}><SelectTrigger aria-label="Filter by size or specification"><Ruler size={14}/><SelectValue/></SelectTrigger><SelectContent><SelectItem value={allCatalogFilter}>All sizes</SelectItem>{dimensionOptions.map(option=><SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select>}{activeCatalogFilter&&<Button variant="ghost" className="filter-reset" onClick={clearCatalogFilters}><X size={14}/>Clear filters</Button>}</div>
 <div className="catalog-subtitle"><span>{families.length} products · {buildReady.length} fit your current build</span><span>{activeCatalogFilter?'Filters active · ':''}{buildConflicting.length} need another build change · {excluded.length} excluded by vehicle fitment · USD · Selection prices include quantity</span></div>
 {catalogWarning&&<div className="inline-warning"><TriangleAlert size={16}/>{catalogWarning}</div>}
 {category==="tires"&&<p className="category-note">Choose a tire with the same wheel diameter as your build: <strong>{wheel?.specs.rim??state.stockRim} inches.</strong></p>}
 <div className="parts-grid">{families.map(family=><PartFamily key={family.key} variants={family.variants} state={state} parts={parts} onSelect={selectPart} onDetail={openDetail} compatibilityReason={p=>partCompatibility(p,state)}/>)}</div>
 {!filtered.length&&<div className="empty-state"><Search/><h3>No matching parts</h3><p>{categoryMatches.length&&!compatible.length?'All matching parts are excluded for this vehicle. Turn on Show excluded to see why.':compatible.length&&!buildReady.length&&!showBuildConflicts?'Matching parts fit this vehicle, but they create a current-build conflict. Turn on Show conflicts to review them.':activeCatalogFilter?'No parts match those filters. Clear filters or broaden the search.':'Try a brand, size or part number.'}</p><Button variant="outline" onClick={clearCatalogFilters}>{activeCatalogFilter?'Clear filters':'Clear search'}</Button></div>}
 <p className="catalog-footnote">Source prices checked September 8 and September 13, 2026. Prices and availability may change. Product artwork is illustrative. Lighting, tops and interior parts are planned for a later catalog.</p>
 </section>
 </div>
 <aside className="build-sidebar" id="build-summary"><div className="summary-card">
 <div className="summary-heading"><span className="eyebrow">PLAN & PRICE</span><span className="count-badge">{selected.length}</span></div>
 <h2>{name}</h2><p className="save-state">{dirty?"Draft · save a named version to compare it later":id?"Named version saved in your garage":"Your upgrade plan"}</p>
 <div className="summary-list">{selected.length?selected.map(p=><div className="summary-item" key={p.id}><div><span>{categoryNames[p.category]}{quantityFor(p,state)>1?` × ${quantityFor(p,state)}`:""}</span><button type="button" onClick={()=>openDetail(p)}>{p.brand} {p.name}</button><small>{p.variant}</small><Select value={stageFor(state,p.category)} onValueChange={v=>update({stages:{...state.stages,[p.category]:v as Stage}})}><SelectTrigger className="stage-select" aria-label={`${p.name} purchase stage`}><SelectValue/></SelectTrigger><SelectContent>{Object.entries(stageNames).map(([value,label])=><SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div><div><strong>{money(p.priceCents*quantityFor(p,state))}</strong><button type="button" className="remove-button" aria-label={`Remove ${p.name}`} onClick={()=>removePart(p.category)}><Trash2 size={14}/></button></div></div>):<div className="build-empty"><Plus size={22}/><p>Your next upgrade goes here.</p><span>Pick a part below the preview to start building.</span></div>}</div>
 <div className="quantity-row"><div><strong>Matching spare</strong><span>Wheel & tire quantity</span></div><div className="quantity-control" role="group" aria-label="Wheel and tire quantity">{[4,5].map(q=><button key={q} type="button" aria-pressed={state.quantity===q} className={state.quantity===q?"active":""} onClick={()=>update({quantity:q as 4|5})}>{q}</button>)}</div></div>
 <div className="budget-fields"><CashField label="Upgrade budget" value={state.budget} onChange={n=>update({budget:n})}/><div className="budget-two"><CashField label="Labor allowance" value={state.labor} onChange={n=>update({labor:n})}/><CashField label="Tax, shipping & extras" value={state.extras} onChange={n=>update({extras:n})}/></div></div>
 <div className="totals"><div><span>Buy now · parts</span><span>{money(plan.now)}</span></div><div><span>Buy later · parts</span><span>{money(plan.later)}</span></div><div><span>Labor & other allowances</span><span>{money(plan.allowances)}</span></div>{plan.covered>0&&<div><span>Owned / installed · excluded</span><span>{money(plan.covered)}</span></div>}<div className="grand-total"><span>Upgrades left to fund</span><strong aria-live="polite">{money(plan.remaining)}</strong></div></div>
 {state.budget>0&&<div className={`budget-meter ${plan.remaining>state.budget?'over':''}`}><div><span style={{width:Math.min(plan.remaining/state.budget*100,100)+'%'}}/></div><p>{plan.remaining>state.budget?`${money(plan.remaining-state.budget)} over upgrade budget`:`${money(state.budget-plan.remaining)} left in your upgrade budget`}</p></div>}
 <p className="price-note">Allowances start at $0. Enter quotes for labor, tax, shipping and supporting parts to include them. Owned and installed parts use catalog value, not your original purchase price.</p>
 <details className="purchase-plan"><summary>Vehicle cost & purchase plan</summary><CashField label="Vehicle price or quote (optional)" value={state.vehicleCost??0} onChange={n=>update({vehicleCost:n})}/><p>Leave $0 if you already own your Jeep. Enter your own quote; this is not factory MSRP.</p><dl><div><dt>Buy now + all allowances</dt><dd>{money(plan.dueNow)}</dd></div><div><dt>Buy later</dt><dd>{money(plan.later)}</dd></div><div><dt>Vehicle + unfunded upgrades</dt><dd>{money(plan.project)}</dd></div></dl><p>Allowances are reserved in the first phase. “Buy now” is a budget plan, not a verified installation sequence.</p></details>
 {lastSavedTotal!==null&&!dirty&&total!==lastSavedTotal&&<p className="inline-warning">Your full selection estimate changed by {money(total-lastSavedTotal)} since this version was saved. Current prices are used above.</p>}
 <Button className="compare-full" variant="outline" onClick={()=>{setCompareOpen(true);void loadGarage();}}><GitCompareArrows size={16}/>Compare with a saved build</Button>
 <Button className="save-full" onClick={()=>{setSaveCopy(false);setSaveOpen(true);}}><Save size={16}/>{id?"Save changes":"Save to my garage"}</Button>
 <div className="export-buttons"><Button variant="ghost" onClick={share}><Share2 size={15}/>Share build</Button>{!isNative()&&<Button variant="ghost" onClick={()=>window.print()}><Printer size={15}/>Print list</Button>}</div>
 <button type="button" className="csv-link" onClick={exportCSV}>{isNative()?'Export parts list':'Download parts CSV'}<ArrowUpRight size={13}/></button>
 </div>
 </aside></div>
 <div className="mobile-total"><div><span>{errors.length?`${errors.length} fitment conflicts`:`${selected.length} upgrades`} · Left to fund</span><strong>{money(plan.remaining)}</strong></div><Button onClick={()=>document.getElementById("build-summary")?.scrollIntoView({behavior:"smooth"})}>Build sheet<ChevronRight size={16}/></Button></div>
 </>:<>
 <section className="page-heading"><div><div className="eyebrow">PARK YOUR IDEAS HERE</div><h1>My garage<span>.</span></h1><p>Revisit a build. Refine the details. Make it happen.</p></div><Button onClick={()=>dirty?setConfirm({kind:"reset"}):reset()}><Plus size={16}/>New build</Button></section>
 <Button variant="ghost" className="back-builder" onClick={()=>setView("builder")}><ArrowLeft size={16}/>Back to current build</Button>
 {garageBusy?<div className="empty-state"><LoaderCircle className="spin"/><p>Opening your garage…</p></div>:garageError?<div className="empty-state"><TriangleAlert/><h3>Garage unavailable</h3><p>{garageError}</p><Button onClick={loadGarage}>Try again</Button></div>:garage.length?<div className="garage-grid">{garage.map(b=><article className="garage-card" key={b.id}><div className="garage-preview"><Preview state={b.state} parts={parts}/></div><div className="garage-info"><span className="eyebrow">{b.state.year} JL · {b.state.trim} · {powertrainNames[b.state.powertrain]}</span><h2>{b.name}</h2><p>{Object.values(b.state.picks).length} upgrades · Saved {new Date(b.updatedAt).toLocaleDateString("en-US")}</p>{b.notes&&<p className="garage-notes">{b.notes}</p>}<div><strong>{money(b.savedTotal)}<small>selection value when saved</small></strong><Button onClick={()=>dirty?setConfirm({kind:"load",build:b}):loadBuild(b)}>Open build<ChevronRight size={15}/></Button><Button variant="ghost" size="icon" aria-label={`Delete ${b.name}`} onClick={()=>setConfirm({kind:"delete",build:b})}><Trash2 size={16}/></Button></div></div></article>)}</div>:<div className="empty-state garage-empty"><FolderOpen size={42}/><h2>A garage full of possibility.</h2><p>Save your first build and it will be waiting here.</p><Button onClick={()=>setView("builder")}>Start building<ChevronRight size={16}/></Button></div>}
 </>}
 <footer className="site-footer"><span><Wrench size={14}/>JEEP BUILD LAB</span><p>Independent build planner. Not affiliated with Jeep or the listed brands.</p><nav><button type="button" onClick={()=>setSettingsOpen(true)}>Privacy & help</button>{!isNative()&&<><a href="/privacy">Privacy policy</a><a href="/support">Support</a></>}</nav></footer>
 </main>
 <section className="print-sheet"><h1>{name}</h1><p>{vehicleText}</p><p>Jeep Build Lab · Planning estimate · {new Date().toLocaleDateString("en-US")}</p><table><thead><tr><th>Part / variant</th><th>Stage</th><th>Qty</th><th>Unit</th><th>Total</th></tr></thead><tbody>{selected.map(p=><tr key={p.id}><td><strong>{p.brand} {p.name}</strong><br/>{p.variant} · {p.reference}<br/><small>{p.url}<br/>{p.customPrice?"Personal price":"Source price"} · {p.checkedAt}</small></td><td>{stageNames[stageFor(state,p.category)]}</td><td>{quantityFor(p,state)}</td><td>{money(p.priceCents)}</td><td>{money(p.priceCents*quantityFor(p,state))}</td></tr>)}</tbody></table><p>Parts: {money(subtotal)} · Labor allowance: {money(state.labor)} · Tax, shipping & extras allowance: {money(state.extras)}</p><h2>Upgrades left to fund: {money(plan.remaining)}</h2><p>Buy now parts: {money(plan.now)} · Buy later parts: {money(plan.later)} · Owned / installed value excluded: {money(plan.covered)}</p><p>Entered vehicle price: {money(state.vehicleCost??0)} · Vehicle plus unfunded upgrades: {money(plan.project)}</p><p>Additional costs are included only to the extent of the entered allowances. Fitment checks cover all selected parts; installation order requires confirmation.</p><h3>Fitment notes</h3><p>Have an installer confirm the complete combination before purchase.</p><ul>{issues.map((i,n)=><li key={n}>{i.message}</li>)}{selected.map(p=><li key={p.id}>{p.name}: {p.notes}</li>)}</ul>{notes&&<><h3>Your notes</h3><p>{notes}</p></>}</section>
 <AppSettings open={settingsOpen} onOpenChange={setSettingsOpen} storage={storage} currentDraft={currentDraft} pauseDraft={draft.pause} resumeDraft={draft.resume}/>
 <BuildComparison open={compareOpen} onOpenChange={setCompareOpen} current={state} name={name} parts={parts} builds={garage} busy={garageBusy} error={garageError} onRetry={loadGarage} onSaveCopy={()=>{setCompareOpen(false);setSaveCopy(true);setSaveOpen(true);}}/>
 <Dialog open={vehicleOpen} onOpenChange={setVehicleOpen}><DialogContent><DialogHeader><DialogTitle>Your starting point</DialogTitle><DialogDescription>This catalog covers 2018–2023 Wrangler JL Unlimited four-door 3.6L gas models plus a first 2024 Sahara 4xe batch.</DialogDescription></DialogHeader><div className="vehicle-dialog-fields"><div className="model-locked"><strong>Wrangler JL</strong><span>4-door · {powertrainNames[state.powertrain]}</span></div><div className="two-fields"><Choice label="Powertrain" value={state.powertrain} onChange={v=>updatePowertrain(v as Powertrain)} options={[{value:"gas",label:"3.6L V6 gas"},{value:"4xe",label:"4xe plug-in hybrid"}]}/><Choice label="Model year" value={String(state.year)} onChange={v=>update({year:Number(v)})} options={yearOptions.map(v=>({value:String(v),label:String(v)}))}/></div><div className="two-fields"><Choice label="Trim" value={state.trim} onChange={v=>updateTrim(v as Trim)} options={trimOptions.map(v=>({value:v,label:v}))}/><Choice label="Current wheel diameter" value={String(state.stockRim)} onChange={v=>update({stockRim:Number(v) as 17|18|20})} options={[17,18,20].map(v=>({value:String(v),label:v+" inches"}))}/></div><div className="field"><Label htmlFor="stock-tire">Current tire diameter (in)</Label><DecimalInput id="stock-tire" places={1} min={300} max={350} value={Math.round(state.stockTire*10)} onChange={n=>update({stockTire:n/10})}/></div><p className="dialog-note">Confirm your current sizes from your Jeep. Defaults are approximate. First 4xe coverage is limited to 2024 Sahara 4xe. TJ, JK, JT, two-door, diesel, 392 and Xtreme Recon are still outside catalog scope. Changing vehicle details keeps your parts and flags conflicts for review.</p></div><DialogFooter><Button onClick={()=>setVehicleOpen(false)}>Continue building<ChevronRight size={16}/></Button></DialogFooter></DialogContent></Dialog>
 <Dialog open={saveOpen} onOpenChange={v=>!saving&&setSaveOpen(v)}><DialogContent><DialogHeader><DialogTitle>{saveCopy?"Save a new copy":"Save your build"}</DialogTitle><DialogDescription>Keep this configuration and your notes {storage.mode==='device'?'on this device':'in your private cloud garage'}. Opening it later uses your current catalog prices.</DialogDescription></DialogHeader><div className="field"><Label htmlFor="build-name">Build name</Label><Input id="build-name" disabled={saving} maxLength={80} value={name} onChange={e=>{markTouched();setName(e.target.value);setDirty(true);}} placeholder="Weekend trail runner"/></div><div className="field"><Label htmlFor="build-notes">Notes (optional)</Label><Textarea id="build-notes" disabled={saving} maxLength={1500} value={notes} onChange={e=>{markTouched();setNotes(e.target.value);setDirty(true);}} placeholder="What are you building toward?"/></div>{errors.length>0&&<p className="inline-warning">This build has {errors.length} unresolved fitment conflicts. You can save it as a plan.</p>}<DialogFooter>{id&&!saveCopy&&<Button variant="outline" disabled={saving} onClick={()=>setSaveCopy(true)}>Save as a copy</Button>}<Button disabled={saving||!name.trim()} onClick={saveBuild}>{saving?<LoaderCircle className="spin" size={16}/>:<Save size={16}/>}Save build</Button></DialogFooter></DialogContent></Dialog>
 <Dialog open={!!detail} onOpenChange={v=>!priceBusy&&!v&&setDetail(null)}><DialogContent className="part-dialog"><DialogHeader><DialogTitle>{detail?.brand} {detail?.name}</DialogTitle><DialogDescription>{detail?.variant} · {detail?.reference}</DialogDescription></DialogHeader>{detail&&<><div className="detail-specs">{detail.specs.rim&&<span>Wheel diameter<strong>{detail.specs.rim}″</strong></span>}{detail.specs.diameter&&<span>Nominal tire diameter<strong>{detail.specs.diameter}″</strong></span>}{detail.specs.width&&<span>Wheel width<strong>{detail.specs.width}″</strong></span>}{detail.specs.offset!==undefined&&<span>Offset<strong>{detail.specs.offset} mm</strong></span>}{detail.specs.backspacing&&<span>Backspacing<strong>{detail.specs.backspacing}″</strong></span>}{detail.specs.lift&&<span>Lift height<strong>{detail.specs.lift}″</strong></span>}</div><div className="detail-note"><Info size={18}/><p>{detail.notes}</p></div><p className="dialog-note">Planner coverage: {partCoverage(detail)}. A vehicle listing does not verify the whole build.</p><a className="source-link" href={detail.url} target="_blank" rel="noopener noreferrer" onClick={e=>{if(isNative()){e.preventDefault();void openExternal(detail.url).catch(()=>toast.error('Could not open the retailer. Check your connection.'));}}}>View product at {detail.retailer}<ArrowUpRight size={17}/></a><p className="dialog-note">Select the exact variant above on the retailer page. These are ordinary retailer links; affiliate tracking is not enabled.</p><div className="price-editor"><h3>Your price note</h3><p>Record a quote or updated price for your own builds. This does not change product specifications.</p><CashField label="Unit price (USD)" value={price} onChange={setPrice} disabled={priceBusy}/><p className="dialog-note">{detail.customPrice?"Personal price updated":"Source price checked"} {detail.checkedAt}. {detail.customPrice?"This amount has not been verified with the retailer.":"Price is a dated snapshot, not a live quote."}</p><div className="price-actions">{detail.customPrice&&<Button variant="outline" disabled={priceBusy} onClick={()=>savePrice(true)}>Restore source price</Button>}<Button disabled={priceBusy} onClick={()=>savePrice()}>{priceBusy?<LoaderCircle className="spin" size={15}/>:<CheckCheck size={15}/>}Save price</Button></div></div></>}</DialogContent></Dialog>
 <Dialog open={linkOpen} onOpenChange={setLinkOpen}><DialogContent><DialogHeader><DialogTitle>Your build link</DialogTitle><DialogDescription>The link contains the vehicle, selected parts, purchase stages and budget amounts. Your name, personal notes and price overrides are not included. Anyone with the link can read the included details. Retailer pages and opening the web link require internet access.</DialogDescription></DialogHeader><Input aria-label="Build link" value={shareUrl} readOnly onFocus={e=>e.target.select()}/><DialogFooter><Button onClick={async()=>{try{await shareLink(shareUrl);if(!isNative())toast.success("Link copied.");}catch{toast.info("You can select and copy the link above.");}}}><Share2 size={15}/>{isNative()?"Share link":"Copy link"}</Button></DialogFooter></DialogContent></Dialog>
 {confirm&&<AlertDialog open onOpenChange={v=>!busyDelete&&!v&&setConfirm(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{confirmTitle}</AlertDialogTitle><AlertDialogDescription>{confirmDescription}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={busyDelete}>Cancel</AlertDialogCancel><AlertDialogAction disabled={busyDelete} onClick={e=>{e.preventDefault();void confirmed();}}>{confirmAction}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>}
 </div>;
}
