'use client';
import {useEffect,useRef,useState} from 'react';
import {stateSchema} from '@/lib/model';
import {StorageError,type BuildStorage,type Draft} from '@/lib/storage/types';
export type {Draft} from '@/lib/storage/types';
export function useBuildDraft(storage:BuildStorage,draft:Draft,onRestore:(draft:Draft)=>boolean,active:boolean){
 const encoded=JSON.stringify(draft),latest=useRef(encoded),restore=useRef(onRestore),enabled=useRef(active);
 latest.current=encoded;restore.current=onRestore;enabled.current=active;
 const revision=useRef(0),saved=useRef(''),inFlight=useRef<Promise<void>|null>(null),failed=useRef(false),blocked=useRef(false);
 const [ready,setReady]=useState(false),[attempt,setAttempt]=useState(0);
 const [status,setStatus]=useState<'loading'|'idle'|'pending'|'saving'|'saved'|'error'|'conflict'>('loading');
 const [error,setError]=useState('');
 useEffect(()=>{
  if(ready)return;let canceled=false;setStatus('loading');
  storage.readDraft().then(data=>{if(canceled)return;
   revision.current=data.revision;
   if(data.draft){const state=stateSchema.safeParse(data.draft.state);if(!state.success)throw new Error('The recovered draft has unsupported parts. Save your current plan as a named build.');const value={...data.draft,state:state.data};if(restore.current(value))saved.current=JSON.stringify(value);}
   failed.current=false;setError('');setReady(true);setStatus('idle');
  }).catch(e=>{if(!canceled){setError(e instanceof Error?e.message:'Draft recovery failed.');setStatus('error');}});
  return()=>{canceled=true;};
 },[ready,attempt,storage]);
 useEffect(()=>{
  if(!ready||blocked.current||failed.current)return;
  if(!active){setStatus('idle');return;}
  if(encoded===saved.current){setStatus('saved');return;}
  setStatus('pending');
  const timer=setTimeout(()=>{
   if(inFlight.current||blocked.current||failed.current)return;
   const task=(async()=>{
    try{
     while(enabled.current&&latest.current!==saved.current&&!blocked.current){
      const payload=latest.current;setStatus('saving');
      const data=await storage.writeDraft(revision.current,JSON.parse(payload));
      revision.current=data.revision;saved.current=payload;setError('');
     }
     setStatus(latest.current===saved.current?'saved':'pending');
    }catch(e){failed.current=true;setStatus(e instanceof StorageError&&e.status===409?'conflict':'error');setError(e instanceof Error?e.message:'Draft could not be protected. Save a named build or retry.');}
   })();
   inFlight.current=task;void task.finally(()=>{inFlight.current=null;});
  },storage.mode==='device'?150:900);
  return()=>clearTimeout(timer);
 },[encoded,ready,attempt,storage,active]);
 return {status:status==='saved'&&encoded!==saved.current?'pending' as const:status,error,ready,
  retry:()=>{failed.current=false;setAttempt(n=>n+1);},
  pause:async()=>{blocked.current=true;await inFlight.current;},
  resume:()=>{blocked.current=false;setAttempt(n=>n+1);}
 };
}
