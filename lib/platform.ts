import {Capacitor} from '@capacitor/core';
export const publicOrigin='https://jeep-build-lab.johnprodromidis1.chatgpt.site';
export const isNative=()=>Capacitor.isNativePlatform();
export async function openExternal(url:string){
 const parsed=new URL(url);if(!['https:','mailto:'].includes(parsed.protocol))throw new Error('Unsupported link.');
 if(isNative()&&parsed.protocol==='https:'){const {Browser}=await import('@capacitor/browser');await Browser.open({url});}
 else if(parsed.protocol==='mailto:')window.location.href=url;
 else window.open(url,'_blank','noopener,noreferrer');
}
export async function shareLink(url:string){
 if(isNative()){const {Share}=await import('@capacitor/share');await Share.share({title:'My Jeep build plan',url});return;}
 await navigator.clipboard.writeText(url);
}
export async function exportFile(name:string,text:string,type:string){
 if(isNative()){
  const {Filesystem,Directory,Encoding}=await import('@capacitor/filesystem');
  const {Share}=await import('@capacitor/share');
  const path='build-lab-'+crypto.randomUUID()+'-'+name;
  const file=await Filesystem.writeFile({path,data:text,directory:Directory.Cache,encoding:Encoding.UTF8});
  try{await Share.share({title:name,files:[file.uri]});}
  finally{await Filesystem.deleteFile({path,directory:Directory.Cache}).catch(()=>{});}
  return;
 }
 const url=URL.createObjectURL(new Blob([text],{type}));const anchor=document.createElement('a');anchor.href=url;anchor.download=name;anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
