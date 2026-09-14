'use client';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription,DialogFooter} from '@/components/ui/dialog';
import {Select,SelectTrigger,SelectContent,SelectItem,SelectValue} from '@/components/ui/select';
import {Button} from '@/components/ui/button';
import {Checkbox} from '@/components/ui/checkbox';
import {useState} from 'react';
import {Check,CopyPlus,FolderOpen} from 'lucide-react';
import {compareRows,costPlan} from '@/lib/planning';
import {buildIssues,money,vehicleDescription,type BuildState,type Part,type SavedBuild} from '@/lib/model';
export function BuildComparison({open,onOpenChange,current,name,parts,builds,busy,error,onRetry,onSaveCopy,onOpenBuild}:{open:boolean;onOpenChange:(open:boolean)=>void;current:BuildState;name:string;parts:Part[];builds:SavedBuild[];busy:boolean;error:string;onRetry:()=>void;onSaveCopy:()=>void;onOpenBuild:(build:SavedBuild)=>void}){
 const [selected,setSelected]=useState(''),[differences,setDifferences]=useState(false);
 const target=builds.find(b=>b.id===selected)??builds[0];
 const a=costPlan(current,parts),b=target?costPlan(target.state,parts):null;
 const rows=target?compareRows(current,target.state,parts):[];
 return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="comparison-dialog"><DialogHeader><DialogTitle>Compare two builds</DialogTitle><DialogDescription>Compare your current plan with a saved build using the same current catalog prices and your price notes.</DialogDescription></DialogHeader>
 {busy?<p>Loading your saved builds…</p>:error?<div><p>{error}</p><Button onClick={onRetry}>Try again</Button></div>:!target?<div className="compare-empty"><p>Save your first option, change a few parts, then compare the two plans here.</p><Button onClick={onSaveCopy}>Save this option</Button></div>:<>
 <Select value={target.id} onValueChange={setSelected}><SelectTrigger aria-label="Saved build to compare"><SelectValue/></SelectTrigger><SelectContent>{builds.map(build=><SelectItem key={build.id} value={build.id}>{build.name}</SelectItem>)}</SelectContent></Select>
 <label className="comparison-filter"><Checkbox checked={differences} onCheckedChange={v=>setDifferences(v===true)}/>Show only different parts</label>
 <div className="comparison-scroll"><table className="comparison-table"><thead><tr><th scope="col">Build detail</th><th scope="col">{name}<small>Current plan</small></th><th scope="col">{target.name}<small>Saved option · current catalog prices</small></th></tr></thead><tbody>
 <tr><th scope="row">Vehicle</th><td>{vehicleDescription(current)}</td><td>{vehicleDescription(target.state)}</td></tr>
 <tr><th scope="row">Current equipment</th><td>{current.stockRim}″ wheels · {current.stockTire}″ tires</td><td>{target.state.stockRim}″ wheels · {target.state.stockTire}″ tires</td></tr>
 {rows.filter(row=>!differences||row.changed).map(row=><tr key={row.category} className={row.changed?'changed':''}><th scope="row">{row.label}{row.changed&&<small>Different</small>}</th><td>{row.left}{row.leftCost>0&&<strong>{money(row.leftCost)}</strong>}</td><td>{row.right}{row.rightCost>0&&<strong>{money(row.rightCost)}</strong>}</td></tr>)}
 <tr><th scope="row">Labor + other allowances</th><td>{money(a.allowances)}</td><td>{money(b!.allowances)}</td></tr>
 <tr className="comparison-total"><th scope="row">Upgrades left to fund</th><td>{money(a.remaining)}</td><td>{money(b!.remaining)}</td></tr>
 <tr><th scope="row">Buy now + allowances</th><td>{money(a.dueNow)}</td><td>{money(b!.dueNow)}</td></tr>
 <tr><th scope="row">Buy later</th><td>{money(a.later)}</td><td>{money(b!.later)}</td></tr>
 <tr><th scope="row">Vehicle price entered</th><td>{money(current.vehicleCost??0)}</td><td>{money(target.state.vehicleCost??0)}</td></tr>
 <tr><th scope="row">Vehicle + unfunded upgrades</th><td>{money(a.project)}</td><td>{money(b!.project)}</td></tr>
 <tr><th scope="row">Upgrade budget</th><td>{money(current.budget)}</td><td>{money(target.state.budget)}</td></tr>
 <tr><th scope="row">Fitment conflicts</th><td>{buildIssues(current,parts).filter(i=>i.level==='error').length}</td><td>{buildIssues(target.state,parts).filter(i=>i.level==='error').length}</td></tr>
 </tbody></table></div>
 {differences&&!rows.some(r=>r.changed)&&<p>The selected parts, quantities and purchase stages match.</p>}
 <p className="comparison-delta">Your current plan needs <strong>{money(Math.abs(a.remaining-b!.remaining))} {a.remaining>=b!.remaining?'more':'less'}</strong> for upgrades.</p>
 <p className="dialog-note">Unentered costs are excluded. Stages describe your purchase plan; they do not verify installation order. All selected parts are included in the final-build fitment checks.</p>
 <DialogFooter className="comparison-actions"><Button variant="outline" onClick={onSaveCopy}><CopyPlus size={15}/>Save current as copy</Button><Button variant="outline" onClick={()=>onOpenBuild(target)}><FolderOpen size={15}/>Open saved build</Button><Button onClick={()=>onOpenChange(false)}><Check size={15}/>Done</Button></DialogFooter>
 </>}
 </DialogContent></Dialog>;
}
