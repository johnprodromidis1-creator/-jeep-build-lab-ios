import assert from 'node:assert/strict';
import test from 'node:test';
import 'fake-indexeddb/auto';
import {build} from 'esbuild';
import {mkdir,rm} from 'node:fs/promises';
const output=new URL('../.sites-runtime/device-tests/',import.meta.url).pathname;
await mkdir(output,{recursive:true});
await build({entryPoints:[new URL('../lib/storage/device.ts',import.meta.url).pathname],outfile:output+'device.mjs',bundle:true,platform:'node',format:'esm'});
await build({entryPoints:[new URL('../lib/model.ts',import.meta.url).pathname],outfile:output+'model.mjs',bundle:true,platform:'node',format:'esm'});
const {deviceStorage:storage}=await import(output+'device.mjs');
const {initialState}=await import(output+'model.mjs');
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
