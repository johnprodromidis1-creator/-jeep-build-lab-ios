import { z } from "zod";
import catalog from "./catalog.json";
export const categories = ["wheels","tires","lift","bumpers","winches","armor"] as const;
export type Category = typeof categories[number];
export const categoryNames: Record<Category,string> = {wheels:"Wheels",tires:"Tires",lift:"Suspension",bumpers:"Bumpers",winches:"Winches",armor:"Side armor"};
export type Trim = "Sport"|"Sahara"|"Rubicon";
export type Part = {id:string; category:Category; brand:string; name:string; variant:string; reference:string; priceCents:number; retailer:string; url:string; checkedAt:string; yearFrom:number; yearTo:number; trims:Trim[]; specs:{rim?:number; diameter?:number; width?:number; offset?:number; backspacing?:number; finish?:string; lift?:number; maxTire?:number; maxTireRubicon?:number; winchMount?:boolean}; notes:string; customPrice?:boolean};
export const baseCatalog = catalog as Part[];
export const stateSchema = z.object({
 year:z.number().int().min(2018).max(2023), trim:z.enum(["Sport","Sahara","Rubicon"]),
 stockRim:z.union([z.literal(17),z.literal(18)]), stockTire:z.number().min(30).max(35),
 vehicleCost:z.number().int().min(0).max(10000000).default(0),
 stages:z.object({wheels:z.enum(["now","later","owned","installed"]).optional(),tires:z.enum(["now","later","owned","installed"]).optional(),lift:z.enum(["now","later","owned","installed"]).optional(),bumpers:z.enum(["now","later","owned","installed"]).optional(),winches:z.enum(["now","later","owned","installed"]).optional(),armor:z.enum(["now","later","owned","installed"]).optional()}).strict().default({}),
 quantity:z.union([z.literal(4),z.literal(5)]),
 budget:z.number().int().min(0).max(10000000),
 labor:z.number().int().min(0).max(10000000), extras:z.number().int().min(0).max(10000000),
 picks:z.object({wheels:z.string().max(100).optional(),tires:z.string().max(100).optional(),lift:z.string().max(100).optional(),bumpers:z.string().max(100).optional(),winches:z.string().max(100).optional(),armor:z.string().max(100).optional()}).strict(),
}).strict().superRefine((s,ctx)=>{for(const [cat,id] of Object.entries(s.picks)){if(!baseCatalog.some(p=>p.id===id&&p.category===cat))ctx.addIssue({code:z.ZodIssueCode.custom,message:"Unknown part or category",path:["picks",cat]});}});
export type BuildState = z.infer<typeof stateSchema>;
export const initialState:BuildState={year:2021,trim:"Sport",stockRim:17,stockTire:32,quantity:5,vehicleCost:0,stages:{},budget:500000,labor:0,extras:0,picks:{}};
export const saveSchema=z.object({id:z.string().uuid().optional(),name:z.string().trim().min(1).max(80),notes:z.string().max(1500),state:stateSchema}).strict();
export type SavedBuild={id:string;name:string;notes:string;state:BuildState;updatedAt:string;savedTotal:number};
export type Issue={level:"error"|"note";message:string;category?:Category};
export function selectedParts(s:BuildState,parts:Part[]=baseCatalog){return categories.map(c=>parts.find(p=>p.id===s.picks[c])).filter((p):p is Part=>!!p);}
export function fitsVehicle(p:Part,s:BuildState){return s.year>=p.yearFrom&&s.year<=p.yearTo&&p.trims.includes(s.trim);}
export function quantityFor(p:Part,s:BuildState){return p.category==="wheels"||p.category==="tires"?s.quantity:1;}
export function totalFor(s:BuildState,parts:Part[]=baseCatalog){const subtotal=selectedParts(s,parts).reduce((n,p)=>n+p.priceCents*quantityFor(p,s),0);return {subtotal,total:subtotal+s.labor+s.extras};}
export function buildIssues(s:BuildState,parts:Part[]=baseCatalog):Issue[]{
 const issues:Issue[]=[]; const selected=selectedParts(s,parts);
 const wheel=selected.find(p=>p.category==="wheels"), tire=selected.find(p=>p.category==="tires"), lift=selected.find(p=>p.category==="lift"), bumper=selected.find(p=>p.category==="bumpers");
 for(const p of selected)if(!fitsVehicle(p,s))issues.push({level:"error",category:p.category,message:p.name+" — this variant is not listed for your selected year/trim."});
 const rim=wheel?.specs.rim??s.stockRim;
 if(tire&&tire.specs.rim!==rim)issues.push({level:"error",category:"tires",message:`Wheel diameter mismatch: ${tire.specs.rim}″ tire requires a ${tire.specs.rim}″ wheel. Your selected wheels are ${rim}″.`});
 if(wheel&&!tire&&rim!==s.stockRim)issues.push({level:"error",category:"tires",message:`Wheel diameter mismatch: your current tires fit ${s.stockRim}″ wheels and cannot mount on these ${rim}″ wheels. Add ${rim}″ tires or keep your current wheels.`});
 const diameter=tire?.specs.diameter??s.stockTire;
 const max=lift?(s.trim==="Rubicon"?(lift.specs.maxTireRubicon??lift.specs.maxTire):lift.specs.maxTire):undefined;
 if(max&&diameter>max)issues.push({level:"error",category:"tires",message:`${diameter}″ tires exceed this lift's listed ${max}″ tire limit for your trim.`});
 if(tire&&!lift&&diameter>s.stockTire+.2)issues.push({level:"note",message:"Larger-than-stock tires: clearance is unverified. Check lift, fenders, steering and suspension travel before purchase."});
 if(lift&&!wheel)issues.push({level:"note",message:"Factory wheels with this lift need additional clearance checks; wheel changes or spacers may be required."});
 if(wheel||tire)issues.push({level:"note",message:"Confirm rim width, offset/backspacing, brake clearance, tire load rating and spare-carrier capacity. Matching diameters alone does not establish fitment."});
 if(lift)issues.push({level:"note",message:"Budget for alignment and any required geometry correction, tire calibration or gearing changes. The preview does not simulate suspension travel."});
 if(selected.some(p=>p.category==="winches"))issues.push({level:"note",message:bumper?.specs.winchMount?"Winch plate included; confirm the exact winch's clearance, rated capacity and wiring with the bumper supplier.":"A rated winch mount is required and is not included in this build. Choose a bumper or budget for a suitable mount."});
 if(bumper?.id==="tactik-hd"&&s.trim==="Sport")issues.push({level:"note",message:"Sport fog lamps need Mopar 68298651AA mounting brackets; that extra cost is not in the parts total."});
 if(bumper?.id.startsWith("qrc-")&&s.trim==="Rubicon")issues.push({level:"note",message:"QRC bumper does not accept fog lights from the factory Rubicon steel bumper; check your original bumper option."});
 if(selected.some(p=>p.category==="armor")&&s.trim==="Rubicon")issues.push({level:"note",message:"Factory Rubicon rock rails must be removed for the selected QRC side armor."});
 return issues;
}
export const money=(cents:number)=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:2}).format(cents/100);
