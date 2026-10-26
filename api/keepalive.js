// Раз в сутки (см. vercel.json) делает лёгкий запрос к Supabase,
// чтобы бесплатный проект не уходил на паузу из-за недели без активности.
// Ключ публичный, тот же, что и в index.html.
const SUPABASE_URL = 'https://mhberhlcyhzmfhemepjy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_4vfWyH8aMDG11XIZby-Xhg_PKWnXEs4';

module.exports = async (req, res) => {
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/metrics_obr?select=id&limit=1`, {
      headers: { apikey: SUPABASE_KEY }
    });
    res.status(r.ok ? 200 : 502).json({ ok: r.ok, status: r.status, at: new Date().toISOString() });
  } catch (e) {
    res.status(502).json({ ok: false, error: String(e && e.message || e), at: new Date().toISOString() });
  }
};
