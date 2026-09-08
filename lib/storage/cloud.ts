import {StorageError,type BuildStorage} from './types';
async function request<T>(path:string,method='GET',body?:unknown):Promise<T>{
 const response=await fetch('/api/'+path,{method,headers:{'Content-Type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)})});
 const data=await response.json() as T&{error?:string};if(!response.ok)throw new StorageError(data.error??'This request could not be completed.',response.status);return data;
}
export const cloudStorage:BuildStorage={
 mode:'cloud',
 catalog:async()=>(await request<{parts:Awaited<ReturnType<BuildStorage['catalog']>>}>('catalog')).parts,
 list:async()=>(await request<{builds:Awaited<ReturnType<BuildStorage['list']>>}>('builds')).builds,
 save:input=>request('builds','POST',input),
 remove:async id=>{await request('builds?id='+encodeURIComponent(id),'DELETE');},
 price:async(partId,priceCents)=>(await request<{parts:Awaited<ReturnType<BuildStorage['catalog']>>}>('catalog'+(priceCents===null?'?partId='+encodeURIComponent(partId):''),priceCents===null?'DELETE':'PUT',priceCents===null?undefined:{partId,priceCents})).parts,
 readDraft:()=>request('draft'),
 writeDraft:(revision,draft)=>request('draft','PUT',{revision,draft}),
 backup:()=>request('data'),
 restore:async()=>{throw new StorageError('Restore backups in the device garage.',400);},
 erase:async()=>{await request('data','DELETE',{confirm:'DELETE MY APP DATA'});},
};
