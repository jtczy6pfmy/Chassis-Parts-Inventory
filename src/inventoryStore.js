const CPI_STORAGE_KEY='cpi-phase3-v2';
function partKey(p){return String(p?.partNumber||p?.PartNumber||p?.part||'').trim();}
function sourceImage(p){return p?.image||p?.imagePath||p?.image_path||p?.imageUrl||p?.image_url||p?.catalogImage||p?.catalog_image||'';}
function loadInventoryState(sourceParts=[]){
 const suppliers=['FleetPride','Parts Authority','Wabash Parts','OEM Supply','Mid-Atlantic Fleet'];
 const locations=['Harrisburg • Rack A • Bin 04','Harrisburg • Rack B • Bin 12','Warehouse • Shelf C • Bin 07','Parts Room • Rack D • Bin 02'];
 let old=null; try{old=JSON.parse(localStorage.getItem('cpi-phase3-v2')||localStorage.getItem('cpi-phase2-v1')||'null')}catch(_){ }
 const oldByPart=new Map((old?.catalog||[]).map(p=>[partKey(p),p]));
 const catalog=sourceParts.map((p,i)=>{const key=partKey(p),prior=oldByPart.get(key)||{};return{...p,partNumber:key||`PART-${i+1}`,description:p.description||p.Description||prior.description||'Chassis replacement part',image:sourceImage(p)||prior.image||'',stock:Number.isFinite(prior.stock)?prior.stock:(i%11===0?0:2+(i*7)%48),cost:Number.isFinite(prior.cost)?prior.cost:+(8+(i*13)%115+.95).toFixed(2),supplier:p.supplier||p.Supplier||prior.supplier||suppliers[i%suppliers.length],location:p.location||p.Location||prior.location||locations[i%locations.length],usage:Array.isArray(prior.usage)?prior.usage:Array.from({length:8},(_,w)=>3+(i*5+w*3)%21),min:prior.min||[10,6,3][i%3],target:prior.target||[30,18,10][i%3]};});
 return{catalog:catalog.length?catalog:(old?.catalog||[]),tx:old?.tx||[],pos:old?.pos||[]};
}
function saveInventoryState(state){try{localStorage.setItem(CPI_STORAGE_KEY,JSON.stringify(state))}catch(_){} }
function inventoryReducer(state,action){switch(action.type){case'ISSUE':return{...state,catalog:state.catalog.map(p=>p.partNumber===action.partNumber?{...p,stock:Math.max(0,p.stock-action.qty),usage:p.usage.map((n,i)=>i===7?n+action.qty:n)}:p),tx:[...state.tx,{date:new Date().toISOString(),part:action.partNumber,type:'ISSUE',qty:action.qty,ref:action.ref||`WEB-${Date.now()}`}]};case'RECEIVE':return{...state,catalog:state.catalog.map(p=>p.partNumber===action.partNumber?{...p,stock:p.stock+action.qty}:p),tx:[...state.tx,{date:new Date().toISOString(),part:action.partNumber,type:'RECEIVE',qty:action.qty,ref:action.ref||`WEB-${Date.now()}`}]};case'CREATE_PO':return{...state,pos:[...state.pos,action.po]};default:return state;}}
function apiClient(baseUrl=''){return{async get(path){return fetch(baseUrl+path).then(r=>{if(!r.ok)throw new Error(`GET ${path}: ${r.status}`);return r.json()})},async post(path,body){return fetch(baseUrl+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}).then(r=>{if(!r.ok)throw new Error(`POST ${path}: ${r.status}`);return r.json()})}}}
