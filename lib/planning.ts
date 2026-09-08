import {categories, categoryNames, selectedParts, quantityFor, totalFor, type BuildState, type Part, type Category} from './model';
export const stageNames = {now:'Buy now',later:'Buy later',owned:'Already owned',installed:'Installed'} as const;
export type Stage = keyof typeof stageNames;
export function stageFor(state:BuildState,category:Category):Stage {return state.stages?.[category]??'now';}
export function costPlan(state:BuildState,parts:Part[]) {
 const byStage={now:0,later:0,owned:0,installed:0};
 for(const p of selectedParts(state,parts))byStage[stageFor(state,p.category)]+=p.priceCents*quantityFor(p,state);
 const allowances=state.labor+state.extras;
 const remaining=byStage.now+byStage.later+allowances;
 return {...byStage,allowances,remaining,dueNow:byStage.now+allowances,covered:byStage.owned+byStage.installed,project:remaining+(state.vehicleCost??0),fullValue:totalFor(state,parts).total};
}
export function groupParts(parts:Part[]) {
 const groups=new Map<string,Part[]>();
 for(const p of parts){const key=[p.category,p.brand,p.name].join('|');groups.set(key,[...(groups.get(key)??[]),p]);}
 return Array.from(groups.entries()).map(([key,variants])=>({key,variants}));
}
export function compareRows(a:BuildState,b:BuildState,parts:Part[]) {
 return categories.map(category=>{
  const left=parts.find(p=>p.id===a.picks[category]),right=parts.find(p=>p.id===b.picks[category]);
  const line=(p:Part|undefined,s:BuildState)=>p?`${p.brand} ${p.name} · ${p.variant} · ×${quantityFor(p,s)} · ${stageNames[stageFor(s,category)]}`:'Keep current equipment';
  const leftText=line(left,a),rightText=line(right,b);
  return {category,label:categoryNames[category],left:leftText,right:rightText,changed:leftText!==rightText,leftCost:left?left.priceCents*quantityFor(left,a):0,rightCost:right?right.priceCents*quantityFor(right,b):0};
 });
}
