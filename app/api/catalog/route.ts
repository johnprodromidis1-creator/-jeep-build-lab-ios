import {z} from "zod";
import {baseCatalog} from "@/lib/model";
import {db,owner,sameOrigin,json,catalogFor} from "@/lib/server";
export async function GET(request:Request){const id=owner(request);if(!id)return json({parts:baseCatalog});try{return json({parts:await catalogFor(id)});}catch{return json({error:"Could not load saved prices. Showing source prices."},503);}}
export async function PUT(request:Request){const id=owner(request);if(!id)return json({error:"Sign in first."},401);if(!sameOrigin(request))return json({error:"Invalid origin."},403);try{
 let body:unknown;try{body=await request.json();}catch{return json({error:"Request body must be valid JSON."},400);}
 const parsed=z.object({partId:z.string().max(100),priceCents:z.number().int().min(0).max(10000000)}).strict().safeParse(body);
 if(!parsed.success||!baseCatalog.some(p=>p.id===parsed.data.partId))return json({error:"Enter a valid product and price."},400);
 const p=parsed.data; await db().prepare("INSERT INTO price_notes (owner_id,part_id,price_cents,updated_at) VALUES (?,?,?,?) ON CONFLICT(owner_id,part_id) DO UPDATE SET price_cents=excluded.price_cents,updated_at=excluded.updated_at").bind(id,p.partId,p.priceCents,new Date().toISOString()).run();
 return json({parts:await catalogFor(id)});
 }catch{return json({error:"Price could not be saved. Try again."},500);}}
export async function DELETE(request:Request){const id=owner(request);if(!id)return json({error:"Sign in first."},401);if(!sameOrigin(request))return json({error:"Invalid origin."},403);const partId=new URL(request.url).searchParams.get("partId");if(!partId)return json({error:"Choose a part."},400);try{await db().prepare("DELETE FROM price_notes WHERE owner_id = ? AND part_id = ?").bind(id,partId).run();return json({parts:await catalogFor(id)});}catch{return json({error:"Price could not be reset."},500);}}
