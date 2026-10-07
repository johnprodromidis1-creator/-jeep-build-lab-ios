import {isNative} from './platform';
import {personalizedAdsAllowed} from './ad-privacy';

let started=false;
const personalizationKey='jeep-build-lab:personalized-ads:v1';
const viteEnv=(import.meta as ImportMeta&{env?:Record<string,string|undefined>}).env;
export const productionBannerAdId=viteEnv?.VITE_ADMOB_IOS_BANNER_ID?.trim()??'';
export const adsConfigured=()=>Boolean(productionBannerAdId)&&viteEnv?.VITE_ADMOB_RELEASE_ENABLED==='true';
export function personalizedAdsEnabled(){try{return localStorage.getItem(personalizationKey)==='enabled';}catch{return false;}}

export async function setPersonalizedAds(enabled:boolean){
 if(enabled)localStorage.setItem(personalizationKey,'enabled');else localStorage.removeItem(personalizationKey);
 if(!isNative()||!adsConfigured())return;
 const {AdMob,AdmobConsentStatus}=await import('@capacitor-community/admob');
 try{
  if(enabled){
   await AdMob.initialize();
   let consent=await AdMob.requestConsentInfo();
   if(consent.status===AdmobConsentStatus.REQUIRED&&consent.isConsentFormAvailable)consent=await AdMob.showConsentForm();
   if(consent.canRequestAds){
    const tracking=await AdMob.trackingAuthorizationStatus();
    if(tracking.status==='notDetermined')await AdMob.requestTrackingAuthorization();
   }
  }
  if(started)await AdMob.removeBanner();
  started=false;
  await startAdBanner();
 }catch(error){
  if(enabled)localStorage.removeItem(personalizationKey);
  throw error;
 }
}

export async function startAdBanner(){
 if(!isNative()||!adsConfigured()||started)return false;
 const {AdMob,AdmobConsentStatus,BannerAdPosition,BannerAdSize}=await import('@capacitor-community/admob');
 try{
  await AdMob.initialize();
  let consent=await AdMob.requestConsentInfo();
  if(consent.status===AdmobConsentStatus.REQUIRED&&consent.isConsentFormAvailable)consent=await AdMob.showConsentForm();
  if(!consent.canRequestAds)return false;
  const tracking=await AdMob.trackingAuthorizationStatus();
  const personalized=personalizedAdsAllowed(consent.status,tracking.status,personalizedAdsEnabled());
  await AdMob.showBanner({adId:productionBannerAdId,adSize:BannerAdSize.ADAPTIVE_BANNER,position:BannerAdPosition.BOTTOM_CENTER,margin:0,npa:!personalized,isTesting:false});
  started=true;
  return true;
 }catch{return false;}
}
