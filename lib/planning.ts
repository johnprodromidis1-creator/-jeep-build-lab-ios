import {categories, categoryNames, selectedParts, quantityFor, totalFor, type BuildState, type Part, type Category} from './model';
export const stageNames = {now:'Buy now',later:'Buy later',owned:'Already owned',installed:'Installed'} as const;
export type Stage = keyof typeof stageNames;
export type BuildOrderStep = {key:string;title:string;parts:Part[];gate:string};
export function stageFor(state:BuildState,category:Category):Stage {return state.stages?.[category]??'now';}
export function costPlan(state:BuildState,parts:Part[]) {
 const byStage={now:0,later:0,owned:0,installed:0};
 for(const p of selectedParts(state,parts))byStage[stageFor(state,p.category)]+=p.priceCents*quantityFor(p,state);
 const allowances=state.labor+state.extras;
 const remaining=byStage.now+byStage.later+allowances;
 return {...byStage,allowances,remaining,dueNow:byStage.now+allowances,covered:byStage.owned+byStage.installed,project:remaining+(state.vehicleCost??0),fullValue:totalFor(state,parts).total};
}
export function groupParts(parts:Part[]) {
 return parts.map(p=>({key:p.id,variants:[p]}));
}
export function buildOrder(state:BuildState,parts:Part[]):BuildOrderStep[] {
 const chosen=selectedParts(state,parts);
 const inCategories=(wanted:Category[])=>wanted.map(category=>chosen.find(part=>part.category===category)).filter((part):part is Part=>!!part);
 const steps:BuildOrderStep[]=[];
 const foundation=inCategories(['lift','wheels','tires']);
 if(foundation.length)steps.push({key:'foundation',title:'Set stance and geometry',parts:foundation,gate:'Confirm wheel and tire dimensions, brake and suspension clearance, then align and calibrate after the final ride height is set.'});
 const front=inCategories(['bumpers','winches']);
 if(front.length)steps.push({key:'recovery',title:'Mount front protection and recovery',parts:front,gate:'Confirm installed weight, rated mounting, winch clearance, recovery points and electrical routing before trail use.'});
 const armor=inCategories(['armor']);
 if(armor.length)steps.push({key:'armor',title:'Fit side protection',parts:armor,gate:'Confirm rail removal, drilling or wiring needs, door clearance and lift-point access with the installer.'});
 if(chosen.length)steps.push({key:'verify',title:'Final combination check',parts:[],gate:'Re-torque fasteners, verify steering and suspension travel, road-test, scan warning systems and document the final installed configuration.'});
 return steps;
}
export function compareRows(a:BuildState,b:BuildState,parts:Part[]) {
 return categories.map(category=>{
  const left=parts.find(p=>p.id===a.picks[category]),right=parts.find(p=>p.id===b.picks[category]);
  const line=(p:Part|undefined,s:BuildState)=>p?`${p.brand} ${p.name} · ${p.variant} · ×${quantityFor(p,s)} · ${stageNames[stageFor(s,category)]}`:'Keep current equipment';
  const leftText=line(left,a),rightText=line(right,b);
  return {category,label:categoryNames[category],left:leftText,right:rightText,changed:leftText!==rightText,leftCost:left?left.priceCents*quantityFor(left,a):0,rightCost:right?right.priceCents*quantityFor(right,b):0};
 });
}
