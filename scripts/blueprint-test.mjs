/**
 * Production-build integration: actual Creative Blueprint Library buttons,
 * placed world voxels, grouped undo, and Survival/guest-safe UI controls.
 * Runs on a disposable new world (NORENDER in CI).
 */
import {chromium} from 'playwright';

const url=(process.argv[2]||'http://localhost:5199/')+(process.env.NORENDER?'?norender':'');
const browser=await chromium.launch({args:process.env.SOFTWARE_GL?
 ['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']:
 ['--use-angle=metal','--enable-gpu','--ignore-gpu-blocklist']});
const page=await browser.newPage({viewport:{width:1180,height:790}});
const errors=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
await page.addInitScript(()=>{
 HTMLCanvasElement.prototype.requestPointerLock=function(){return Promise.reject(Error('test pointer lock disabled'))};
});
try{
 await page.goto(url,{waitUntil:'domcontentloaded'});
 await page.waitForTimeout(1800);
 await page.evaluate(()=>window.blockhaven.createWorld('Blueprint acceptance','blueprint-2026-11-06','creative'));
 await page.waitForFunction(()=>window.blockhaven?.mode==='playing',{timeout:120000});
 await page.waitForTimeout(2000);
 const before=await page.evaluate(()=>{
  const g=window.blockhaven,p=g.player,w=g.world;
  p.creative=true;p.flying=true;p.yaw=0;p.pitch=0;
  const x=Math.floor(p.body.pos[0]),z=Math.floor(p.body.pos[2]);
  const base=Math.max(36,Math.min(175,w.groundY(x,z)-1));
  p.body.pos=[x+.5,base+1,z+.5];p.body.vel=[0,0,0];
  // Prepare ONE unloaded-structure-free patch in the disposable QA world;
  // do not stub the actual command or world mutation logic.
  for(let dx=-7;dx<=7;dx++)for(let dz=-19;dz<=-3;dz++){
   const wx=x+dx,wz=z+dz;
   if(!w.isLoaded(wx,wz))continue;
   w.setBlock(wx,base,wz,g.ids.dirt);
   for(let dy=1;dy<=16;dy++)w.setBlock(wx,base+dy,wz,0);
  }
  const dir=p.lookDir(),at={x:Math.floor(p.body.pos[0]+dir[0]*11),
   y:Math.floor(p.body.pos[1])-1,z:Math.floor(p.body.pos[2]+dir[2]*11)};
  return {x,z,base,at,loaded:w.isLoaded(at.x,at.z),creative:p.creative,
   original:w.getBlock(at.x-4,at.y,at.z-3)};
 });
 if(!before.loaded||!before.creative)throw Error('world preparation failed '+JSON.stringify(before));
 await page.evaluate(()=>window.blockhaven.menus.show('pause'));
 await page.locator('#pause button:has-text("Creative Blueprint Library")').click();
 await page.waitForFunction(()=>window.blockhaven.menus.current==='blueprints');
 const panels=await page.evaluate(()=>({
  count:document.querySelectorAll('#blueprints [data-blueprint]').length,
  selectable:[...document.querySelectorAll('#blueprints [data-build-blueprint]')].every(b=>!b.disabled),
  selected:document.querySelector('#blueprints #blueprint-turn')?.value
 }));
 if(panels.count!==4||!panels.selectable||panels.selected!=='0')
  throw Error('blueprint library not active '+JSON.stringify(panels));
 await page.screenshot({path:'test-results/blueprint-catalog.png'});
 await page.locator('#blueprints [data-build-blueprint="cabin"]').click();
 await page.waitForTimeout(900);
 const built=await page.evaluate(at=>{
  const g=window.blockhaven,w=g.world;
  return {entry:w.getBlock(at.x-4,at.y,at.z-3),
   head:w.getBlock(at.x-4,at.y+2,at.z-3),open:
    w.getBlock(at.x,at.y+2,at.z-3),
   menu:g.menus.current};
 },before.at);
 if(built.entry===before.original||built.head!==9||built.open!==0||built.menu!==null)
  throw Error('physical cabin placement was not successful '+JSON.stringify({before,built}));
 await page.evaluate(()=>window.blockhaven.runCommand('/undo'));
 const restored=await page.evaluate(at=>({
  entry:window.blockhaven.world.getBlock(at.x-4,at.y,at.z-3),
  head:window.blockhaven.world.getBlock(at.x-4,at.y+2,at.z-3)
 }),before.at);
 if(restored.entry!==before.original||restored.head!==0)
  throw Error('grouped /undo failed '+JSON.stringify({restored,before}));
 await page.evaluate(()=>{window.blockhaven.player.creative=false;window.blockhaven.menus.show('pause')});
 await page.locator('#pause button:has-text("Creative Blueprint Library")').click();
 const survival=await page.evaluate(()=>({
  disabled:[...document.querySelectorAll('#blueprints [data-build-blueprint]')].every(b=>b.disabled),
  cards:document.querySelectorAll('#blueprints [data-blueprint]').length
 }));
 if(!survival.disabled||survival.cards!==4)throw Error('Survival can build for free '+JSON.stringify(survival));
 await page.evaluate(()=>window.blockhaven.runCommand('/blueprint build cabin north'));
 const denied=await page.evaluate(at=>window.blockhaven.world.getBlock(at.x-4,at.y,at.z-3),before.at);
 if(denied!==before.original)throw Error('Survival command mutated world');
 await page.screenshot({path:'test-results/blueprint-survival-view.png'});
 const report={status:'PASS',catalog:panels,geometry:built,undo:restored,survival,errors};
 if(errors.length)throw Error('browser errors '+JSON.stringify(errors));
 console.log(JSON.stringify(report));
}finally{await browser.close()}
