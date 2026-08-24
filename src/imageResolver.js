const LOCAL_PART_IMAGES = {
  BEN802052: './assets/images/page_003_image_01_xref_16.png'
};

const IMAGE_FIELDS = [
  'image','imagePath','image_path','imageUrl','image_url',
  'catalogImage','catalog_image','catalogImagePath','catalog_image_path',
  'catalogImageUrl','catalog_image_url','catalogImageFile','catalog_image_file',
  'imageFile','image_file','imageName','image_name','imageFilename','image_filename',
  'photo','photoPath','photo_path','photoFile','photo_file','picture','picturePath','picture_path'
];

function normalizePartImage(raw){
  if(!raw) return '';
  let s=String(raw).trim().replaceAll('\\','/');
  if(/^https?:\/\//i.test(s) || s.startsWith('data:')) return s;
  s=s.replace(/^\.\//,'').replace(/^\//,'');
  if(s.startsWith('assets/images/')) return './'+s;
  if(s.startsWith('assets/')) return './'+s;
  if(!s.includes('/')) return './assets/images/'+s;
  return './'+s;
}

function getPartNumber(part){
  return String(part?.partNumber||part?.PartNumber||part?.part||part?.part_no||part?.partNo||part?.part_number||'').trim().toUpperCase();
}

function getImageFromRecord(record){
  if(!record || typeof record!=='object') return '';
  for(const field of IMAGE_FIELDS){
    if(record[field]) return normalizePartImage(record[field]);
  }
  const nested=[record.catalog,record.media,record.images,record.imageData,record.image_data];
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
      if(Array.isArray(value) && value.length && typeof value[0]==='object' && ('partNumber' in value[0] || 'PartNumber' in value[0])) return value;
    }catch(_){}
  }
  return [];
}

function getPartImage(part){
  const partNumber=getPartNumber(part);
  if(LOCAL_PART_IMAGES[partNumber]) return LOCAL_PART_IMAGES[partNumber];

  const direct=getImageFromRecord(part);
  if(direct) return direct;

  // The inventory store normalizes records and can drop catalog image fields.
  // Look the part back up in the original parts.js catalog.
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
