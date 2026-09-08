import {db,owner,sameOrigin,json} from '@/lib/server';
import {backupSchema} from '@/lib/storage/types';
export async function GET(request:Request){
 const user=owner(request);if(!user)return json({error:'Sign in to export your cloud garage.'},401);
 try{
  const [builds,prices,draft]=await Promise.all([
   db().prepare('SELECT id,name,notes,state,saved_total,updated_at FROM builds WHERE owner_id=?').bind(user).all<{id:string;name:string;notes:string;state:string;saved_total:number;updated_at:string}>(),
   db().prepare('SELECT part_id,price_cents,updated_at FROM price_notes WHERE owner_id=?').bind(user).all<{part_id:string;price_cents:number;updated_at:string}>(),
   db().prepare('SELECT payload FROM build_drafts WHERE owner_id=?').bind(user).first<{payload:string}>()
  ]);
  return json(backupSchema.parse({format:'jeep-build-lab',version:1,exportedAt:new Date().toISOString(),builds:builds.results.map(b=>({id:b.id,name:b.name,notes:b.notes,state:JSON.parse(b.state),savedTotal:b.saved_total,updatedAt:b.updated_at})),prices:prices.results.map(p=>({partId:p.part_id,priceCents:p.price_cents,updatedAt:p.updated_at})),draft:draft?JSON.parse(draft.payload):null}));
 }catch{return json({error:'Your data could not be exported. Try again.'},503);}
}
export async function DELETE(request:Request){
 const user=owner(request);if(!user)return json({error:'Sign in to delete your cloud garage.'},401);
 if(!sameOrigin(request))return json({error:'Invalid origin.'},403);
 try{
  const body=await request.json() as {confirm?:string};if(body.confirm!=='DELETE MY APP DATA')return json({error:'Confirm deletion in Settings.'},400);
  await db().batch(['builds','price_notes','build_drafts'].map(table=>db().prepare(`DELETE FROM ${table} WHERE owner_id=?`).bind(user)));
  return json({ok:true});
 }catch{return json({error:'Your app data could not be deleted. Try again.'},503);}
}
