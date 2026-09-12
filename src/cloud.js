const CPI_SUPABASE_URL='https://lavsuaojwyzavwtbgkcs.supabase.co';
const CPI_SUPABASE_KEY_STORAGE='cpi-supabase-publishable-key';

function getCpiSupabaseKey(){
  try{return localStorage.getItem(CPI_SUPABASE_KEY_STORAGE)||'';}catch(_){return '';}
}

function setCpiSupabaseKey(key){
  const clean=String(key||'').trim();
  if(!clean) throw new Error('A Supabase publishable key is required.');
  localStorage.setItem(CPI_SUPABASE_KEY_STORAGE,clean);
  return clean;
}

function clearCpiSupabaseKey(){
  try{localStorage.removeItem(CPI_SUPABASE_KEY_STORAGE);}catch(_){}
}

function getCpiSupabaseClient(){
  const key=getCpiSupabaseKey();
  if(!key) return null;
  if(!window.supabase?.createClient) throw new Error('Supabase library did not load.');
  return window.supabase.createClient(CPI_SUPABASE_URL,key);
}

window.CPI_CLOUD_URL=CPI_SUPABASE_URL;
window.getCpiSupabaseKey=getCpiSupabaseKey;
window.setCpiSupabaseKey=setCpiSupabaseKey;
window.clearCpiSupabaseKey=clearCpiSupabaseKey;
window.getCpiSupabaseClient=getCpiSupabaseClient;
