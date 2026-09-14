import {Capacitor} from '@capacitor/core';
export const publicOrigin='https://jeep-build-lab.johnprodromidis1.chatgpt.site';
export const isNative=()=>Capacitor.isNativePlatform();
function appShareUrl(url:string){
 const parsed=new URL(url);
 if(parsed.protocol!=='https:'||parsed.origin!==publicOrigin||!parsed.hash.startsWith('#build='))throw new Error('Unsupported share link.');
 return parsed.toString();
}
function exportName(name:string){
 const clean=name.replace(/[/\\?%*:|"<>]/g,'-').replace(/[\u0000-\u001f\u007f]/g,'').replace(/-+/g,'-').trim().replace(/^[.\-\s]+|[.\-\s]+$/g,'').slice(0,96);
 return clean&&clean!=='.'&&clean!=='..'?clean:'jeep-build-export.txt';
}
export async function openExternal(url:string){
 const parsed=new URL(url);if(!['https:','mailto:'].includes(parsed.protocol))throw new Error('Unsupported link.');
 if(isNative()&&parsed.protocol==='https:'){const {Browser}=await import('@capacitor/browser');await Browser.open({url});}
 else if(parsed.protocol==='mailto:')window.location.href=url;
 else window.open(url,'_blank','noopener,noreferrer');
}
export async function shareLink(url:string){
 const shareUrl=appShareUrl(url);
 if(isNative()){const {Share}=await import('@capacitor/share');await Share.share({title:'My Jeep build plan',url:shareUrl});return;}
 await navigator.clipboard.writeText(shareUrl);
}
export async function exportFile(name:string,text:string,type:string){
 if(isNative()){
  const {Filesystem,Directory,Encoding}=await import('@capacitor/filesystem');
  const {Share}=await import('@capacitor/share');
  const path='build-lab-'+crypto.randomUUID()+'-'+exportName(name);
  const file=await Filesystem.writeFile({path,data:text,directory:Directory.Cache,encoding:Encoding.UTF8});
  try{await Share.share({title:name,files:[file.uri]});}
  finally{await Filesystem.deleteFile({path,directory:Directory.Cache}).catch(()=>{});}
  return;
 }
 const url=URL.createObjectURL(new Blob([text],{type}));const anchor=document.createElement('a');anchor.href=url;anchor.download=name;anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
