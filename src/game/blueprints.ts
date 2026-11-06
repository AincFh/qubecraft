/**
 * Original creative-build library. Pure geometry: no world mutation, random
 * materials, bundled models or third-party structures. Each palette entry
 * maps to a block that already exists in QubeCraft.
 */
export type BlueprintId = 'cabin' | 'glasshouse' | 'watchtower' | 'market';
export type CompassTurn = 0 | 1 | 2 | 3;
export interface BlueprintVoxel {x:number;y:number;z:number;key:string;meta?:number}
export interface BlueprintPlan {
 id:BlueprintId;title:string;description:string;size:[number,number,number];
 turn:CompassTurn;voxels:BlueprintVoxel[];materials:Record<string,number>;
}
interface PalettePlan {width:number;depth:number;height:number;title:string;description:string;voxels:BlueprintVoxel[]}
export const BLUEPRINT_NAMES:readonly BlueprintId[]=['cabin','glasshouse','watchtower','market'];
export const BLUEPRINT_INFO:Readonly<Record<BlueprintId,{title:string;description:string;size:[number,number,number]}>>={
 cabin:{title:'Riverside Cabin',description:'A timber lodge with stone plinth, windows, an oak porch and furnished interior.',size:[9,7,9]},
 glasshouse:{title:'Botanical Glasshouse',description:'An illuminated 11-by-9 grow-house with raised beds, cedar framing and a vaulted glass roof.',size:[11,9,9]},
 watchtower:{title:'Frontier Watchtower',description:'A stone-founded wooden lookout with elevated deck, ladder access and perimeter railings.',size:[7,7,13]},
 market:{title:'Village Market Stall',description:'Open timber market pavilion with striped canopy, display counters and light.',size:[9,7,7]},
};
const key=(x:number,y:number,z:number)=>x+','+y+','+z;
function newPlan(id:BlueprintId):{put:(x:number,y:number,z:number,b:string,meta?:number)=>void;finish:()=>PalettePlan}{
 const info=BLUEPRINT_INFO[id],data=new Map<string,BlueprintVoxel>();
 const put=(x:number,y:number,z:number,b:string,meta?:number)=>{
  if(!Number.isInteger(x)||!Number.isInteger(y)||!Number.isInteger(z)||
     x<0||x>=info.size[0]||z<0||z>=info.size[1]||y<0||y>=info.size[2])
   throw Error('Blueprint out of bounds: '+id+' '+key(x,y,z));
  data.set(key(x,y,z),{x,y,z,key:b,...(meta===undefined?{}:{meta})});
 };
 return {put,finish:()=>({width:info.size[0],depth:info.size[1],height:info.size[2],
   title:info.title,description:info.description,voxels:[...data.values()]})};
}
function cabin():PalettePlan{
 const p=newPlan('cabin'),set=p.put;
 for(let x=0;x<9;x++)for(let z=0;z<7;z++){set(x,0,z,'cobblestone');set(x,1,z,'planks');}
 for(let y=2;y<=5;y++)for(let x=0;x<9;x++)for(let z=0;z<7;z++){
  if(x!==0&&x!==8&&z!==0&&z!==6)continue;
  if(z===0&&x===4&&(y===2||y===3))continue; // An open and usable doorway
  if(y===3&&((z===0&&(x===2||x===6))||(z===6&&x===4)||
     ((x===0||x===8)&&(z===2||z===4)))){set(x,y,z,'glass');continue}
  set(x,y,z,(x===0||x===8)&&(z===0||z===6)?'log':'planks');
 }
 // Stepped gable, built from actual wooden blocks (no texture-only roof).
 for(let x=0;x<9;x++)for(let z=0;z<7;z++){
   const slope=Math.min(x,8-x);
   const y=6+Math.min(2,Math.floor(slope/2));
   set(x,y,z,'planks');
 }
 for(let z=0;z<7;z++){set(4,7,z,'log');}
 // Interior furnishings and supported lighting.
 set(2,2,4,'crafting_table');set(6,2,4,'chest');
 set(2,2,5,'furnace');set(6,2,5,'bookshelf');
 set(4,2,5,'glowstone');set(4,5,3,'glowstone');
 return p.finish();
}
function glasshouse():PalettePlan{
 const p=newPlan('glasshouse'),set=p.put;
 for(let x=0;x<11;x++)for(let z=0;z<9;z++){
  set(x,0,z,'stone_bricks');
  const garden=(x>=2&&x<=4||x>=6&&x<=8)&&z>=2&&z<=6;
  set(x,1,z,garden?'farmland':'planks');
 }
 for(let y=2;y<=5;y++)for(let x=0;x<11;x++)for(let z=0;z<9;z++){
  if(x!==0&&x!==10&&z!==0&&z!==8)continue;
  if(x===5&&z===0&&(y===2||y===3))continue;
  const frame=(x===0||x===10)&&(z===0||z===4||z===8) ||
     (z===0||z===8)&&(x===0||x===5||x===10);
  set(x,y,z,frame?'log':'glass');
 }
 for(let x=0;x<11;x++)for(let z=0;z<9;z++){
  const y=6+Math.min(2,Math.floor(Math.min(x,10-x)/2));
  set(x,y,z,'glass');
 }
 for(let z=0;z<9;z++){set(5,8,z,'planks');}
 for(const x of [0,10])for(const z of [0,8])set(x,6,z,'glowstone');
 set(5,2,7,'crafting_table');set(5,2,2,'chest');
 return p.finish();
}
function watchtower():PalettePlan{
 const p=newPlan('watchtower'),set=p.put;
 for(let x=0;x<7;x++)for(let z=0;z<7;z++){
  set(x,0,z,'stone_bricks');
  if(x===0||x===6||z===0||z===6)set(x,1,z,'stone_bricks');
 }
 for(const x of [0,6])for(const z of [0,6])for(let y=2;y<=11;y++)set(x,y,z,'log');
 for(let x=0;x<7;x++)for(let z=0;z<7;z++)if(x!==0&&x!==6&&z!==0&&z!==6){
  set(x,9,z,'planks');
 }
 for(let y=2;y<10;y++)set(3,y,1,'ladder',2);
 for(let x=1;x<=5;x++)for(let z=1;z<=5;z++)set(x,12,z,'planks');
 for(let x=0;x<7;x++)for(let z=0;z<7;z++){
  if(x!==0&&x!==6&&z!==0&&z!==6)continue;
  if(x===3&&z===1)continue;
  if(x===3&&z===0)continue; // Entry to the observation deck
  set(x,10,z,'fence');
 }
 for(const x of [1,5])for(const z of [1,5])set(x,11,z,'glowstone');
 return p.finish();
}
function market():PalettePlan{
 const p=newPlan('market'),set=p.put;
 for(let x=0;x<9;x++)for(let z=0;z<7;z++){
  set(x,0,z,'cobblestone');
  set(x,1,z,'planks');
 }
 for(const x of [0,8])for(const z of [0,6])for(let y=2;y<=5;y++)set(x,y,z,'log');
 for(let x=0;x<9;x++)for(let z=0;z<7;z++){
   set(x,6,z,(x+z)%4<2?'red_wool':'white_wool');
 }
 for(let x=1;x<=7;x++)for(const z of [1,5])set(x,2,z,'planks');
 for(const x of [1,7])for(const z of [1,5])set(x,3,z,'hay_bale');
 for(const x of [2,6])for(const z of [2,4])set(x,2,z,'barrel');
 set(4,5,3,'glowstone');
 return p.finish();
}
const BUILDERS:Record<BlueprintId,()=>PalettePlan>={cabin,glasshouse,watchtower,market};
export function isBlueprintId(value:string):value is BlueprintId{
 return Object.hasOwn(BUILDERS,value);
}
export function blueprintPlan(name:BlueprintId,turn:CompassTurn=0):BlueprintPlan{
 if(!isBlueprintId(name)||![0,1,2,3].includes(turn))throw Error('Unknown blueprint or rotation');
 const raw=BUILDERS[name]();
 const w2=Math.floor(raw.width/2),d2=Math.floor(raw.depth/2);
 const voxels=raw.voxels.map(({x,y,z,...other})=>{
  const a=x-w2,b=z-d2;
  const rx=turn===0?a:turn===1?-b:turn===2?-a:b;
  const rz=turn===0?b:turn===1?a:turn===2?-b:-a;
  return {...other,x:rx,y,z:rz};
 });
 const materials:Record<string,number>={};
 for(const v of voxels)materials[v.key]=(materials[v.key]||0)+1;
 return {id:name,title:raw.title,description:raw.description,size:[raw.width,raw.depth,raw.height],turn,voxels,materials};
}
/** Validation is all-or-nothing BEFORE calling the world history mutator. */
export interface BlueprintWorldReader{
 isLoaded(x:number,z:number):boolean;
 getBlock(x:number,y:number,z:number):number;
}
export interface BlueprintLocation{x:number;y:number;z:number}
export function blueprintBounds(plan:BlueprintPlan,at:BlueprintLocation){
 return plan.voxels.reduce((r,p)=>({
  minX:Math.min(r.minX,at.x+p.x),maxX:Math.max(r.maxX,at.x+p.x),
  minY:Math.min(r.minY,at.y+p.y),maxY:Math.max(r.maxY,at.y+p.y),
  minZ:Math.min(r.minZ,at.z+p.z),maxZ:Math.max(r.maxZ,at.z+p.z)
 }),{minX:Infinity,maxX:-Infinity,minY:Infinity,maxY:-Infinity,minZ:Infinity,maxZ:-Infinity});
}
export function blueprintPreflight(plan:BlueprintPlan,at:BlueprintLocation,
 world:BlueprintWorldReader,permittedSurface:ReadonlySet<number>,replaceable:ReadonlySet<number>):
 {ok:true;changes:number}|{ok:false;reason:string}{
 if(![at.x,at.y,at.z].every(Number.isSafeInteger))return {ok:false,reason:'Invalid coordinates'};
 const b=blueprintBounds(plan,at);
 if(b.minY<0||b.maxY>=256)return {ok:false,reason:'Blueprint exceeds the buildable vertical range'};
 if(plan.voxels.length>2500)return {ok:false,reason:'Blueprint exceeds the 2500-block limit'};
 let changes=0;
 // Validate the ENTIRE volume, not just the blocks the structure places.
 // This catches existing buildings in the interior before any mutation.
 for(let x=b.minX;x<=b.maxX;x++)for(let z=b.minZ;z<=b.maxZ;z++){
  if(!world.isLoaded(x,z))return {ok:false,reason:'Move closer: all blueprint chunks must be loaded'};
  for(let y=b.minY;y<=b.maxY;y++){
   const existing=world.getBlock(x,y,z);
   if(y<=at.y+1){
    if(existing!==0&&!permittedSurface.has(existing)&&!replaceable.has(existing))
      return {ok:false,reason:'Solid construction already occupies the planned foundation'};
   }else if(existing!==0&&!replaceable.has(existing))
    return {ok:false,reason:'An existing structure or tree occupies the build volume'};
  }
 }
 for(const v of plan.voxels)if(world.getBlock(at.x+v.x,at.y+v.y,at.z+v.z)!==-1)changes++;
 return {ok:true,changes};
}
