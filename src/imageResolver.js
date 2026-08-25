const LOCAL_PART_IMAGES = {
  BEN802052: 'assets/images/page_003_image_01_xref_16.png'
};

const IMAGE_FIELDS = [
  'image','imagePath','image_path','imageUrl','image_url',
  'catalogImage','catalog_image','catalogImagePath','catalog_image_path',
  'catalogImageUrl','catalog_image_url','catalogImageFile','catalog_image_file',
  'imageFile','image_file','imageName','image_name','imageFilename','image_filename',
  'photo','photoPath','photo_path','photoFile','photo_file',
  'picture','picturePath','picture_path','thumbnail','thumbnailPath','thumbnail_path',
  'img','imgPath','img_path','imgUrl','img_url','catalogImg','catalog_img',
  'catalogPhoto','catalog_photo','file','filename','fileName','path','src'
];

const IMAGE_RE=/\.(?:png|jpe?g|webp|gif|bmp|svg)(?:\?.*)?$/i;

function getRepoBasePath() {
  const pathSegments = window.location.pathname.split('/').filter(Boolean);
  // If hosted on GitHub Pages under a repository name, prepend the repo name
  if (window.location.hostname.includes('github.io') && pathSegments.length > 0) {
    return '/' + pathSegments[0] + '/';
  }
  return './';
}

function normalizePartImage(raw){
  if(!raw) return '';
  let s=String(raw).trim().replaceAll('\\','/');
  if(/^https?:\/\//i.test(s) || s.startsWith('data:')) return s;
  
  s=s.replace(/^\.\//,'').replace(/^\//,'');
  const basePath = getRepoBasePath();

  if(s.startsWith('assets/')) return basePath + s;
  if(!s.includes('/')) return basePath + 'assets/images/' + s;
  
  return basePath + s;
}

function getPartNumber(part){
  return String(part?.partNumber||part?.PartNumber||part?.part||part?.part_no||part?.partNo||part?.part_number||'').trim().toUpperCase();
}

function getImageFromRecord(record){
  if(!record || typeof record!=='object') return '';
  for(const field of IMAGE_FIELDS){
    const value=record[field];
    if(typeof value==='string' && (IMAGE_RE.test(value) || /assets\/images|page_\d+_image_/i.test(value))) return normalizePartImage(value);
  }
  const seen=new Set();
  function walk(value,depth=0){
    if(!value || depth>5 || seen.has(value)) return '';
    if(typeof value==='string'){
      return IMAGE_RE.test(value) || /assets\/images|page_\d+_image_/i.test(value) ? normalizePartImage(value) : '';
    }
    if(typeof value!=='object') return '';
    seen.add(value);
    if(Array.isArray(value)){
      for(const item of value){const found=walk(item,depth+1);if(found)return found;}
      return '';
    }
    for(const [key,val] of Object.entries(value)){
      if(/image|photo|picture|thumbnail|media|file|path|src|url/i.test(key)){
        const found=walk(val,depth+1);if(found)return found;
      }
    }
    return '';
  }
  return walk(record);
}

function findSourceCatalog(){
  const preferred=['parts','PARTS','partsCatalog','parts_catalog','chassisParts','chassisPartsCatalog','catalog','PARTS_CATALOG','partsList','partList'];
  for(const key of preferred){
    if(Array.isArray(window[key]) && window[key].length) return window[key];
  }
  for(const key of Object.keys(window)){
    try{
      const value=window[key];
      if(Array.isArray(value) && value.length && typeof value[0]==='object' && ('partNumber' in value[0] || 'PartNumber' in value[0] || 'part' in value[0])) return value;
    }catch(_){}
  }
  return [];
}

function getPartImage(part){
  const partNumber=getPartNumber(part);
  if(LOCAL_PART_IMAGES[partNumber]) return normalizePartImage(LOCAL_PART_IMAGES[partNumber]);
  const direct=getImageFromRecord(part);
  if(direct) return direct;
  if(partNumber){
    const source=findSourceCatalog();
    const sourcePart=source.find(p=>getPartNumber(p)===partNumber);
    const sourceImage=getImageFromRecord(sourcePart);
    if(sourceImage) return sourceImage;
  }
  return '';
}

function imageExists(url){
  return new Promise(resolve=>{
    if(!url) return resolve(false);
    const img=new Image();
    img.onload=()=>resolve(true);
    img.onerror=()=>resolve(false);
    img.src=url;
  });
}
