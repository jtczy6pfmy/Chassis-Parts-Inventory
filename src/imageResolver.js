function normalizePartImage(raw){
  if(!raw) return '';
  let s=String(raw).trim().replaceAll('\\','/');
  if(/^https?:\/\//i.test(s) || s.startsWith('data:')) return s;
  s=s.replace(/^\.\//,'').replace(/^\//,'');
  if(s.startsWith('assets/images/')) return './'+s;
  if(s.startsWith('assets/')) return './'+s;
  if(s.includes('/')) return './'+s;
  return './assets/images/'+s;
}
function getPartImage(part){
  return normalizePartImage(part?.image || part?.imagePath || part?.image_path || part?.imageUrl || part?.image_url || part?.catalogImage || part?.catalog_image || '');
}
function findSourceCatalog(){
  const preferred=['parts','PARTS','partsCatalog','parts_catalog','chassisParts','chassisPartsCatalog','catalog'];
  for(const key of preferred){ if(Array.isArray(window[key]) && window[key].length) return window[key]; }
  for(const key of Object.keys(window)){ try{ const value=window[key]; if(Array.isArray(value)&&value.length&&typeof value[0]==='object'&&('partNumber' in value[0] || 'PartNumber' in value[0])) return value; }catch(_){} }
  return [];
}
function imageExists(url){return new Promise(resolve=>{if(!url)return resolve(false);const img=new Image();img.onload=()=>resolve(true);img.onerror=()=>resolve(false);img.src=url;});}
