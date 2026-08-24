const LOCAL_PART_IMAGES = {
  BEN802052: './assets/images/page_003_image_01_xref_16.png'
};

const MARTEC_PART_IMAGES = {
  // Add verified Martec image URLs here as they are identified.
  // BEN802052 is intentionally local-first because the repository
  // already contains the catalog image.
};

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

function getPartNumber(part){
  return String(
    part?.partNumber ||
    part?.PartNumber ||
    part?.part ||
    ''
  ).trim().toUpperCase();
}

function getPartImage(part){
  const partNumber=getPartNumber(part);

  // OPTION C — 1. LOCAL REPOSITORY IMAGE
  if(LOCAL_PART_IMAGES[partNumber]){
    return LOCAL_PART_IMAGES[partNumber];
  }

  // Existing image fields from parts.json
  const existing=
    part?.image ||
    part?.imagePath ||
    part?.image_path ||
    part?.imageUrl ||
    part?.image_url ||
    part?.catalogImage ||
    part?.catalog_image ||
    '';

  if(existing){
    return normalizePartImage(existing);
  }

  // OPTION C — 2. VERIFIED MARTEC IMAGE
  if(MARTEC_PART_IMAGES[partNumber]){
    return MARTEC_PART_IMAGES[partNumber];
  }

  // OPTION C — 3. NO IMAGE
  return '';
}

function findSourceCatalog(){
  const preferred=[
    'parts',
    'PARTS',
    'partsCatalog',
    'parts_catalog',
    'chassisParts',
    'chassisPartsCatalog',
    'catalog'
  ];

  for(const key of preferred){
    if(Array.isArray(window[key]) && window[key].length){
      return window[key];
    }
  }

  for(const key of Object.keys(window)){
    try{
      const value=window[key];

      if(
        Array.isArray(value) &&
        value.length &&
        typeof value[0]==='object' &&
        ('partNumber' in value[0] || 'PartNumber' in value[0])
      ){
        return value;
      }
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
