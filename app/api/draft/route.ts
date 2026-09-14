import {z} from 'zod';
import {stateSchema} from '@/lib/model';
import {db,owner,sameOrigin,json} from '@/lib/server';
const draftPayloadSchema=z.object({name:z.string().max(80),notes:z.string().max(1500),state:stateSchema,buildId:z.string().uuid().nullable(),lastSavedTotal:z.number().int().min(0).nullable()}).strict();
const draftSchema=z.object({revision:z.number().int().min(0).max(Number.MAX_SAFE_INTEGER-1),draft:draftPayloadSchema}).strict();
export async function GET(request:Request){
 const user=owner(request);if(!user)return json({error:'Sign in to recover your draft.'},401);
 try{const row=await db().prepare('SELECT payload,revision,updated_at FROM build_drafts WHERE owner_id=?').bind(user).first<{payload:string;revision:number;updated_at:string}>();return json(row?{draft:draftPayloadSchema.parse(JSON.parse(row.payload)),revision:row.revision,updatedAt:row.updated_at}:{draft:null,revision:0});}
 catch{return json({error:'Draft recovery is unavailable. You can still save a named build.'},503);}
}
export async function PUT(request:Request){
 const user=owner(request);if(!user)return json({error:'Sign in to protect your draft.'},401);
 if(!sameOrigin(request))return json({error:'Invalid origin.'},403);
 let body:unknown;try{body=await request.json();}catch{return json({error:'Request body must be valid JSON.'},400);}
 try{
  const parsed=draftSchema.safeParse(body);if(!parsed.success)return json({error:'Draft contains unsupported data.'},400);
  const {draft,revision}=parsed.data,updatedAt=new Date().toISOString(),payload=JSON.stringify(draft);
  const result=revision===0
   ?await db().prepare('INSERT INTO build_drafts (owner_id,payload,revision,updated_at) VALUES (?,?,1,?) ON CONFLICT(owner_id) DO NOTHING').bind(user,payload,updatedAt).run()
   :await db().prepare('UPDATE build_drafts SET payload=?,revision=revision+1,updated_at=? WHERE owner_id=? AND revision=?').bind(payload,updatedAt,user,revision).run();
  if(!result.meta.changes)return json({error:'This draft changed in another tab or device. Save your current plan as a copy before reloading.'},409);
  return json({revision:revision+1,updatedAt});
 }catch{return json({error:'Draft could not be protected. Save a named build or retry.'},503);}
}
