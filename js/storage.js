import { getSupabase } from './supabase-client.js';
import { slugify } from './utils.js';

export async function uploadFile(bucket, file) {
  const supabase = await getSupabase();
  const now = new Date();
  const ext = (file.name.split('.').pop() || 'bin').toLowerCase();
  const base = slugify(file.name.replace(/\.[^.]+$/, '')) || 'file';
  const path = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${Date.now()}-${base}.${ext}`;

  const { error } = await supabase.storage.from(bucket).upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error('Upload thất bại: ' + error.message);

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { path, url: data.publicUrl, size: file.size };
}

export async function removeFile(bucket, path) {
  if (!path) return;
  try {
    const supabase = await getSupabase();
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) console.warn('Không xóa được file', bucket, path, error.message);
  } catch (e) {
    console.warn('Không xóa được file', bucket, path, e.message);
  }
}
