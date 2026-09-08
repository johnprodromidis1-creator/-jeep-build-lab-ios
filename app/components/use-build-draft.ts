'use client';
import {useEffect,useRef,useState} from 'react';
import {stateSchema,type BuildState} from '@/lib/model';
export type Draft={name:string;notes:string;state:BuildState;buildId:string|null;lastSavedTotal:number|null};
type DraftResponse={error?:string;revision:number;draft?:Draft|null};
export function useBuildDraft(draft:Draft,onRestore:(draft:Draft)=>boolean){
 const encoded=JSON.stringify(draft),latest=useRef(encoded),restore=useRef(onRestore);
 latest.current=encoded;restore.current=onRestore;
 const revision=useRef(0),saved=useRef(''),inFlight=useRef(false),paused=useRef(false);
 const [ready,setReady]=useState(false),[attempt,setAttempt]=useState(0);
 const [status,setStatus]=useState<'loading'|'pending'|'saving'|'saved'|'error'|'conflict'>('loading');
 const [error,setError]=useState('');
 useEffect(()=>{
  if(ready)return;let canceled=false;
  setStatus('loading');
  fetch('/api/draft').then(async r=>{const data=await r.json() as DraftResponse;if(!r.ok)throw new Error(data.error);if(canceled)return;
   revision.current=data.revision;
   if(data.draft){const state=stateSchema.safeParse(data.draft.state);if(!state.success)throw new Error('The recovered draft has unsupported parts. Save your current plan as a named build.');const value={...data.draft,state:state.data} as Draft;if(restore.current(value))saved.current=JSON.stringify(value);}
   paused.current=false;setError('');setReady(true);setStatus('pending');
  }).catch(e=>{if(!canceled){setError(e instanceof Error?e.message:'Draft recovery failed.');setStatus('error');}});
  return()=>{canceled=true;};
 },[ready,attempt]);
 useEffect(()=>{
  if(!ready||paused.current)return;
  if(encoded===saved.current){setStatus('saved');return;}
  setStatus('pending');let canceled=false;
  const timer=setTimeout(async()=>{
   if(inFlight.current)return;
   inFlight.current=true;
   try{
    while(latest.current!==saved.current&&!paused.current){
     const payload=latest.current;setStatus('saving');
     const r=await fetch('/api/draft',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({revision:revision.current,draft:JSON.parse(payload)})});
     const data=await r.json() as DraftResponse;
     if(!r.ok){paused.current=true;setStatus(r.status===409?'conflict':'error');setError(data.error||'Draft could not be protected.');return;}
     revision.current=data.revision;saved.current=payload;setError('');
    }
    setStatus('saved');
   }catch{paused.current=true;setStatus('error');setError('Draft could not be protected. Save a named build or retry.');}
   finally{inFlight.current=false;if(canceled&&latest.current!==saved.current&&!paused.current)setAttempt(n=>n+1);}
  },900);
  return()=>{canceled=true;clearTimeout(timer);};
 },[encoded,ready,attempt]);
 return {status:status==='saved'&&encoded!==saved.current?'pending' as const:status,error,ready,retry:()=>{paused.current=false;setAttempt(n=>n+1);}};
}
