import {isNative} from './platform';

let started=false;
const viteEnv=(import.meta as ImportMeta&{env?:Record<string,string|undefined>}).env;
export const productionBannerAdId=viteEnv?.VITE_ADMOB_IOS_BANNER_ID?.trim()??'';
export const adsConfigured=()=>Boolean(productionBannerAdId);

export async function startAdBanner(){
 if(!isNative()||!adsConfigured()||started)return false;
 const {AdMob,AdmobConsentStatus,BannerAdPosition,BannerAdSize}=await import('@capacitor-community/admob');
 await AdMob.initialize();
 let consent=await AdMob.requestConsentInfo();
 if(consent.status===AdmobConsentStatus.REQUIRED&&consent.isConsentFormAvailable)consent=await AdMob.showConsentForm();
 if(!consent.canRequestAds)return false;
 await AdMob.showBanner({adId:productionBannerAdId,adSize:BannerAdSize.ADAPTIVE_BANNER,position:BannerAdPosition.BOTTOM_CENTER,margin:0,npa:true,isTesting:false});
 started=true;
 return true;
}
