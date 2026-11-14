// Đọc supabase.txt (dạng KEY=VALUE), bỏ dòng trống và dòng bắt đầu bằng #
let cachedConfig = null;

export async function loadConfig() {
  if (cachedConfig) return cachedConfig;

  const res = await fetch('supabase.txt', { cache: 'no-store' });
  if (!res.ok) throw new Error('Không đọc được file supabase.txt. Hãy chạy bằng Live Server.');

  const text = await res.text();
  const config = {};
  text.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const idx = trimmed.indexOf('=');
    if (idx === -1) return;
    config[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
  });

  if (!config.SUPABASE_URL || !config.SUPABASE_ANON_KEY) {
    throw new Error('supabase.txt thiếu SUPABASE_URL hoặc SUPABASE_ANON_KEY');
  }
  cachedConfig = config;
  return config;
}
