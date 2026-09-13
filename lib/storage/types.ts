import {z} from 'zod';
import {stateSchema,baseCatalog,type Part,type SavedBuild} from '../model';
export const draftSchema=z.object({name:z.string().max(80),notes:z.string().max(1500),state:stateSchema,buildId:z.string().uuid().nullable(),lastSavedTotal:z.number().int().min(0).nullable()}).strict();
export type Draft=z.infer<typeof draftSchema>;
const priceSchema=z.object({partId:z.string().refine(id=>baseCatalog.some(p=>p.id===id)),priceCents:z.number().int().min(0).max(10000000),updatedAt:z.string().datetime()}).strict();
export type PriceNote=z.infer<typeof priceSchema>;
const buildSchema=z.object({id:z.string().uuid(),name:z.string().trim().min(1).max(80),notes:z.string().max(1500),state:stateSchema,updatedAt:z.string().datetime(),savedTotal:z.number().int().min(0)}).strict();
export const backupSchema=z.object({format:z.literal('jeep-build-lab'),version:z.literal(1),exportedAt:z.string().datetime(),builds:z.array(buildSchema).max(100),prices:z.array(priceSchema).max(baseCatalog.length),draft:draftSchema.nullable()}).strict().superRefine((backup,ctx)=>{
 if(new Set(backup.builds.map(b=>b.id)).size!==backup.builds.length||new Set(backup.prices.map(p=>p.partId)).size!==backup.prices.length)ctx.addIssue({code:z.ZodIssueCode.custom,message:'Duplicate records in backup.'});
});
export type Backup=z.infer<typeof backupSchema>;
export type DraftSnapshot={draft:Draft|null;revision:number};
export type SaveInput={id?:string;name:string;notes:string;state:Draft['state']};
export class StorageError extends Error {constructor(message:string,public status=500){super(message);this.name='StorageError';}}
export interface BuildStorage {
 mode:'device'|'cloud';
 catalog():Promise<Part[]>;
 list():Promise<SavedBuild[]>;
 save(input:SaveInput):Promise<{id:string;savedTotal:number}>;
 remove(id:string):Promise<void>;
 price(partId:string,priceCents:number|null):Promise<Part[]>;
 readDraft():Promise<DraftSnapshot>;
 writeDraft(revision:number,draft:Draft):Promise<DraftSnapshot>;
 backup():Promise<Backup>;
 restore(backup:Backup):Promise<void>;
 erase():Promise<void>;
}
export function applyPrices(prices:PriceNote[]):Part[]{return baseCatalog.map(p=>{const note=prices.find(n=>n.partId===p.id);return note?{...p,priceCents:note.priceCents,checkedAt:note.updatedAt.slice(0,10),customPrice:true}:p;});}
