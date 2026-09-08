import {saveSchema,totalFor} from "@/lib/model";
import {db,owner,sameOrigin,json,catalogFor} from "@/lib/server";
export async function GET(request:Request){const id=owner(request);if(!id)return json({error:"Sign in to open your garage."},401);try{
 const rows=await db().prepare("SELECT id,name,notes,state,saved_total,updated_at FROM builds WHERE owner_id = ? ORDER BY updated_at DESC LIMIT 100").bind(id).all<{id:string;name:string;notes:string;state:string;saved_total:number;updated_at:string}>();
 return json({builds:rows.results.map(r=>({id:r.id,name:r.name,notes:r.notes,state:JSON.parse(r.state),savedTotal:r.saved_total,updatedAt:r.updated_at}))});
 }catch{return json({error:"Your garage could not be loaded. Try again."},503);}}
export async function POST(request:Request){const userId=owner(request);if(!userId)return json({error:"Sign in to save your build."},401);if(!sameOrigin(request))return json({error:"Invalid origin."},403);
 try{const parsed=saveSchema.safeParse(await request.json());if(!parsed.success)return json({error:"Please check your build details."},400);
 const b=parsed.data,now=new Date().toISOString(),total=totalFor(b.state,await catalogFor(userId)).total;
 if(b.id){const result=await db().prepare("UPDATE builds SET name=?,notes=?,state=?,saved_total=?,updated_at=? WHERE id=? AND owner_id=?").bind(b.name,b.notes,JSON.stringify(b.state),total,now,b.id,userId).run();if(!result.meta.changes)return json({error:"Build not found in your garage."},404);}
 else{const count=await db().prepare("SELECT COUNT(*) AS n FROM builds WHERE owner_id=?").bind(userId).first<{n:number}>();if((count?.n??0)>=100)return json({error:"Garage limit reached. Remove an old build first."},400);b.id=crypto.randomUUID();await db().prepare("INSERT INTO builds (id,owner_id,name,notes,state,saved_total,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)").bind(b.id,userId,b.name,b.notes,JSON.stringify(b.state),total,now,now).run();}
 return json({id:b.id,updatedAt:now,savedTotal:total});
 }catch{return json({error:"Build could not be saved. Your current selections are still here."},500);}}
export async function DELETE(request:Request){const userId=owner(request);if(!userId)return json({error:"Sign in first."},401);if(!sameOrigin(request))return json({error:"Invalid origin."},403);const id=new URL(request.url).searchParams.get("id");if(!id)return json({error:"Choose a build."},400);try{await db().prepare("DELETE FROM builds WHERE id=? AND owner_id=?").bind(id,userId).run();return json({ok:true});}catch{return json({error:"Could not delete build."},500);}}
