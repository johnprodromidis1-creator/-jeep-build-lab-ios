import assert from 'node:assert/strict';
import test from 'node:test';
import 'fake-indexeddb/auto';
import {existsSync} from 'node:fs';
import {mkdir,readFile,rm} from 'node:fs/promises';
import {fileURLToPath,pathToFileURL} from 'node:url';
import path from 'node:path';
import {build} from 'esbuild';

const root=fileURLToPath(new URL('..',import.meta.url));
const output=path.join(root,'.sites-runtime','device-tests');
await mkdir(output,{recursive:true});

function resolveLocal(specifier,resolveDir){
 const base=specifier.startsWith('@/')?path.join(root,specifier.slice(2)):path.resolve(resolveDir,specifier);
 for(const candidate of [base,base+'.ts',base+'.tsx',base+'.json',path.join(base,'index.ts'),path.join(base,'index.tsx')]){
  if(existsSync(candidate))return candidate;
 }
 throw new Error(`Could not resolve ${specifier} from ${resolveDir}`);
}
async function bundle(file,name){
 const entry=path.join(root,file),outfile=path.join(output,name+'.mjs');
 await build({absWorkingDir:root,stdin:{contents:await readFile(entry,'utf8'),sourcefile:path.basename(file),resolveDir:path.dirname(entry),loader:file.endsWith('.tsx')?'tsx':'ts'},outfile,bundle:true,platform:'node',format:'esm',plugins:[{name:'test-resolver',setup(b){
  b.onResolve({filter:/^@\//},args=>({path:resolveLocal(args.path,root)}));
  b.onResolve({filter:/^\./},args=>({path:resolveLocal(args.path,args.resolveDir)}));
  b.onResolve({filter:/^[^./]/},args=>({path:args.path,external:true}));
  b.onLoad({filter:/\.(ts|tsx)$/},async args=>({contents:await readFile(args.path,'utf8'),loader:args.path.endsWith('.tsx')?'tsx':'ts'}));
  b.onLoad({filter:/\.json$/},async args=>({contents:await readFile(args.path,'utf8'),loader:'json'}));
 }}]});
 return import(pathToFileURL(outfile).href);
}

const {deviceStorage:storage}=await bundle('lib/storage/device.ts','device');
const {initialState}=await bundle('lib/model.ts','model');
const state=()=>({...structuredClone(initialState),picks:{tires:'nitto-217020'}});
await test('device garage, backup restore, revision conflicts and erasure work without network access',async()=>{
 const originalFetch=globalThis.fetch;globalThis.fetch=()=>{throw new Error('Device garage must not use network requests.');};
 try{
  assert.deepEqual(await storage.list(),[]);
  const first=await storage.save({name:'Offline option',notes:'Personal notes',state:state()});assert.equal(first.savedTotal,43200*5);
  await storage.price('nitto-217020',40000);
  const updated=await storage.save({id:first.id,name:'Offline quote',notes:'Still local',state:state()});assert.equal(updated.savedTotal,200000);
  const draft={name:'Unfinished',notes:'Remember the spare',state:state(),buildId:first.id,lastSavedTotal:updated.savedTotal};
  const initial=await storage.readDraft();
  const writes=await Promise.allSettled([storage.writeDraft(initial.revision,draft),storage.writeDraft(initial.revision,{...draft,name:'Stale tab'})]);
  assert.equal(writes.filter(r=>r.status==='fulfilled').length,1);assert.equal(writes.find(r=>r.status==='rejected').reason.status,409);
  const backup=await storage.backup();assert.equal(backup.builds[0].name,'Offline quote');assert.equal(backup.prices[0].priceCents,40000);
  await assert.rejects(storage.restore({...backup,builds:[{...backup.builds[0],state:{...state(),picks:{tires:'fake'}}}]}));
  assert.equal((await storage.list())[0].name,'Offline quote');
  const beforeDelete=await storage.readDraft();await storage.erase();assert.deepEqual(await storage.list(),[]);assert.equal((await storage.readDraft()).draft,null);
  await assert.rejects(storage.writeDraft(beforeDelete.revision,draft),e=>e.status===409);
  assert.equal((await storage.catalog()).find(p=>p.id==='nitto-217020').priceCents,43200);
  await storage.restore(backup);assert.equal((await storage.list())[0].id,first.id);assert.equal((await storage.catalog()).find(p=>p.id==='nitto-217020').priceCents,40000);
  await storage.remove(first.id);assert.equal((await storage.readDraft()).draft.buildId,null);
 }finally{globalThis.fetch=originalFetch;await storage.erase();await rm(output,{recursive:true,force:true});}
});
