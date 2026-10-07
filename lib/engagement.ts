import {baseCatalog,type Part} from './model';
import {isNative} from './platform';

const preferenceKey='jeep-build-lab:part-spotlights:v1';
const scheduledUntilKey='jeep-build-lab:part-spotlights-until:v1';
const notificationIds=Array.from({length:18},(_,index)=>7300+index);
const threeDays=3*24*60*60*1000;
const categoryLabels:Record<string,string>={wheels:'rim',tires:'tire',lift:'suspension part',bumpers:'bumper',winches:'winch',armor:'armor part'};

export function partSpotlightsEnabled(){
 try{return localStorage.getItem(preferenceKey)==='enabled';}catch{return false;}
}

function spotlightParts(parts:Part[]){
 const categoryOrder=['wheels','tires','lift','bumpers','winches','armor'];
 return categoryOrder.flatMap(category=>parts.find(part=>part.category===category)??[]);
}

export async function setPartSpotlights(enabled:boolean,parts:Part[]=baseCatalog){
 if(!isNative())throw new Error('Part spotlights are available in the iPhone and iPad app.');
 const {LocalNotifications}=await import('@capacitor/local-notifications');
 await LocalNotifications.cancel({notifications:notificationIds.map(id=>({id}))});
 if(!enabled){localStorage.removeItem(preferenceKey);localStorage.removeItem(scheduledUntilKey);return false;}
 const permission=await LocalNotifications.checkPermissions();
 const result=permission.display==='prompt'||permission.display==='prompt-with-rationale'?await LocalNotifications.requestPermissions():permission;
 if(result.display!=='granted')throw new Error('Notifications are off. Enable them in iOS Settings to receive part spotlights.');
 const picks=spotlightParts(parts);
 if(!picks.length)throw new Error('No spotlight parts are available.');
 const now=Date.now();
 await LocalNotifications.schedule({notifications:notificationIds.map((id,index)=>{
  const part=picks[index%picks.length];
  return {id,title:`${part.brand} ${part.name}`,body:`See how this ${categoryLabels[part.category]??'part'} fits your current Jeep plan.`,schedule:{at:new Date(now+(index+1)*threeDays)},extra:{partId:part.id}};
 })});
 localStorage.setItem(preferenceKey,'enabled');
 localStorage.setItem(scheduledUntilKey,String(now+notificationIds.length*threeDays));
 return true;
}

let listening=false;
export async function listenForPartSpotlights(onPart:(partId:string)=>void){
 if(!isNative()||listening)return;
 listening=true;
 const {LocalNotifications}=await import('@capacitor/local-notifications');
 await LocalNotifications.addListener('localNotificationActionPerformed',event=>{
  const partId=event.notification.extra?.partId;
  if(typeof partId==='string')onPart(partId);
 });
}

export async function refreshPartSpotlights(parts:Part[]=baseCatalog){
 if(!partSpotlightsEnabled())return;
 const scheduledUntil=Number(localStorage.getItem(scheduledUntilKey)??0);
 if(scheduledUntil-Date.now()<=2*threeDays)await setPartSpotlights(true,parts);
}
