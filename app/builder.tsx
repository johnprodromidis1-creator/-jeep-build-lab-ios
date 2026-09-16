"use client";
import {useEffect,useId,useMemo,useRef,useState} from "react";
import {Wrench,ArrowUpRight,Plus,Trash2,Save,Share2,Printer,RotateCcw,Search,SlidersHorizontal,ChevronRight,TriangleAlert,Info,FolderOpen,ArrowLeft,LoaderCircle,Settings2,CircleDot,MoveVertical,Shield,Anchor,PanelTop,CheckCheck,Undo2,GitCompareArrows,Tag,DollarSign,Ruler,X,FileText,CopyPlus,FileSpreadsheet,Handshake,ClipboardList,Mail} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Select,SelectTrigger,SelectContent,SelectItem,SelectValue} from "@/components/ui/select";
import {Tabs,TabsList,TabsTrigger} from "@/components/ui/tabs";
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription,DialogFooter} from "@/components/ui/dialog";
import {AlertDialog,AlertDialogContent,AlertDialogHeader,AlertDialogTitle,AlertDialogDescription,AlertDialogFooter,AlertDialogCancel,AlertDialogAction} from "@/components/ui/alert-dialog";
import {Textarea} from "@/components/ui/textarea";
import {toast,Toaster} from "sonner";
import {baseCatalog,categories,categoryNames,initialState,stateSchema,selectedParts,totalFor,quantityFor,fitsVehicle,buildIssues,buildErrorsForOption,partCompatibility,partCoverage,partSpecBadges,defaultEquipment,vehicleDescription,powertrainNames,money,linePriceRangeLabel,encodeSharedBuildState,decodeSharedBuildStatePayload,optionAddsBuildError,latestSourceCheckedAt,priceBasis,sourceCheckedLabel,sourceFreshnessSummary,type BuildState,type Part,type Category,type SavedBuild,type Trim,type Powertrain} from "@/lib/model";
import {allCatalogFilter,catalogSortOptions,compareCatalogParts,dimensionFilterOptions,hasCatalogFilter,matchesCatalogFilters,priceBandOptions,type CatalogSort} from "@/lib/catalog-filters";
import {allGarageFilter,filterGarageBuilds,garageConflictCount,garageConflictOptions,garageSortOptions,hasGarageFilter,type GarageSort} from "@/lib/garage-filters";
import {buildShopBrief} from "@/lib/shop-brief";
import {affiliateApplicationAnswers,affiliateApplicationProfileFields,commerceDisclosure,noActiveCommerceDisclosure,partnerPrograms,commerceOffersForPart,commerceSummaryForPart,relationshipNames,commerceStatusNames,safeCommerceUrl,buildAffiliateApplicationAnswers,buildAffiliateApplicationProfile,buildBlockedApplicationSupportDraft,buildBlockedApplicationSupportMailtoUrl,buildCommerceApplicationPack,buildPartnerApplicationLinks,buildPartnerApplicationTrackerCsv,buildPartnerApplicationTrackerText,buildPaidLinkDisclosurePack,buildPartnerOutreachDraftPack,buildPartnerOutreachEmailDraft,buildPartnerOutreachMailtoUrl,buildPartnerSubmissionReviewSheet,partnerApplicationPrioritiesForBuild,partnerApplicationTrackerStatusNames,partnerProgramsForBuild,sponsoredLinkReadinessChecklist,partnerSubmissionReviewChecklist,paidLinkDisclosureSnippet,paidLinkLaunchChecklist,paidLinkLaunchStatus,type PartnerApplicationTrackerStatus} from "@/lib/commerce";
import {buildRecipes,type BuildRecipe} from "@/lib/build-recipes";

import {costPlan,groupParts,stageFor,stageNames,type Stage} from '@/lib/planning';
import {useBuildDraft,type Draft} from './components/use-build-draft';
import {PartFamily} from './components/part-family';
import {BuildComparison} from './components/build-comparison';
import {deviceStorage} from '@/lib/storage/device';
import {cloudStorage} from '@/lib/storage/cloud';
import {isNative,publicOrigin,exportFile,shareLink,openExternal} from '@/lib/platform';
import {partThumbnail} from '@/lib/part-images';
import {AppSettings} from './components/app-settings';
import {DecimalInput} from './components/decimal-input';

const icons={wheels:CircleDot,tires:CircleDot,lift:MoveVertical,bumpers:PanelTop,winches:Anchor,armor:Shield};
const starter4xeRecipe=buildRecipes.find(recipe=>recipe.id==="sahara-4xe")??buildRecipes[0];
const favoriteStorageKey="jeep-build-lab:favorites:v1";
const partnerApplicationStorageKey="jeep-build-lab:partner-applications:v1";
const partnerApplicationNotesStorageKey="jeep-build-lab:partner-application-notes:v1";
const partnerApplicationStatusOptions=Object.keys(partnerApplicationTrackerStatusNames) as PartnerApplicationTrackerStatus[];
type PartnerApplicationStatus=PartnerApplicationTrackerStatus;
const partnerApplicationStatusNames=partnerApplicationTrackerStatusNames;
function isPartnerApplicationStatus(value:unknown):value is PartnerApplicationStatus{return typeof value==="string"&&Object.hasOwn(partnerApplicationStatusNames,value);}
function nextPartnerApplicationStatus(status:PartnerApplicationStatus){const index=partnerApplicationStatusOptions.indexOf(status);return partnerApplicationStatusOptions[(index+1)%partnerApplicationStatusOptions.length];}
function cleanPartnerApplicationNote(value:string){return value.trim().slice(0,240);}
function defaultPartnerApplicationBlockerNote(target:ApplicationAnswerTarget){return target.id==="realtruck-affiliate"?"Impact account setup blocked: account details, USD currency and Partner Program Agreement acceptance advanced, then Impact stopped at \"Password format is invalid\" plus \"An unknown error occurred. Please try again later.\" The account owner must fix the password/account setup directly in Impact or retry later before submitting.":"Partner form blocked: fix password, account setup, eligibility or network errors before retrying.";}
function copiedBuildName(name:string){const base=name.trim()||"Untitled build",suffix=" copy";return base.length+suffix.length<=80?base+suffix:base.slice(0,80-suffix.length).trimEnd()+suffix;}
function csvCell(value:unknown){return '"'+String(value).replace(/^[=+@-]/,"'$&").replaceAll('"','""')+'"';}
function buildPartsCsv({name,notes,state,parts}:{name:string;notes:string;state:BuildState;parts:Part[]}){
 const selected=selectedParts(state,parts),totals=totalFor(state,parts),plan=costPlan(state,parts),issues=buildIssues(state,parts);
 const rows=[["Jeep Build Lab",name],["Vehicle",vehicleDescription(state)],["Commerce disclosure",commerceDisclosure],["Commerce status",noActiveCommerceDisclosure],["Category","Brand","Product","Variant","Reference","Quantity","Unit USD","Line USD","Source","Commerce options","Source checked","Planner coverage","Price basis","Purchase stage"],...selected.map(p=>[categoryNames[p.category],p.brand,p.name,p.variant,p.reference,quantityFor(p,state),p.priceCents/100,p.priceCents*quantityFor(p,state)/100,p.url,commerceSummaryForPart(p),p.checkedAt,partCoverage(p),priceBasis(p),stageNames[stageFor(state,p.category)]]),["Parts subtotal",totals.subtotal/100],["Labor allowance",state.labor/100],["Tax, shipping and extras allowance",state.extras/100],["Full selection value incl. allowances",totals.total/100],["Already owned / installed selection value",plan.covered/100],["Buy now parts",plan.now/100],["Buy later parts",plan.later/100],["Upgrades left to fund incl. allowances",plan.remaining/100],["Entered vehicle price",state.vehicleCost/100],["Vehicle plus unfunded upgrades",plan.project/100],["Notes",notes],...issues.map(i=>["Fitment "+i.level,i.message])];
 return rows.map(row=>row.map(csvCell).join(",")).join("\r\n");
}
type CatalogHighlightDraft={key:string;label:string;part?:Part;detail:(part:Part)=>string};
function uniqueCatalogHighlights(entries:CatalogHighlightDraft[]){
 const seen=new Set<string>(),highlights:{key:string;label:string;part:Part;detail:string}[]=[];
 for(const entry of entries){
  if(!entry.part||seen.has(entry.part.id))continue;
  seen.add(entry.part.id);highlights.push({key:entry.key,label:entry.label,part:entry.part,detail:entry.detail(entry.part)});
 }
 return highlights;
}
function partSpecSummary(part:Part){const badges=partSpecBadges(part);return badges.length?badges.join(" · "):part.variant;}
function advisorActionLabel(part:Part,state:BuildState){return state.picks[part.category]?"Replace":"Add";}
function partSelectionSummary(part:Part,state:BuildState,parts:Part[]){
 const active=state.picks[part.category]===part.id,excluded=partCompatibility(part,state),conflicts=buildErrorsForOption(part,state,parts),current=parts.find(v=>v.id===state.picks[part.category]);
 const action=active?"Remove":excluded?"Excluded":conflicts.length?current?"Replace anyway":"Add anyway":current?"Replace":"Add";
 const title=excluded?active?"Selected part needs vehicle review":"Excluded for your Jeep":conflicts.length?active?"Selected part has conflicts":"Current-build conflict":active?"Selected in this build":"Ready for this build";
 const body=excluded??(conflicts.length?`${conflicts.length} current-build conflict${conflicts.length===1?"":"s"} flagged. Review before buying.`:active?"This part is included in the build summary and exports.":"Adds this part to the current quote sheet.");
 return {active,excluded,conflicts,action,title,body};
}
function Choice({label,value,onChange,options}:{label:string;value:string;onChange:(v:string)=>void;options:{value:string;label:string}[]}){
 return <div className="field"><Label>{label}</Label><Select value={value} onValueChange={onChange}><SelectTrigger aria-label={label}><SelectValue/></SelectTrigger><SelectContent>{options.map(o=><SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select></div>;
}
function CashField({label,value,onChange,disabled}:{label:string;value:number;onChange:(n:number)=>void;disabled?:boolean}){
 const inputId=useId();
 return <div className="field"><Label htmlFor={inputId}>{label}</Label><div className="cash-input"><span aria-hidden="true">$</span><DecimalInput id={inputId} value={value} onChange={onChange} places={2} min={0} max={10000000} emptyAsZero disabled={disabled}/></div></div>;
}
type ApplicationAnswerTarget={id:string;name:string;network?:string;status:PartnerApplicationStatus;statusLabel:string;reason:string;url:string;requirements:readonly string[];note?:string};
function nextTargetStatusLabel(status:PartnerApplicationStatus){return status==="ready"?"Mark submitted":"Mark profile ready";}
function targetPrepText(target:ApplicationAnswerTarget){
 return ["Jeep Build Lab partner target prep",`Program: ${target.name}${target.network?` via ${target.network}`:""}`,`Tracker status: ${target.statusLabel}`,...(target.note?[`Tracker note: ${target.note}`]:[]),`Application link: ${safeCommerceUrl(target.url)}`,`Match reason: ${target.reason}`,"Requirements",...(target.requirements.length?target.requirements.map(item=>`- ${item}`):["- Confirm the current application terms inside the partner network before submitting."]),"Reminder: Verify private business, tax and banking details inside the partner network. Do not claim approved affiliate tracking until the partner approves the account and links are tested."].join("\n");
}
function ApplicationAnswerKit({target,onCopy,onExport,onExportReview,onOpenTarget,onOpenEmail,onAdvanceTarget,onPauseTarget,onBlockTarget,onResetTarget,onCopyTarget,onCopyEmail}:{target:ApplicationAnswerTarget|null;onCopy:()=>void;onExport:()=>void;onExportReview:()=>void;onOpenTarget:()=>void;onOpenEmail:()=>void;onAdvanceTarget:()=>void;onPauseTarget:()=>void;onBlockTarget:()=>void;onResetTarget:()=>void;onCopyTarget:()=>void;onCopyEmail:()=>void}){
 return <section className="application-answer-kit" aria-label="Common application answers"><div className="application-answer-head"><strong>Application answer kit</strong><span>{affiliateApplicationAnswers.length} reusable answers for partner forms</span></div>{target?<div className="application-answer-target" aria-label="Next application target"><span><strong>{target.name}{target.network?` via ${target.network}`:""}</strong><small>{target.statusLabel}</small></span><p>{target.reason}</p>{target.note&&<p className="application-answer-note">{target.note}</p>}{target.requirements.length>0&&<ul className="application-answer-requirements" aria-label="Target requirements">{target.requirements.map(item=><li key={item}>{item}</li>)}</ul>}</div>:<p className="application-answer-target complete">No unblocked partner application is next. Reset a blocked or paused program when it can move again.</p>}<dl>{affiliateApplicationAnswers.slice(0,3).map(item=><div key={item.field}><dt>{item.field}</dt><dd>{item.answer}</dd></div>)}</dl><p>Exports include the full answer set and next application target. Verify private business, tax and banking details inside the partner network.</p><div className="application-answer-actions">{target&&(isNative()?<Button variant="outline" size="sm" onClick={onOpenTarget}><ArrowUpRight size={14}/>Open application</Button>:<Button variant="outline" size="sm" asChild><a href={safeCommerceUrl(target.url)} target="_blank" rel="noopener noreferrer"><ArrowUpRight size={14}/>Open application</a></Button>)}{target&&<Button variant="outline" size="sm" onClick={onOpenEmail}><Mail size={14}/>Open email draft</Button>}{target&&<Button variant="outline" size="sm" onClick={onAdvanceTarget}><CheckCheck size={14}/>{nextTargetStatusLabel(target.status)}</Button>}{target&&target.status!=="paused"&&<Button variant="outline" size="sm" onClick={onPauseTarget}><TriangleAlert size={14}/>Pause target</Button>}{target&&<Button variant="outline" size="sm" onClick={onBlockTarget}><TriangleAlert size={14}/>Block target</Button>}{target&&target.status!=="todo"&&<Button variant="outline" size="sm" onClick={onResetTarget}><Undo2 size={14}/>Reset target</Button>}{target&&!isNative()&&<Button variant="outline" size="sm" onClick={onCopyTarget}><CopyPlus size={14}/>Copy target prep</Button>}{target&&!isNative()&&<Button variant="outline" size="sm" onClick={onCopyEmail}><CopyPlus size={14}/>Copy email draft</Button>}{!isNative()&&<Button variant="outline" size="sm" onClick={onCopy}><CopyPlus size={14}/>Copy answer kit</Button>}<Button variant="outline" size="sm" onClick={onExportReview}><Shield size={14}/>{isNative()?"Share review sheet":"Download review sheet"}</Button><Button variant="outline" size="sm" onClick={onExport}><ClipboardList size={14}/>{isNative()?"Share answer kit":"Download answer kit"}</Button></div></section>;
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
 return <div className="jeep-canvas" role="img" aria-label={`Illustrative silver Wrangler JL with ${diameter}-inch tires, ${lift}-inch lift and ${finish} rims. Bumpers, winches and armor are not shown.`}>
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
 const [sort,setSort]=useState<CatalogSort>("fit");
 const [favoritePartIds,setFavoritePartIds]=useState<Set<string>>(new Set());
 const favoritesLoaded=useRef(false);
 const [partnerApplicationStatus,setPartnerApplicationStatus]=useState<Record<string,PartnerApplicationStatus>>({});
 const [partnerApplicationNotes,setPartnerApplicationNotes]=useState<Record<string,string>>({});
 const partnerApplicationsLoaded=useRef(false);
 const partnerApplicationNotesLoaded=useRef(false);
 const [favoritesOnly,setFavoritesOnly]=useState(false);
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
 const [garageQuery,setGarageQuery]=useState("");
 const [garagePowertrain,setGaragePowertrain]=useState(allGarageFilter);
 const [garageConflicts,setGarageConflicts]=useState(allGarageFilter);
 const [garageSort,setGarageSort]=useState<GarageSort>("updated-desc");
 const [garageBusy,setGarageBusy]=useState(false);
 const [garageError,setGarageError]=useState("");
 const [copyingBuildId,setCopyingBuildId]=useState<string|null>(null);
 const [vehicleOpen,setVehicleOpen]=useState(false);
 const [detail,setDetail]=useState<Part|null>(null);
 const [price,setPrice]=useState(0);
 const [priceBusy,setPriceBusy]=useState(false);
 const [confirm,setConfirm]=useState<{kind:"reset"|"load"|"delete"|"starter"|"recipe"|"vehicle";build?:SavedBuild;recipe?:BuildRecipe;patch?:Partial<BuildState>;warning?:string}|null>(null);
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
 const relevantPartnerPrograms=useMemo(()=>partnerProgramsForBuild(state,parts),[state,parts]);
 const allPartnerApplicationPriorities=useMemo(()=>partnerApplicationPrioritiesForBuild(state,parts),[state,parts]);
 const partnerApplicationPriorities=allPartnerApplicationPriorities.slice(0,3);
 const trackedPartnerApplications=allPartnerApplicationPriorities.map(priority=>({priority,status:partnerApplicationStatus[priority.program.id]??"todo",note:partnerApplicationNotes[priority.program.id]??""}));
 const partnerApplicationStatusCounts=partnerApplicationStatusOptions.map(status=>({status,label:partnerApplicationStatusNames[status],count:trackedPartnerApplications.filter(item=>item.status===status).length}));
 const paidLinkLaunchLines=useMemo(()=>paidLinkLaunchStatus(allPartnerApplicationPriorities,partnerApplicationStatus).split("\n").slice(1).map(line=>line.replace(/^- /,"")),[allPartnerApplicationPriorities,partnerApplicationStatus]);
 const blockedPartnerApplicationNotes=trackedPartnerApplications.filter(({status,note})=>status==="blocked"&&note);
 const blockedPartnerApplicationNotesText=blockedPartnerApplicationNotes.length?["Jeep Build Lab blocked partner application notes",...blockedPartnerApplicationNotes.map(({priority,note})=>`- ${priority.program.name}${priority.program.network?` via ${priority.program.network}`:""}: ${note}`),"Reset a blocked program only after the partner-site issue is resolved and the application can be reviewed again."].join("\n"):"";
 const nextPartnerApplication=trackedPartnerApplications.find(({status})=>status==="todo"||status==="ready"||status==="paused")??null;
 const nextPartnerAnswerTarget=nextPartnerApplication?{id:nextPartnerApplication.priority.program.id,name:nextPartnerApplication.priority.program.name,network:nextPartnerApplication.priority.program.network,status:nextPartnerApplication.status,statusLabel:partnerApplicationStatusNames[nextPartnerApplication.status],reason:nextPartnerApplication.priority.reason,url:nextPartnerApplication.priority.program.url,requirements:nextPartnerApplication.priority.program.requirements??[],note:nextPartnerApplication.note}:null;
 const partnerApplicationExportState={applicationStatuses:partnerApplicationStatus,applicationStatusNotes:partnerApplicationNotes};
 const blockedPartnerSupportDraftText=blockedPartnerApplicationNotes.length?buildBlockedApplicationSupportDraft({name,notes,state,parts,...partnerApplicationExportState}):"";
 const activePartnerApplicationCount=trackedPartnerApplications.filter(({status})=>status==="ready"||status==="submitted"||status==="approved").length;
 const selectedCommercePathCount=useMemo(()=>selected.reduce((count,part)=>count+commerceOffersForPart(part).length,0),[selected]);
 const catalogSourceDate=latestSourceCheckedAt(parts);
 const selectedSourceDate=latestSourceCheckedAt(selected);
 const catalogSourceText=sourceFreshnessSummary(parts);
 const {subtotal,total}=totalFor(state,parts);
 const plan=costPlan(state,parts);
 const errors=issues.filter(i=>i.level==="error");
 const tire=selected.find(p=>p.category==="tires"),wheel=selected.find(p=>p.category==="wheels"),lift=selected.find(p=>p.category==="lift");
 const selectedRimDiameter=wheel?.specs.rim??state.stockRim;
 const selectedTireRimDiameter=tire?.specs.rim??state.stockRim;
 const selectedTireDiameter=tire?.specs.diameter??state.stockTire;
 const selectedLiftLimit=lift?(state.trim==="Rubicon"?lift.specs.maxTireRubicon??lift.specs.maxTire:lift.specs.maxTire):undefined;
 const wheelNeedsMatchingTires=!!wheel&&!tire&&selectedRimDiameter!==state.stockRim;
 const tireNeedsMatchingRims=!!tire&&!wheel&&selectedTireRimDiameter!==state.stockRim;
 const oversizedTireNeedsLift=!!tire&&!lift&&selectedTireDiameter>state.stockTire+.2;
 const tireExceedsLift=!!tire&&!!lift&&selectedLiftLimit!==undefined&&selectedTireDiameter>selectedLiftLimit;
 const vehicleText=vehicleDescription(state);
 const yearOptions=state.powertrain==="4xe"?[2024]:[2018,2019,2020,2021,2022,2023];
 const trimOptions=(state.powertrain==="4xe"?["Sahara"]:["Sport","Sahara","Rubicon"]) as Trim[];
 const categoryPool=parts.filter(p=>p.category===category);
 const categoryStats=useMemo(()=>{
  const stats={} as Record<Category,{loaded:number;ready:number;fit:number;blocked:number;excluded:number}>;
  for(const c of categories)stats[c]={loaded:0,ready:0,fit:0,blocked:0,excluded:0};
  const picked=new Set(Object.values(state.picks));
  for(const part of parts){
   const row=stats[part.category];
   row.loaded+=1;
   if(!fitsVehicle(part,state)){row.excluded+=1;continue;}
   row.fit+=1;
   if(picked.has(part.id)||!optionAddsBuildError(part,state,parts))row.ready+=1;
   else row.blocked+=1;
  }
  return stats;
 },[parts,state]);
 const brandOptions=Array.from(new Set(categoryPool.map(p=>p.brand))).sort((a,b)=>a.localeCompare(b));
 const dimensionOptions=dimensionFilterOptions(categoryPool,category);
 const catalogFilters={category,query,brand:brandFilter,price:priceFilter,dimension:dimensionFilter};
 const activeCatalogFilter=hasCatalogFilter(catalogFilters)||favoritesOnly;
 const favoriteCount=parts.filter(p=>favoritePartIds.has(p.id)).length;
 const categoryMatches=categoryPool.filter(p=>matchesCatalogFilters(p,state,catalogFilters)).filter(p=>!favoritesOnly||favoritePartIds.has(p.id));
 const compatible=categoryMatches.filter(p=>fitsVehicle(p,state));
 const pickedIds=new Set(Object.values(state.picks));
 const buildConflicting=compatible.filter(p=>!pickedIds.has(p.id)&&optionAddsBuildError(p,state,parts));
 const buildReady=compatible.filter(p=>pickedIds.has(p.id)||!optionAddsBuildError(p,state,parts));
 const excluded=categoryMatches.filter(p=>!fitsVehicle(p,state));
 const rimFirstBrowsing=category==="wheels"&&!state.picks.tires;
 const browseReady=rimFirstBrowsing?compatible:buildReady;
 const filtered=[...(showExcluded?categoryMatches:showBuildConflicts?compatible:browseReady)].sort(compareCatalogParts(sort,state,parts));
 const families=groupParts(filtered);
 const currentCategoryStats=categoryStats[category];
 const catalogDepthTarget=15;
 const categoryDepthRows=categories.map(c=>{const stats=categoryStats[c];return {category:c,loaded:stats.loaded,ready:stats.ready,blocked:stats.blocked,excluded:stats.excluded,meets:stats.loaded>=catalogDepthTarget,missing:Math.max(catalogDepthTarget-stats.loaded,0),active:category===c};});
 const currentDepth=categoryDepthRows.find(row=>row.category===category)??categoryDepthRows[0];
 const catalogView=showExcluded?"all":showBuildConflicts?"review":"ready";
 const hiddenByCatalogView=currentCategoryStats.loaded>filtered.length;
 const showingFullCategory=showExcluded&&!activeCatalogFilter&&filtered.length===currentCategoryStats.loaded;
 const categoryMarketRange=linePriceRangeLabel(categoryPool,state);
 const categoryInventory=categories.map(c=>{
  const categoryParts=parts.filter(p=>p.category===c),stats=categoryStats[c];
  return {category:c,loaded:stats.loaded,ready:stats.ready,range:linePriceRangeLabel(categoryParts,state),selected:!!state.picks[c]};
 });
 const catalogAdvisorPool=filtered.filter(p=>fitsVehicle(p,state)&&(pickedIds.has(p.id)||!optionAddsBuildError(p,state,parts)));
 const bestFitPick=[...catalogAdvisorPool].sort(compareCatalogParts("fit",state,parts))[0];
 const lowestShownPick=[...catalogAdvisorPool].sort((a,b)=>a.priceCents*quantityFor(a,state)-b.priceCents*quantityFor(b,state))[0];
 const mostPathsPick=[...catalogAdvisorPool].sort((a,b)=>commerceOffersForPart(b).length-commerceOffersForPart(a).length||a.priceCents-b.priceCents)[0];
 const catalogHighlights=uniqueCatalogHighlights([
  {key:"fit",label:"Best fit",part:bestFitPick,detail:part=>`${money(part.priceCents*quantityFor(part,state))} · closest to this build`},
  {key:"budget",label:"Lowest shown",part:lowestShownPick,detail:part=>`${money(part.priceCents*quantityFor(part,state))} · compatible option`},
  {key:"paths",label:"Most source paths",part:mostPathsPick,detail:part=>`${commerceOffersForPart(part).length} source and partner paths`}
 ]);
 const garageFilters=useMemo(()=>({query:garageQuery,powertrain:garagePowertrain,conflicts:garageConflicts,sort:garageSort}),[garageQuery,garagePowertrain,garageConflicts,garageSort]);
 const activeGarageFilter=hasGarageFilter(garageFilters);
 const visibleGarage=useMemo(()=>filterGarageBuilds(garage,parts,garageFilters),[garage,parts,garageFilters]);
 const detailOffers=detail?commerceOffersForPart(detail):[];
 const detailThumbnail=detail?partThumbnail(detail):null;
 const detailSelection=detail?partSelectionSummary(detail,state,parts):null;
 const readinessState=errors.length?"needs-review":selected.length?"ready":"empty";
 const ReadinessIcon=readinessState==="needs-review"?TriangleAlert:readinessState==="ready"?CheckCheck:ClipboardList;
 const firstErrorCategory=errors.find(issue=>issue.category)?.category;
 const missingCore=(["wheels","tires","lift"] as Category[]).filter(c=>!state.picks[c]);
 const readinessTitle=readinessState==="needs-review"?"Needs fitment review":readinessState==="ready"?"Ready for quote":"Start a quote sheet";
 const readinessDetail=readinessState==="needs-review"?"Resolve the flagged combination before sharing with a shop.":readinessState==="ready"?"Your current build can be exported or sent for real quotes.":"Choose at least one upgrade to start pricing the build.";
 const readinessItems=[
  {status:selected.length?"ready":"open",label:selected.length?`${selected.length} upgrade${selected.length===1?"":"s"} selected`:"No upgrades selected yet"},
  {status:errors.length?"needs-review":"ready",label:errors.length?`${errors.length} fitment conflict${errors.length===1?"":"s"} flagged`:"Current checks show no fitment conflicts"},
  {status:missingCore.length?"open":"ready",label:missingCore.length?`Open stance picks: ${missingCore.map(c=>categoryNames[c].toLowerCase()).join(", ")}`:"Rims, tires and suspension picks are set"},
  {status:state.labor||state.extras?"ready":"open",label:state.labor||state.extras?"Labor, tax or shipping allowances included":"Add allowances when quotes arrive"},
  {status:selected.length?"ready":"open",label:selected.length?`${relevantPartnerPrograms.length} partner application${relevantPartnerPrograms.length===1?"":"s"} matched`:"Partner applications narrow after parts are selected"},
  {status:selected.length?"ready":"open",label:selected.length?`Source evidence checked through ${sourceCheckedLabel(selectedSourceDate)}`:"Source evidence appears after parts are selected"}
];
 const advisorProofItems=[
  {key:"sources",status:selected.length?"ready":"open",label:selected.length?`${selected.length} selected source${selected.length===1?"":"s"} documented`:"Source proof pending",detail:selected.length?`Latest selected check ${sourceCheckedLabel(selectedSourceDate)}`:`Catalog latest check ${sourceCheckedLabel(catalogSourceDate)}`},
  {key:"fitment",status:errors.length?"needs-review":"ready",label:errors.length?`${errors.length} fitment review item${errors.length===1?"":"s"}`:"No current fitment conflicts",detail:"Installer still confirms the full combination."},
  {key:"commerce",status:"ready",label:"No active paid links",detail:"Reference and application links only until approval."},
  {key:"exports",status:selected.length?"ready":"open",label:selected.length?"Shop/export proof ready":"Export proof pending",detail:"Exports include source URL, checked date, coverage and price basis."}
 ];
 const stanceActions=[
  ...(wheelNeedsMatchingTires?[{key:"matching-tires",title:"Match tires to rims",body:`Your selected rims need ${selectedRimDiameter}-inch tires before quoting.`,label:`Find ${selectedRimDiameter}-inch tires`,onClick:()=>browseMatchingTires(selectedRimDiameter)}]:[]),
  ...(tireNeedsMatchingRims?[{key:"matching-rims",title:"Match rims to tires",body:`Your selected tires need ${selectedTireRimDiameter}-inch rims before quoting.`,label:`Find ${selectedTireRimDiameter}-inch rims`,onClick:()=>browseMatchingRims(selectedTireRimDiameter)}]:[]),
  ...(oversizedTireNeedsLift?[{key:"supporting-lift",title:"Clearance still needs a lift",body:`These ${selectedTireDiameter}-inch tires are larger than the current ${state.stockTire}-inch setup.`,label:"Find supporting suspension",onClick:()=>browseSupportingLift()}]:[]),
  ...(tireExceedsLift?[{key:"stronger-lift",title:"Lift limit is too tight",body:`These ${selectedTireDiameter}-inch tires exceed this lift's listed ${selectedLiftLimit}-inch limit.`,label:"Find stronger suspension",onClick:()=>browseSupportingLift()}]:[])
 ];
 const nextOpenCategory=(["bumpers","winches","armor"] as Category[]).find(c=>!state.picks[c]);
 const nextPick=wheelNeedsMatchingTires?{title:"Match tires to selected rims",body:`Filter to ${selectedRimDiameter}-inch tires so the wheel and tire package can be quoted together.`,label:`Find ${selectedRimDiameter}-inch tires`,onClick:()=>browseMatchingTires(selectedRimDiameter)}
  :tireNeedsMatchingRims?{title:"Match rims to selected tires",body:`Filter to ${selectedTireRimDiameter}-inch rims before you price the tire package.`,label:`Find ${selectedTireRimDiameter}-inch rims`,onClick:()=>browseMatchingRims(selectedTireRimDiameter)}
  :tireExceedsLift?{title:"Strengthen the suspension choice",body:"The selected tire is above this lift's listed limit. Review stronger suspension before exporting.",label:"Find stronger suspension",onClick:()=>browseSupportingLift()}
  :oversizedTireNeedsLift?{title:"Add clearance for the tire size",body:`The selected ${selectedTireDiameter}-inch tires are larger than stock. Price suspension before calling the stance finished.`,label:"Find supporting suspension",onClick:()=>browseSupportingLift()}
  :!state.picks.wheels?{title:"Start with rims",body:"Rims set the tire diameter path and visual stance, so they stay first in the catalog flow.",label:"Browse rims",onClick:()=>reviewCategory("wheels")}
  :!state.picks.tires?{title:"Choose tires next",body:`Pick tires that match the ${selectedRimDiameter}-inch rim diameter before quoting the package.`,label:"Browse tires",onClick:()=>browseMatchingTires(selectedRimDiameter)}
  :!state.picks.lift?{title:"Check suspension clearance",body:"Suspension decides how much tire the build can realistically clear. Add it before final quote export.",label:"Browse suspension",onClick:()=>browseSupportingLift()}
  :nextOpenCategory?{title:`Add ${categoryNames[nextOpenCategory].toLowerCase()} next`,body:"The core stance is set. Round out the quote with protection, recovery and side armor choices.",label:`Browse ${categoryNames[nextOpenCategory].toLowerCase()}`,onClick:()=>reviewCategory(nextOpenCategory)}
  :{title:"Ready for shop quotes",body:"All major categories have a selected part. Export the shop brief with source dates and fitment notes.",label:isNative()?"Share shop brief":"Download shop brief",onClick:()=>void exportShopBrief()};
 const stageBreakdown=(["now","later","owned","installed"] as Stage[]).map(stage=>{
  const staged=selected.filter(part=>stageFor(state,part.category)===stage);
 return {stage,count:staged.length,cost:staged.reduce((sum,part)=>sum+part.priceCents*quantityFor(part,state),0)};
 });
 const buildChecklist=categories.map(c=>({category:c,part:selected.find(p=>p.category===c),ready:categoryStats[c].ready}));
 function markTouched(){touched.current=true;setTouchedDraft(true);}
 function clearCatalogFilters(){setQuery("");setBrandFilter(allCatalogFilter);setPriceFilter(allCatalogFilter);setDimensionFilter(allCatalogFilter);setFavoritesOnly(false);}
 function showAllCategoryChoices(){clearCatalogFilters();setShowBuildConflicts(false);setShowExcluded(true);}
 function showConflictCatalogChoices(){setShowExcluded(false);setShowBuildConflicts(true);}
 function showReadyCatalogChoices(){setShowExcluded(false);setShowBuildConflicts(false);}
 function clearGarageFilters(){setGarageQuery("");setGaragePowertrain(allGarageFilter);setGarageConflicts(allGarageFilter);}
 function changeCategory(c:Category){setCategory(c);clearCatalogFilters();}
 const modified=(next:BuildState)=>{markTouched();undoHistory.current=[...undoHistory.current.slice(-19),state];setUndoCount(undoHistory.current.length);setState(next);setDirty(true);setCompare(false);};
 function undo(){const previous=undoHistory.current.pop();if(!previous)return;markTouched();setState(previous);setUndoCount(undoHistory.current.length);setDirty(true);setCompare(false);}
 function reviewCategory(c:Category){changeCategory(c);document.getElementById('parts-heading')?.focus({preventScroll:true});document.getElementById('parts-section')?.scrollIntoView({behavior:'smooth'});}
 function browseMatchingRims(rim:number=selectedTireRimDiameter){setCategory("wheels");setQuery("");setBrandFilter(allCatalogFilter);setPriceFilter(allCatalogFilter);setDimensionFilter(`rim:${rim}`);setSort("fit");setFavoritesOnly(false);setShowBuildConflicts(false);setShowExcluded(false);document.getElementById('parts-heading')?.focus({preventScroll:true});document.getElementById('parts-section')?.scrollIntoView({behavior:'smooth'});}
 function browseMatchingTires(rim:number=selectedRimDiameter){setCategory("tires");setQuery("");setBrandFilter(allCatalogFilter);setPriceFilter(allCatalogFilter);setDimensionFilter(`rim:${rim}`);setSort("fit");setFavoritesOnly(false);setShowBuildConflicts(false);setShowExcluded(false);document.getElementById('parts-heading')?.focus({preventScroll:true});document.getElementById('parts-section')?.scrollIntoView({behavior:'smooth'});}
 function browseSupportingLift(){setCategory("lift");setQuery("");setBrandFilter(allCatalogFilter);setPriceFilter(allCatalogFilter);setDimensionFilter(allCatalogFilter);setSort("fit");setFavoritesOnly(false);setShowBuildConflicts(false);setShowExcluded(false);document.getElementById('parts-heading')?.focus({preventScroll:true});document.getElementById('parts-section')?.scrollIntoView({behavior:'smooth'});}
 function clearUndo(){undoHistory.current=[];setUndoCount(0);markTouched();}
 const update=(patch:Partial<BuildState>)=>modified({...state,...patch});
 function vehicleChangeWarning(next:BuildState){
  const chosen=selectedParts(next,parts);
  if(!chosen.length)return "";
  const excluded=chosen.filter(part=>!fitsVehicle(part,next));
  const errorsAfter=buildIssues(next,parts).filter(issue=>issue.level==="error");
  if(!excluded.length&&!errorsAfter.length)return "";
  const labels=[...new Set([...excluded.map(part=>`${categoryNames[part.category]}: ${part.brand} ${part.name}`),...errorsAfter.map(issue=>issue.category?categoryNames[issue.category]:issue.message)])].slice(0,3);
  const count=excluded.length+errorsAfter.length;
  const more=count>labels.length?` and ${count-labels.length} more`:"";
  return `Changing this vehicle setting leaves ${count} selected item${count===1?"":"s"} needing review: ${labels.join(", ")}${more}.`;
 }
 function requestVehicleUpdate(patch:Partial<BuildState>){
  const next={...state,...patch};
  const warning=vehicleChangeWarning(next);
  if(warning)setConfirm({kind:"vehicle",patch,warning});
  else update(patch);
 }
 function updatePowertrain(powertrain:Powertrain){
  const trim=powertrain==="4xe"?"Sahara":state.trim;
  const year=powertrain==="4xe"?2024:Math.min(state.year,2023);
  requestVehicleUpdate({powertrain,trim,year,...defaultEquipment(trim,powertrain)});
 }
 function updateTrim(trim:Trim){requestVehicleUpdate({trim,...defaultEquipment(trim,state.powertrain)});}
 useEffect(()=>{
  queueMicrotask(()=>{
   try{
    const raw=localStorage.getItem(favoriteStorageKey);
    const ids=raw?JSON.parse(raw):[];
    if(Array.isArray(ids))setFavoritePartIds(new Set(ids.filter((id):id is string=>typeof id==="string")));
   }catch{}
   favoritesLoaded.current=true;
  });
 },[]);
 useEffect(()=>{
  if(!favoritesLoaded.current)return;
  try{localStorage.setItem(favoriteStorageKey,JSON.stringify([...favoritePartIds]));}catch{}
 },[favoritePartIds]);
 useEffect(()=>{
  queueMicrotask(()=>{
   try{
    const raw=localStorage.getItem(partnerApplicationStorageKey);
    const parsed=raw?JSON.parse(raw):{};
    if(parsed&&typeof parsed==="object"&&!Array.isArray(parsed)){
     const entries=Object.entries(parsed).filter((entry):entry is [string,PartnerApplicationStatus]=>typeof entry[0]==="string"&&isPartnerApplicationStatus(entry[1]));
     setPartnerApplicationStatus(Object.fromEntries(entries));
    }
   }catch{}
   partnerApplicationsLoaded.current=true;
  });
 },[]);
 useEffect(()=>{
  if(!partnerApplicationsLoaded.current)return;
  try{localStorage.setItem(partnerApplicationStorageKey,JSON.stringify(partnerApplicationStatus));}catch{}
 },[partnerApplicationStatus]);
 useEffect(()=>{
  queueMicrotask(()=>{
   try{
    const raw=localStorage.getItem(partnerApplicationNotesStorageKey);
    const parsed=raw?JSON.parse(raw):{};
    if(parsed&&typeof parsed==="object"&&!Array.isArray(parsed)){
     const entries=Object.entries(parsed).flatMap(([id,note])=>typeof id==="string"&&typeof note==="string"&&cleanPartnerApplicationNote(note)?[[id,cleanPartnerApplicationNote(note)] as const]:[]);
     setPartnerApplicationNotes(Object.fromEntries(entries));
    }
   }catch{}
   partnerApplicationNotesLoaded.current=true;
  });
 },[]);
 useEffect(()=>{
  if(!partnerApplicationNotesLoaded.current)return;
  try{localStorage.setItem(partnerApplicationNotesStorageKey,JSON.stringify(partnerApplicationNotes));}catch{}
 },[partnerApplicationNotes]);
 useEffect(()=>{
 storage.catalog().then(setParts).catch((e:Error)=>setCatalogWarning(e.message));
 if(window.location.hash.startsWith("#build=")){
   try{const raw=window.location.hash.slice(7);if(raw.length>5000)throw new Error();const parsed=decodeSharedBuildStatePayload(raw);queueMicrotask(()=>{setState(parsed);setName("Linked JL build");setDirty(true);toast.success("Build loaded from link.");});}catch{toast.error("This build link is invalid or uses unsupported parts.");}
  }
 },[storage]);
 useEffect(()=>{if(!dirty||draft.status==="saved")return;const handler=(e:BeforeUnloadEvent)=>{e.preventDefault();};window.addEventListener("beforeunload",handler);return()=>window.removeEventListener("beforeunload",handler);},[dirty,draft.status]);
 async function loadGarage(){setGarageBusy(true);setGarageError('');try{setGarage(await storage.list());}catch(e){setGarageError(e instanceof Error?e.message:'Could not load garage.');}finally{setGarageBusy(false);}}
 function selectPart(p:Part){const picks={...state.picks},stages={...state.stages};if(picks[p.category]===p.id){delete picks[p.category];delete stages[p.category];}else{picks[p.category]=p.id;stages[p.category]='now';}update({picks,stages});}
function toggleFavoritePart(part:Part){
  const saved=favoritePartIds.has(part.id);
  setFavoritePartIds(ids=>{const next=new Set(ids);if(saved)next.delete(part.id);else next.add(part.id);return next;});
  toast.success(saved?"Removed from favorites.":"Saved to favorites.");
 }
 function updatePartnerApplicationStatus(programId:string,status:PartnerApplicationStatus,note?:string){
  setPartnerApplicationStatus(statuses=>({...statuses,[programId]:status}));
  if(note!==undefined)setPartnerApplicationNotes(notes=>{
   const next={...notes},cleaned=cleanPartnerApplicationNote(note);
   if(cleaned)next[programId]=cleaned;else delete next[programId];
   return next;
  });
  toast.success(`Application status: ${partnerApplicationStatusNames[status]}.`);
 }
 function updatePartnerApplicationNote(programId:string,note:string){
  setPartnerApplicationNotes(notes=>{
   const next={...notes},cleaned=note.slice(0,240);
   if(cleaned.trim())next[programId]=cleaned;else delete next[programId];
   return next;
  });
 }
 function cyclePartnerApplicationStatus(programId:string){
  const current=partnerApplicationStatus[programId]??"todo",next=nextPartnerApplicationStatus(current);
  updatePartnerApplicationStatus(programId,next,next==="blocked"?"Partner form blocked: fix password, account setup, eligibility or network errors before retrying.":next==="todo"?"":undefined);
 }
 function advanceNextPartnerApplication(){
  if(!nextPartnerApplication)return;
  const next=nextPartnerApplication.status==="ready"?"submitted":"ready";
  updatePartnerApplicationStatus(nextPartnerApplication.priority.program.id,next,"");
 }
 function pauseNextPartnerApplication(){
  if(!nextPartnerAnswerTarget)return;
  updatePartnerApplicationStatus(nextPartnerAnswerTarget.id,"paused");
 }
 function blockNextPartnerApplication(){
  if(!nextPartnerAnswerTarget)return;
  updatePartnerApplicationStatus(nextPartnerAnswerTarget.id,"blocked",defaultPartnerApplicationBlockerNote(nextPartnerAnswerTarget));
 }
 function resetNextPartnerApplication(){
  if(!nextPartnerAnswerTarget)return;
  updatePartnerApplicationStatus(nextPartnerAnswerTarget.id,"todo","");
 }
 function removePart(c:Category){const picks={...state.picks},stages={...state.stages};delete picks[c];delete stages[c];update({picks,stages});}
 async function saveBuild(){if(!name.trim())return;setSaving(true);try{const data=await storage.save({id:saveCopy?undefined:id,name:name.trim(),notes,state});setId(data.id);setLastSavedTotal(data.savedTotal);setName(name.trim());markTouched();setDirty(false);setSaveOpen(false);toast.success(storage.mode==='device'?'Build saved on this device.':'Build saved in your cloud garage.');}catch(e){toast.error(e instanceof Error?e.message:'Could not save build.');}finally{setSaving(false);}}
 function loadBuild(b:SavedBuild){const parsed=stateSchema.safeParse(b.state);if(!parsed.success){toast.error("This saved build has unsupported data.");return;}clearUndo();setState(parsed.data);setLastSavedTotal(b.savedTotal);setId(b.id);setName(b.name);setNotes(b.notes);setDirty(false);setView("builder");setCompare(false);history.replaceState(null,"",location.pathname);toast.success("Build opened.");}
 function requestOpenBuild(b:SavedBuild){setCompareOpen(false);if(dirty)setConfirm({kind:"load",build:b});else loadBuild(b);}
 function loadRecipe(recipe:BuildRecipe,message=`${recipe.name} loaded.`){clearUndo();setLastSavedTotal(null);setState(structuredClone(recipe.state));setId(undefined);setName(recipe.name);setNotes(recipe.notes);setDirty(true);setCompare(false);setView("builder");setCategory(recipe.focus);clearCatalogFilters();setShowBuildConflicts(false);setShowExcluded(false);history.replaceState(null,"",location.pathname);toast.success(message);}
 function requestRecipe(recipe:BuildRecipe){if(recipe.id===starter4xeRecipe.id){requestStarterBuild();return;}if(dirty)setConfirm({kind:"recipe",recipe});else loadRecipe(recipe);}
 function loadStarterBuild(){loadRecipe(starter4xeRecipe,"Starter 4xe build loaded.");}
 function requestStarterBuild(){if(dirty)setConfirm({kind:"starter"});else loadStarterBuild();}
 function reset(){clearUndo();setLastSavedTotal(null);setState({...initialState,picks:{}});setId(undefined);setName("My JL build");setNotes("");setDirty(false);setCompare(false);setView("builder");history.replaceState(null,"",location.pathname);}
 async function confirmed(){
  if(confirm?.kind==="delete"&&confirm.build){setBusyDelete(true);try{await storage.remove(confirm.build.id);if(id===confirm.build.id){setId(undefined);setDirty(true);}setGarage(v=>v.filter(b=>b.id!==confirm.build!.id));toast.success("Build deleted.");}catch(e){toast.error(e instanceof Error?e.message:"Could not delete build.");}finally{setBusyDelete(false);setConfirm(null);}}
  else{if(confirm?.kind==="load"&&confirm.build)loadBuild(confirm.build);else if(confirm?.kind==="starter")loadStarterBuild();else if(confirm?.kind==="recipe"&&confirm.recipe)loadRecipe(confirm.recipe);else if(confirm?.kind==="vehicle"&&confirm.patch)update(confirm.patch);else reset();setConfirm(null);}
 }
 async function share(){const url=publicOrigin+'/#build='+encodeSharedBuildState(state);setShareUrl(url);setLinkOpen(true);}
 async function openCommerceLink(url:string){try{await openExternal(safeCommerceUrl(url));}catch(e){toast.error(e instanceof Error?e.message:'Could not open this partner link. Check your connection.');}}
 async function savePrice(resetPrice=false){if(!detail)return;setPriceBusy(true);try{const updated=await storage.price(detail.id,resetPrice?null:price);setParts(updated);setDetail(updated.find(p=>p.id===detail.id)??null);setDirty(true);toast.success(resetPrice?'Source price restored.':'Your price note was saved.');}catch(e){toast.error(e instanceof Error?e.message:'Could not save price.');}finally{setPriceBusy(false);}}
 function openDetail(p:Part){setDetail(p);setPrice(p.priceCents);}
 async function exportCSV(){
  try{await exportFile('jeep-build-parts.csv','\uFEFF'+buildPartsCsv({name,notes,state,parts}),'text/csv;charset=utf-8');}catch(e){toast.error(e instanceof Error?e.message:'The parts list could not be exported.');}
 }
 async function exportShopBrief(){
  try{await exportFile('jeep-build-shop-brief.txt',buildShopBrief({name,notes,state,parts}),'text/plain;charset=utf-8');}catch(e){toast.error(e instanceof Error?e.message:'The shop brief could not be exported.');}
 }
 async function exportCommercePack(){
  try{await exportFile('jeep-build-commerce-pack.txt',buildCommerceApplicationPack({name,notes,state,parts,...partnerApplicationExportState}),'text/plain;charset=utf-8');}catch(e){toast.error(e instanceof Error?e.message:'The commerce pack could not be exported.');}
 }
 async function exportPartnerLinks(){
  try{await exportFile('jeep-build-partner-links.txt',buildPartnerApplicationLinks({name,notes,state,parts,...partnerApplicationExportState}),'text/plain;charset=utf-8');}catch(e){toast.error(e instanceof Error?e.message:'The partner links could not be exported.');}
 }
 async function exportPartnerApplicationTracker(){
  try{await exportFile('jeep-build-partner-application-tracker.csv',buildPartnerApplicationTrackerCsv({name,notes,state,parts,...partnerApplicationExportState}),'text/csv;charset=utf-8');}catch(e){toast.error(e instanceof Error?e.message:'The application tracker could not be exported.');}
 }
 async function exportPartnerOutreachDrafts(){
  try{await exportFile('jeep-build-partner-outreach-drafts.txt',buildPartnerOutreachDraftPack({name,notes,state,parts,...partnerApplicationExportState}),'text/plain;charset=utf-8');}catch(e){toast.error(e instanceof Error?e.message:'The outreach drafts could not be exported.');}
 }
 async function exportPartnerSubmissionReview(){
  try{await exportFile('jeep-build-partner-submission-review.txt',buildPartnerSubmissionReviewSheet({name,notes,state,parts,...partnerApplicationExportState}),'text/plain;charset=utf-8');}catch(e){toast.error(e instanceof Error?e.message:'The submission review sheet could not be exported.');}
 }
 async function copyPartnerLinks(){
  try{await navigator.clipboard.writeText(buildPartnerApplicationLinks({name,notes,state,parts,...partnerApplicationExportState}));toast.success("Partner links copied.");}catch{toast.info("Download partner links, then copy from the text file.");}
 }
 async function copyPartnerApplicationTracker(){
  try{await navigator.clipboard.writeText(buildPartnerApplicationTrackerText({name,notes,state,parts,...partnerApplicationExportState}));toast.success("Tracker summary copied.");}catch{toast.info("Download the tracker CSV, then copy from the file.");}
 }
 async function copyBlockedApplicationNotes(){
  if(!blockedPartnerApplicationNotesText)return;
  try{await navigator.clipboard.writeText(blockedPartnerApplicationNotesText);toast.success("Blocked notes copied.");}catch{toast.info("Download the blocked notes file, then copy from it.");}
 }
 async function exportBlockedApplicationNotes(){
  if(!blockedPartnerApplicationNotesText)return;
  try{await exportFile('jeep-build-blocked-application-notes.txt',blockedPartnerApplicationNotesText,'text/plain;charset=utf-8');}catch(e){toast.error(e instanceof Error?e.message:'The blocked notes file could not be exported.');}
 }
 async function copyBlockedApplicationSupportDraft(){
  if(!blockedPartnerSupportDraftText)return;
  try{await navigator.clipboard.writeText(blockedPartnerSupportDraftText);toast.success("Support draft copied.");}catch{toast.info("Download the support draft, then copy from it.");}
 }
 async function exportBlockedApplicationSupportDraft(){
  if(!blockedPartnerSupportDraftText)return;
  try{await exportFile('jeep-build-blocked-application-support-draft.txt',blockedPartnerSupportDraftText,'text/plain;charset=utf-8');}catch(e){toast.error(e instanceof Error?e.message:'The support draft could not be exported.');}
 }
 async function openBlockedApplicationSupportEmail(){
  if(!blockedPartnerSupportDraftText)return;
  try{await openExternal(buildBlockedApplicationSupportMailtoUrl({name,notes,state,parts,...partnerApplicationExportState}));toast.success("Support email draft opened.");}catch(e){toast.error(e instanceof Error?e.message:"The support email draft could not be opened.");}
 }
 async function exportAffiliateProfile(){
  try{await exportFile('jeep-build-affiliate-profile.txt',buildAffiliateApplicationProfile({name,notes,state,parts,...partnerApplicationExportState}),'text/plain;charset=utf-8');}catch(e){toast.error(e instanceof Error?e.message:'The affiliate profile could not be exported.');}
 }
 async function exportPaidLinkDisclosure(){
  try{await exportFile('jeep-build-paid-link-disclosure.txt',buildPaidLinkDisclosurePack({name,notes,state,parts,...partnerApplicationExportState}),'text/plain;charset=utf-8');}catch(e){toast.error(e instanceof Error?e.message:'The paid-link disclosure could not be exported.');}
 }
 async function copyPaidLinkDisclosure(){
  try{await navigator.clipboard.writeText(buildPaidLinkDisclosurePack({name,notes,state,parts,...partnerApplicationExportState}));toast.success("Disclosure pack copied.");}catch{toast.info("Download the disclosure, then copy from the text file.");}
 }
 async function copyAffiliateAnswers(){
  try{await navigator.clipboard.writeText(buildAffiliateApplicationAnswers({name,notes,state,parts,...partnerApplicationExportState}));toast.success("Answer kit copied.");}catch{toast.info("Download the answer kit, then copy from the text file.");}
 }
 async function copyTargetPrep(){
  if(!nextPartnerAnswerTarget)return;
  try{await navigator.clipboard.writeText(targetPrepText(nextPartnerAnswerTarget));toast.success("Target prep copied.");}catch{toast.info("Download the answer kit, then copy target details from the text file.");}
 }
 async function copyTargetOutreachEmail(){
  if(!nextPartnerAnswerTarget)return;
  try{await navigator.clipboard.writeText(buildPartnerOutreachEmailDraft({name,notes,state,parts,...partnerApplicationExportState}));toast.success("Email draft copied.");}catch{toast.info("Download the answer kit, then draft outreach from the text file.");}
 }
 async function openTargetOutreachEmail(){
  if(!nextPartnerAnswerTarget)return;
  try{await openExternal(buildPartnerOutreachMailtoUrl({name,notes,state,parts,...partnerApplicationExportState}));toast.success("Email draft opened.");}catch(e){toast.error(e instanceof Error?e.message:"The email draft could not be opened.");}
 }
 async function exportAffiliateAnswers(){
  try{await exportFile('jeep-build-affiliate-answer-kit.txt',buildAffiliateApplicationAnswers({name,notes,state,parts,...partnerApplicationExportState}),'text/plain;charset=utf-8');}catch(e){toast.error(e instanceof Error?e.message:'The answer kit could not be exported.');}
 }
 async function exportSavedShopBrief(build:SavedBuild){
  try{await exportFile('jeep-build-shop-brief.txt',buildShopBrief({name:build.name,notes:build.notes,state:build.state,parts}),'text/plain;charset=utf-8');}catch(e){toast.error(e instanceof Error?e.message:'The shop brief could not be exported.');}
 }
 async function exportSavedCommercePack(build:SavedBuild){
  try{await exportFile('jeep-build-commerce-pack.txt',buildCommerceApplicationPack({name:build.name,notes:build.notes,state:build.state,parts,...partnerApplicationExportState}),'text/plain;charset=utf-8');}catch(e){toast.error(e instanceof Error?e.message:'The commerce pack could not be exported.');}
 }
 async function exportSavedSubmissionReview(build:SavedBuild){
  try{await exportFile('jeep-build-partner-submission-review.txt',buildPartnerSubmissionReviewSheet({name:build.name,notes:build.notes,state:build.state,parts,...partnerApplicationExportState}),'text/plain;charset=utf-8');}catch(e){toast.error(e instanceof Error?e.message:'The submission review sheet could not be exported.');}
 }
 async function exportSavedCSV(build:SavedBuild){
  try{await exportFile('jeep-build-parts.csv','\uFEFF'+buildPartsCsv({name:build.name,notes:build.notes,state:build.state,parts}),'text/csv;charset=utf-8');}catch(e){toast.error(e instanceof Error?e.message:'The parts list could not be exported.');}
 }
 async function duplicateSavedBuild(build:SavedBuild){
  if(copyingBuildId)return;setCopyingBuildId(build.id);const copyName=copiedBuildName(build.name);
  try{const saved=await storage.save({name:copyName,notes:build.notes,state:structuredClone(build.state)});setGarage(v=>[{...build,id:saved.id,name:copyName,updatedAt:new Date().toISOString(),savedTotal:saved.savedTotal},...v]);toast.success("Build duplicated.");}
  catch(e){toast.error(e instanceof Error?e.message:"Could not duplicate build.");}
  finally{setCopyingBuildId(null);}
 }
 const confirmTitle=confirm?.kind==="delete"?"Delete this saved build?":confirm?.kind==="starter"?"Load the 4xe starter build?":confirm?.kind==="recipe"?`Load ${confirm.recipe?.name??"this starter build"}?`:confirm?.kind==="vehicle"?"Confirm vehicle change":"Leave the current build?";
 const confirmDescription=confirm?.kind==="delete"?`“${confirm.build?.name}” will be removed from your garage.`:confirm?.kind==="starter"?"This replaces your current draft with a sample 2024 Sahara 4xe plan. Save a named version first if you want to keep your current draft. Other saved builds stay in your garage.":confirm?.kind==="recipe"?"This replaces your current draft with a complete sample build recipe. Save a named version first if you want to keep your current draft. Other saved builds stay in your garage.":confirm?.kind==="vehicle"?`${confirm.warning} Your parts stay selected so you can review the warnings after the change.`:"Continuing replaces your current draft. Save a named version first if you want to keep it. Other saved builds stay in your garage.";
 const confirmAction=busyDelete?"Deleting…":confirm?.kind==="delete"?"Delete build":confirm?.kind==="starter"?"Load starter build":confirm?.kind==="recipe"?"Load recipe":confirm?.kind==="vehicle"?"Change vehicle":"Continue";
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
 <section className="starter-strip" aria-label="Starter build recipes"><div className="starter-strip-head"><span className="eyebrow">STARTER BUILDS</span><strong>Pick a complete path, then tune it</strong><p>Load a rims-first daily plan, a recovery-ready trail plan, or the sourced 2024 Sahara 4xe sample.</p></div><div className="recipe-list">{buildRecipes.map(recipe=><article className="recipe-row" key={recipe.id}><span className="eyebrow">{recipe.label}</span><strong>{recipe.title}</strong><p>{recipe.body}</p><Button variant="outline" onClick={()=>requestRecipe(recipe)}><Plus size={16}/>{recipe.id===starter4xeRecipe.id?"Load starter":"Load plan"}</Button></article>)}</div></section>
 <nav className="build-steps" aria-label="Build steps"><button type="button" onClick={()=>setVehicleOpen(true)}><span>1</span>Your Jeep<small>Year, trim & current equipment</small></button><button type="button" onClick={()=>reviewCategory(category)}><span>2</span>Choose parts<small>{selected.length} categories selected</small></button><button type="button" onClick={()=>document.getElementById('build-summary')?.scrollIntoView({behavior:'smooth'})}><span>3</span>Plan & price<small>{money(plan.remaining)} left to fund</small></button></nav>
 <section className="build-coach" aria-label="Next best build step"><div><span className="eyebrow">NEXT BEST PICK</span><strong>{nextPick.title}</strong><p>{nextPick.body}</p></div><Button variant="outline" onClick={nextPick.onClick}>{nextPick.label}<ChevronRight size={16}/></Button></section>
 <section className="vehicle-bar" aria-label="Your vehicle"><span className="vehicle-number">01</span><div className="vehicle-title"><span className="eyebrow">YOUR VEHICLE</span><strong>{state.year} Wrangler JL <span>Unlimited · 4-door</span></strong></div><div className="vehicle-tags"><span>{state.trim}</span><span>{powertrainNames[state.powertrain]}</span></div><Button variant="ghost" className="change-vehicle" onClick={()=>setVehicleOpen(true)}>Edit vehicle<Settings2 size={16}/></Button></section>
 <section className={`fitment-inline ${errors.length?'has-conflict':''}`} aria-label="Fitment checks" id="fitment-status">
 <div className="fitment-inline-heading"><TriangleAlert size={18}/><strong>{errors.length?`${errors.length} fitment conflict${errors.length===1?'':'s'} to resolve`:selected.length?'No conflicts detected by the current checks':'Fitment checks appear as you build'}</strong></div>
 {errors.map((issue,index)=>{const canMatchTires=issue.category==="tires"&&wheelNeedsMatchingTires,canMatchRims=issue.category==="tires"&&tireNeedsMatchingRims,canFindLift=issue.category==="tires"&&tireExceedsLift;return <div className="fitment-inline-error" key={index}><p>{issue.message}</p>{canMatchTires?<Button size="sm" variant="outline" onClick={()=>browseMatchingTires(selectedRimDiameter)}>Find {selectedRimDiameter}-inch tires</Button>:canMatchRims?<Button size="sm" variant="outline" onClick={()=>browseMatchingRims(selectedTireRimDiameter)}>Find {selectedTireRimDiameter}-inch rims</Button>:canFindLift?<Button size="sm" variant="outline" onClick={browseSupportingLift}>Find stronger suspension</Button>:issue.category&&<Button size="sm" variant="outline" onClick={()=>reviewCategory(issue.category!)}>Review {categoryNames[issue.category].toLowerCase()}</Button>}</div>;})}
 {stanceActions.length>0&&<div className="stance-next" aria-label="Stance match next steps">{stanceActions.map(action=><div className="stance-action" key={action.key}><div><strong>{action.title}</strong><span>{action.body}</span></div><Button size="sm" variant="outline" onClick={action.onClick}>{action.label}</Button></div>)}</div>}
 <details><summary>{issues.filter(i=>i.level==='note').length} checks still need confirmation</summary><p>Checks apply to the final combination, including parts marked for later. A shop must confirm fitment and installation order.</p>{issues.filter(i=>i.level==='note').map((issue,index)=><p key={index}>• {issue.message}</p>)}{!selected.length&&<p>Add a part to see its fitment checks.</p>}</details>
 </section>
 <div className="build-grid"><div className="build-main">
 <section className="preview-panel">
 <div className="preview-top"><span className="preview-status"><span/>{compare?"STOCK COMPARISON":"BUILD PREVIEW"}</span><div className="preview-toggle"><button type="button" aria-pressed={!compare} className={compare?"":"active"} onClick={()=>setCompare(false)}>Your build</button><button type="button" aria-pressed={compare} className={compare?"active":""} onClick={()=>setCompare(true)}>Stock</button></div></div>
 <div className="preview-stage"><span className="studio-word" aria-hidden="true">WRANGLER</span><Preview state={state} parts={parts} stock={compare}/><span className="stage-label">JL / 4-DOOR</span><span className="stage-side">SIDE PROFILE</span></div>
 <div className="preview-specs"><div><span>TIRES</span><strong>{compare?state.stockTire:tire?.specs.diameter??state.stockTire}<small>″</small></strong></div><div><span>LIFT</span><strong>{compare?0:lift?.specs.lift??0}<small>″</small></strong></div><div><span>RIMS</span><strong>{compare?state.stockRim:wheel?.specs.rim??state.stockRim}<small>″</small></strong></div><div className="preview-finish"><span>FINISH</span><strong><i/>Silver</strong></div></div>
 <p className="preview-disclaimer"><Info size={14}/>Illustrative preview. Rim designs are generic; bumpers, winches and armor are listed only. Dimensions are approximate.</p>
 </section>
 <section id="parts-section" className="parts-section" aria-labelledby="parts-heading">
 <div className="section-heading"><div><span className="eyebrow">AFTERMARKET PARTS</span><h2 id="parts-heading" tabIndex={-1}>Choose your upgrades</h2></div><span className="catalog-count">{parts.length} curated variants</span></div>
 <Tabs value={category} onValueChange={v=>changeCategory(v as Category)}><TabsList className="category-tabs">{categories.map(c=>{const Icon=icons[c],stats=categoryStats[c];return <TabsTrigger key={c} value={c} title={`${stats.ready} ready for this build; ${stats.loaded} loaded`}><Icon size={16}/><span className="tab-label">{categoryNames[c]}</span><span className="tab-count" aria-label={`${stats.ready} ready choices, ${stats.loaded} loaded choices`}><strong>{stats.ready}</strong><small>of {stats.loaded}</small></span>{state.picks[c]&&<span className="tab-dot"/>}</TabsTrigger>;})}</TabsList></Tabs>
 <div className="source-status" aria-label="Catalog source status"><span><CheckCheck size={14}/>{catalogSourceText}</span><span><DollarSign size={14}/>Prices are dated snapshots, not live quotes.</span><span><Shield size={14}/>Planner fitment is coverage, not certification.</span></div>
 <div className="catalog-inventory" aria-label="Catalog inventory by category">{categoryInventory.map(row=>{const Icon=icons[row.category],active=category===row.category;return <button type="button" key={row.category} className={`inventory-tile ${active?"active":""} ${row.selected?"picked":""}`} aria-pressed={active} onClick={()=>changeCategory(row.category)}><Icon size={15}/><span><strong>{categoryNames[row.category]}</strong><small>{row.loaded} loaded · {row.ready} ready</small></span><em>{row.range}</em></button>;})}</div>
 <div className="catalog-toolbar"><div className="search-box"><Search size={17}/><Input aria-label="Search parts" placeholder={`Search ${categoryNames[category].toLowerCase()}…`} value={query} onChange={e=>setQuery(e.target.value)}/></div><Select value={sort} onValueChange={v=>setSort(v as CatalogSort)}><SelectTrigger aria-label="Sort parts"><SlidersHorizontal size={14}/><SelectValue/></SelectTrigger><SelectContent>{catalogSortOptions.map(option=><SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select><div className="catalog-view-switch" role="group" aria-label="Catalog view"><button type="button" aria-pressed={catalogView==="ready"} onClick={showReadyCatalogChoices}>Ready<strong>{browseReady.length}</strong></button><button type="button" aria-pressed={catalogView==="review"} onClick={showConflictCatalogChoices}>Fit + conflicts<strong>{compatible.length}</strong>{buildConflicting.length>0&&<em>{buildConflicting.length}</em>}</button><button type="button" aria-pressed={catalogView==="all"} onClick={showAllCategoryChoices}>All loaded<strong>{currentCategoryStats.loaded}</strong></button></div><label className="catalog-toggle favorite-toggle"><input type="checkbox" checked={favoritesOnly} onChange={e=>setFavoritesOnly(e.target.checked)}/><span>Favorites only</span>{favoriteCount>0&&<strong>{favoriteCount}</strong>}</label></div>
 <div className="catalog-filters" aria-label="Catalog filters"><Select value={brandFilter} onValueChange={setBrandFilter}><SelectTrigger aria-label="Filter by brand"><Tag size={14}/><SelectValue/></SelectTrigger><SelectContent><SelectItem value={allCatalogFilter}>All brands</SelectItem>{brandOptions.map(brand=><SelectItem key={brand} value={brand}>{brand}</SelectItem>)}</SelectContent></Select><Select value={priceFilter} onValueChange={setPriceFilter}><SelectTrigger aria-label="Filter by price"><DollarSign size={14}/><SelectValue/></SelectTrigger><SelectContent>{priceBandOptions.map(option=><SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select>{dimensionOptions.length>1&&<Select value={dimensionFilter} onValueChange={setDimensionFilter}><SelectTrigger aria-label="Filter by size or specification"><Ruler size={14}/><SelectValue/></SelectTrigger><SelectContent><SelectItem value={allCatalogFilter}>All sizes</SelectItem>{dimensionOptions.map(option=><SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select>}{activeCatalogFilter&&<Button variant="ghost" className="filter-reset" onClick={clearCatalogFilters}><X size={14}/>Clear filters</Button>}</div>
 <div className="catalog-market" aria-label="Current category market snapshot"><span><strong>{filtered.length}</strong><small>shown of {currentCategoryStats.loaded} loaded</small></span><span><strong>{brandOptions.length}</strong><small>{brandOptions.length===1?'brand':'brands'} loaded</small></span><span><strong>{categoryMarketRange}</strong><small>selection range</small></span><span><strong>{currentCategoryStats.ready}</strong><small>ready for this build</small></span></div>
 <div className="catalog-depth-proof" aria-label="Catalog 15 choice depth proof"><div><strong>{currentDepth.loaded} {categoryNames[category].toLowerCase()} choices loaded</strong><span>{currentDepth.meets?`Meets the ${catalogDepthTarget}+ choice target for this section.`:`Needs ${currentDepth.missing} more sourced choices to hit the ${catalogDepthTarget}+ target.`}</span><p className="depth-breakdown" aria-label="Current category visibility breakdown"><span><strong>{currentDepth.ready}</strong> ready</span><span><strong>{currentDepth.blocked}</strong> need combo</span><span><strong>{currentDepth.excluded}</strong> vehicle excluded</span></p></div><div className="depth-chip-list">{categoryDepthRows.map(row=><button type="button" key={row.category} className={`${row.active?"active":""} ${row.meets?"meets":"short"}`} aria-pressed={row.active} onClick={()=>changeCategory(row.category)}><span>{categoryNames[row.category]}</span><strong>{row.meets?`${catalogDepthTarget}+ loaded`:`${row.loaded} loaded`}</strong></button>)}</div>{!showingFullCategory&&<Button variant="outline" size="sm" onClick={showAllCategoryChoices}>Show all {currentDepth.loaded}</Button>}</div>
 <div className="catalog-subtitle"><span>{families.length} products · {buildReady.length} fit your current build</span><span>{activeCatalogFilter?'Filters active · ':''}{buildConflicting.length} need another build change · {excluded.length} excluded by vehicle fitment · USD · Selection prices include quantity</span></div>
 {catalogHighlights.length>0&&<div className="catalog-highlights" aria-label="Catalog advisor picks">{catalogHighlights.map(highlight=>{const active=state.picks[highlight.part.category]===highlight.part.id;return <div className={`catalog-highlight ${active?"selected":""}`} key={highlight.key}><div><span>{highlight.label}</span><strong>{highlight.part.brand} {highlight.part.name}</strong><small>{highlight.detail}</small></div><div className="catalog-highlight-actions"><Button size="sm" variant="ghost" onClick={()=>openDetail(highlight.part)}>Review</Button><Button size="sm" variant={active?"secondary":"outline"} onClick={()=>selectPart(highlight.part)}>{active?<><CheckCheck size={13}/>Added</>:advisorActionLabel(highlight.part,state)}</Button></div></div>;})}</div>}
 {catalogHighlights.length>1&&<details className="catalog-compare" aria-label="Compare catalog advisor picks"><summary>Compare advisor picks</summary><div className="catalog-compare-scroll"><table><thead><tr><th>Signal</th>{catalogHighlights.map(highlight=><th key={highlight.key}>{highlight.label}</th>)}</tr></thead><tbody><tr><th scope="row">Part</th>{catalogHighlights.map(highlight=><td key={highlight.key}><button type="button" onClick={()=>openDetail(highlight.part)}>{highlight.part.brand} {highlight.part.name}</button><small>{highlight.part.variant}</small></td>)}</tr><tr><th scope="row">Selection price</th>{catalogHighlights.map(highlight=><td key={highlight.key}>{money(highlight.part.priceCents*quantityFor(highlight.part,state))}<small>{quantityFor(highlight.part,state)>1?`${money(highlight.part.priceCents)} each`:"Kit price"}</small></td>)}</tr><tr><th scope="row">Specs</th>{catalogHighlights.map(highlight=><td key={highlight.key}>{partSpecSummary(highlight.part)}</td>)}</tr><tr><th scope="row">Source</th>{catalogHighlights.map(highlight=><td key={highlight.key}><span>{highlight.part.retailer}</span><small>Checked {sourceCheckedLabel(highlight.part.checkedAt)}</small></td>)}</tr><tr><th scope="row">Coverage</th>{catalogHighlights.map(highlight=><td key={highlight.key}>{partCoverage(highlight.part)}</td>)}</tr></tbody></table></div></details>}
 {rimFirstBrowsing&&!showExcluded&&!showBuildConflicts&&!activeCatalogFilter&&<div className="rim-first-note"><span><Info size={14}/>Rim-first browsing keeps every vehicle-compatible rim visible. Add matching tires next for non-stock diameters.</span>{wheelNeedsMatchingTires&&<Button size="sm" variant="outline" onClick={()=>browseMatchingTires(selectedRimDiameter)}>Find {selectedRimDiameter}-inch tires</Button>}</div>}
 {(hiddenByCatalogView||showingFullCategory)&&<div className="catalog-reveal" aria-label="Catalog visibility controls"><span>{showingFullCategory?`Showing all ${currentCategoryStats.loaded} loaded ${categoryNames[category].toLowerCase()} choices.`:`${currentCategoryStats.loaded-filtered.length} loaded ${categoryNames[category].toLowerCase()} choices are hidden by fitment, build or filter settings.`}</span><div className="catalog-reveal-actions">{!showingFullCategory&&<Button variant="outline" size="sm" onClick={showAllCategoryChoices}>Show all loaded</Button>}{(showExcluded||showBuildConflicts)&&<Button variant="ghost" size="sm" onClick={showReadyCatalogChoices}>Ready only</Button>}</div></div>}
 {catalogWarning&&<div className="inline-warning"><TriangleAlert size={16}/>{catalogWarning}</div>}
 {category==="tires"&&<p className="category-note">Choose a tire with the same rim diameter as your build: <strong>{wheel?.specs.rim??state.stockRim} inches.</strong></p>}
 <div className="parts-grid">{families.map(family=><PartFamily key={family.key} variants={family.variants} state={state} parts={parts} favoriteIds={favoritePartIds} onFavorite={toggleFavoritePart} onSelect={selectPart} onDetail={openDetail} compatibilityReason={p=>partCompatibility(p,state)}/>)}</div>
 {!filtered.length&&<div className="empty-state"><Search/><h3>No matching parts</h3><p>{favoritesOnly&&!favoriteCount?'Tap the star on any part to save favorites on this device.':categoryMatches.length&&!compatible.length?'All matching parts are excluded for this vehicle. Switch to All loaded to see why.':compatible.length&&!buildReady.length&&!showBuildConflicts?'Matching parts fit this vehicle, but they create a current-build conflict. Switch to Fit + conflicts to review them.':activeCatalogFilter?'No parts match those filters. Clear filters or broaden the search.':'Try a brand, size or part number.'}</p><Button variant="outline" onClick={clearCatalogFilters}>{activeCatalogFilter?'Clear filters':'Clear search'}</Button></div>}
 <p className="catalog-footnote">Catalog source checks are dated snapshots; latest check {sourceCheckedLabel(catalogSourceDate)}. Prices and availability may change. Product artwork is illustrative. Lighting, tops and interior parts are planned for a later catalog.</p>
 </section>
 </div>
 <aside className="build-sidebar" id="build-summary"><div className="summary-card">
 <div className="summary-heading"><span className="eyebrow">PLAN & PRICE</span><span className="count-badge">{selected.length}</span></div>
 <h2>{name}</h2><p className="save-state">{dirty?"Draft · save a named version to compare it later":id?"Named version saved in your garage":"Your upgrade plan"}</p>
 <div className={`quote-readiness ${readinessState}`} aria-label="Quote readiness"><div className="quote-readiness-head"><ReadinessIcon size={17}/><div><strong>{readinessTitle}</strong><span>{readinessDetail}</span></div></div><ul>{readinessItems.map(item=><li key={item.label} className={item.status}>{item.label}</li>)}</ul><Button variant="outline" size="sm" onClick={()=>readinessState==="needs-review"?reviewCategory(firstErrorCategory??category):readinessState==="ready"?void exportShopBrief():reviewCategory(category)}>{readinessState==="needs-review"?"Review first issue":readinessState==="ready"?isNative()?"Share shop brief":"Download shop brief":"Choose parts"}</Button></div>
 <div className="build-checklist" aria-label="Build category checklist"><div className="build-checklist-head"><strong>Build checklist</strong><span>{selected.length} of {categories.length} categories selected</span></div>{buildChecklist.map(row=>{const Icon=icons[row.category];return <button type="button" key={row.category} className={`build-checklist-row ${row.part?"picked":"open"}`} onClick={()=>reviewCategory(row.category)}><Icon size={15}/><span><strong>{categoryNames[row.category]}</strong><small>{row.part?`${row.part.brand} ${row.part.name}`:`${row.ready} ready choices`}</small></span><em>{row.part?"Swap":"Browse"}</em></button>;})}</div>
 <div className="source-readiness" aria-label="Build source evidence"><strong>Source evidence</strong><span>{selected.length?`${selected.length} selected source${selected.length===1?"":"s"} · latest check ${sourceCheckedLabel(selectedSourceDate)}`:"Select parts to build source evidence"}</span><p>Exports include retailer links, checked dates, price basis and planner coverage for shop review.</p></div>
 <div className="advisor-proof" aria-label="Neutral advisor proof"><div className="advisor-proof-head"><strong>Proof for quotes</strong><span>{advisorProofItems.filter(item=>item.status==="ready").length} of {advisorProofItems.length} ready</span></div>{advisorProofItems.map(item=><div className={`advisor-proof-row ${item.status}`} key={item.key}><span aria-hidden="true"/><div><strong>{item.label}</strong><small>{item.detail}</small></div></div>)}</div>
 <div className="stage-breakdown" aria-label="Purchase stage breakdown"><div className="stage-breakdown-head"><strong>Purchase stages</strong><span>{plan.dueNow>0?`${money(plan.dueNow)} first phase incl. allowances`:"Move parts into stages as quotes firm up"}</span></div><div className="stage-breakdown-list">{stageBreakdown.map(row=><div key={row.stage} className={`stage-breakdown-row ${row.stage} ${row.count?"":"empty"}`}><div><span>{stageNames[row.stage]}</span><small>{row.count?`${row.count} ${row.count===1?"category":"categories"}`:"No parts"}</small></div><strong>{money(row.cost)}</strong></div>)}{plan.allowances>0&&<div className="stage-breakdown-row allowances"><div><span>Allowances</span><small>Labor, tax, shipping and extras</small></div><strong>{money(plan.allowances)}</strong></div>}</div></div>
 <div className="summary-list">{selected.length?selected.map(p=>{const thumbnail=partThumbnail(p);return <div className="summary-item" key={p.id}><div className="summary-item-main"><div className={`summary-thumb ${thumbnail.className}`} aria-hidden="true"><img src={thumbnail.src} alt="" draggable={false}/></div><div className="summary-copy"><span>{categoryNames[p.category]}{quantityFor(p,state)>1?` × ${quantityFor(p,state)}`:""}</span><button type="button" onClick={()=>openDetail(p)}>{p.brand} {p.name}</button><small>{p.variant}</small><small className="summary-source">{priceBasis(p)}</small><Select value={stageFor(state,p.category)} onValueChange={v=>update({stages:{...state.stages,[p.category]:v as Stage}})}><SelectTrigger className="stage-select" aria-label={`${p.name} purchase stage`}><SelectValue/></SelectTrigger><SelectContent>{Object.entries(stageNames).map(([value,label])=><SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div></div><div className="summary-price"><strong>{money(p.priceCents*quantityFor(p,state))}</strong><button type="button" className="remove-button" aria-label={`Remove ${p.name}`} onClick={()=>removePart(p.category)}><Trash2 size={14}/></button></div></div>;}):<div className="build-empty"><Plus size={22}/><p>Your next upgrade goes here.</p><span>Pick a part below the preview to start building.</span></div>}</div>
 <div className="quantity-row"><div><strong>Matching spare</strong><span>Rim & tire quantity</span></div><div className="quantity-control" role="group" aria-label="Rim and tire quantity">{[4,5].map(q=><button key={q} type="button" aria-pressed={state.quantity===q} className={state.quantity===q?"active":""} onClick={()=>update({quantity:q as 4|5})}>{q}</button>)}</div></div>
 <div className="budget-fields"><CashField label="Upgrade budget" value={state.budget} onChange={n=>update({budget:n})}/><div className="budget-two"><CashField label="Labor allowance" value={state.labor} onChange={n=>update({labor:n})}/><CashField label="Tax, shipping & extras" value={state.extras} onChange={n=>update({extras:n})}/></div></div>
 <div className="totals"><div><span>Buy now · parts</span><span>{money(plan.now)}</span></div><div><span>Buy later · parts</span><span>{money(plan.later)}</span></div><div><span>Labor & other allowances</span><span>{money(plan.allowances)}</span></div>{plan.covered>0&&<div><span>Owned / installed · excluded</span><span>{money(plan.covered)}</span></div>}<div className="grand-total"><span>Upgrades left to fund</span><strong aria-live="polite">{money(plan.remaining)}</strong></div></div>
 {state.budget>0&&<div className={`budget-meter ${plan.remaining>state.budget?'over':''}`}><div><span style={{width:Math.min(plan.remaining/state.budget*100,100)+'%'}}/></div><p>{plan.remaining>state.budget?`${money(plan.remaining-state.budget)} over upgrade budget`:`${money(state.budget-plan.remaining)} left in your upgrade budget`}</p></div>}
 <p className="price-note">Allowances start at $0. Enter quotes for labor, tax, shipping and supporting parts to include them. Owned and installed parts use catalog value, not your original purchase price.</p>
  <details className="commerce-summary"><summary><Handshake size={15}/>Partner commerce</summary><p>{commerceDisclosure} {noActiveCommerceDisclosure}</p><div className="commerce-stats"><span>{partnerPrograms.length} programs listed</span><span>{selected.length?`${relevantPartnerPrograms.length} applications for selected parts`:"Select parts to narrow applications"}</span><span>{selected.length?`${selectedCommercePathCount} source and partner paths`:"Full directory shown"}</span></div><div className="sponsor-readiness" aria-label="Sponsored-link readiness"><div><strong>Sponsored-link readiness</strong><p>Apply first, then label and test every paid link. Current links stay reference and application links.</p></div><ul>{sponsoredLinkReadinessChecklist.slice(0,3).map(item=><li key={item}>{item}</li>)}</ul><div className="paid-launch-status" aria-label="Paid-link launch status"><strong>Paid-link launch status</strong><ul>{paidLinkLaunchLines.map(line=><li key={line}>{line}</li>)}</ul></div><div className="paid-disclosure-preview" aria-label="Paid-link disclosure preview"><strong>Paid-link disclosure</strong><p>{paidLinkDisclosureSnippet}</p><span>{paidLinkLaunchChecklist.length} pre-publish checks before tracking goes live</span>{!isNative()&&<Button variant="outline" size="sm" onClick={copyPaidLinkDisclosure}><CopyPlus size={14}/>Copy disclosure</Button>}</div><div className="sponsor-readiness-foot"><span>{affiliateApplicationProfileFields.length} application profile fields to confirm</span><span>RealTruck path: Impact application</span></div><div className="application-profile-preview" aria-label="Affiliate application profile preview"><strong>Affiliate application profile</strong><ul>{affiliateApplicationProfileFields.slice(0,4).map(item=><li key={item}>{item}</li>)}</ul><span>Download the profile template or full application pack for partner review.</span></div><div className="submission-review-preview" aria-label="Partner submission review"><strong>Final submission review</strong><ul>{partnerSubmissionReviewChecklist.slice(0,3).map(item=><li key={item}>{item}</li>)}</ul><span>Download the review sheet before marking an application submitted.</span></div></div><div className="partner-priority" aria-label="Suggested application order"><strong>Apply first</strong>{partnerApplicationPriorities.map((priority,index)=><a key={priority.program.id} className="priority-program" href={safeCommerceUrl(priority.program.url)} target="_blank" rel="noopener noreferrer" onClick={e=>{if(isNative()){e.preventDefault();void openCommerceLink(priority.program.url);}}}><span>{index+1}</span><div><strong>{priority.program.name}{priority.program.network?` via ${priority.program.network}`:""}</strong><small>{priority.reason}</small></div><em>{relationshipNames[priority.program.relationship]}</em><ArrowUpRight size={13}/></a>)}</div><div className="partner-status-tracker" aria-label="Partner application tracker"><div><strong>Application tracker</strong><small>{activePartnerApplicationCount?`${activePartnerApplicationCount} application status${activePartnerApplicationCount===1?"":"es"} active across ${trackedPartnerApplications.length} program${trackedPartnerApplications.length===1?"":"s"}.`:`Track ${trackedPartnerApplications.length} program${trackedPartnerApplications.length===1?"":"s"} on this device.`}</small></div><div className="partner-status-summary" aria-label="Partner application status summary">{partnerApplicationStatusCounts.map(item=><span key={item.status} className={item.status}><strong>{item.count}</strong>{item.label}</span>)}</div>{nextPartnerApplication?<a className="partner-next-link" href={safeCommerceUrl(nextPartnerApplication.priority.program.url)} target="_blank" rel="noopener noreferrer" onClick={e=>{if(isNative()){e.preventDefault();void openCommerceLink(nextPartnerApplication.priority.program.url);}}}><span><strong>Next application</strong><small>{nextPartnerApplication.priority.program.name}{nextPartnerApplication.priority.program.network?` via ${nextPartnerApplication.priority.program.network}`:""} · {partnerApplicationStatusNames[nextPartnerApplication.status]}</small></span><ArrowUpRight size={13}/></a>:<p className="partner-next-complete">No unblocked partner application is next. Reset a blocked or paused program when it can move again.</p>}<div className="partner-status-list">{trackedPartnerApplications.map(({priority,status,note})=><div className="partner-status-row" key={priority.program.id}><button type="button" className={`partner-status ${status}`} onClick={()=>cyclePartnerApplicationStatus(priority.program.id)} aria-label={`Cycle ${priority.program.name} application status from ${partnerApplicationStatusNames[status]}`}><span>{priority.program.name}{priority.program.network?` via ${priority.program.network}`:""}<small>{priority.reason}</small></span><strong>{partnerApplicationStatusNames[status]}</strong></button><Input className="partner-status-note" aria-label={`${priority.program.name} application note`} value={note} maxLength={240} placeholder="Application note" onChange={e=>updatePartnerApplicationNote(priority.program.id,e.target.value)}/></div>)}</div></div><p className="commerce-directory-note">{selected.length?`Showing programs that match this build's selected categories. Add or remove parts to change the application list.`:"Pick at least one part to focus this directory on the programs that match your build."}</p><div className="commerce-actions"><Button variant="outline" size="sm" onClick={exportAffiliateProfile}><ClipboardList size={14}/>{isNative()?'Share profile':'Download profile'}</Button>{!isNative()&&<Button variant="outline" size="sm" onClick={copyPartnerLinks}><CopyPlus size={14}/>Copy partner links</Button>}{!isNative()&&<Button variant="outline" size="sm" onClick={copyPartnerApplicationTracker}><CopyPlus size={14}/>Copy tracker summary</Button>}<Button variant="outline" size="sm" onClick={exportPartnerLinks}><ClipboardList size={14}/>{isNative()?'Share partner links':'Download partner links'}</Button><Button variant="outline" size="sm" onClick={exportPartnerApplicationTracker}><FileSpreadsheet size={14}/>{isNative()?'Share tracker CSV':'Download tracker CSV'}</Button><Button variant="outline" size="sm" onClick={exportPartnerOutreachDrafts}><FileText size={14}/>{isNative()?'Share outreach drafts':'Download outreach drafts'}</Button><Button variant="outline" size="sm" onClick={exportPartnerSubmissionReview}><Shield size={14}/>{isNative()?'Share review sheet':'Download review sheet'}</Button><Button variant="outline" size="sm" onClick={exportCommercePack}><FileText size={14}/>{isNative()?'Share application pack':'Download application pack'}</Button><Button variant="outline" size="sm" onClick={exportPaidLinkDisclosure}><FileText size={14}/>{isNative()?'Share disclosure':'Download disclosure'}</Button></div>{selected.length>0&&<div className="commerce-sources" aria-label="Selected source links"><strong>Selected source links</strong>{selected.map(part=><a key={part.id} className="commerce-source" href={safeCommerceUrl(part.url)} target="_blank" rel="noopener noreferrer" onClick={e=>{if(isNative()){e.preventDefault();void openCommerceLink(part.url);}}}><span><small>{categoryNames[part.category]} · {part.retailer}</small><strong>{part.brand} {part.name}</strong><small>{part.variant} · Checked {sourceCheckedLabel(part.checkedAt)}</small></span><em>Source link</em><ArrowUpRight size={13}/></a>)}</div>}<div className="commerce-directory">{relevantPartnerPrograms.map(program=><a key={program.id} className="commerce-link" href={program.url} target="_blank" rel="noopener noreferrer" onClick={e=>{if(isNative()){e.preventDefault();void openCommerceLink(program.url);}}}><strong>{program.name}</strong><small>{relationshipNames[program.relationship]}{program.network?` via ${program.network}`:""} · {program.note}</small><em>{commerceStatusNames[program.status]}</em><ArrowUpRight size={13}/></a>)}</div></details>
 <ApplicationAnswerKit target={nextPartnerAnswerTarget} onCopy={copyAffiliateAnswers} onExport={exportAffiliateAnswers} onExportReview={exportPartnerSubmissionReview} onOpenTarget={()=>{if(nextPartnerAnswerTarget)void openCommerceLink(nextPartnerAnswerTarget.url);}} onOpenEmail={openTargetOutreachEmail} onAdvanceTarget={advanceNextPartnerApplication} onPauseTarget={pauseNextPartnerApplication} onBlockTarget={blockNextPartnerApplication} onResetTarget={resetNextPartnerApplication} onCopyTarget={copyTargetPrep} onCopyEmail={copyTargetOutreachEmail}/>
 {blockedPartnerApplicationNotes.length>0&&<section className="blocked-application-notes" aria-label="Blocked application notes"><strong>Blocked application notes</strong>{blockedPartnerApplicationNotes.map(({priority,note})=><p key={priority.program.id}><span>{priority.program.name}{priority.program.network?` via ${priority.program.network}`:""}</span><small>{note}</small></p>)}<div>{!isNative()&&<Button variant="outline" size="sm" onClick={copyBlockedApplicationNotes}><CopyPlus size={14}/>Copy blocked notes</Button>}<Button variant="outline" size="sm" onClick={exportBlockedApplicationNotes}><FileText size={14}/>{isNative()?"Share blocked notes":"Download blocked notes"}</Button><Button variant="outline" size="sm" onClick={openBlockedApplicationSupportEmail}><Mail size={14}/>Open support email</Button>{!isNative()&&<Button variant="outline" size="sm" onClick={copyBlockedApplicationSupportDraft}><CopyPlus size={14}/>Copy support draft</Button>}<Button variant="outline" size="sm" onClick={exportBlockedApplicationSupportDraft}><Mail size={14}/>{isNative()?"Share support draft":"Download support draft"}</Button></div></section>}
 <details className="purchase-plan"><summary>Vehicle cost & purchase plan</summary><CashField label="Vehicle price or quote (optional)" value={state.vehicleCost??0} onChange={n=>update({vehicleCost:n})}/><p>Leave $0 if you already own your Jeep. Enter your own quote; this is not factory MSRP.</p><dl><div><dt>Buy now + all allowances</dt><dd>{money(plan.dueNow)}</dd></div><div><dt>Buy later</dt><dd>{money(plan.later)}</dd></div><div><dt>Vehicle + unfunded upgrades</dt><dd>{money(plan.project)}</dd></div></dl><p>Allowances are reserved in the first phase. “Buy now” is a budget plan, not a verified installation sequence.</p></details>
 {lastSavedTotal!==null&&!dirty&&total!==lastSavedTotal&&<p className="inline-warning">Your full selection estimate changed by {money(total-lastSavedTotal)} since this version was saved. Current prices are used above.</p>}
 <Button className="compare-full" variant="outline" onClick={()=>{setCompareOpen(true);void loadGarage();}}><GitCompareArrows size={16}/>Compare with a saved build</Button>
 <Button className="save-full" onClick={()=>{setSaveCopy(false);setSaveOpen(true);}}><Save size={16}/>{id?"Save changes":"Save to my garage"}</Button>
 <div className="export-buttons"><Button variant="ghost" onClick={share}><Share2 size={15}/>Share build</Button>{!isNative()&&<Button variant="ghost" onClick={()=>window.print()}><Printer size={15}/>Print list</Button>}</div>
 <button type="button" className="csv-link" onClick={exportShopBrief}>{isNative()?'Share shop brief':'Download shop brief'}<FileText size={13}/></button>
 <button type="button" className="csv-link" onClick={exportCommercePack}>{isNative()?'Share commerce pack':'Download commerce pack'}<ClipboardList size={13}/></button>
 <button type="button" className="csv-link" onClick={exportPartnerApplicationTracker}>{isNative()?'Share application tracker':'Download application tracker'}<FileSpreadsheet size={13}/></button>
 <button type="button" className="csv-link" onClick={exportPartnerOutreachDrafts}>{isNative()?'Share outreach drafts':'Download outreach drafts'}<FileText size={13}/></button>
 <button type="button" className="csv-link" onClick={exportPartnerSubmissionReview}>{isNative()?'Share submission review':'Download submission review'}<Shield size={13}/></button>
 <button type="button" className="csv-link" onClick={exportCSV}>{isNative()?'Export parts list':'Download parts CSV'}<FileSpreadsheet size={13}/></button>
 </div>
 </aside></div>
 <div className="mobile-total"><div><span>{errors.length?`${errors.length} fitment conflicts`:`${selected.length} upgrades`} · Left to fund</span><strong>{money(plan.remaining)}</strong></div><Button onClick={()=>document.getElementById("build-summary")?.scrollIntoView({behavior:"smooth"})}>Build sheet<ChevronRight size={16}/></Button></div>
 </>:<>
 <section className="page-heading"><div><div className="eyebrow">PARK YOUR IDEAS HERE</div><h1>My garage<span>.</span></h1><p>Revisit a build. Refine the details. Make it happen.</p></div><Button onClick={()=>dirty?setConfirm({kind:"reset"}):reset()}><Plus size={16}/>New build</Button></section>
 <Button variant="ghost" className="back-builder" onClick={()=>setView("builder")}><ArrowLeft size={16}/>Back to current build</Button>
 {garage.length>0&&<><div className="garage-tools" aria-label="Garage filters"><div className="search-box garage-search"><Search size={17}/><Input aria-label="Search saved builds" placeholder="Search names, notes or parts" value={garageQuery} onChange={e=>setGarageQuery(e.target.value)}/></div><Select value={garagePowertrain} onValueChange={setGaragePowertrain}><SelectTrigger aria-label="Filter garage by powertrain"><CircleDot size={14}/><SelectValue/></SelectTrigger><SelectContent><SelectItem value={allGarageFilter}>All powertrains</SelectItem>{Object.entries(powertrainNames).map(([value,label])=><SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select><Select value={garageConflicts} onValueChange={setGarageConflicts}><SelectTrigger aria-label="Filter garage by fitment status"><TriangleAlert size={14}/><SelectValue/></SelectTrigger><SelectContent>{garageConflictOptions.map(option=><SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select><Select value={garageSort} onValueChange={v=>setGarageSort(v as GarageSort)}><SelectTrigger aria-label="Sort saved builds"><SlidersHorizontal size={14}/><SelectValue/></SelectTrigger><SelectContent>{garageSortOptions.map(option=><SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select>{activeGarageFilter&&<Button variant="ghost" className="garage-clear" onClick={clearGarageFilters}><X size={14}/>Clear</Button>}</div><p className="garage-count">{visibleGarage.length} of {garage.length} saved builds shown</p></>}
 {garageBusy?<div className="empty-state"><LoaderCircle className="spin"/><p>Opening your garage…</p></div>:garageError?<div className="empty-state"><TriangleAlert/><h3>Garage unavailable</h3><p>{garageError}</p><Button onClick={loadGarage}>Try again</Button></div>:garage.length?visibleGarage.length?<div className="garage-grid">{visibleGarage.map(b=>{const conflictCount=garageConflictCount(b,parts);return <article className={`garage-card ${conflictCount?"needs-review":""}`} key={b.id}><div className="garage-preview"><Preview state={b.state} parts={parts}/></div><div className="garage-info"><span className="eyebrow">{b.state.year} JL · {b.state.trim} · {powertrainNames[b.state.powertrain]}</span><h2>{b.name}</h2><p>{Object.values(b.state.picks).length} upgrades · Saved {new Date(b.updatedAt).toLocaleDateString("en-US")} · {conflictCount?`${conflictCount} fitment conflict${conflictCount===1?"":"s"}`:"No fitment conflicts"}</p>{b.notes&&<p className="garage-notes">{b.notes}</p>}<div><strong>{money(b.savedTotal)}<small>selection value when saved</small></strong><Button onClick={()=>requestOpenBuild(b)}>Open build<ChevronRight size={15}/></Button><Button variant="ghost" size="icon" title="Duplicate saved build" aria-label={`Duplicate ${b.name}`} disabled={!!copyingBuildId} onClick={()=>void duplicateSavedBuild(b)}>{copyingBuildId===b.id?<LoaderCircle className="spin" size={16}/>:<CopyPlus size={16}/>}</Button><Button variant="ghost" size="icon" title={isNative()?"Share commerce pack":"Download commerce pack"} aria-label={`Export commerce pack for ${b.name}`} onClick={()=>void exportSavedCommercePack(b)}><ClipboardList size={16}/></Button><Button variant="ghost" size="icon" title={isNative()?"Share submission review":"Download submission review"} aria-label={`Export submission review for ${b.name}`} onClick={()=>void exportSavedSubmissionReview(b)}><Shield size={16}/></Button><Button variant="ghost" size="icon" title={isNative()?"Share parts CSV":"Download parts CSV"} aria-label={`Export parts CSV for ${b.name}`} onClick={()=>void exportSavedCSV(b)}><FileSpreadsheet size={16}/></Button><Button variant="ghost" size="icon" title={isNative()?"Share shop brief":"Download shop brief"} aria-label={`Export shop brief for ${b.name}`} onClick={()=>void exportSavedShopBrief(b)}><FileText size={16}/></Button><Button variant="ghost" size="icon" aria-label={`Delete ${b.name}`} onClick={()=>setConfirm({kind:"delete",build:b})}><Trash2 size={16}/></Button></div></div></article>;})}</div>:<div className="empty-state garage-empty"><Search size={42}/><h2>No saved builds match.</h2><p>Clear filters or search a different part, note or vehicle.</p><Button variant="outline" onClick={clearGarageFilters}><X size={16}/>Clear garage filters</Button></div>:<div className="empty-state garage-empty"><FolderOpen size={42}/><h2>A garage full of possibility.</h2><p>Save your first build and it will be waiting here.</p><Button onClick={()=>setView("builder")}>Start building<ChevronRight size={16}/></Button></div>}
 </>}
 <footer className="site-footer"><span><Wrench size={14}/>JEEP BUILD LAB</span><p>Independent build planner. Affiliate links are inactive until approved, tested and labeled.</p><nav><button type="button" onClick={()=>setSettingsOpen(true)}>Privacy & help</button>{!isNative()&&<><a href="/privacy">Privacy policy</a><a href="/support">Support</a></>}</nav></footer>
 </main>
 <section className="print-sheet"><h1>{name}</h1><p>{vehicleText}</p><p>Jeep Build Lab · Planning estimate · {new Date().toLocaleDateString("en-US")}</p><p>{commerceDisclosure} {noActiveCommerceDisclosure}</p><table><thead><tr><th>Part / variant</th><th>Stage</th><th>Qty</th><th>Unit</th><th>Total</th></tr></thead><tbody>{selected.map(p=><tr key={p.id}><td><strong>{p.brand} {p.name}</strong><br/>{p.variant} · {p.reference}<br/><small>{p.url}<br/>{priceBasis(p)}<br/>Planner coverage: {partCoverage(p)}</small></td><td>{stageNames[stageFor(state,p.category)]}</td><td>{quantityFor(p,state)}</td><td>{money(p.priceCents)}</td><td>{money(p.priceCents*quantityFor(p,state))}</td></tr>)}</tbody></table><p>Parts: {money(subtotal)} · Labor allowance: {money(state.labor)} · Tax, shipping & extras allowance: {money(state.extras)}</p><h2>Upgrades left to fund: {money(plan.remaining)}</h2><p>Buy now parts: {money(plan.now)} · Buy later parts: {money(plan.later)} · Owned / installed value excluded: {money(plan.covered)}</p><p>Entered vehicle price: {money(state.vehicleCost??0)} · Vehicle plus unfunded upgrades: {money(plan.project)}</p><p>Additional costs are included only to the extent of the entered allowances. Fitment checks cover all selected parts; installation order requires confirmation.</p><h3>Fitment notes</h3><p>Have an installer confirm the complete combination before purchase.</p><ul>{issues.map((i,n)=><li key={n}>{i.message}</li>)}{selected.map(p=><li key={p.id}>{p.name}: {p.notes}</li>)}</ul>{notes&&<><h3>Your notes</h3><p>{notes}</p></>}</section>
 <AppSettings open={settingsOpen} onOpenChange={setSettingsOpen} storage={storage} currentDraft={currentDraft} pauseDraft={draft.pause} resumeDraft={draft.resume}/>
 <BuildComparison open={compareOpen} onOpenChange={setCompareOpen} current={state} name={name} parts={parts} builds={garage} busy={garageBusy} error={garageError} onRetry={loadGarage} onSaveCopy={()=>{setCompareOpen(false);setSaveCopy(true);setSaveOpen(true);}} onOpenBuild={requestOpenBuild}/>
 <Dialog open={vehicleOpen} onOpenChange={setVehicleOpen}><DialogContent><DialogHeader><DialogTitle>Your starting point</DialogTitle><DialogDescription>This catalog covers 2018–2023 Wrangler JL Unlimited four-door 3.6L gas models plus a first 2024 Sahara 4xe batch.</DialogDescription></DialogHeader><div className="vehicle-dialog-fields"><div className="model-locked"><strong>Wrangler JL</strong><span>4-door · {powertrainNames[state.powertrain]}</span></div><div className="two-fields"><Choice label="Powertrain" value={state.powertrain} onChange={v=>updatePowertrain(v as Powertrain)} options={[{value:"gas",label:"3.6L V6 gas"},{value:"4xe",label:"4xe plug-in hybrid"}]}/><Choice label="Model year" value={String(state.year)} onChange={v=>requestVehicleUpdate({year:Number(v)})} options={yearOptions.map(v=>({value:String(v),label:String(v)}))}/></div><div className="two-fields"><Choice label="Trim" value={state.trim} onChange={v=>updateTrim(v as Trim)} options={trimOptions.map(v=>({value:v,label:v}))}/><Choice label="Current rim diameter" value={String(state.stockRim)} onChange={v=>requestVehicleUpdate({stockRim:Number(v) as 17|18|20})} options={[17,18,20].map(v=>({value:String(v),label:v+" inches"}))}/></div><div className="field"><Label htmlFor="stock-tire">Current tire diameter (in)</Label><DecimalInput id="stock-tire" places={1} min={300} max={350} value={Math.round(state.stockTire*10)} onChange={n=>requestVehicleUpdate({stockTire:n/10})}/></div><p className="dialog-note">Confirm your current sizes from your Jeep. Defaults are approximate. First 4xe coverage is limited to 2024 Sahara 4xe. TJ, JK, JT, two-door, diesel, 392 and Xtreme Recon are still outside catalog scope. Vehicle changes that affect selected parts ask for confirmation first.</p></div><DialogFooter><Button onClick={()=>setVehicleOpen(false)}>Continue building<ChevronRight size={16}/></Button></DialogFooter></DialogContent></Dialog>
 <Dialog open={saveOpen} onOpenChange={v=>!saving&&setSaveOpen(v)}><DialogContent><DialogHeader><DialogTitle>{saveCopy?"Save a new copy":"Save your build"}</DialogTitle><DialogDescription>Keep this configuration and your notes {storage.mode==='device'?'on this device':'in your private cloud garage'}. Opening it later uses your current catalog prices.</DialogDescription></DialogHeader><div className="field"><Label htmlFor="build-name">Build name</Label><Input id="build-name" disabled={saving} maxLength={80} value={name} onChange={e=>{markTouched();setName(e.target.value);setDirty(true);}} placeholder="Weekend trail runner"/></div><div className="field"><Label htmlFor="build-notes">Notes (optional)</Label><Textarea id="build-notes" disabled={saving} maxLength={1500} value={notes} onChange={e=>{markTouched();setNotes(e.target.value);setDirty(true);}} placeholder="What are you building toward?"/></div>{errors.length>0&&<p className="inline-warning">This build has {errors.length} unresolved fitment conflicts. You can save it as a plan.</p>}<DialogFooter>{id&&!saveCopy&&<Button variant="outline" disabled={saving} onClick={()=>setSaveCopy(true)}>Save as a copy</Button>}<Button disabled={saving||!name.trim()} onClick={saveBuild}>{saving?<LoaderCircle className="spin" size={16}/>:<Save size={16}/>}Save build</Button></DialogFooter></DialogContent></Dialog>
 <Dialog open={!!detail} onOpenChange={v=>!priceBusy&&!v&&setDetail(null)}><DialogContent className="part-dialog"><DialogHeader><DialogTitle>{detail?.brand} {detail?.name}</DialogTitle><DialogDescription>{detail?.variant} · {detail?.reference}</DialogDescription></DialogHeader>{detail&&detailThumbnail&&detailSelection&&<><div className="part-dialog-hero"><div className={`detail-part-art ${detailThumbnail.className}`} aria-hidden="true"><img src={detailThumbnail.src} alt="" draggable={false}/></div><div><span>{categoryNames[detail.category]}</span><strong>{money(detail.priceCents*quantityFor(detail,state))}</strong><small>{priceBasis(detail)}</small></div></div><div className="detail-specs">{detail.specs.rim&&<span>Rim diameter<strong>{detail.specs.rim}″</strong></span>}{detail.specs.diameter&&<span>Nominal tire diameter<strong>{detail.specs.diameter}″</strong></span>}{detail.specs.width&&<span>Rim width<strong>{detail.specs.width}″</strong></span>}{detail.specs.offset!==undefined&&<span>Offset<strong>{detail.specs.offset} mm</strong></span>}{detail.specs.backspacing&&<span>Backspacing<strong>{detail.specs.backspacing}″</strong></span>}{detail.specs.lift&&<span>Lift height<strong>{detail.specs.lift}″</strong></span>}</div><div className="detail-note"><Info size={18}/><p>{detail.notes}</p></div><div className="source-confidence" aria-label="Source confidence"><span><CheckCheck size={14}/><strong>Source checked</strong>{sourceCheckedLabel(detail.checkedAt)}</span><span><Shield size={14}/><strong>Planner coverage</strong>{partCoverage(detail)}</span><span><DollarSign size={14}/><strong>Price basis</strong>{priceBasis(detail)}</span><span><TriangleAlert size={14}/><strong>Still confirm</strong>Whole build and install sequence with a shop</span></div><div className={`detail-action-row ${detailSelection.active?"selected":detailSelection.excluded?"blocked":detailSelection.conflicts.length?"warning":""}`} aria-label="Part selection action"><div><strong>{detailSelection.title}</strong><span>{detailSelection.body}</span></div><Button variant={detailSelection.active?"secondary":"outline"} disabled={!!detailSelection.excluded&&!detailSelection.active} onClick={()=>selectPart(detail)}>{detailSelection.active?<><Trash2 size={15}/>Remove</>:<><Plus size={15}/>{detailSelection.action}</>}</Button></div><p className="dialog-note">A vehicle listing does not verify the whole build.</p><a className="source-link" href={detail.url} target="_blank" rel="noopener noreferrer" onClick={e=>{if(isNative()){e.preventDefault();void openCommerceLink(detail.url);}}}>View product source at {detail.retailer}<ArrowUpRight size={17}/></a><div className="commerce-panel" aria-label="Partner-ready offer options"><div className="commerce-panel-head"><Handshake size={18}/><div><h3>Partner-ready offers</h3><p>{commerceDisclosure} {noActiveCommerceDisclosure}</p></div></div><div className="commerce-offers">{detailOffers.map(offer=><a key={offer.id} className="commerce-offer" href={offer.url} target="_blank" rel={offer.paid?"sponsored noopener noreferrer":"noopener noreferrer"} onClick={e=>{if(isNative()){e.preventDefault();void openCommerceLink(offer.url);}}}><span><strong>{offer.partnerName}</strong><small>{relationshipNames[offer.relationship]} · {offer.detail}</small></span><em>{commerceStatusNames[offer.status]}</em><ArrowUpRight size={13}/></a>)}</div></div><p className="dialog-note">Select the exact variant on the retailer page. Application links do not create a sale, commission or dealer order until you add approved account credentials and terms.</p><div className="price-editor"><h3>Your price note</h3><p>Record a quote or updated price for your own builds. This does not change product specifications.</p><CashField label="Unit price (USD)" value={price} onChange={setPrice} disabled={priceBusy}/><p className="dialog-note">{detail.customPrice?"Personal price updated":"Source price checked"} {detail.checkedAt}. {detail.customPrice?"This amount has not been verified with the retailer.":"Price is a dated snapshot, not a live quote."}</p><div className="price-actions">{detail.customPrice&&<Button variant="outline" disabled={priceBusy} onClick={()=>savePrice(true)}>Restore source price</Button>}<Button disabled={priceBusy} onClick={()=>savePrice()}>{priceBusy?<LoaderCircle className="spin" size={15}/>:<CheckCheck size={15}/>}Save price</Button></div></div></>}</DialogContent></Dialog>
 <Dialog open={linkOpen} onOpenChange={setLinkOpen}><DialogContent><DialogHeader><DialogTitle>Your build link</DialogTitle><DialogDescription>The link contains the vehicle, selected parts, purchase stages and budget amounts. Your name, personal notes and price overrides are not included. Anyone with the link can read the included details. Retailer pages and opening the web link require internet access.</DialogDescription></DialogHeader><Input aria-label="Build link" value={shareUrl} readOnly onFocus={e=>e.target.select()}/><DialogFooter><Button onClick={async()=>{try{await shareLink(shareUrl);if(!isNative())toast.success("Link copied.");}catch{toast.info("You can select and copy the link above.");}}}><Share2 size={15}/>{isNative()?"Share link":"Copy link"}</Button></DialogFooter></DialogContent></Dialog>
 {confirm&&<AlertDialog open onOpenChange={v=>!busyDelete&&!v&&setConfirm(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{confirmTitle}</AlertDialogTitle><AlertDialogDescription>{confirmDescription}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={busyDelete}>Cancel</AlertDialogCancel><AlertDialogAction disabled={busyDelete} onClick={e=>{e.preventDefault();void confirmed();}}>{confirmAction}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>}
 </div>;
}
