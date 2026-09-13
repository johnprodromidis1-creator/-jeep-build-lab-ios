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
export function AppSettings({open,onOpenChange,storage,currentDraft,pauseDraft,resumeDraft}:{open:boolean;onOpenChange:(value:boolean)=>void;storage:BuildStorage;currentDraft:Draft;pauseDraft:()=>Promise<void>;resumeDraft:()=>void}){
 const [tab,setTab]=useState('data'),[busy,setBusy]=useState(false),[erase,setErase]=useState(false),[restore,setRestore]=useState<Backup|null>(null);
 const file=useRef<HTMLInputElement>(null);
 async function backup(){setBusy(true);try{await pauseDraft();const data={...await storage.backup(),draft:currentDraft};await exportFile('jeep-build-backup.json',JSON.stringify(data,null,2),'application/json');}catch(e){toast.error(e instanceof Error?e.message:'Backup could not be exported.');}finally{resumeDraft();setBusy(false);}}
 async function chooseBackup(selected:File|undefined){if(!selected)return;setBusy(true);try{if(selected.size>2000000)throw new Error('This file is too large to be a build backup.');const parsed=backupSchema.safeParse(JSON.parse(await selected.text()));if(!parsed.success)throw new Error('This backup is invalid or contains unsupported parts. Your current data is unchanged.');setRestore(parsed.data);}catch(e){toast.error(e instanceof Error?e.message:'Could not read the backup.');}finally{setBusy(false);if(file.current)file.current.value='';}}
 async function replaceData(){setBusy(true);try{await pauseDraft();if(restore)await storage.restore(restore);else await storage.erase();
  // A shared build must not override the restored garage or reappear after erasure.
  window.history.replaceState(null,'',window.location.pathname+window.location.search);
  window.location.reload();
 }catch(e){resumeDraft();toast.error(e instanceof Error?e.message:'Your app data could not be updated.');setBusy(false);setErase(false);setRestore(null);}}
 return <><Dialog open={open} onOpenChange={v=>!busy&&onOpenChange(v)}><DialogContent className="settings-dialog"><DialogHeader><DialogTitle>Settings & help</DialogTitle><DialogDescription>{storage.mode==='device'?'Your garage is saved on this device.':'Your cloud garage is private to your signed-in account.'} App 0.2.0</DialogDescription></DialogHeader>
 <Tabs value={tab} onValueChange={setTab}><TabsList className="settings-tabs"><TabsTrigger value="data">Your data</TabsTrigger><TabsTrigger value="privacy">Privacy</TabsTrigger><TabsTrigger value="support">Help</TabsTrigger></TabsList></Tabs>
 {tab==='privacy'?<PrivacyContent/>:tab==='support'?<SupportContent/>:<div className="settings-data">
 <h3>Back up your garage</h3><p>A backup includes your builds, notes, current saved draft and personal price quotes. Keep it somewhere private. Exported files are not deleted when you erase app data.</p><Button disabled={busy} onClick={backup}>{busy?'Please wait…':'Export backup'}</Button>
 {storage.mode==='device'&&<><input ref={file} type="file" accept=".json,application/json" className="sr-only" aria-label="Choose a build backup" onChange={e=>void chooseBackup(e.target.files?.[0])}/><Button variant="outline" disabled={busy} onClick={()=>file.current?.click()}>Restore from backup</Button><p>Restore replaces this device’s garage. Export it first if you want to keep both.</p></>}
 {!isNative()&&storage.mode==='device'&&<><h3>Optional cloud garage</h3><p>You can use the builder without signing in. Cloud and device garages are separate. Export a backup to keep a copy of your device builds.</p><a className="settings-auth" href="/signin-with-chatgpt?return_to=%2F" target="_top">Sign in with ChatGPT</a></>}
 {!isNative()&&storage.mode==='cloud'&&<a className="settings-auth" href="/signout-with-chatgpt?return_to=%2F" target="_top">Sign out</a>}
 <h3>Delete app data</h3><p>Remove all builds, drafts and price notes from this {storage.mode==='device'?'device garage':'cloud garage'}. {storage.mode==='cloud'?'This does not delete your ChatGPT account.':''}</p><Button variant="destructive" disabled={busy} onClick={()=>setErase(true)}>Delete app data</Button>
 </div>}</DialogContent></Dialog>
 <AlertDialog open={erase||!!restore} onOpenChange={v=>{if(!busy&&!v){setErase(false);setRestore(null);}}}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{restore?'Replace this device’s garage?':'Delete all app data?'}</AlertDialogTitle><AlertDialogDescription>{restore?`Restore ${restore.builds.length} saved builds, price notes and the backed-up draft. This replaces the current device garage, including unsaved changes.`:'This permanently removes your builds, draft and price notes from the selected garage. Exported backups are not affected.'}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel><AlertDialogAction disabled={busy} onClick={e=>{e.preventDefault();void replaceData();}}>{busy?'Please wait…':restore?'Replace and restore':'Delete app data'}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
 </>;
}
