import {describe,it,expect} from 'vitest';
import {B} from '../blocks';
import {
 BLUEPRINT_NAMES,BLUEPRINT_INFO,blueprintPlan,blueprintBounds,
 blueprintPreflight,isBlueprintId,type BlueprintLocation,type BlueprintPlan
} from './blueprints';

const location:BlueprintLocation={x:128,y:70,z:-64};
const fake=(fn:(x:number,y:number,z:number)=>number=()=>0,loaded=true)=>({
 isLoaded:()=>loaded,getBlock:fn
});
const surface=new Set([B.grass,B.dirt,B.stone,B.cobblestone,B.sand]);
const replaceable=new Set([B.tall_grass,B.snow_layer]);

describe('Creative voxel construction, no asset files or runtime randomness',()=>{
 it('ships four unique blueprints of meaningful multi-storey geometry',()=>{
  expect(BLUEPRINT_NAMES).toHaveLength(4);
  expect(new Set(BLUEPRINT_NAMES).size).toBe(4);
  for(const id of BLUEPRINT_NAMES){
   const info=BLUEPRINT_INFO[id];
   expect(info.title.length).toBeGreaterThan(4);
   expect(info.description.length).toBeGreaterThan(15);
   const p=blueprintPlan(id);
   expect(p.voxels.length).toBeGreaterThan(90);
   expect(p.voxels.length).toBeLessThan(2500);
   expect(p.size).toEqual(info.size);
   expect(isBlueprintId(id)).toBe(true);
  }
  expect(isBlueprintId('paid-cheat')).toBe(false);
 });
 it('every template rotation uses only registered QubeCraft blocks and unique positions',()=>{
  for(const id of BLUEPRINT_NAMES)for(const turn of [0,1,2,3] as const){
   const p=blueprintPlan(id,turn),coords=new Set();
   for(const v of p.voxels){
    const key=v.x+','+v.y+','+v.z;
    expect(coords.has(key)).toBe(false);
    coords.add(key);
    expect(v.y).toBeGreaterThanOrEqual(0);
    expect(v.y).toBeLessThan(p.size[2]);
    expect(B[v.key]).toBeTypeOf('number');
    expect(B[v.key]).toBeGreaterThan(0);
   }
   const count=Object.values(p.materials).reduce((a,b)=>a+b,0);
   expect(count).toBe(p.voxels.length);
   expect(blueprintBounds(p,location).maxY).toBe(location.y+p.size[2]-1);
  }
 });
 it('rotating a structure preserves each block count and vertical silhouette',()=>{
  for(const name of BLUEPRINT_NAMES){
   const canonical=blueprintPlan(name,0);
   for(const turn of [1,2,3] as const){
    const next=blueprintPlan(name,turn);
    expect(next.materials).toEqual(canonical.materials);
    expect(next.voxels.length).toBe(canonical.voxels.length);
    expect(next.voxels.map(x=>x.y).sort((a,b)=>a-b)).toEqual(canonical.voxels.map(x=>x.y).sort((a,b)=>a-b));
   }
  }
 });
 it('cabin offers a real open 2-block entrance, usable window lights and interior',()=>{
  const p=blueprintPlan('cabin'),cell=(x:number,y:number,z:number)=>
   p.voxels.find(v=>v.x===x&&v.y===y&&v.z===z)?.key;
  expect(cell(0,2,-3)).toBeUndefined();
  expect(cell(0,3,-3)).toBeUndefined();
  expect(cell(0,1,-3)).toBe('planks');
  expect(p.materials.glass).toBeGreaterThanOrEqual(5);
  expect(p.materials.crafting_table).toBe(1);
  expect(p.materials.chest).toBe(1);
 });
 it('a farmable glasshouse and furnished open-air market have real materials',()=>{
  const greenhouse=blueprintPlan('glasshouse');
  expect(greenhouse.materials.farmland).toBe(30);
  expect(greenhouse.materials.glass).toBeGreaterThan(100);
  const market=blueprintPlan('market');
  expect(market.materials.wool_red).toBeGreaterThan(5);
  expect(market.materials.wool).toBeGreaterThan(5);
  expect(market.materials.barrel).toBe(4);
 });
 it('tower contains a real ladder, elevated platform and safety rail',()=>{
  const tower=blueprintPlan('watchtower');
  expect(tower.size[2]).toBe(13);
  expect(tower.materials.ladder).toBe(8);
  expect(tower.materials.fence).toBeGreaterThanOrEqual(15);
  expect(tower.materials.planks).toBeGreaterThan(20);
 });
 it('all successful preflights are pure and do not change the world',()=>{
  const p=blueprintPlan('cabin');
  let checks=0;
  const world=fake(()=>{checks++;return 0});
  const result=blueprintPreflight(p,location,world,surface,replaceable);
  expect(result).toEqual({ok:true,placements:p.voxels.length});
  expect(checks).toBeGreaterThan(250);
  expect(result.ok).toBe(true);
 });
 it('unloaded chunks and 256-height boundaries abort before placing any block',()=>{
  const p=blueprintPlan('watchtower',3);
  expect(blueprintPreflight(p,location,fake(()=>0,false),surface,replaceable)).toMatchObject({ok:false});
  expect(blueprintPreflight(p,{...location,y:251},fake(),surface,replaceable)).toMatchObject({ok:false});
  expect(blueprintPreflight(p,{...location,x:NaN},fake(),surface,replaceable)).toMatchObject({ok:false});
 });
 it('preflight prevents building over other settlements and trees even in hidden interior',()=>{
  const p=blueprintPlan('market');
  // A block in the middle is not part of the support frame, but must still block.
  const intrusion=fake((x,y,z)=>x===location.x&&y===location.y+4&&z===location.z?B.log:0);
  expect(blueprintPreflight(p,location,intrusion,surface,replaceable)).toMatchObject({ok:false});
  const ground=fake((x,y,z)=>x===location.x&&y===location.y&&z===location.z?B.chest:0);
  expect(blueprintPreflight(p,location,ground,surface,replaceable)).toMatchObject({ok:false});
 });
 it('natural grass foundations and small replaceable plants are permitted',()=>{
  const p=blueprintPlan('glasshouse');
  const natural=fake((x,y,z)=>y===location.y?B.grass:y===location.y+3&&x===location.x?B.tall_grass:0);
  expect(blueprintPreflight(p,location,natural,surface,replaceable).ok).toBe(true);
 });
});
