import {baseCatalog,saveSchema,totalFor} from '../model';
import {backupSchema,draftSchema,applyPrices,StorageError,type BuildStorage,type Backup,type Draft,type PriceNote} from './types';
type DeviceData={builds:Backup['builds'];prices:PriceNote[];draft:Draft|null;revision:number};
const empty=():DeviceData=>({builds:[],prices:[],draft:null,revision:0});
let opened:Promise<IDBDatabase>|undefined;
function database(){
 if(!opened)opened=new Promise<IDBDatabase>((resolve,reject)=>{
  if(typeof indexedDB==='undefined'){reject(new StorageError('Device storage is unavailable. Use a regular browser window with storage enabled.'));return;}
  const request=indexedDB.open('jeep-build-lab-device',1);
  const timer=setTimeout(()=>reject(new StorageError('Device storage is busy. Close other app tabs and try again.')),8000);
  request.onupgradeneeded=()=>request.result.createObjectStore('garage');
  request.onerror=()=>{clearTimeout(timer);reject(new StorageError('Could not open device storage. Your existing data has not been replaced.'));};
  request.onblocked=()=>{clearTimeout(timer);reject(new StorageError('Close other tabs of this app, then try again.'));};
  request.onsuccess=()=>{clearTimeout(timer);const db=request.result;db.onversionchange=()=>{db.close();opened=undefined;};resolve(db);};
 }).catch(e=>{opened=undefined;throw e;});
 return opened;
}
async function transaction<T>(write:boolean,operation:(data:DeviceData)=>T,replaceExisting=false):Promise<T>{
 const db=await database();return new Promise<T>((resolve,reject)=>{
  const tx=db.transaction('garage',write?'readwrite':'readonly'),store=tx.objectStore('garage'),request=store.get('current');let value:T,failure:unknown;
  request.onsuccess=()=>{try{
   const data:DeviceData=replaceExisting?{...empty(),revision:Number.isSafeInteger(request.result?.revision)?request.result.revision:0}:request.result??empty();
   const valid=backupSchema.parse({format:'jeep-build-lab',version:1,exportedAt:new Date().toISOString(),builds:data.builds,prices:data.prices,draft:data.draft});
   data.builds=valid.builds;data.prices=valid.prices;data.draft=valid.draft;
   if(!Number.isSafeInteger(data.revision)||data.revision<0)throw new Error('Invalid revision.');
   value=operation(data);if(write)store.put(data,'current');
  }catch(e){failure=e;tx.abort();}};
  tx.oncomplete=()=>resolve(value);
  tx.onerror=()=>{failure??=new StorageError('Device storage could not be updated. Check free space and retry.');};
  tx.onabort=()=>reject(failure instanceof StorageError?failure:new StorageError('Device data could not be read or saved. It has not been replaced.'));
 });
}
export const deviceStorage:BuildStorage={
 mode:'device',
 catalog:()=>transaction(false,data=>applyPrices(data.prices)),
 list:()=>transaction(false,data=>data.builds.slice().sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt))),
 save:input=>transaction(true,data=>{const b=saveSchema.parse(input);const existing=b.id?data.builds.find(v=>v.id===b.id):undefined;
  if(b.id&&!existing)throw new StorageError('This build is no longer saved. Save it as a copy.',404);
  if(!b.id&&data.builds.length>=100)throw new StorageError('Garage limit reached. Remove an old build first.',400);
  const id=b.id??crypto.randomUUID(),savedTotal=totalFor(b.state,applyPrices(data.prices)).total;
  const saved={id,name:b.name,notes:b.notes,state:b.state,updatedAt:new Date().toISOString(),savedTotal};
  data.builds=existing?data.builds.map(v=>v.id===id?saved:v):[...data.builds,saved];return {id,savedTotal};}),
 remove:id=>transaction(true,data=>{data.builds=data.builds.filter(b=>b.id!==id);if(data.draft?.buildId===id)data.draft.buildId=null;}),
 price:(partId,priceCents)=>transaction(true,data=>{if(!baseCatalog.some(p=>p.id===partId)||(priceCents!==null&&(!Number.isInteger(priceCents)||priceCents<0||priceCents>10000000)))throw new StorageError('Invalid product or price.',400);
  data.prices=data.prices.filter(p=>p.partId!==partId);if(priceCents!==null)data.prices.push({partId,priceCents,updatedAt:new Date().toISOString()});return applyPrices(data.prices);}),
 readDraft:()=>transaction(false,data=>({draft:data.draft,revision:data.revision})),
 writeDraft:(revision,draft)=>transaction(true,data=>{if(revision!==data.revision)throw new StorageError('This draft changed in another tab. Save your plan as a copy before reloading.',409);data.draft=draftSchema.parse(draft);data.revision++;return {draft:data.draft,revision:data.revision};}),
 backup:()=>transaction(false,data=>({format:'jeep-build-lab',version:1,exportedAt:new Date().toISOString(),builds:data.builds,prices:data.prices,draft:data.draft})),
 restore:backup=>transaction(true,data=>{const valid=backupSchema.parse(backup);data.builds=valid.builds;data.prices=valid.prices;data.draft=valid.draft;data.revision++;},true),
 erase:()=>transaction(true,data=>{data.builds=[];data.prices=[];data.draft=null;data.revision++;},true),
};
