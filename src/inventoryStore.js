const CPI_STORAGE_KEY='cpi-phase3-v2';
const CPI_DEMO_VERSION='realistic-demo-v2';
function partKey(p){return String(p?.partNumber||p?.PartNumber||p?.part||'').trim();}
function sourceImage(p){
  if(typeof getImageFromRecord==='function') return getImageFromRecord(p)||'';
  return p?.image||p?.imagePath||p?.image_path||p?.imageUrl||p?.image_url||p?.catalogImage||p?.catalog_image||'';
}
function demoStock(i,min,target,prior){
  if(Number.isFinite(prior)) return prior;
  const profile=i%20;
  if(profile===0||profile===13) return 0;
  if(profile===4||profile===11||profile===18) return Math.max(1,Math.ceil(min*.45));
  if(profile===7||profile===16) return Math.max(min+1,Math.round(target*.8));
  if(profile===9||profile===19) return Math.max(min+2,Math.round(target*1.35));
  const cycle=[.55,.72,.9,1.05,1.2,.65,.82,1.1];
  return Math.max(1,Math.round(target*cycle[i%cycle.length]));
}
function demoUsage(i,min){const demand=i%5===0?1.45:i%5===1?1.2:i%5===2?.85:i%5===3?.6:.4;return Array.from({length:8},(_,w)=>Math.max(1,Math.round((min*.7+((i*7+w*5)%Math.max(4,min+8)))*demand)));}
function loadInventoryState(sourceParts=[]){
 const suppliers=['FleetPride','Parts Authority','Wabash Parts','OEM Supply','Mid-Atlantic Fleet'];
 const locations=['Harrisburg • Rack A • Bin 04','Harrisburg • Rack B • Bin 12','Warehouse • Shelf C • Bin 07','Parts Room • Rack D • Bin 02'];
 let old=null; try{old=JSON.parse(localStorage.getItem(CPI_STORAGE_KEY)||localStorage.getItem('cpi-phase2-v1')||'null')}catch(_){ }
 const keepDemo=old?.demoVersion===CPI_DEMO_VERSION; const oldByPart=new Map((old?.catalog||[]).map(p=>[partKey(p),p]));
 const catalog=sourceParts.map((p,i)=>{const key=partKey(p),prior=oldByPart.get(key)||{};const min=Number.isFinite(prior.min)?prior.min:(i%3===0?10:i%3===1?6:3);const target=Number.isFinite(prior.target)?prior.target:(i%3===0?30:i%3===1?18:10);return{...p,partNumber:key||`PART-${i+1}`,description:p.description||p.Description||prior.description||'Chassis replacement part',image:sourceImage(p)||prior.image||'',stock:demoStock(i,min,target,keepDemo&&Number.isFinite(prior.stock)?prior.stock:undefined),cost:Number.isFinite(prior.cost)?prior.cost:+(8+(i*13)%115+.95).toFixed(2),supplier:p.supplier||p.Supplier||prior.supplier||suppliers[i%suppliers.length],location:p.location||p.Location||prior.location||locations[i%locations.length],usage:keepDemo&&Array.isArray(prior.usage)?prior.usage:demoUsage(i,min),min,target};});
 return{catalog:catalog.length?catalog:(old?.catalog||[]),tx:keepDemo?(old?.tx||[]):[],pos:keepDemo?(old?.pos||[]):[],demoVersion:CPI_DEMO_VERSION};
}
function saveInventoryState(state){try{localStorage.setItem(CPI_STORAGE_KEY,JSON.stringify(state))}catch(_){} }
function inventoryReducer(state,action){switch(action.type){case'ISSUE':return{...state,catalog:state.catalog.map(p=>p.partNumber===action.partNumber?{...p,stock:Math.max(0,p.stock-action.qty),usage:p.usage.map((n,i)=>i===7?n+action.qty:n)}:p),tx:[...state.tx,{date:new Date().toISOString(),part:action.partNumber,type:'ISSUE',qty:action.qty,ref:action.ref||`WEB-${Date.now()}`,reason:action.reason||'',workOrder:action.workOrder||''}]};case'RECEIVE':return{...state,catalog:state.catalog.map(p=>p.partNumber===action.partNumber?{...p,stock:p.stock+action.qty}:p),tx:[...state.tx,{date:new Date().toISOString(),part:action.partNumber,type:'RECEIVE',qty:action.qty,ref:action.ref||`WEB-${Date.now()}`,reason:action.reason||'Receipt',workOrder:action.workOrder||''}]};case'CREATE_PO':return{...state,pos:[...state.pos,action.po]};case'UPDATE_PO':return{...state,pos:state.pos.map(p=>p.number===action.number?{...p,...action.changes}:p)};case'RECEIVE_PO':{const po=state.pos.find(p=>p.number===action.number);if(!po)return state;const catalog=state.catalog.map(p=>{const item=po.items.find(i=>i.partNumber===p.partNumber);return item?{...p,stock:p.stock+Number(item.qty||0)}:p});const tx=[...state.tx,...po.items.map(i=>({date:new Date().toISOString(),part:i.partNumber,type:'RECEIVE',qty:Number(i.qty||0),ref:po.number,reason:'Purchase order receipt',workOrder:''}))];return{...state,catalog,tx,pos:state.pos.map(p=>p.number===action.number?{...p,status:'Received',receivedAt:new Date().toISOString()}:p)}}case'CYCLE_COUNT':{const item=state.catalog.find(p=>p.partNumber===action.partNumber);if(!item)return state;const qty=Math.max(0,Number(action.qty)||0),variance=qty-item.stock;return{...state,catalog:state.catalog.map(p=>p.partNumber===action.partNumber?{...p,stock:qty}:p),tx:[...state.tx,{date:new Date().toISOString(),part:action.partNumber,type:'COUNT',qty,variance,ref:action.ref||`COUNT-${Date.now()}`,reason:'Physical cycle count',workOrder:''}]}}default:return state;}}
function apiClient(baseUrl=''){return{async get(path){return fetch(baseUrl+path).then(r=>{if(!r.ok)throw new Error(`GET ${path}: ${r.status}`);return r.json()})},async post(path,body){return fetch(baseUrl+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}).then(r=>{if(!r.ok)throw new Error(`POST ${path}: ${r.status}`);return r.json()})}}}
