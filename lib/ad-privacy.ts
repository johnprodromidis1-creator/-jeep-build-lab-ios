export function personalizedAdsAllowed(consentStatus:string,trackingStatus:string,enabled:boolean){
 return enabled&&(consentStatus==='OBTAINED'||consentStatus==='NOT_REQUIRED')&&trackingStatus==='authorized';
}
