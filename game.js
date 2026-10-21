import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js';
const $=id=>document.getElementById(id),canvas=$('world');
let scene,camera,renderer,clock,hero,terrainMesh,sword,keys={},joy={x:0,y:0},mobs=[],xpOrbs=[],vfx=[],running=false,toastTimer,swing=0,abilityCooldown=0,abilityBuff=0,aim=new THREE.Vector3(0,0,-1);
const p={x:0,z:0,hp:100,maxHp:100,mp:60,maxMp:60,xp:0,level:1,ess:0,form:'Awakened',path:'',rank:0,damage:25,speed:7};
const kinds=[{name:'Azure Slime',color:0x35bfff,hp:40,dmg:7,xp:18,ess:14,r:.62},{name:'Moonfang',color:0x6b79ff,hp:62,dmg:12,xp:28,ess:20,r:.7},{name:'Abyss Knight',color:0xd34dff,hp:95,dmg:17,xp:45,ess:32,r:.85}];
const material=(color,roughness=.8,emissive=0)=>new THREE.MeshStandardMaterial({color,roughness,emissive,emissiveIntensity:.22});
function say(s){$('toast').textContent=s;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),1700)}
function height(x,z){
 const rolling=Math.sin(x*.025)*2.2+Math.cos(z*.031)*2.6+Math.sin((x+z)*.018)*1.7;
 const ridge1=10*Math.exp(-((x-58)**2/1250+(z+52)**2/850));
 const ridge2=14*Math.exp(-((x+95)**2/1700+(z-78)**2/1300));
 const ridge3=7*Math.exp(-((x-5)**2/950+(z-115)**2/1100));
 const foothills=2.5*Math.sin(x*.09)*Math.cos(z*.075);
 return rolling+ridge1+ridge2+ridge3+foothills;
}
function init(){
 scene=new THREE.Scene();scene.background=new THREE.Color(0x101a2b);scene.fog=new THREE.FogExp2(0x101a2b,.009);
 camera=new THREE.PerspectiveCamera(65,innerWidth/innerHeight,.1,350);
 renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio||1,innerWidth<700?1.35:1.8));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.28;
 scene.add(new THREE.HemisphereLight(0x9bbcff,0x11151b,1.25));const sun=new THREE.DirectionalLight(0xc7d8ff,3.2);sun.position.set(-25,45,20);sun.castShadow=true;sun.shadow.mapSize.set(innerWidth<700?1024:2048,innerWidth<700?1024:2048);sun.shadow.camera.left=-38;sun.shadow.camera.right=38;sun.shadow.camera.top=38;sun.shadow.camera.bottom=-38;scene.add(sun);const rim=new THREE.DirectionalLight(0x9b5cff,1.4);rim.position.set(22,12,-28);scene.add(rim);const moon=new THREE.Mesh(new THREE.SphereGeometry(7,24,18),new THREE.MeshBasicMaterial({color:0xc8d7ff}));moon.position.set(65,48,-110);scene.add(moon);
 const geo=new THREE.PlaneGeometry(600,600,160,160);geo.rotateX(-Math.PI/2);const pos=geo.attributes.position;for(let i=0;i<pos.count;i++){const x=pos.getX(i),z=pos.getZ(i);pos.setY(i,height(x,z));const h=height(x,z),noise=(Math.sin(x*.11)*Math.cos(z*.1))*.06;geo.setAttribute('color',geo.getAttribute('color')||new THREE.BufferAttribute(new Float32Array(pos.count*3),3));let r,g,b;if(h>12){r=.42;g=.43;b=.48}else if(h>8){r=.34;g=.36;b=.39}else if(h>4){r=.25;g=.32;b=.25}else{r=.12;g=.29;b=.23}geo.attributes.color.setXYZ(i,THREE.MathUtils.clamp(r+noise,0,1),THREE.MathUtils.clamp(g+noise,0,1),THREE.MathUtils.clamp(b+noise,0,1))}geo.computeVertexNormals();terrainMesh=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color:0x344c3d,roughness:.96,vertexColors:true}));terrainMesh.receiveShadow=true;scene.add(terrainMesh);
 const grid=new THREE.GridHelper(600,120,0x7bb58a,0x5a986d);grid.position.y=-8;grid.material.transparent=true;grid.material.opacity=.025;scene.add(grid);
 const trunk=material(0x59422c),leaves=[material(0x285b3c),material(0x397449),material(0x477f4d)];
 for(let i=0;i<285;i++){const x=(Math.random()-.5)*260,z=(Math.random()-.5)*260;if(Math.hypot(x,z)<7)continue;const g=new THREE.Group(),h=1.8+Math.random()*2.8;const t=new THREE.Mesh(new THREE.CylinderGeometry(.16,.28,h*.65,7),trunk);t.position.y=h*.32;t.castShadow=true;g.add(t);for(let k=0;k<3;k++){const c=new THREE.Mesh(new THREE.ConeGeometry(.7+k*.18,1.5,7),leaves[Math.floor(Math.random()*3)]);c.position.y=h*.45+k*.65;c.castShadow=true;g.add(c)}g.position.set(x,height(x,z),z);g.rotation.y=Math.random()*6.28;scene.add(g)}
 hero=new THREE.Group();
 const armor=material(0x26344b,.32),steel=new THREE.MeshStandardMaterial({color:0x9eafc8,metalness:.78,roughness:.26}),leather=material(0x53382b,.7),glow=new THREE.MeshStandardMaterial({color:0x65efff,emissive:0x159dc2,emissiveIntensity:1.8,roughness:.25});
 const torso=new THREE.Mesh(new THREE.CapsuleGeometry(.34,.72,6,12),armor);torso.position.y=1.08;torso.castShadow=true;hero.add(torso);
 const breast=new THREE.Mesh(new THREE.BoxGeometry(.53,.48,.18),steel);breast.position.set(0,1.25,-.25);breast.castShadow=true;hero.add(breast);
 const belt=new THREE.Mesh(new THREE.CylinderGeometry(.34,.34,.13,12),leather);belt.position.y=.72;hero.add(belt);
 const head=new THREE.Mesh(new THREE.SphereGeometry(.235,20,16),material(0xc9d3e2,.55));head.position.y=1.72;head.castShadow=true;hero.add(head);
 const helm=new THREE.Mesh(new THREE.SphereGeometry(.27,16,12,0,Math.PI*2,0,Math.PI*.62),steel);helm.position.y=1.78;helm.castShadow=true;hero.add(helm);
 const faceplate=new THREE.Mesh(new THREE.BoxGeometry(.3,.11,.07),armor);faceplate.position.set(0,1.72,-.225);hero.add(faceplate);
 for(const side of [-1,1]){
  const eye=new THREE.Mesh(new THREE.SphereGeometry(.035,8,8),glow);eye.position.set(side*.075,1.75,-.265);hero.add(eye);
  const shoulder=new THREE.Mesh(new THREE.SphereGeometry(.19,12,10),steel);shoulder.position.set(side*.43,1.38,0);shoulder.castShadow=true;hero.add(shoulder);
  const upper=new THREE.Mesh(new THREE.CapsuleGeometry(.105,.28,4,8),armor);upper.position.set(side*.48,1.12,0);upper.rotation.z=side*-.15;upper.castShadow=true;hero.add(upper);
  const forearm=new THREE.Mesh(new THREE.CapsuleGeometry(.085,.25,4,8),steel);forearm.position.set(side*.53,.88,-.04);forearm.rotation.z=side*.12;forearm.castShadow=true;hero.add(forearm);
  const thigh=new THREE.Mesh(new THREE.CapsuleGeometry(.13,.31,4,8),armor);thigh.position.set(side*.19,.49,0);thigh.castShadow=true;hero.add(thigh);
  const boot=new THREE.Mesh(new THREE.BoxGeometry(.23,.28,.36),leather);boot.position.set(side*.2,.19,-.045);boot.castShadow=true;hero.add(boot);
  const knee=new THREE.Mesh(new THREE.SphereGeometry(.12,10,8),steel);knee.position.set(side*.2,.35,-.04);hero.add(knee);
 }
 const cape=new THREE.Mesh(new THREE.ConeGeometry(.42,1.05,7),material(0x432951,.8));cape.position.set(0,.93,.3);cape.rotation.x=-.2;cape.castShadow=true;hero.add(cape);
 const ring=new THREE.Mesh(new THREE.TorusGeometry(.58,.025,6,28),new THREE.MeshBasicMaterial({color:0x65efff}));ring.rotation.x=Math.PI/2;ring.position.y=.06;hero.add(ring);
 sword=new THREE.Group();const blade=new THREE.Mesh(new THREE.BoxGeometry(.105,1.0,.065),new THREE.MeshStandardMaterial({color:0xcceeff,metalness:.92,roughness:.16,emissive:0x278ac0,emissiveIntensity:.65}));blade.position.y=.68;sword.add(blade);const edge=new THREE.Mesh(new THREE.BoxGeometry(.025,.86,.025),new THREE.MeshBasicMaterial({color:0xffffff}));edge.position.set(-.055,.69,-.04);sword.add(edge);const tip=new THREE.Mesh(new THREE.ConeGeometry(.075,.2,4),steel);tip.position.y=1.27;sword.add(tip);const guard=new THREE.Mesh(new THREE.BoxGeometry(.38,.075,.12),material(0xe5bd6a,.3));guard.position.y=.15;sword.add(guard);const grip=new THREE.Mesh(new THREE.CylinderGeometry(.045,.05,.3,8),leather);grip.position.y=-.035;sword.add(grip);sword.position.set(.58,.9,-.13);sword.rotation.z=-.3;hero.add(sword);scene.add(hero);hero.visible=false;hero.visible=false;hero.visible=false;
 for(let i=0;i<25;i++)spawn((Math.random()-.5)*75,(Math.random()-.5)*75);
 // Camera-mounted forearm and polished fantasy sword for first-person view.
 // First-person weapon: camera-mounted, always in front of the scene.
 const fpArmMat=new THREE.MeshStandardMaterial({color:0x263750,roughness:.42,metalness:.35,emissive:0x081629});
 const fpArm=new THREE.Mesh(new THREE.CapsuleGeometry(.105,.43,5,10),fpArmMat);fpArm.position.set(.48,-.48,-.82);fpArm.rotation.z=-.48;fpArm.renderOrder=20;camera.add(fpArm);
 const fpCuff=new THREE.Mesh(new THREE.CylinderGeometry(.135,.12,.19,12),steel);fpCuff.position.set(.45,-.32,-.8);fpCuff.rotation.z=-.48;fpCuff.renderOrder=21;camera.add(fpCuff);
 const fpSword=new THREE.Group();
 const fpBladeMat=new THREE.MeshStandardMaterial({color:0xdaf8ff,metalness:.88,roughness:.14,emissive:0x159ddd,emissiveIntensity:1.15,depthTest:false});
 const fpBlade=new THREE.Mesh(new THREE.BoxGeometry(.105,1.08,.055),fpBladeMat);fpBlade.position.y=.57;fpBlade.renderOrder=22;fpSword.add(fpBlade);
 const fpEdge=new THREE.Mesh(new THREE.BoxGeometry(.022,.9,.022),new THREE.MeshBasicMaterial({color:0xffffff,depthTest:false}));fpEdge.position.set(-.056,.59,-.031);fpEdge.renderOrder=23;fpSword.add(fpEdge);
 const fpTip=new THREE.Mesh(new THREE.ConeGeometry(.075,.18,4),new THREE.MeshStandardMaterial({color:0xdaf8ff,metalness:.85,roughness:.18,depthTest:false}));fpTip.position.y=1.2;fpTip.renderOrder=23;fpSword.add(fpTip);
 const fpGuard=new THREE.Mesh(new THREE.BoxGeometry(.34,.065,.105),new THREE.MeshStandardMaterial({color:0xf0ce7a,metalness:.65,roughness:.24,depthTest:false}));fpGuard.position.y=.06;fpGuard.renderOrder=23;fpSword.add(fpGuard);
 const fpGrip=new THREE.Mesh(new THREE.CylinderGeometry(.04,.045,.29,10),new THREE.MeshStandardMaterial({color:0x503020,roughness:.72,depthTest:false}));fpGrip.position.y=-.12;fpGrip.renderOrder=23;fpSword.add(fpGrip);
 fpSword.position.set(.53,-.52,-.92);fpSword.rotation.set(-.12,0,-.22);camera.add(fpSword);sword=fpSword;

 clock=new THREE.Clock();addEventListener('resize',resize);updateHud();renderer.setAnimationLoop(frame);
}
function spawn(x,z){
 const k=kinds[Math.floor(Math.random()*Math.min(3,1+p.level/3))],g=new THREE.Group();
 const hide=new THREE.MeshStandardMaterial({color:k.color,roughness:.62,metalness:.12}),dark=material(0x22202e),eyeMat=new THREE.MeshStandardMaterial({color:0xffd6df,emissive:0xff365f,emissiveIntensity:1.6});
 let b;
 if(k.name==='Azure Slime'){
  b=new THREE.Mesh(new THREE.SphereGeometry(k.r,32,24),new THREE.MeshPhysicalMaterial({color:k.color,roughness:.12,metalness:.04,transmission:.22,transparent:true,opacity:.9,clearcoat:1,clearcoatRoughness:.08,emissive:k.color,emissiveIntensity:.24}));b.scale.set(1,.76,.92);b.position.y=k.r*.78;g.add(b);
  for(const side of [-1,1]){const white=new THREE.Mesh(new THREE.SphereGeometry(.105,16,12),new THREE.MeshBasicMaterial({color:0xeafaff}));white.position.set(side*.19,k.r*.67,-k.r*.79);g.add(white);const eye=new THREE.Mesh(new THREE.SphereGeometry(.058,12,10),new THREE.MeshBasicMaterial({color:0x12315e}));eye.position.set(side*.19,k.r*.67,-k.r*.88);g.add(eye);const shine=new THREE.Mesh(new THREE.SphereGeometry(.022,8,8),new THREE.MeshBasicMaterial({color:0xffffff}));shine.position.set(side*.17,k.r*.7,-k.r*.93);g.add(shine)}
  const mouth=new THREE.Mesh(new THREE.TorusGeometry(.09,.018,5,12,Math.PI),dark);mouth.position.set(0,k.r*.5,-k.r*.91);mouth.rotation.z=Math.PI;g.add(mouth);
 }else if(k.name==='Moonfang'){
  b=new THREE.Mesh(new THREE.SphereGeometry(.48,18,14),hide);b.scale.set(1.35,.72,.75);b.position.set(0,.78,.05);b.castShadow=true;g.add(b);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.31,16,12),hide);head.position.set(0,1.02,-.48);head.scale.set(.92,.85,1.15);head.castShadow=true;g.add(head);
  const muzzle=new THREE.Mesh(new THREE.ConeGeometry(.17,.4,8),hide);muzzle.rotation.x=-Math.PI/2;muzzle.position.set(0,.94,-.77);g.add(muzzle);
  for(const side of [-1,1]){const ear=new THREE.Mesh(new THREE.ConeGeometry(.105,.3,6),hide);ear.position.set(side*.2,1.3,-.48);ear.rotation.z=side*-.2;g.add(ear);const eye=new THREE.Mesh(new THREE.SphereGeometry(.045,8,8),eyeMat);eye.position.set(side*.19,1.08,-.72);g.add(eye);const leg=new THREE.Mesh(new THREE.CapsuleGeometry(.095,.38,4,8),hide);leg.position.set(side*.29,.36,-.28);leg.castShadow=true;g.add(leg);const leg2=new THREE.Mesh(new THREE.CapsuleGeometry(.1,.38,4,8),hide);leg2.position.set(side*.29,.36,.38);leg2.castShadow=true;g.add(leg2)}
  const tail=new THREE.Mesh(new THREE.ConeGeometry(.12,.62,7),hide);tail.position.set(0,.83,.62);tail.rotation.x=Math.PI/2.5;g.add(tail);
 }else{
  b=new THREE.Mesh(new THREE.CapsuleGeometry(.35,.8,5,10),hide);b.position.y=1.1;b.castShadow=true;g.add(b);
  const skull=new THREE.Mesh(new THREE.SphereGeometry(.28,16,12),hide);skull.position.y=1.85;skull.castShadow=true;g.add(skull);
  for(const side of [-1,1]){const horn=new THREE.Mesh(new THREE.ConeGeometry(.09,.48,6),dark);horn.position.set(side*.19,2.15,0);horn.rotation.z=side*-.3;g.add(horn);const eye=new THREE.Mesh(new THREE.SphereGeometry(.05,8,8),eyeMat);eye.position.set(side*.1,1.88,-.23);g.add(eye);const arm=new THREE.Mesh(new THREE.CapsuleGeometry(.11,.55,4,8),hide);arm.position.set(side*.48,1.15,0);arm.rotation.z=side*.3;g.add(arm);const claw=new THREE.Mesh(new THREE.ConeGeometry(.1,.32,5),dark);claw.position.set(side*.55,.76,-.04);claw.rotation.x=Math.PI;g.add(claw)}
  for(let i=0;i<3;i++){const spike=new THREE.Mesh(new THREE.ConeGeometry(.12,.42,5),dark);spike.position.set(0,1.5-i*.27,.29);spike.rotation.x=Math.PI/2;g.add(spike)}
 }
 b.castShadow=true;g.position.set(x,height(x,z),z);scene.add(g);mobs.push({g,b,x,z,k,hp:k.hp,dead:false,attack:0});
}
const distance=m=>Math.hypot(m.x-p.x,m.z-p.z);
function gainXP(amount){p.xp+=amount;while(p.xp>=p.level*55){p.xp-=p.level*55;p.level++;p.maxHp+=12;p.hp=p.maxHp;p.damage+=3;p.maxMp+=5;p.mp=p.maxMp;say('LEVEL UP! Level '+p.level)}updateHud()}
function dropXP(m){const count=Math.max(3,Math.ceil(m.k.xp/7));for(let i=0;i<count;i++){const orb=new THREE.Group();const core=new THREE.Mesh(new THREE.IcosahedronGeometry(.105+Math.random()*.045,1),new THREE.MeshStandardMaterial({color:0x78ffbd,emissive:0x27ffb1,emissiveIntensity:2.4,metalness:.25,roughness:.18}));orb.add(core);const halo=new THREE.Mesh(new THREE.SphereGeometry(.2,8,8),new THREE.MeshBasicMaterial({color:0x70ffd2,transparent:true,opacity:.16,depthWrite:false}));orb.add(halo);const ox=m.x+(Math.random()-.5)*1.6,oz=m.z+(Math.random()-.5)*1.6;orb.position.set(ox,height(ox,oz)+.5+Math.random()*.7,oz);scene.add(orb);xpOrbs.push({g:orb,value:i===0?m.k.xp-(count-1)*Math.floor(m.k.xp/count):Math.floor(m.k.xp/count),x:ox,z:oz,phase:Math.random()*6.28})}}
function burstEffect(color,radius=5,count=28){
 const origin=new THREE.Vector3(p.x,height(p.x,p.z)+.9,p.z);
 const ring=new THREE.Mesh(new THREE.TorusGeometry(.7,.075,8,48),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.95,depthWrite:false}));
 ring.rotation.x=Math.PI/2;ring.position.copy(origin);scene.add(ring);
 vfx.push({type:'ring',o:ring,life:.72,max:.72,radius});
 const geo=new THREE.BufferGeometry(),arr=new Float32Array(count*3),vel=[];
 for(let i=0;i<count;i++){arr[i*3]=origin.x;arr[i*3+1]=origin.y;arr[i*3+2]=origin.z;const a=Math.random()*Math.PI*2,s=.9+Math.random()*radius*.8;vel.push(new THREE.Vector3(Math.cos(a)*s,1+Math.random()*4,Math.sin(a)*s))}
 geo.setAttribute('position',new THREE.BufferAttribute(arr,3));
 const pts=new THREE.Points(geo,new THREE.PointsMaterial({color,size:.16,transparent:true,opacity:1,blending:THREE.AdditiveBlending,depthWrite:false}));
 scene.add(pts);vfx.push({type:'particles',o:pts,vel,life:1,max:1});
}
function updateEffects(dt){
 for(const f of [...vfx]){f.life-=dt;const t=1-Math.max(0,f.life)/f.max;
 if(f.type==='ring'){f.o.scale.setScalar(1+t*f.radius);f.o.material.opacity=Math.max(0,f.life/f.max)}
 else{const a=f.o.geometry.attributes.position;for(let i=0;i<f.vel.length;i++){a.array[i*3]+=f.vel[i].x*dt;a.array[i*3+1]+=f.vel[i].y*dt; a.array[i*3+2]+=f.vel[i].z*dt;f.vel[i].y-=5*dt}a.needsUpdate=true;f.o.material.opacity=Math.max(0,f.life/f.max)}
 if(f.life<=0){scene.remove(f.o);f.o.geometry?.dispose();f.o.material?.dispose();vfx=vfx.filter(q=>q!==f)}
 }
}
function strike(skill=false){if(!running)return;swing=.42;burstEffect(skill?0x55dfff:0xe6f8ff,skill?6:2.5,skill?42:12);if(sword){sword.rotation.z=-1.35;sword.rotation.x=-.35}if(skill){if(p.mp<18){say('Not enough essence!');return}p.mp-=18}let hits=0;for(const m of mobs){if(m.dead||distance(m)>(skill?7:3.2))continue;m.hp-=p.damage*(skill?2.25:1)*(p.form==='Predator'?1.3:1);hits++;if(m.hp<=0){m.dead=true;dropXP(m);m.b.material.emissive?.setHex(0x7af5ff);say(m.k.name+' defeated — XP orbs dropped!')}}if(!hits)say(skill?'Eclipse Burst!':'Move closer to strike.');updateHud()}
function useClassAbility(){
 if(!running)return;
 if(p.rank===0||!p.path){strike(true);return}
 if(abilityCooldown>0){say('Ability recharging: '+abilityCooldown.toFixed(1)+'s');return}
 const root=p.path==='demonpeer'||p.path==='demonking'?'demon':p.path==='archangel'||p.path==='seraph'?'angel':p.path==='saint'||p.path==='legend'?'hero':p.path==='phantom'||p.path==='deathstalker'?'assassin':p.path==='shadowmaster'||p.path==='shinobi'?'ninja':p.path;
 const power=p.rank>=3?1.8:p.rank===2?1.45:1;
 abilityCooldown=9;let hits=0;const classColor=({demon:0xff315f,angel:0x9fe8ff,hero:0xffd47a,assassin:0xb995ff,ninja:0x5be6c8}[root]||0x65efff);burstEffect(classColor,root==='demon'?9:root==='ninja'?7:5,root==='demon'?70:45);
 if(root==='demon'){
  for(const m of mobs){if(!m.dead&&distance(m)<8){m.hp-=p.damage*2.4*power;hits++;if(m.hp<=0){m.dead=true;dropXP(m)}}}
  say('INFERNAL NOVA — '+hits+' targets hit!');
 }else if(root==='angel'){
  const heal=Math.round(p.maxHp*.28*power);p.hp=Math.min(p.maxHp,p.hp+heal);p.mp=Math.min(p.maxMp,p.mp+18*power);
  for(const m of mobs){if(!m.dead&&distance(m)<6){m.hp-=p.damage*1.25*power;if(m.hp<=0){m.dead=true;dropXP(m)}}}
  say('CELESTIAL GRACE — restored '+heal+' vitality');
 }else if(root==='hero'){
  p.hp=Math.min(p.maxHp,p.hp+Math.round(p.maxHp*.2*power));abilityBuff=3.5;
  for(const m of mobs){if(!m.dead&&distance(m)<5){m.hp-=p.damage*1.8*power;if(m.hp<=0){m.dead=true;dropXP(m)}}}
  say('HEROIC AEGIS — healing and guard!');
 }else if(root==='assassin'){
  const fx=Math.sin(yaw),fz=Math.cos(yaw);p.x+=fx*7*power;p.z+=fz*7*power;
  for(const m of mobs){if(!m.dead&&distance(m)<5){m.hp-=p.damage*3.2*power;hits++;if(m.hp<=0){m.dead=true;dropXP(m)}}}
  say('PHANTOM STEP — dash strike!');
 }else if(root==='ninja'){
  const fx=Math.sin(yaw),fz=Math.cos(yaw);p.x+=fx*10*power;p.z+=fz*10*power;
  for(const m of mobs){if(!m.dead&&distance(m)<6){m.hp-=p.damage*2.1*power;hits++;if(m.hp<=0){m.dead=true;dropXP(m)}}}
  say('SHADOW SHIFT — vanish and reappear!');
 }
 updateHud();
}
function absorb(){const m=mobs.filter(q=>q.dead).sort((a,b)=>distance(a)-distance(b))[0];if(!m||distance(m)>4.5){say('Move closer to a defeated monster.');return}p.ess+=m.k.ess;p.mp=Math.min(p.maxMp,p.mp+8);scene.remove(m.g);mobs=mobs.filter(q=>q!==m);say('Absorbed '+m.k.name+' · +'+m.k.ess+' essence. Collect the shiny XP orbs!');if(p.ess>=35){renderEvolutions();$('evoPanel').classList.remove('hidden')}$('message').textContent='Absorption complete. Keep hunting to evolve.';updateHud()}
const evolution={
 demon:{name:'Demon',desc:'Abyssal power · heavy damage',color:0xff4b78,cost:35,level:2,damage:18,hp:0,mp:0,next:'demonpeer'},
 angel:{name:'Angel',desc:'Radiant wings · essence mastery',color:0x9fe8ff,cost:35,level:2,damage:7,hp:10,mp:35,next:'archangel'},
 hero:{name:'Hero',desc:'Balanced legendary warrior',color:0xffd47a,cost:35,level:2,damage:12,hp:25,mp:10,next:'saint'},
 assassin:{name:'Assassin',desc:'Critical strikes · swift hunter',color:0xb995ff,cost:35,level:2,damage:15,hp:0,mp:15,next:'phantom'},
 ninja:{name:'Ninja',desc:'Shadow arts · mobility and burst',color:0x5be6c8,cost:35,level:2,damage:10,hp:10,mp:25,next:'shadowmaster'},
 demonpeer:{name:'Demon Peer',desc:'Awakened demon nobility',color:0xff315f,cost:90,level:5,damage:28,hp:35,mp:20,next:'demonking'},
 demonking:{name:'Demon King',desc:'Cataclysmic sovereign of the abyss',color:0xff164c,cost:180,level:10,damage:65,hp:90,mp:55,next:null},
 archangel:{name:'Archangel',desc:'Ascended celestial guardian',color:0xbcecff,cost:90,level:5,damage:20,hp:35,mp:55,next:'seraph'},
 seraph:{name:'Seraph',desc:'Sixfold celestial ascendant',color:0xf5fdff,cost:180,level:10,damage:48,hp:75,mp:85,next:null},
 saint:{name:'Saint Hero',desc:'A hero who transcends mortal limits',color:0xffd986,cost:90,level:5,damage:32,hp:70,mp:35,next:'legend'},
 legend:{name:'Legendary Hero',desc:'A living myth of the frontier',color:0xffedb0,cost:180,level:10,damage:55,hp:110,mp:60,next:null},
 phantom:{name:'Phantom Assassin',desc:'An executioner between heartbeats',color:0xc3a2ff,cost:90,level:5,damage:42,hp:15,mp:30,next:'deathstalker'},
 deathstalker:{name:'Deathstalker',desc:'Unseen, inevitable, lethal',color:0x9d75ff,cost:180,level:10,damage:70,hp:45,mp:45,next:null},
 shadowmaster:{name:'Shadow Master',desc:'Master of the vanishing blade',color:0x65e8cf,cost:90,level:5,damage:30,hp:30,mp:50,next:'shinobi'},
 shinobi:{name:'Shinobi Grandmaster',desc:'Perfected shadow-step and burst arts',color:0x94fff0,cost:180,level:10,damage:58,hp:65,mp:75,next:null}
};
function evolve(key){const e=evolution[key];if(!e)return;if(p.level<e.level){say('Reach level '+e.level+' to unlock '+e.name+'.');return}if(p.ess<e.cost){say('Need '+e.cost+' essence for '+e.name+'.');return}p.ess-=e.cost;p.form=e.name;p.path=key;p.rank++;p.damage+=e.damage;abilityCooldown=0;p.maxHp+=e.hp;p.hp=Math.min(p.maxHp,p.hp+e.hp+25);p.maxMp+=e.mp;p.mp=Math.min(p.maxMp,p.mp+e.mp+20);const aura=new THREE.Mesh(new THREE.TorusGeometry(.8,.045,8,40),new THREE.MeshBasicMaterial({color:e.color,transparent:true,opacity:.85}));aura.rotation.x=Math.PI/2;aura.position.y=.12;hero.add(aura);hero.traverse(o=>{if(o.isMesh&&o.material&&o.material.emissive){o.material.emissive.setHex(e.color);o.material.emissiveIntensity=.18}});$('evoPanel').classList.add('hidden');say('ASCENSION COMPLETE: '+e.name.toUpperCase());$('message').textContent='Evolution path: '+e.name+' · next stage requires level and essence.';updateHud()}
function renderEvolutions(){const wrap=$('evoChoices');if(!wrap)return;wrap.innerHTML='';const choices=p.rank===0?['demon','angel','hero','assassin','ninja']:[evolution[p.path]?.next].filter(Boolean);if(!choices.length){wrap.innerHTML='<p class="muted">You have reached the final stage of this path. Your legend is complete.</p>';return}for(const key of choices){const e=evolution[key],locked=p.level<e.level||p.ess<e.cost;const b=document.createElement('button');b.className='evo-card';b.style.setProperty('--path-color','#'+e.color.toString(16).padStart(6,'0'));b.innerHTML='<strong>'+e.name+'</strong><span>'+e.desc+'</span><small>LEVEL '+e.level+' · '+e.cost+' ESSENCE</small>'+(p.level<e.level?'<em>Requires level '+e.level+'</em>':p.ess<e.cost?'<em>Need '+e.cost+' essence</em>':'<em>UNLOCKED — ASCEND</em>');b.disabled=locked;b.onclick=()=>evolve(key);wrap.appendChild(b)}}

function updateHud(){$('stats').textContent='LV '+p.level+' · '+p.form;$('hp').style.width=100*p.hp/p.maxHp+'%';$('mp').style.width=100*p.mp/p.maxMp+'%';$('xp').style.width=100*p.xp/(p.level*55)+'%';$('expText').textContent='EXP '+p.xp+' / '+p.level*55;$('essText').textContent=p.ess+' essence';$('quest').textContent=mobs.some(m=>m.dead)?'Essence Awaits':'First Hunt';$('zone').textContent=Math.hypot(p.x,p.z)>35?'THE OUTER WILDS':'THE VERDANT EXPANSE';$('evolve').textContent=p.ess>=35?'⬆ Evolve ✧':'⬆ Evolve';$('skill').textContent=p.rank===0?'✦ Burst':({'demon':'☄ Infernal Nova','demonpeer':'☄ Infernal Nova+','demonking':'☄ Cataclysm','angel':'✧ Celestial Grace','archangel':'✧ Radiant Grace','seraph':'✧ Seraphic Dawn','hero':'◈ Heroic Aegis','saint':'◈ Saint Aegis','legend':'◈ Legend Guard','assassin':'➤ Phantom Step','phantom':'➤ Phantom Step+','deathstalker':'➤ Deathstrike','ninja':'影 Shadow Shift','shadowmaster':'影 Shadow Shift+','shinobi':'影 Shinobi Flash'}[p.path]||'✦ Class Ability')+(abilityCooldown>0?' '+abilityCooldown.toFixed(0)+'s':'')}
$('attack').onclick=()=>strike();$('skill').onclick=()=>useClassAbility();$('absorb').onclick=()=>say('Essence automatically collects when you approach defeated monsters.');$('evolve').onclick=()=>{renderEvolutions();$('evoPanel').classList.remove('hidden')};$('closeEvo').onclick=()=>$('evoPanel').classList.add('hidden');
$('play').onclick=()=>{$('start').classList.add('hidden');running=true;say('First-person hunt begins. WASD to move; drag to look.')};
addEventListener('keydown',e=>{const k=e.key.toLowerCase();keys[k]=true;if([' ','arrowup','arrowdown','arrowleft','arrowright'].includes(k))e.preventDefault();if(e.repeat)return;if(k===' ')strike();if(k==='e')absorb();if(k==='q')useClassAbility();if(k==='escape')$('evoPanel').classList.add('hidden')});addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);

let lookPointer=null,lastLookX=0,lastLookY=0,yaw=Math.PI,pitch=0;
function applyLook(dx,dy){yaw-=dx*.0032;pitch=THREE.MathUtils.clamp(pitch-dy*.0027,-1.15,1.15);aim.set(Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),Math.cos(yaw)*Math.cos(pitch));}
canvas.addEventListener('click',()=>{if(!running)return;if(document.pointerLockElement!==canvas&&canvas.requestPointerLock){const request=canvas.requestPointerLock();if(request&&request.catch)request.catch(()=>{})}});
document.addEventListener('mousemove',e=>{if(document.pointerLockElement===canvas){applyLook(e.movementX||0,e.movementY||0);return}if(lookPointer!==null){applyLook(e.clientX-lastLookX,e.clientY-lastLookY);lastLookX=e.clientX;lastLookY=e.clientY}});
canvas.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'){if(e.button!==0)return;if(document.pointerLockElement===canvas)return;lookPointer=e.pointerId;lastLookX=e.clientX;lastLookY=e.clientY;}else{lookPointer=e.pointerId;lastLookX=e.clientX;lastLookY=e.clientY;if(canvas.setPointerCapture)canvas.setPointerCapture(e.pointerId)}});
canvas.addEventListener('pointermove',e=>{if(lookPointer!==e.pointerId||document.pointerLockElement===canvas)return;const dx=e.clientX-lastLookX,dy=e.clientY-lastLookY;lastLookX=e.clientX;lastLookY=e.clientY;applyLook(dx,dy)});
function endLook(e){if(lookPointer===e.pointerId)lookPointer=null}
canvas.addEventListener('pointerup',endLook);canvas.addEventListener('pointercancel',endLook);
const stick=$('stick'),nub=$('nub');let pointer=null;stick.addEventListener('pointerdown',e=>{pointer=e.pointerId;stick.setPointerCapture(pointer);moveJoy(e)});stick.addEventListener('pointermove',e=>{if(e.pointerId===pointer)moveJoy(e)});function moveJoy(e){const r=stick.getBoundingClientRect(),x=e.clientX-(r.left+r.width/2),y=e.clientY-(r.top+r.height/2),m=Math.min(34,Math.hypot(x,y)),a=Math.atan2(y,x);joy.x=Math.cos(a)*m/34;joy.y=Math.sin(a)*m/34;nub.style.left=(34+joy.x*34)+'px';nub.style.top=(34+joy.y*34)+'px'}function endJoy(){pointer=null;joy.x=joy.y=0;nub.style.left='32px';nub.style.top='32px'}stick.addEventListener('pointerup',endJoy);stick.addEventListener('pointercancel',endJoy);
function resize(){if(!renderer)return;camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)}
function frame(){const dt=Math.min(clock.getDelta(),.04);updateEffects(dt);abilityCooldown=Math.max(0,abilityCooldown-dt);abilityBuff=Math.max(0,abilityBuff-dt);if(swing>0){swing=Math.max(0,swing-dt);if(sword){const t=swing/.42;sword.rotation.z=-.25-1.35*Math.sin(t*Math.PI);sword.rotation.x=-.15-.45*Math.sin(t*Math.PI)}}else if(sword){sword.rotation.z=-.25;sword.rotation.x=0}if(running){let side=(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0)+joy.x,forwardInput=(keys.w||keys.arrowup?1:0)-(keys.s||keys.arrowdown?1:0)-joy.y;const moveLen=Math.hypot(side,forwardInput);if(moveLen>.08){side/=Math.max(1,moveLen);forwardInput/=Math.max(1,moveLen);const fx=Math.sin(yaw),fz=Math.cos(yaw),rx=Math.cos(yaw),rz=-Math.sin(yaw);const mx=fx*forwardInput+rx*side,mz=fz*forwardInput+rz*side;p.x+=mx*p.speed*dt;p.z+=mz*p.speed*dt;hero.rotation.y=Math.atan2(mx,mz)}hero.position.set(p.x,height(p.x,p.z),p.z);for(const m of mobs){if(m.dead)continue;m.attack=Math.max(0,m.attack-dt);const d=distance(m);if(d<28&&d>1.5){const speed=m.k.name==='Dusk Wolf'?3.4:2;m.x+=(p.x-m.x)/d*dt*speed;m.z+=(p.z-m.z)/d*dt*speed;m.g.position.set(m.x,height(m.x,m.z)+Math.sin(performance.now()*.004+m.x)*.09,m.z);m.g.lookAt(p.x,m.g.position.y,p.z)}if(d<1.7&&m.attack<=0){p.hp-=m.k.dmg*(abilityBuff>0?.35:1);m.attack=1.1;if(p.hp<=0){p.hp=p.maxHp;p.x*=.6;p.z*=.6;p.ess=Math.floor(p.ess*.8);say('You fell and were reborn. Some essence was lost.')}}}for(const m of [...mobs]){if(m.dead&&distance(m)<5){p.ess+=m.k.ess;scene.remove(m.g);mobs=mobs.filter(q=>q!==m);say('◈ Essence absorbed automatically: +'+m.k.ess);if(p.ess>=35){renderEvolutions();$('evoPanel').classList.remove('hidden')}updateHud()}}for(const o of [...xpOrbs]){o.phase+=dt*3;o.g.position.y=height(o.x,o.z)+.55+Math.sin(o.phase)*.18;const d=Math.hypot(o.x-p.x,o.z-p.z);if(d<2.5){gainXP(o.value);scene.remove(o.g);xpOrbs=xpOrbs.filter(q=>q!==o);say('✦ +'+o.value+' EXP');continue}if(d<8){o.x+=(p.x-o.x)*dt*.8;o.z+=(p.z-o.z)*dt*.8;o.g.position.x=o.x;o.g.position.z=o.z}o.g.rotation.y+=dt*1.8}if(mobs.filter(m=>!m.dead).length<22)spawn(p.x+(Math.random()-.5)*55,p.z+(Math.random()-.5)*55);p.mp=Math.min(p.maxMp,p.mp+2.5*dt);updateHud()}
const eyeY=height(p.x,p.z)+1.58;camera.position.set(p.x,eyeY,p.z);camera.lookAt(p.x+aim.x*12,eyeY+aim.y*12,p.z+aim.z*12);renderer.render(scene,camera);drawMap()}
function drawMap(){const c=$('map'),x=c.getContext('2d');x.clearRect(0,0,100,100);x.fillStyle='#142c28';x.fillRect(0,0,100,100);for(const m of mobs){const a=50+(m.x-p.x)*.8,b=50+(m.z-p.z)*.8;if(a>0&&a<100&&b>0&&b<100){x.fillStyle=m.dead?'#7af5ff':'#ff789d';x.fillRect(a,b,3,3)}}x.fillStyle='white';x.beginPath();x.arc(50,50,3,0,Math.PI*2);x.fill()}
try{init()}catch(e){console.error(e);$('message').textContent='3D engine failed to load. Check your internet connection and reload.';$('start').classList.remove('hidden')}
