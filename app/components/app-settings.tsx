'use client';
import {useRef,useState} from 'react';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {AlertDialog,AlertDialogContent,AlertDialogHeader,AlertDialogTitle,AlertDialogDescription,AlertDialogFooter,AlertDialogCancel,AlertDialogAction} from '@/components/ui/alert-dialog';
import {Button} from '@/components/ui/button';
import {Tabs,TabsList,TabsTrigger} from '@/components/ui/tabs';
import {backupSchema,type Backup,type BuildStorage,type Draft} from '@/lib/storage/types';
import {exportFile,isNative} from '@/lib/platform';
import {PrivacyContent,SupportContent} from './privacy-content';
import {toast} from 'sonner';
import {adsConfigured} from '@/lib/ads';
import {partSpotlightsEnabled,setPartSpotlights} from '@/lib/engagement';
export function AppSettings({open,onOpenChange,storage,currentDraft,pauseDraft,resumeDraft}:{open:boolean;onOpenChange:(value:boolean)=>void;storage:BuildStorage;currentDraft:Draft;pauseDraft:()=>Promise<void>;resumeDraft:()=>void}){
 const [tab,setTab]=useState('data'),[busy,setBusy]=useState(false),[erase,setErase]=useState(false),[restore,setRestore]=useState<Backup|null>(null),[spotlights,setSpotlights]=useState(()=>partSpotlightsEnabled());
 const file=useRef<HTMLInputElement>(null);
 const confirmOpen=erase||!!restore;
 async function backup(){setBusy(true);try{await pauseDraft();const data={...await storage.backup(),draft:currentDraft};await exportFile('jeep-build-backup.json',JSON.stringify(data,null,2),'application/json');}catch(e){toast.error(e instanceof Error?e.message:'Backup could not be exported.');}finally{resumeDraft();setBusy(false);}}
 async function chooseBackup(selected:File|undefined){if(!selected)return;setBusy(true);try{if(selected.size>2000000)throw new Error('This file is too large to be a build backup.');const parsed=backupSchema.safeParse(JSON.parse(await selected.text()));if(!parsed.success)throw new Error('This backup is invalid or contains unsupported parts. Your current data is unchanged.');setRestore(parsed.data);}catch(e){toast.error(e instanceof Error?e.message:'Could not read the backup.');}finally{setBusy(false);if(file.current)file.current.value='';}}
 async function replaceData(){setBusy(true);try{await pauseDraft();if(restore)await storage.restore(restore);else await storage.erase();
  // A shared build must not override the restored garage or reappear after erasure.
  window.history.replaceState(null,'',window.location.pathname+window.location.search);
  window.location.reload();
 }catch(e){resumeDraft();toast.error(e instanceof Error?e.message:'Your app data could not be updated.');setBusy(false);setErase(false);setRestore(null);}}
 async function changeSpotlights(enabled:boolean){setBusy(true);try{setSpotlights(await setPartSpotlights(enabled));toast.success(enabled?'Part spotlights scheduled every three days.':'Part spotlights turned off.');}catch(e){setSpotlights(partSpotlightsEnabled());toast.error(e instanceof Error?e.message:'Notification settings could not be updated.');}finally{setBusy(false);}}
 return <><Dialog open={open} onOpenChange={v=>!busy&&onOpenChange(v)}><DialogContent className="settings-dialog"><DialogHeader><DialogTitle>Settings & help</DialogTitle><DialogDescription>{storage.mode==='device'?'Your garage is saved on this device.':'Your cloud garage is private to your signed-in account.'} App 0.2.0</DialogDescription></DialogHeader>
 <Tabs value={tab} onValueChange={setTab}><TabsList className="settings-tabs"><TabsTrigger value="data">Your data</TabsTrigger>{isNative()&&<TabsTrigger value="updates">Updates</TabsTrigger>}<TabsTrigger value="privacy">Privacy</TabsTrigger><TabsTrigger value="support">Help</TabsTrigger></TabsList></Tabs>
 {tab==='privacy'?<PrivacyContent/>:tab==='support'?<SupportContent/>:tab==='updates'?<div className="settings-data engagement-settings"><h3>Part spotlights</h3><p>Get one local notification every three days featuring a sourced rim, tire, suspension or trail part to review against your current build. No account or notification server is used.</p><label><span><strong>Spotlight notifications</strong><small>{spotlights?'About two months of upcoming spotlights are scheduled on this device.':'Off until you choose to enable them.'}</small></span><input type="checkbox" checked={spotlights} disabled={busy} onChange={event=>void changeSpotlights(event.target.checked)}/></label><h3>Advertising</h3><p>{adsConfigured()?'A non-personalized banner may appear at the bottom of the native app after Google consent allows ads.':'Ads are prepared but inactive until the production AdMob app and banner IDs are configured.'} Ads never replace builder controls or open automatically.</p></div>:<div className="settings-data">
 <h3>Back up your garage</h3><p>A backup includes your builds, notes, current saved draft and personal price quotes. Keep it somewhere private. Exported files are not deleted when you erase app data.</p><Button disabled={busy} onClick={backup}>{busy?'Please wait…':'Export backup'}</Button>
 {storage.mode==='device'&&<><input ref={file} type="file" accept=".json,application/json" className="sr-only" aria-label="Choose a build backup" onChange={e=>void chooseBackup(e.target.files?.[0])}/><Button variant="outline" disabled={busy} onClick={()=>file.current?.click()}>Restore from backup</Button><p>Restore replaces this device’s garage. Export it first if you want to keep both.</p></>}
 {!isNative()&&storage.mode==='device'&&<><h3>Optional cloud garage</h3><p>You can use the builder without signing in. Cloud and device garages are separate. Export a backup to keep a copy of your device builds.</p><a className="settings-auth" href="/signin-with-chatgpt?return_to=%2F" target="_top">Sign in with ChatGPT</a></>}
 {!isNative()&&storage.mode==='cloud'&&<a className="settings-auth" href="/signout-with-chatgpt?return_to=%2F" target="_top">Sign out</a>}
 <h3>Delete app data</h3><p>Remove all builds, drafts and price notes from this {storage.mode==='device'?'device garage':'cloud garage'}. {storage.mode==='cloud'?'This does not delete your ChatGPT account.':''}</p><Button variant="destructive" disabled={busy} onClick={()=>setErase(true)}>Delete app data</Button>
 </div>}</DialogContent></Dialog>
 {confirmOpen&&<AlertDialog open onOpenChange={v=>{if(!busy&&!v){setErase(false);setRestore(null);}}}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{restore?'Replace this device’s garage?':'Delete all app data?'}</AlertDialogTitle><AlertDialogDescription>{restore?`Restore ${restore.builds.length} saved builds, price notes and the backed-up draft. This replaces the current device garage, including unsaved changes.`:'This permanently removes your builds, draft and price notes from the selected garage. Exported backups are not affected.'}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel><AlertDialogAction disabled={busy} onClick={e=>{e.preventDefault();void replaceData();}}>{busy?'Please wait…':restore?'Replace and restore':'Delete app data'}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>}
 </>;
}
