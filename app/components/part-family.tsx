'use client';
import {useState} from 'react';
import {Check,Plus,ArrowUpRight,CircleDot,MoveVertical,PanelTop,Anchor,Shield} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Select,SelectContent,SelectItem,SelectTrigger,SelectValue} from '@/components/ui/select';
import {buildIssues,money,quantityFor,type Part,type BuildState} from '@/lib/model';
const icons={wheels:CircleDot,tires:CircleDot,lift:MoveVertical,bumpers:PanelTop,winches:Anchor,armor:Shield};
export function PartFamily({variants,state,parts,onSelect,onDetail,compatibilityReason}:{variants:Part[];state:BuildState;parts:Part[];onSelect:(p:Part)=>void;onDetail:(p:Part)=>void;compatibilityReason?:(p:Part)=>string|null}){
 const [choice,setChoice]=useState<string>();
 const p=variants.find(v=>v.id===choice)??variants.find(v=>v.id===state.picks[v.category])??variants.find(v=>!compatibilityReason?.(v))??variants[0];
 const active=state.picks[p.category]===p.id,Icon=icons[p.category],qty=quantityFor(p,state);
 const current=parts.find(v=>v.id===state.picks[p.category]);
 const delta=(p.priceCents-(current?.priceCents??0))*qty;
 const excludedReason=compatibilityReason?.(p)??null;
 const conflicts=buildIssues({...state,picks:{...state.picks,[p.category]:p.id}},parts).filter(i=>i.level==='error');
 return <article className={`part-card ${active?'selected':''} ${excludedReason&&!active?'excluded':''}`}>
  <div className="part-card-top"><span className="part-brand">{p.brand}</span><span className="part-type">{excludedReason&&!active?'Excluded':variants.length===1?'1 option':`${variants.length} options`}</span></div>
  <div className="part-content"><div className="part-art" aria-hidden="true">{p.category==='wheels'||p.category==='tires'?<img src={`/assets/wheel-${p.specs.finish==='bronze'?'bronze':'charcoal'}.png`} alt=""/>:<Icon size={36} strokeWidth={1.2}/>}</div><div><h3>{p.name}</h3><span className="part-reference">{p.reference}</span></div></div>
  {variants.length>1?<Select value={p.id} onValueChange={setChoice}><SelectTrigger className="variant-select" aria-label={`${p.brand} ${p.name} variant`}><SelectValue/></SelectTrigger><SelectContent>{variants.map(v=><SelectItem key={v.id} value={v.id}>{v.variant} · {money(v.priceCents)} / {v.category==='tires'||v.category==='wheels'?'each':v.category==='armor'?'pair':'kit'}{compatibilityReason?.(v)?' · Excluded':''}</SelectItem>)}</SelectContent></Select>:<p className="single-variant">{p.variant}</p>}
  <button type="button" className="details-link" onClick={()=>onDetail(p)}>Specs & fitment notes<ArrowUpRight size={13}/></button>
  {excludedReason&&!active?<p className="option-conflict">Excluded for your Jeep: {excludedReason}</p>:conflicts.length>0&&<p className="option-conflict">With this option: {conflicts.length} build conflict{conflicts.length===1?'':'s'}. Review before buying.</p>}
  <div className="part-bottom"><div><strong>{money(p.priceCents*qty)}</strong><span> / {qty>1?`${qty} ${p.category}`:p.category==='armor'?'pair':'kit'}</span><small>{qty>1?`${money(p.priceCents)} each · `:''}{p.customPrice?'Your price note':'Source snapshot'}</small></div><Button size="sm" variant={active?'secondary':'outline'} disabled={!!excludedReason&&!active} onClick={()=>onSelect(p)}>{active?<><Check size={15}/>Added</>:excludedReason?<><Plus size={15}/>Excluded</>:<><Plus size={15}/>{current?'Replace':'Add'}</>}</Button></div>
  {!active&&current&&<p className="price-change">Selection value {delta<0?'decreases':'increases'} by {money(Math.abs(delta))}</p>}
 </article>;
}
