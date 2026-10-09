
"use strict";
// TUM stores camera-to-world poses, quaternion order xyzw.
const WalkthroughMath = (() => {
  const dot = (a,b) => a.reduce((s,x,i) => s+x*b[i],0);
  const sub = (a,b) => a.map((x,i) => x-b[i]);
  const cross = (a,b) => [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const unit = a => { const n=Math.hypot(...a); return a.map(x=>x/n); };
  function rotation(q) {
    const [x,y,z,w]=q;
    return [[1-2*(y*y+z*z),2*(x*y-z*w),2*(x*z+y*w)],
            [2*(x*y+z*w),1-2*(x*x+z*z),2*(y*z-x*w)],
            [2*(x*z-y*w),2*(y*z+x*w),1-2*(x*x+y*y)]];
  }
  function slerp(a,b,t) {
    let c=dot(a,b); b=b.slice();
    if(c<0) { b=b.map(x=>-x); c=-c; }
    if(c>.9995) return unit(a.map((x,i)=>x+(b[i]-x)*t));
    const angle=Math.acos(Math.min(1,c)), s=Math.sin(angle);
    return a.map((x,i)=>(x*Math.sin((1-t)*angle)+b[i]*Math.sin(t*angle))/s);
  }
  function sample(poses,index) {
    index=Math.max(0,Math.min(poses.length-1,index));
    const i=Math.floor(index),a=poses[i],b=poses[Math.min(i+1,poses.length-1)],t=index-i;
    return {p:a.slice(1,4).map((x,j)=>x+(b[j+1]-x)*t),q:slerp(a.slice(4),b.slice(4),t),stamp:a[0]+(b[0]-a[0])*t};
  }
  function cameraView(p,q) {
    const r=rotation(q), rows=[];
    // R^T (X_world - p), then flip camera Y/Z for OpenGL.
    for(let i=0;i<3;i++) {
      const row=[r[0][i],r[1][i],r[2][i]], sign=i===0?1:-1;
      rows.push([...row.map(x=>sign*x),-sign*dot(row,p)]);
    }
    rows.push([0,0,0,1]);
    return columns(rows);
  }
  function columns(rows) { return Float32Array.from([0,1,2,3].flatMap(j=>rows.map(row=>row[j]))); }
  function lookAt(eye,target) {
    const z=unit(sub(eye,target)),x=unit(cross([0,-1,0],z)),y=cross(z,x);
    return columns([[...x,-dot(x,eye)],[...y,-dot(y,eye)],[...z,-dot(z,eye)],[0,0,0,1]]);
  }
  function perspective(fov,aspect,near,far) {
    const f=1/Math.tan(fov*Math.PI/360);
    return columns([[f/aspect,0,0,0],[0,f,0,0],[0,0,(far+near)/(near-far),2*far*near/(near-far)],[0,0,-1,0]]);
  }
  function multiply(a,b) {
    const out=new Float32Array(16);
    for(let col=0;col<4;col++) for(let row=0;row<4;row++)
      for(let k=0;k<4;k++) out[col*4+row]+=a[k*4+row]*b[col*4+k];
    return out;
  }
  function transform(p,q,v) {
    return rotation(q).map((row,i)=>dot(row,v)+p[i]);
  }
  return {dot,sub,cross,unit,rotation,slerp,sample,cameraView,lookAt,perspective,multiply,transform};
})();


(() => {
  const el=id=>document.getElementById(id),math=WalkthroughMath;
  const data=JSON.parse(el("walkthrough-data").textContent), poses=data.poses;
  function decode(text) {
    const bytes=Uint8Array.from(atob(text),c=>c.charCodeAt(0));
    return new Float32Array(bytes.buffer);
  }
  const initial=data.chunks?null:{points:decode(data.positions),colors:decode(data.colors)};
  const min=data.bounds?data.bounds[0].slice():[Infinity,Infinity,Infinity],max=data.bounds?data.bounds[1].slice():[-Infinity,-Infinity,-Infinity];
  if(initial) for(let i=0;i<initial.points.length;i++) { const j=i%3; min[j]=Math.min(min[j],initial.points[i]);max[j]=Math.max(max[j],initial.points[i]); }
  for(const pose of poses) for(let j=0;j<3;j++) { min[j]=Math.min(min[j],pose[j+1]);max[j]=Math.max(max[j],pose[j+1]); }
  const center=min.map((v,i)=>(v+max[i])/2),radius=Math.max(.01,Math.hypot(...max.map((v,i)=>v-min[i]))/2);
  // Frame the camera route rather than letting distant map points shift the view.
  const routeCenter=[1,2,3].map(axis=>
    (Math.min(...poses.map(p=>p[axis]))+Math.max(...poses.map(p=>p[axis])))/2);
  const homeView={"target":[0.4478115905,-0.09259909200000001,0.23658447099999996],"distance":2.025606196750372,"theta":0.6520000000000004,"phi":0.43400000000000016};
  const orbit={...homeView,target:homeView.target.slice()};
  const viewStorageKey="jiwoo-walkthrough-map-view-v1";
  try {
    const saved=JSON.parse(localStorage.getItem(viewStorageKey));
    if(saved && Array.isArray(saved.target) && saved.target.length===3 &&
       [...saved.target,saved.distance,saved.theta,saved.phi].every(Number.isFinite) &&
       saved.distance>=radius*.015 && saved.distance<=radius*100 && saved.phi>=.05 && saved.phi<=Math.PI-.05) {
      Object.assign(orbit,saved);
      el("view-status").textContent="Your saved map angle is active.";
    }
  } catch { /* Storage is optional; the viewer also works without it. */ }
  const state={index:0,playing:false,last:0,dirty:true,loaded:0,downloaded:0};
  const controls=[...document.querySelectorAll("button,input,select")];
  function counts() {
    const shown=Math.min(state.loaded,+el("budget").value);
    el("counts").textContent=shown.toLocaleString()+" shown / "+data.pointCount.toLocaleString()+" points · "+poses.length+" keyframes"+(state.loaded<data.pointCount?" · loading "+Math.round(state.downloaded/data.totalBytes*100)+"%":"");
  }
  if(data.chunks) controls.forEach(control=>control.disabled=true);
  el("frame").max=poses.length-1;
  if(poses.length===1) for(const id of ["frame","play","prev","next","restart"]) el(id).disabled=true;

  const vertex="attribute vec3 position; attribute vec3 color; uniform mat4 matrix; uniform float size; varying vec3 rgb; void main(){gl_Position=matrix*vec4(position,1.0);gl_PointSize=size;rgb=color;}";
  const fragment="precision mediump float; varying vec3 rgb; uniform bool roundPoint; void main(){if(roundPoint&&distance(gl_PointCoord,vec2(0.5))>0.5)discard;gl_FragColor=vec4(rgb,1.0);}";
  function renderer(canvas) {
    const gl=canvas.getContext("webgl",{antialias:true,preserveDrawingBuffer:false});
    if(!gl) throw Error("WebGL is unavailable. Enable browser hardware acceleration and reopen this file.");
    function shader(type,source) {
      const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);
      if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)) throw Error(gl.getShaderInfoLog(s));
      return s;
    }
    const program=gl.createProgram();
    gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS)) throw Error(gl.getProgramInfoLog(program));
    gl.useProgram(program);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);
    const attr=["position","color"].map(n=>gl.getAttribLocation(program,n));
    const uniform=["matrix","size","roundPoint"].map(n=>gl.getUniformLocation(program,n));
    const maxSize=gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE)[1];
    function buffer(values) { const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,values,gl.STATIC_DRAW);return b; }
    const cloud=[];
    const pathPoints=Float32Array.from(poses.flatMap(p=>p.slice(1,4)));
    const path=[buffer(pathPoints),buffer(Float32Array.from(poses.flatMap(()=>[.396,.847,.933])))];
    const marker=[buffer(new Float32Array(0)),buffer(new Float32Array(0))];
    function draw(buffers,count,mode,size,round,rgb8=false) {
      buffers.forEach((b,i)=>{gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.vertexAttribPointer(attr[i],3,i===1&&rgb8?gl.UNSIGNED_BYTE:gl.FLOAT,i===1&&rgb8,0,0);gl.enableVertexAttribArray(attr[i]);});
      gl.uniform1f(uniform[1],Math.min(maxSize,size));gl.uniform1i(uniform[2],round?1:0);gl.drawArrays(mode,0,count);
    }
    const onLost=e=>{e.preventDefault();state.playing=false;el("play").textContent="Play";el("play").setAttribute("aria-pressed","false");el("error").hidden=false;el("error").textContent="Graphics context lost. Reload this file to restore the viewer.";};
    canvas.addEventListener("webglcontextlost",onLost);
    const render=(view,pose,overview)=>{
      if(gl.isContextLost()) return;
      const dpr=Math.min(devicePixelRatio||1,2),w=Math.max(1,Math.round(canvas.clientWidth*dpr)),h=Math.max(1,Math.round(canvas.clientHeight*dpr));
      if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
      gl.viewport(0,0,w,h);gl.clearColor(.031,.043,.063,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
      const far=Math.max(radius*100,orbit.distance+radius*10,Math.hypot(...math.sub(pose.p,center))+radius*10);
      const projection=math.perspective(overview?55:+el("fov").value,w/h,Math.max(radius*.0001,.00001),far);
      gl.uniformMatrix4fv(uniform[0],false,math.multiply(projection,view));
      let remaining=+el("budget").value;
      for(const chunk of cloud) {
        const count=Math.min(chunk.count,remaining);
        if(count<=0) break;
        draw(chunk.buffers,count,gl.POINTS,+el("size").value*dpr,true,chunk.rgb8);
        remaining-=count;
      }
      if(overview){
        draw(path,poses.length,gl.LINE_STRIP,1,false);
        const aspect=Math.max(1,el("camera").clientWidth)/Math.max(1,el("camera").clientHeight);
        const z=radius*.10,y=z*Math.tan(+el("fov").value*Math.PI/360),x=y*aspect;
        const origin=[0,0,0],corners=[[-x,-y,z],[x,-y,z],[x,y,z],[-x,y,z]];
        const lines=corners.flatMap((p,i)=>[origin,p,p,corners[(i+1)%4]]);
        const verts=Float32Array.from(lines.flatMap(p=>math.transform(pose.p,pose.q,p)));
        gl.bindBuffer(gl.ARRAY_BUFFER,marker[0]);gl.bufferData(gl.ARRAY_BUFFER,verts,gl.DYNAMIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER,marker[1]);gl.bufferData(gl.ARRAY_BUFFER,Float32Array.from(lines.flatMap(()=>[1,.80,.28])),gl.DYNAMIC_DRAW);
        gl.disable(gl.DEPTH_TEST);draw(marker,lines.length,gl.LINES,1,false);gl.enable(gl.DEPTH_TEST);
      }
    };
    render.add=(points,colors)=>cloud.push({buffers:[buffer(points),buffer(colors)],count:points.length/3,rgb8:colors instanceof Uint8Array});
    return render;
  }
  let mapRender,cameraRender;
  try { mapRender=renderer(el("map"));cameraRender=renderer(el("camera")); }
  catch(error) { el("error").hidden=false;el("error").textContent=error.message;for(const input of document.querySelectorAll("button,input,select"))input.disabled=true;return; }
  function add(points,colors) {
    mapRender.add(points,colors);cameraRender.add(points,colors);
    state.loaded+=points.length/3;state.dirty=true;counts();
    if(state.loaded===points.length/3 && !matchMedia("(prefers-reduced-motion: reduce)").matches) setPlaying(true);
    if(controls.some(control=>control.disabled)) {
      controls.forEach(control=>control.disabled=false);
      if(poses.length===1) for(const id of ["frame","play","prev","next","restart"]) el(id).disabled=true;
    }
  }
  if(initial) add(initial.points,initial.colors);
  else {
    let next=1,failed=false;
    async function download(chunk) {
      const buffers=await Promise.all([chunk.positions,chunk.colors].map(async file=>{
        const response=await fetch(file.url);
        if(!response.ok) throw Error("Map download failed ("+response.status+"). Reload to retry.");
        const result=await response.arrayBuffer();
        if(result.byteLength!==file.bytes) throw Error("Incomplete map data. Reload to retry.");
        return result;
      }));
      if(failed) return;
      const points=new Float32Array(buffers[0]),colors=new Uint8Array(buffers[1]);
      if(points.length!==chunk.count*3||colors.length!==points.length) throw Error("Invalid map data length.");
      state.downloaded+=buffers[0].byteLength+buffers[1].byteLength;
      add(points,colors);
    }
    async function worker() {
      while(!failed&&next<data.chunks.length) { const chunk=data.chunks[next++];await download(chunk); }
    }
    (async()=>{
      await download(data.chunks[0]);
      await Promise.all(Array.from({length:3},worker));
    })().catch(error=>{
      failed=true;el("error").hidden=false;el("error").textContent=error.message;
      if(!state.loaded) controls.forEach(control=>control.disabled=true);
      else el("error").textContent+=" The loaded preview is still usable.";
    });
  }
  function setPlaying(value) { state.playing=value;state.dirty=true;el("play").textContent=value?"Pause":"Play";el("play").setAttribute("aria-pressed",String(value)); }
  function seek(index) { state.index=Math.max(0,Math.min(poses.length-1,index));setPlaying(false); }
  function fit() {
    Object.assign(orbit,homeView,{target:homeView.target.slice()});
    el("follow").checked=false;state.dirty=true;
    try { localStorage.removeItem(viewStorageKey); } catch {}
    el("view-status").textContent="Default map view restored.";
  }
  el("play").onclick=()=>{if(state.index>=poses.length-1)state.index=0;setPlaying(!state.playing);};
  el("prev").onclick=()=>seek(Math.ceil(state.index)-1);
  el("next").onclick=()=>seek(Math.floor(state.index)+1);
  el("restart").onclick=()=>seek(0);
  el("frame").oninput=e=>seek(+e.target.value);
  el("fit").onclick=fit;
  el("save-view").onclick=()=>{
    try {
      localStorage.setItem(viewStorageKey,JSON.stringify(orbit));
      el("view-status").textContent="Angle saved in this browser.";
    } catch {
      el("view-status").textContent="Browser storage unavailable; you can still adjust the view.";
    }
  };
  for(const name of ["fov","size"]) el(name).oninput=()=>{state.dirty=true;el(name+"-label").textContent=el(name).value+(name==="fov"?"°":" px");};
  el("budget").onchange=()=>{state.dirty=true;counts();};
  el("follow").onchange=()=>{state.dirty=true;};
  window.addEventListener("resize",()=>{state.dirty=true;});
  window.addEventListener("keydown",e=>{
    if(["INPUT","SELECT","BUTTON"].includes(document.activeElement.tagName))return;
    if(e.code==="Space"){e.preventDefault();el("play").click();}
    if(e.code==="ArrowLeft"){e.preventDefault();el("prev").click();}
    if(e.code==="ArrowRight"){e.preventDefault();el("next").click();}
  });
  const canvas=el("map");let drag=null;
  canvas.oncontextmenu=e=>e.preventDefault();
  canvas.onpointerdown=e=>{canvas.focus();canvas.setPointerCapture(e.pointerId);drag={x:e.clientX,y:e.clientY,pan:e.button===2||e.shiftKey};};
  canvas.onpointerup=canvas.onpointercancel=()=>{drag=null;};
  canvas.onpointermove=e=>{
    if(!drag)return;
    state.dirty=true;
    const dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag.x=e.clientX;drag.y=e.clientY;
    if(drag.pan){
      el("follow").checked=false;
      const view=math.lookAt(orbitEye(),orbit.target),scale=orbit.distance/Math.max(1,canvas.clientHeight);
      for(let i=0;i<3;i++)orbit.target[i]+=(-dx*view[i*4]+dy*view[i*4+1])*scale;
    }else{orbit.theta-=dx*.006;orbit.phi=Math.max(.05,Math.min(Math.PI-.05,orbit.phi+dy*.006));}
  };
  canvas.addEventListener("wheel",e=>{e.preventDefault();state.dirty=true;orbit.distance=Math.max(radius*.015,Math.min(radius*100,orbit.distance*Math.exp(e.deltaY*.001)));},{passive:false});
  function orbitEye() {
    const {distance:d,theta:t,phi:p,target}=orbit;
    return target.map((x,i)=>x+[d*Math.sin(p)*Math.sin(t),-d*Math.cos(p),d*Math.sin(p)*Math.cos(t)][i]);
  }
  let inView=true;
  window.addEventListener("message", event=>{
    if(event.origin===location.origin && event.source===parent && event.data?.type==="walkthrough-visibility") { inView=event.data.visible;state.last=0; }
  });
  document.addEventListener("visibilitychange",()=>{state.last=0;});
  function tick(now) {
    const dt=state.last?Math.min((now-state.last)/1000,.1):0;state.last=now;
    if(state.playing && !document.hidden && inView){
      state.dirty=true;
      state.index+=dt*+el("speed").value;
      if(state.index>poses.length-1){if(el("loop").checked)state.index=0;else{state.index=poses.length-1;setPlaying(false);}}
    }
    if(state.dirty) {
      state.dirty=false;
      const pose=math.sample(poses,state.index);
      if(el("follow").checked)orbit.target=pose.p.slice();
      mapRender(math.lookAt(orbitEye(),orbit.target),pose,true);
      cameraRender(math.cameraView(pose.p,pose.q),pose,false);
      el("frame").value=state.index;
      el("frame-label").textContent=(Math.floor(state.index)+1)+" / "+poses.length;
      el("stamp").textContent="Timestamp / frame ID: "+pose.stamp.toFixed(3);
      el("position").textContent="Camera XYZ: "+pose.p.map(x=>x.toFixed(3)).join(", ")+" · map units";
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
