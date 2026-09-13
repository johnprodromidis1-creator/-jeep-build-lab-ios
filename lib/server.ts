import {env} from "cloudflare:workers";
import {baseCatalog, type Part} from "./model";
export function db(){if(!env.DB)throw new Error("Database unavailable");return env.DB;}
export function owner(request:Request){return request.headers.get("oai-authenticated-user-id");}
export function sameOrigin(request:Request){const origin=request.headers.get("origin");return !origin||origin===new URL(request.url).origin;}
export function json(data:unknown,status=200){return Response.json(data,{status,headers:{"Cache-Control":"private, no-store"}});}
export async function catalogFor(id:string):Promise<Part[]>{
 const result=await db().prepare("SELECT part_id, price_cents, updated_at FROM price_notes WHERE owner_id = ?").bind(id).all<{part_id:string;price_cents:number;updated_at:string}>();
 const overrides=new Map(result.results.map(p=>[p.part_id,p]));
 return baseCatalog.map(p=>{const v=overrides.get(p.id);return v?{...p,priceCents:v.price_cents,checkedAt:v.updated_at.slice(0,10),customPrice:true}:p;});
}
