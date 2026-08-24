const LOCAL_PART_IMAGES = {
  BEN802052: './assets/images/page_003_image_01_xref_16.png'
};

// Accept the image metadata names used by different catalog exports.
const IMAGE_FIELDS = [
  'image','imagePath','image_path','imageUrl','image_url',
  'catalogImage','catalog_image','catalogImagePath','catalog_image_path',
  'imageFile','image_file','imageName','image_name','photo','photoPath','photo_path'
];

function normalizePartImage(raw){
  if(!raw) return '';

  let s=String(raw).trim().replaceAll('\\','/');

  if(/^https?:\/\//i.test(s) || s.startsWith('data:')) return s;

  s=s.replace(/^\.\//,'').replace(/^\//,'');

  // Catalog exports sometimes store a full repository-relative path.
  if(s.startsWith('assets/images/')) return './'+s;
  if(s.startsWith('assets/')) return './'+s;

  // Also accept just the image filename.
  if(!s.includes('/')) return './assets/images/'+s;

  return './'+s;
}

function getPartNumber(part){
  return String(
    part?.partNumber || part?.PartNumber || part?.part || part?.part_no ||
    part?.partNo || part?.part_number || ''
  ).trim().toUpperCase();
}

function getPartImage(part){
  const partNumber=getPartNumber(part);

  // 1. Explicit local mapping always wins.
  if(LOCAL_PART_IMAGES[partNumber]) return LOCAL_PART_IMAGES[partNumber];

  // 2. Use any image metadata already carried by the catalog record.
  for(const field of IMAGE_FIELDS){
    const existing=part?.[field];
    if(existing) return normalizePartImage(existing);
  }

  // 3. Some imports keep image metadata in a nested catalog object.
  const nested=[part?.catalog,part?.media,part?.images];
  for(const obj of nested){
    if(!obj || typeof obj!=='object') continue;
    for(const field of IMAGE_FIELDS){
      if(obj[field]) return normalizePartImage(obj[field]);
    }
  }

  return '';
}

function findSourceCatalog(){
  const preferred=['parts','PARTS','partsCatalog','parts_catalog','chassisParts','chassisPartsCatalog','catalog'];

  for(const key of preferred){
    if(Array.isArray(window[key]) && window[key].length) return window[key];
  }

  for(const key of Object.keys(window)){
    try{
      const value=window[key];
      if(Array.isArray(value) && value.length && typeof value[0]==='object' &&
        ('partNumber' in value[0] || 'PartNumber' in value[0])) return value;
    }catch(_){}
  }

  return [];
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
