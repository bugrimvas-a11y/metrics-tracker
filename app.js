window.__appReady = true;
const SUPABASE_URL = 'https://mhberhlcyhzmfhemepjy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_4vfWyH8aMDG11XIZby-Xhg_PKWnXEs4';
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

const charts = {};

// ── Конфигурация показателей отделов ──────────────────────────────────────
// Единый источник для формы, истории и текста для ИИ.
// t: 'i' — целое, 'f' — число с дробью, 's' — текст; d — число знаков после запятой
const DEP_CFG = {
  obr: {
    title: 'Обработка запросов', table: 'metrics_obr', monthly: false,
    fields: [
      { col: 'score', id: 'obr-score', t: 'f', d: 2, label: 'Оценка клиентов', short: 'Оценка' },
      { col: 'total_requests', id: 'obr-total', t: 'i', label: 'Количество запросов', short: 'Запросов' },
      { col: 'expired_requests', id: 'obr-expired', t: 'i', label: 'Просроченных запросов', short: 'Просроченных' }
    ],
    derived: [
      { short: '% просрочки', label: 'Доля просроченных запросов',
        calc: r => r.total_requests ? (r.expired_requests || 0) / r.total_requests * 100 : null }
    ]
  },
  okk: {
    title: 'ОКК (контроль качества)', table: 'metrics_okk', monthly: false,
    fields: [
      { col: 'rejected', id: 'okk-rejected', t: 'i', label: 'Забраковано всего, руб.', short: 'Забраковано, ₽' },
      { col: 'restored', id: 'okk-restored', t: 'i', label: 'С решением по восстановлению, руб.', short: 'С решением, ₽' },
      { col: 'no_solution', id: 'okk-no-solution', t: 'i', label: 'Без решения по восстановлению, руб.', short: 'Без решения, ₽' },
      { col: 'sort_count', id: 'okk-sort-count', t: 'i', label: 'Количество сортировки, шт.', short: 'Сортировка, шт' },
      { col: 'sort_sum', id: 'okk-sort-sum', t: 'f', label: 'Сумма сортировки, руб.', short: 'Сортировка, ₽' },
      { col: 'opt_count', id: 'okk-opt-count', t: 'i', label: 'Выведено в ОПТ после сортировки, шт.', short: 'В ОПТ, шт' },
      { col: 'opt_sum', id: 'okk-opt-sum', t: 'f', label: 'Выведено в ОПТ после сортировки, руб.', short: 'В ОПТ, ₽' },
      { col: 'rec_new', id: 'okk-rec-new', t: 'i', label: 'Сформировано рекламаций поставщикам за неделю', short: 'Рекл. новых' },
      { col: 'rec_in_work', id: 'okk-rec-work', t: 'i', label: 'Задач в работе по претензиям', short: 'Рекл. в работе' },
      { col: 'rec_done', id: 'okk-rec-done', t: 'i', label: 'Завершённых задач по претензиям', short: 'Рекл. завершено' },
      { col: 'trainings', id: 'okk-training', t: 'i', label: 'Количество обучений', short: 'Обучений' },
      { col: 'inspections', id: 'okk-inspections', t: 'i', label: 'Количество инспекций', short: 'Инспекций' },
      { col: 'feedback_total', id: 'okk-fb-total', t: 'i', label: 'Обратная связь, всего', short: 'Обр. связь' },
      { col: 'feedback_expired', id: 'okk-fb-expired', t: 'i', label: 'Обратная связь, просроченных', short: 'Обр. связь просроч.' }
    ]
  },
  sklad: {
    title: 'Склад Брак', table: 'metrics_sklad', monthly: false,
    fields: [
      { col: 'alt_sum', id: 'sklad-alt-sum', t: 'f', label: 'Сумма остатка "Альт", руб.', short: 'Остаток "Альт", ₽' },
      { col: 'contractor_count', id: 'sklad-cont-count', t: 'i', label: 'Отправлено подрядчикам, шт.', short: 'Подрядчикам, шт' },
      { col: 'contractor_sum', id: 'sklad-cont-sum', t: 'f', label: 'Отправлено подрядчикам, руб.', short: 'Подрядчикам, ₽' },
      { col: 'brak_count', id: 'sklad-brak-count', t: 'i', label: 'Остаток брака, шт.', short: 'Остаток брака, шт' },
      { col: 'brak_sum', id: 'sklad-brak-sum', t: 'f', label: 'Остаток брака, руб.', short: 'Остаток брака, ₽' },
      { col: 'cons_count', id: 'sklad-cons-count', t: 'i', label: 'Консолидация "один короб — один артикул", кол-во', short: 'Консолидация, кол.' },
      { col: 'cons_sum', id: 'sklad-cons-sum', t: 'f', label: 'Консолидация "один короб — один артикул", руб.', short: 'Консолидация, ₽' }
    ]
  },
  or: {
    title: 'Отдел рекламаций (ОР)', table: 'metrics_or', monthly: false,
    fields: [
      { col: 'closed_recs', id: 'or-closed', t: 'i', label: 'Количество завершённых задач', short: 'Закрыто' },
      { col: 'errors', id: 'or-errors', t: 'i', label: 'Ошибок при разборе рекламаций', short: 'Ошибок' },
      { col: 'feedback', id: 'or-feedback', t: 'i', label: 'Обратная связь от смежных подразделений', short: 'Обр. связь' },
      { col: 'main_reason', id: 'or-reason', t: 's', label: 'Основная причина обратной связи', short: 'Причина обр. связи' },
      { col: 'avg_close_hours', id: 'or-avg-time', t: 'f', label: 'Среднее время закрытия, сек', short: 'Ср. закрытие, сек' },
      { col: 'accept_time', id: 'or-accept-time', t: 'f', label: 'Среднее время принятия, сек', short: 'Ср. принятие, сек' },
      { col: 'score_speed', id: 'or-score-speed', t: 'f', label: 'Оценка скорости обработки', short: 'Оценка скорости' },
      { col: 'score_lk', id: 'or-score-lk', t: 'f', label: 'Оценка удобства ЛК', short: 'Оценка ЛК' }
    ],
    derived: [
      { short: '% ошибок', label: 'Доля ошибок от завершённых задач',
        calc: r => r.closed_recs ? (r.errors || 0) / r.closed_recs * 100 : null }
    ]
  },
  dik: {
    title: 'Метрики директора', table: 'metrics_dik', monthly: true,
    fields: [
      { col: 'rec_pct', id: 'dik-rec-pct', t: 'f', d: 2, label: 'Доля рекламаций, %', short: 'Доля рекл., %' },
      { col: 'rec_money_pct', id: 'dik-rec-money-pct', t: 'f', d: 2, label: 'Доля рекламаций в деньгах, %', short: 'Доля в деньгах, %' },
      { col: 'rec_sum', id: 'dik-rec-sum', t: 'f', label: 'Сумма рекламаций, руб.', short: 'Сумма рекл., ₽' },
      { col: 'china_total', id: 'dik-china-total', t: 'i', label: 'Инспекций', short: 'Инспекций' },
      { col: 'china_ok', id: 'dik-china-ok', t: 'i', label: 'Инспекций без просрочек', short: 'Без просрочек' }
    ]
  }
};

function fmtVal(f, v) {
  if (v === null || v === undefined || v === '') return '—';
  if (f.t === 's') return String(v);
  const n = Number(v);
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString('ru', { minimumFractionDigits: f.d ?? 0, maximumFractionDigits: f.d ?? 2 });
}

function fmtDate(d) {
  return new Date(d).toLocaleDateString('ru', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// Текущая неделя по той же формуле, что и неделя по умолчанию в боковой панели
function currentWeekNow() {
  const now = new Date();
  const yr = now.getFullYear();
  const start = new Date(yr, 0, 1);
  const wn = Math.ceil(((now - start) / 86400000 + start.getDay() + 1) / 7);
  return { year: yr, week: wn };
}

function getWeek() {
  const w = document.getElementById('global-week').value;
  if (!w) return null;
  const [yr, wk] = w.split('-W');
  return { week_number: parseInt(wk), year: parseInt(yr), label: `Нед ${wk}/${yr}` };
}

function setDefaultWeek() {
  const c = currentWeekNow();
  document.getElementById('global-week').value = `${c.year}-W${String(c.week).padStart(2, '0')}`;
}

function showToast(msg, isError = false) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show' + (isError ? ' error' : '');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 3000);
}

function showPage(id, el) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('page-' + id).classList.add('active');
  el.classList.add('active');
  updateWeekLabels();
  if (id === 'dash') loadDash('obr');
  else if (id === 'prob') loadProblems();
  else if (id === 'plan') {
    const t = document.querySelector('#plan-dept-tabs .sub-tab.active');
    if (t) switchPlanDept(t.dataset.dept, t);
  }
  else { loadHistory(id); ensureFormLoaded(id); }
}

function updateWeekLabels() {
  const w = getWeek();
  if (!w) return;
  ['obr', 'okk', 'sklad', 'or', 'dik'].forEach(d => {
    const el = document.getElementById(d + '-week-label');
    if (el) el.textContent = `Неделя ${w.week_number}, ${w.year} г.` + (corrText[d] || '');
  });
}

document.getElementById('global-week').addEventListener('change', () => {
  updateWeekLabels();
  const active = document.querySelector('.page.active');
  if (active) {
    const id = active.id.replace('page-', '');
    if (id === 'dash') loadDash(document.querySelector('.sub-tab.active')?.dataset?.id || 'obr');
    else { loadHistory(id); ensureFormLoaded(id); }
  }
});

// ── Период формы (неделя или месяц) ───────────────────────────────────────
// isPast = период уже закончился: его заполнение или правка считается корректировкой
function getPeriod(dep) {
  if (dep === 'dik') {
    const dm = getDikMonth();
    if (!dm) return null;
    const now = new Date();
    return {
      keys: { month_number: dm.month, year: dm.year },
      conflict: 'month_number,year',
      isPast: dm.year * 100 + dm.month < now.getFullYear() * 100 + (now.getMonth() + 1),
      label: 'Метрики за ' + dm.label
    };
  }
  const w = getWeek();
  if (!w) return null;
  const c = currentWeekNow();
  return {
    keys: { week_number: w.week_number, year: w.year },
    conflict: 'week_number,year',
    isPast: w.year * 100 + w.week_number < c.year * 100 + c.week,
    label: `Неделя ${w.week_number}, ${w.year} г.`
  };
}

function readForm(dep) {
  const out = {};
  DEP_CFG[dep].fields.forEach(f => {
    const raw = document.getElementById(f.id).value.trim();
    if (raw === '') { out[f.col] = null; return; }
    if (f.t === 's') { out[f.col] = raw; return; }
    const n = f.t === 'i' ? parseInt(raw, 10) : parseFloat(raw);
    out[f.col] = Number.isFinite(n) ? n : null;
  });
  return out;
}

function sameVal(a, b) {
  const na = (a === undefined || a === null || a === '') ? null : a;
  const nb = (b === undefined || b === null || b === '') ? null : b;
  if (na === null || nb === null) return na === nb;
  if (typeof na === 'number' || typeof nb === 'number') return Number(na) === Number(nb);
  return String(na).trim() === String(nb).trim();
}

function setFieldsValues(dep, row) {
  DEP_CFG[dep].fields.forEach(f => {
    const el = document.getElementById(f.id);
    if (!el) return;
    el.value = row && row[f.col] !== null && row[f.col] !== undefined ? row[f.col] : '';
    el.dispatchEvent(new Event('input')); // обновить подсказки о норме
  });
}

// Пометка "скорректировано" в подписи страницы
const corrText = {};
function applyCorrNote(dep, row) {
  corrText[dep] = row && row.corrected_at ? ` · скорректировано ${fmtDate(row.corrected_at)}` : '';
  if (dep === 'dik') {
    const per = getPeriod('dik');
    const el = document.getElementById('dik-month-label');
    if (per && el) el.textContent = per.label + corrText.dik;
  } else {
    updateWeekLabels();
  }
}

// ── SAVE ──────────────────────────────────────────────────────────────────
async function saveForm(dep) {
  const cfg = DEP_CFG[dep];
  const per = getPeriod(dep);
  if (!per) { showToast(dep === 'dik' ? 'Выберите месяц' : 'Выберите неделю', true); return; }
  const btn = document.getElementById(dep + '-save-btn');
  btn.disabled = true; btn.textContent = 'Сохранение...';
  try {
    const values = readForm(dep);
    const { data: existing, error: selErr } = await db.from(cfg.table).select('*').match(per.keys).maybeSingle();
    if (selErr) throw selErr;
    if (existing && cfg.fields.every(f => sameVal(existing[f.col], values[f.col]))) {
      showToast('Изменений нет, данные уже сохранены');
      return;
    }
    const payload = { ...per.keys, ...values };
    if (per.isPast) payload.corrected_at = new Date().toISOString();
    const { error } = await db.from(cfg.table).upsert(payload, { onConflict: per.conflict });
    if (error) throw error;
    showToast(per.isPast ? '✓ Данные за прошлый период сохранены, дата корректировки записана' : '✓ Данные сохранены');
    applyCorrNote(dep, per.isPast ? payload : existing);
    loadHistory(dep);
  } catch (e) {
    showToast('Ошибка: ' + (e.message || e), true);
  } finally {
    btn.disabled = false; btn.textContent = 'Сохранить';
  }
}

function tableFor(dep) {
  return { obr: 'metrics_obr', okk: 'metrics_okk', sklad: 'metrics_sklad', or: 'metrics_or' }[dep];
}

// ── LOAD FORM ─────────────────────────────────────────────────────────────
const loadedKey = {};  // для какого периода форма отдела уже загружена
const formReq = {};

// manual = true: нажата кнопка "Загрузить сохранённое";
// manual = false: автозагрузка при смене недели/месяца или открытии раздела
async function loadForm(dep, manual = true) {
  const cfg = DEP_CFG[dep];
  const per = getPeriod(dep);
  if (!per) { if (manual) showToast(dep === 'dik' ? 'Выберите месяц' : 'Выберите неделю', true); return; }
  const req = (formReq[dep] = (formReq[dep] || 0) + 1);
  if (!manual) { setFieldsValues(dep, null); applyCorrNote(dep, null); } // не оставляем цифры другой недели
  const { data, error } = await db.from(cfg.table).select('*').match(per.keys).maybeSingle();
  if (req !== formReq[dep]) return; // за время запроса выбрали другой период
  if (error) {
    loadedKey[dep] = null;
    showToast('Не удалось загрузить данные: ' + error.message, true);
    return;
  }
  if (!data) { if (manual) showToast('Данных за этот период нет', true); return; }
  setFieldsValues(dep, data);
  applyCorrNote(dep, data);
  if (manual) showToast('Данные загружены');
}

function ensureFormLoaded(dep) {
  if (!DEP_CFG[dep]) return;
  const per = getPeriod(dep);
  if (!per) return;
  const key = JSON.stringify(per.keys);
  if (loadedKey[dep] === key) return; // этот период уже в форме, введённое не затираем
  loadedKey[dep] = key;
  loadForm(dep, false);
}

function setv(id, v) {
  const el = document.getElementById(id);
  if (el && v !== null && v !== undefined) el.value = v;
}

// ── HISTORY ───────────────────────────────────────────────────────────────
async function loadHistory(dep) {
  const cfg = DEP_CFG[dep];
  const container = document.getElementById(dep + '-history');
  if (!cfg || !container) return;
  const { data, error } = await db.from(cfg.table).select('*')
    .order('year', { ascending: false })
    .order(cfg.monthly ? 'month_number' : 'week_number', { ascending: false })
    .limit(8);
  if (error) {
    container.innerHTML = `<p style="color:var(--err);font-size:13px">Не удалось загрузить историю: ${probEsc(error.message)}
      <button class="btn" style="margin-left:8px;padding:4px 12px;font-size:12px" onclick="loadHistory('${dep}')">Повторить</button></p>`;
    return;
  }
  if (!data || !data.length) { container.innerHTML = '<p style="color:var(--muted);font-size:13px">Данных пока нет</p>'; return; }

  const derived = cfg.derived || [];
  let html = '<div style="overflow-x:auto"><table class="hist-table"><thead><tr>';
  html += `<th class="hist-sticky">${cfg.monthly ? 'Месяц' : 'Неделя'}</th>`;
  cfg.fields.forEach(f => html += `<th>${probEsc(f.short)}</th>`);
  derived.forEach(d => html += `<th>${probEsc(d.short)}</th>`);
  html += '<th>Корректировка</th></tr></thead><tbody>';
  data.forEach(r => {
    html += '<tr>';
    html += `<td class="hist-sticky">${cfg.monthly ? `${r.month_number}/${r.year}` : `Нед ${r.week_number}/${r.year}`}</td>`;
    cfg.fields.forEach(f => {
      const v = fmtVal(f, r[f.col]);
      html += f.t === 's'
        ? `<td title="${probEsc(v)}" style="max-width:220px;overflow:hidden;text-overflow:ellipsis">${probEsc(v)}</td>`
        : `<td>${v}</td>`;
    });
    derived.forEach(d => {
      const v = d.calc(r);
      html += `<td>${v === null ? '—' : v.toFixed(1) + '%'}</td>`;
    });
    html += r.corrected_at
      ? `<td><span class="badge badge-warn" style="margin-left:0" title="Дата, когда данные за этот период были заполнены или исправлены после его окончания">${fmtDate(r.corrected_at)}</span></td>`
      : '<td style="color:var(--muted)">—</td>';
    html += '</tr>';
  });
  html += '</tbody></table></div>';
  container.innerHTML = html;
}

// ── DASHBOARD ─────────────────────────────────────────────────────────────
function switchDash(id, el) {
  document.querySelectorAll('.sub-tab').forEach(t => t.classList.remove('active'));
  ['obr','okk','sklad','or'].forEach(d => {
    const el2 = document.getElementById('dash-' + d);
    if (el2) el2.style.display = d === id ? 'block' : 'none';
  });
  el.classList.add('active');
  el.dataset.id = id;
  loadDash(id);
}

function destroyChart(id) { if (charts[id]) { charts[id].destroy(); delete charts[id]; } }

function mkChart(id, cfg) {
  destroyChart(id);
  const el = document.getElementById(id);
  if (!el) return;
  charts[id] = new Chart(el, { ...cfg, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, ...cfg.options } });
}

function kpiCard(label, val, sub, status, trend) {
  const colors = { ok: '#16a34a', warn: '#d97706', err: '#dc2626', '': 'var(--muted)' };
  let trendHtml = '';
  if (trend !== undefined && trend !== null) {
    const isGood = trend >= 0;
    const arrow = trend > 0 ? '▲' : trend < 0 ? '▼' : '→';
    const color = trend === 0 ? 'var(--muted)' : (isGood ? '#16a34a' : '#dc2626');
    const pct = Math.abs(trend).toFixed(1);
    trendHtml = `<div style="font-size:11px;color:${color};font-weight:600;margin-top:3px">${arrow} ${pct}% vs прошлый период</div>`;
  }
  return `<div class="kpi-card"><div class="kpi-val">${val}</div><div class="kpi-label">${label}</div>${trendHtml}${sub ? `<div class="kpi-sub" style="color:${colors[status||'']};">${sub}</div>` : ''}</div>`;
}

function calcTrend(curr, prev, lowerIsBetter) {
  if (prev === null || prev === undefined || prev === 0 || curr === null || curr === undefined) return null;
  const pct = ((curr - prev) / Math.abs(prev)) * 100;
  return lowerIsBetter ? -pct : pct;
}


// ── Period filter ─────────────────────────────────────────────────────────
let currentPeriod = 'week';

function setPeriod(period, el) {
  currentPeriod = period;
  document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  const labels = { week:'по неделям', month:'по месяцам', quarter:'по кварталам', year:'по годам' };
  document.getElementById('dash-period-label').textContent = '— ' + labels[period];
  const activeSubTab = document.querySelector('.sub-tab.active');
  const dep = activeSubTab?.dataset?.id || 'obr';
  loadDash(dep);
}

async function fetchAggregated(dep) {
  const { data } = await db.from(tableFor(dep)).select('*')
    .order('year', { ascending: true })
    .order('week_number', { ascending: true })
    .limit(104); // up to 2 years of weeks
  if (!data || !data.length) return { labels: [], rows: [] };

  if (currentPeriod === 'week') {
    const slice = data.slice(-12);
    return {
      labels: slice.map(r => `Нед ${r.week_number}/${String(r.year).slice(2)}`),
      rows: slice
    };
  }

  if (currentPeriod === 'month') {
    const map = {};
    data.forEach(r => {
      const d = weekToDate(r.week_number, r.year);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      if (!map[key]) map[key] = [];
      map[key].push(r);
    });
    const keys = Object.keys(map).sort().slice(-12);
    return {
      labels: keys.map(k => { const [y,m]=k.split('-'); return new Date(y,m-1).toLocaleString('ru',{month:'short',year:'2-digit'}); }),
      rows: keys.map(k => aggregateRows(map[k]))
    };
  }

  if (currentPeriod === 'quarter') {
    const map = {};
    data.forEach(r => {
      const d = weekToDate(r.week_number, r.year);
      const q = Math.ceil((d.getMonth()+1)/3);
      const key = `${d.getFullYear()}-Q${q}`;
      if (!map[key]) map[key] = [];
      map[key].push(r);
    });
    const keys = Object.keys(map).sort().slice(-8);
    return { labels: keys.map(k => k.replace('-', ' ')), rows: keys.map(k => aggregateRows(map[k])) };
  }

  if (currentPeriod === 'year') {
    const map = {};
    data.forEach(r => {
      const key = String(r.year);
      if (!map[key]) map[key] = [];
      map[key].push(r);
    });
    const keys = Object.keys(map).sort();
    return { labels: keys, rows: keys.map(k => aggregateRows(map[k])) };
  }

  return { labels: [], rows: [] };
}

function weekToDate(week, year) {
  const jan1 = new Date(year, 0, 1);
  return new Date(jan1.getTime() + (week - 1) * 7 * 86400000);
}

function aggregateRows(rows) {
  if (!rows.length) return {};
  const numericKeys = Object.keys(rows[0]).filter(k =>
    !['id','created_at','week_number','year'].includes(k) && typeof rows[0][k] === 'number'
  );
  const result = { week_number: rows[0].week_number, year: rows[0].year };
  numericKeys.forEach(k => {
    const vals = rows.map(r => r[k]).filter(v => v !== null && v !== undefined);
    if (!vals.length) { result[k] = null; return; }
    // averages for rates/scores, sums for counts/amounts
    const isAvg = ['score','pct','avg','hours'].some(s => k.includes(s));
    result[k] = isAvg
      ? vals.reduce((a,b)=>a+b,0) / vals.length
      : vals.reduce((a,b)=>a+b,0);
  });
  return result;
}

// Cache for chart data
const dashCache = {};

async function renderMetricChart(dep) {
  const cached = dashCache[dep];
  if (!cached) return;
  const { labels, data } = cached;
  const sel = document.getElementById('sel-' + dep);
  if (!sel) return;
  const field = sel.value;
  const label = sel.options[sel.selectedIndex].text;
  const chartId = 'ch-' + dep + '-main';
  destroyChart(chartId);
  const el = document.getElementById(chartId);
  if (!el) return;

  const values = data.map(r => r[field] ?? null);

  // Point colors: green if better than prev, red if worse, blue for first
  const pointColors = values.map((v, i) => {
    if (i === 0 || values[i-1] === null || v === null) return '#2563eb';
    return v >= values[i-1] ? '#16a34a' : '#dc2626';
  });

  // Segment colors for line
  const segmentColors = values.map((v, i) => {
    if (i === 0 || values[i-1] === null || v === null) return '#93c5fd';
    return v >= values[i-1] ? '#16a34a' : '#dc2626';
  });

  Chart.register({
    id: 'valueLabels',
    afterDatasetsDraw(chart) {
      const { ctx, data } = chart;
      chart.data.datasets.forEach((dataset, i) => {
        const meta = chart.getDatasetMeta(i);
        meta.data.forEach((point, idx) => {
          const val = dataset.data[idx];
          if (val === null || val === undefined) return;
          const display = Math.abs(val) >= 10000
            ? (val/1000).toFixed(1) + ' тыс'
            : typeof val === 'number' && !Number.isInteger(val)
              ? val.toFixed(2)
              : val.toLocaleString('ru');
          ctx.save();
          ctx.font = '500 11px sans-serif';
          ctx.fillStyle = point.options?.backgroundColor || '#2563eb';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillText(display, point.x, point.y - 10);
          ctx.restore();
        });
      });
    }
  });

  charts[chartId] = new Chart(el, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label,
        data: values,
        borderColor: '#2563eb',
        borderWidth: 2.5,
        pointBackgroundColor: pointColors,
        pointBorderColor: pointColors,
        pointRadius: 6,
        pointHoverRadius: 8,
        tension: 0.3,
        fill: {
          target: 'origin',
          above: 'rgba(37,99,235,0.07)',
          below: 'rgba(220,38,38,0.07)'
        },
        segment: {
          borderColor: ctx => {
            const i = ctx.p1DataIndex;
            return segmentColors[i] || '#2563eb';
          }
        }
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        datalabels: false,
        tooltip: {
          callbacks: {
            title: ctx => ctx[0].label,
            label: ctx => ' ' + label + ': ' + (ctx.raw ?? '—'),
            afterLabel: ctx => {
              const i = ctx.dataIndex;
              if (i === 0 || values[i-1] === null || values[i] === null) return '';
              const diff = values[i] - values[i-1];
              const pct = ((diff / Math.abs(values[i-1])) * 100).toFixed(1);
              const arrow = diff > 0 ? '▲ +' : diff < 0 ? '▼ ' : '→ ';
              return arrow + pct + '% к предыдущему периоду';
            }
          }
        }
      },
      layout: { padding: { top: 24 } },
      scales: {
        x: {
          grid: { color: 'rgba(0,0,0,0.05)' },
          ticks: { font: { size: 11 } }
        },
        y: {
          beginAtZero: false,
          grid: { color: 'rgba(0,0,0,0.05)' },
          ticks: { font: { size: 11 } }
        }
      }
    }
  });
}

async function loadDash(dep) {
  const { labels, rows: data } = await fetchAggregated(dep);
  if (!data || !data.length) return;
  const last = data[data.length - 1] || {};
  const prev = data[data.length - 2] || null;

  if (dep === 'obr') {
    const score = last.score?.toFixed(2) ?? '—';
    const pct = last.total_requests ? (last.expired_requests / last.total_requests * 100).toFixed(1) + '%' : '—';
    document.getElementById('kpi-obr').innerHTML =
      kpiCard('Оценка клиентов', score, last.score ? (last.score >= 4.8 ? '✓ норма' : '✗ ниже нормы') : '', last.score ? (last.score >= 4.8 ? 'ok' : 'err') : '', calcTrend(last.score, prev?.score, false)) +
      kpiCard('Запросов за неделю', (last.total_requests ?? '—').toLocaleString(), '', '', calcTrend(last.total_requests, prev?.total_requests, false)) +
      kpiCard('Просроченных', last.expired_requests ?? '—', '% от общего: ' + pct, last.total_requests && (last.expired_requests / last.total_requests) > 0.01 ? 'err' : 'ok', calcTrend(last.expired_requests, prev?.expired_requests, true));

    dashCache['obr'] = { labels, data };
    renderMetricChart('obr');
  } else if (dep === 'okk') {
    document.getElementById('kpi-okk').innerHTML =
      kpiCard('Брак (шт.)', last.rejected ?? '—', '', '', calcTrend(last.rejected, prev?.rejected, true)) +
      kpiCard('Восстановлено', last.restored ?? '—', '', '', calcTrend(last.restored, prev?.restored, false)) +
      kpiCard('Рекламаций новых', last.rec_new ?? '—', '', '', calcTrend(last.rec_new, prev?.rec_new, true)) +
      kpiCard('Обучений', last.trainings ?? '—', '', '', calcTrend(last.trainings, prev?.trainings, false)) +
      kpiCard('Инспекций', last.inspections ?? '—', '', '', calcTrend(last.inspections, prev?.inspections, false)) +
      kpiCard('Обр. связь просроч.', last.feedback_expired ?? '—', '', '', calcTrend(last.feedback_expired, prev?.feedback_expired, true));
    dashCache['okk'] = { labels, data };
    renderMetricChart('okk');
  } else if (dep === 'sklad') {
    const altWarn = last.alt_sum >= 500000;
    document.getElementById('kpi-sklad').innerHTML =
      kpiCard('Остаток «Альт»', last.alt_sum ? last.alt_sum.toLocaleString('ru') + ' ₽' : '—', altWarn ? '⚠ требует контроля' : '', altWarn ? 'warn' : '', calcTrend(last.alt_sum, prev?.alt_sum, true)) +
      kpiCard('Подрядчики (шт.)', last.contractor_count ?? '—', '', '', calcTrend(last.contractor_count, prev?.contractor_count, false)) +
      kpiCard('Подрядчики (руб.)', last.contractor_sum ? last.contractor_sum.toLocaleString('ru') + ' ₽' : '—', '', '', calcTrend(last.contractor_sum, prev?.contractor_sum, false)) +
      kpiCard('Остаток брака (шт.)', last.brak_count ?? '—', '', '', calcTrend(last.brak_count, prev?.brak_count, true)) +
      kpiCard('Остаток брака (руб.)', last.brak_sum ? last.brak_sum.toLocaleString('ru') + ' ₽' : '—', '', '', calcTrend(last.brak_sum, prev?.brak_sum, true)) +
      kpiCard('Консолидация (шт.)', last.cons_count ?? '—', '', '', calcTrend(last.cons_count, prev?.cons_count, false));
    dashCache['sklad'] = { labels, data };
    renderMetricChart('sklad');
  } else if (dep === 'or') {
    document.getElementById('kpi-or').innerHTML =
      kpiCard('Завершённых задач', last.closed_recs ?? '—', '', '', calcTrend(last.closed_recs, prev?.closed_recs, false)) +
      kpiCard('Ошибок при разборе', last.errors ?? '—', last.errors > 0 ? 'есть ошибки' : '', last.errors > 0 ? 'warn' : 'ok', calcTrend(last.errors, prev?.errors, true)) +
      kpiCard('Ср. время закрытия (сек)', last.avg_close_hours ?? '—', '', '', calcTrend(last.avg_close_hours, prev?.avg_close_hours, true)) +
      kpiCard('Ср. время принятия (сек)', last.accept_time ?? '—', '', '', calcTrend(last.accept_time, prev?.accept_time, true)) +
      kpiCard('Оценка скорости', last.score_speed?.toFixed(1) ?? '—', last.score_speed >= 4.8 ? '✓ норма' : last.score_speed ? '✗ ниже нормы' : '', last.score_speed >= 4.8 ? 'ok' : 'err', calcTrend(last.score_speed, prev?.score_speed, false)) +
      kpiCard('Оценка удобства ЛК', last.score_lk?.toFixed(1) ?? '—', last.score_lk >= 4.8 ? '✓ норма' : last.score_lk ? '✗ ниже нормы' : '', last.score_lk >= 4.8 ? 'ok' : 'err', calcTrend(last.score_lk, prev?.score_lk, false)) +
      kpiCard('Обратная связь', last.feedback ?? '—', '', '', calcTrend(last.feedback, prev?.feedback, false));
    dashCache['or'] = { labels, data };
    renderMetricChart('or');
  }
}

// ── Live hints ────────────────────────────────────────────────────────────
document.getElementById('obr-score').addEventListener('input', function() {
  const h = document.getElementById('obr-score-hint');
  const v = parseFloat(this.value);
  if (!this.value) { h.innerHTML = ''; return; }
  h.innerHTML = v >= 4.8 ? '<span class="badge badge-ok">✓ Норма соблюдена</span>' : '<span class="badge badge-err">✗ Ниже нормы 4.8</span>';
});

function updatePctHint() {
  const total = parseInt(document.getElementById('obr-total').value) || 0;
  const exp = parseInt(document.getElementById('obr-expired').value) || 0;
  const h = document.getElementById('obr-pct-hint');
  if (!total) { h.innerHTML = ''; return; }
  const pct = (exp / total * 100).toFixed(1);
  h.innerHTML = exp / total <= 0.01 ? `<span class="badge badge-ok">✓ ${pct}% — норма</span>` : `<span class="badge badge-err">✗ ${pct}% — превышение нормы</span>`;
}
document.getElementById('obr-total').addEventListener('input', updatePctHint);
document.getElementById('obr-expired').addEventListener('input', updatePctHint);

document.getElementById('sklad-alt-sum').addEventListener('input', function() {
  const h = document.getElementById('sklad-alt-hint');
  const v = parseFloat(this.value) || 0;
  h.innerHTML = v >= 500000 ? '<span class="badge badge-warn">⚠ Превышает 500 000 ₽ — требует контроля</span>' : '';
});

setDefaultWeek();
setDefaultDikMonth();
updateWeekLabels();
loadHistory('obr');
ensureFormLoaded('obr');

function getDikMonth() {
  const v = document.getElementById('dik-month-input').value;
  if (!v) return null;
  const [yr, mo] = v.split('-');
  return { month: parseInt(mo), year: parseInt(yr), label: new Date(yr, mo-1).toLocaleString('ru', {month:'long', year:'numeric'}) };
}

function setDefaultDikMonth() {
  const now = new Date();
  document.getElementById('dik-month-input').value = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
}


// ── ДИК password ─────────────────────────────────────────────────────────
let dikUnlocked = false;
let dikNavEl = null;

function openDik(el) {
  if (dikUnlocked) { showPage('dik', el); return; }
  dikNavEl = el;
  const modal = document.getElementById('dik-modal');
  modal.style.display = 'flex';
  document.getElementById('dik-password-input').value = '';
  document.getElementById('dik-pw-error').style.display = 'none';
  setTimeout(() => document.getElementById('dik-password-input').focus(), 50);
}

function closeDikModal() {
  document.getElementById('dik-modal').style.display = 'none';
}

function checkDikPassword() {
  const val = document.getElementById('dik-password-input').value;
  if (val === 'Bugrim-VAS123456') {
    dikUnlocked = true;
    closeDikModal();
    showPage('dik', dikNavEl);
    loadHistory('dik');
  } else {
    document.getElementById('dik-pw-error').style.display = 'block';
    document.getElementById('dik-password-input').value = '';
    document.getElementById('dik-password-input').focus();
  }
}

// ДИК save/load/history support
const _origTableFor = tableFor;
window.tableFor = function(dep) {
  if (dep === 'dik') return 'metrics_dik';
  return _origTableFor(dep);
};

// China hint
document.getElementById('dik-china-ok').addEventListener('input', function() {
  const total = parseInt(document.getElementById('dik-china-total').value) || 0;
  const ok = parseInt(this.value) || 0;
  const h = document.getElementById('dik-china-hint');
  if (!total) { h.innerHTML = ''; return; }
  const pct = (ok / total * 100).toFixed(0);
  h.innerHTML = ok === total
    ? '<span class="badge badge-ok">100% без просрочек</span>'
    : '<span class="badge badge-warn">' + pct + '% без просрочек</span>';
});

document.getElementById('dik-month-input').addEventListener('change', function() {
  const dm = getDikMonth();
  if (dm) document.getElementById('dik-month-label').textContent = 'Метрики за ' + dm.label;
  ensureFormLoaded('dik');
});

document.getElementById('dik-china-total').addEventListener('input', function() {
  document.getElementById('dik-china-ok').dispatchEvent(new Event('input'));
});

// ── ОР live hints ─────────────────────────────────────────
document.getElementById('or-errors').addEventListener('input', function() {
  const closed = parseInt(document.getElementById('or-closed').value) || 0;
  const errors = parseInt(this.value) || 0;
  const h = document.getElementById('or-errors-hint');
  if (!closed) { h.innerHTML = ''; return; }
  const pct = (errors / closed * 100).toFixed(1);
  h.innerHTML = errors / closed <= 0.01
    ? '<span class="badge badge-ok">✓ ' + pct + '% — норма</span>'
    : '<span class="badge badge-err">✗ ' + pct + '% — превышение нормы</span>';
});
document.getElementById('or-closed').addEventListener('input', function() {
  document.getElementById('or-errors').dispatchEvent(new Event('input'));
});

function checkTimeSec(inputId, hintId) {
  const v = parseFloat(document.getElementById(inputId).value) || 0;
  const h = document.getElementById(hintId);
  if (!v) { h.innerHTML = ''; return; }
  const mins = (v / 60).toFixed(1);
  h.innerHTML = v <= 1200
    ? '<span class="badge badge-ok">✓ ' + mins + ' мин — норма</span>'
    : '<span class="badge badge-err">✗ ' + mins + ' мин — превышение нормы (20 мин)</span>';
}
document.getElementById('or-avg-time').addEventListener('input', function() {
  checkTimeSec('or-avg-time', 'or-avg-time-hint');
});
document.getElementById('or-accept-time').addEventListener('input', function() {
  checkTimeSec('or-accept-time', 'or-accept-time-hint');
});

function checkScore48(inputId, hintId) {
  const v = parseFloat(document.getElementById(inputId).value);
  const h = document.getElementById(hintId);
  if (!v) { h.innerHTML = ''; return; }
  h.innerHTML = v >= 4.8
    ? '<span class="badge badge-ok">✓ Норма соблюдена</span>'
    : '<span class="badge badge-err">✗ Ниже нормы 4.8</span>';
}
document.getElementById('or-score-speed').addEventListener('input', function() {
  checkScore48('or-score-speed', 'or-score-speed-hint');
});
document.getElementById('or-score-lk').addEventListener('input', function() {
  checkScore48('or-score-lk', 'or-score-lk-hint');
});



// ══════════════════════════════════════════════════════════
// ПЛАНИРОВАНИЕ — цели без срока + еженедельные задачи
// ══════════════════════════════════════════════════════════

function switchPlanDept(dept, el) {
  document.querySelectorAll('#plan-dept-tabs .sub-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  ['okk','or','sklad','plan-dash'].forEach(d => {
    const el2 = document.getElementById('plan-dept-' + d);
    if (el2) el2.style.display = d === dept ? 'block' : 'none';
  });
  if (dept === 'plan-dash') loadPlanDash('all');
  else renderPlanDept(dept);
}

// ── Render full dept view ─────────────────────────────────
async function renderPlanDept(dept) {
  const body = document.getElementById('plan-body-' + dept);
  if (!body) return;
  body.innerHTML = '<div class="loading"><div class="spinner"></div>Загрузка...</div>';

  // Load ALL goals for this dept (active + closed)
  const { data: goals } = await db.from('plan_goals')
    .select('*')
    .eq('dept', dept)
    .order('created_at', { ascending: true });

  const list = goals || [];
  const activeGoals = list.filter(g => !g.closed);
  const closedGoals = list.filter(g => g.closed);

  let html = '';

  // ── Active goals ──────────────────────────────────────
  if (activeGoals.length === 0) {
    html += '<div class="card" style="text-align:center;color:var(--muted);padding:24px"><div style="font-size:32px;margin-bottom:8px">🎯</div><div>Нет активных целей — добавьте первую</div></div>';
  }

  for (let idx = 0; idx < activeGoals.length; idx++) {
    const g = activeGoals[idx];
    const w = getWeek();

    // Load ALL tasks for this goal across all weeks
    const { data: at } = await db.from('plan_tasks')
      .select('*').eq('goal_id', g.id)
      .order('year').order('week_number').order('created_at');
    const allTasks = at || [];

    // Cache closed tasks for filtering
    if (!window._closedTasksCache) window._closedTasksCache = {};
    window._closedTasksCache[g.id] = allTasks.filter(t => t.done || t.cancelled);

    // Group tasks by week
    const tasksByWeek = {};
    allTasks.forEach(t => {
      const key = t.year + '-W' + String(t.week_number).padStart(2,'0');
      if (!tasksByWeek[key]) tasksByWeek[key] = { week_number: t.week_number, year: t.year, tasks: [] };
      tasksByWeek[key].tasks.push(t);
    });
    const weekKeys = Object.keys(tasksByWeek).sort();

    const totalAll = allTasks.length;
    const doneAll = allTasks.filter(t => t.done).length;
    const pct = totalAll ? Math.round(doneAll / totalAll * 100) : 0;

    html += `<div class="card" style="margin-bottom:16px;border-left:4px solid #2563eb">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px">
        <div style="flex:1">
          <div style="font-size:11px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.05em">Цель ${idx+1} из ${activeGoals.length}</div>
          <div style="font-size:17px;font-weight:600;margin-top:3px;color:var(--text)">${g.title}</div>
          ${g.description ? `<div style="font-size:13px;color:var(--muted);margin-top:3px">${g.description}</div>` : ''}
          <div style="font-size:11px;color:var(--muted);margin-top:4px">Создана: ${new Date(g.created_at).toLocaleDateString('ru')}</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end;flex-shrink:0">
          <button onclick="closeGoal('${g.id}','${dept}')" class="btn" style="font-size:12px;padding:5px 12px;color:#16a34a;border-color:#16a34a">✓ Закрыть цель</button>
          <button onclick="deleteGoal('${g.id}','${dept}')" class="btn" style="font-size:12px;padding:5px 12px;color:var(--err);border-color:var(--err)">✕ Удалить</button>
        </div>
      </div>`;

    // Overall progress bar
    if (totalAll > 0) {
      html += `<div style="display:flex;align-items:center;gap:10px;margin-top:12px;margin-bottom:4px">
        <span style="font-size:12px;color:var(--muted)">Общий прогресс:</span>
        <div style="flex:1;height:6px;background:var(--border);border-radius:3px;overflow:hidden">
          <div style="height:100%;width:${pct}%;background:${pct===100?'#16a34a':pct>=50?'#d97706':'#2563eb'};transition:width .4s"></div>
        </div>
        <span style="font-size:12px;font-weight:600;color:${pct===100?'#16a34a':pct>=50?'#d97706':'#2563eb'}">${doneAll}/${totalAll} (${pct}%)</span>
      </div>`;
    }

    // ── Tasks split: active / done+cancelled ──────────
    html += `<div style="border-top:1px solid var(--border);margin-top:14px;padding-top:14px">`;

    // Split tasks
    const activeTasks = allTasks.filter(t => !t.done && !t.cancelled);
    const closedTasks = allTasks.filter(t => t.done || t.cancelled);

    // Active tasks grouped by week
    const activeByWeek = {};
    activeTasks.forEach(t => {
      const key = t.year + '-W' + String(t.week_number).padStart(2,'0');
      if (!activeByWeek[key]) activeByWeek[key] = { week_number: t.week_number, year: t.year, tasks: [] };
      activeByWeek[key].tasks.push(t);
    });
    const activeWeekKeys = Object.keys(activeByWeek).sort();

    html += `<div style="font-size:12px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px">
      Активные задачи (${activeTasks.length})
    </div>`;

    if (activeWeekKeys.length === 0) {
      html += '<p style="font-size:13px;color:var(--muted);margin-bottom:12px">Нет активных задач</p>';
    }

    activeWeekKeys.forEach(wk => {
      const { week_number, year, tasks: weekTaskList } = activeByWeek[wk];
      const isCurrentWeek = w && week_number === w.week_number && year === w.year;
      html += `<div style="margin-bottom:14px">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
          <span style="font-size:11px;font-weight:600;color:${isCurrentWeek?'var(--accent)':'var(--muted)'};text-transform:uppercase;letter-spacing:.05em">
            ${isCurrentWeek ? '📋 Текущая неделя' : '📁 Нед '+week_number+'/'+year}
          </span>
          ${isCurrentWeek ? '<span style="font-size:10px;background:var(--accent);color:#fff;padding:1px 6px;border-radius:10px">активна</span>' : ''}
        </div>`;
      weekTaskList.forEach(t => {
      const isCancelled = !!t.cancelled;
      const prioIcon = t.priority === 'Высокий' ? '<span class="priority-high">🔴 Высокий</span>'
        : t.priority === 'Средний' ? '<span class="priority-mid">🟡 Средний</span>'
        : '<span class="priority-low">🟢 Низкий</span>';
      html += `<div class="task-item" style="${isCancelled ? 'background:#fff5f5;border-radius:8px;padding:8px;border-left:3px solid #dc2626' : ''}">
        <div class="task-check ${t.done ? 'done' : ''}"
          onclick="${!isCancelled && !t.done ? `togglePlanTask('${t.id}','${g.id}','${dept}')` : ''}"
          style="${isCancelled ? 'background:#fecaca;border-color:#fca5a5;cursor:not-allowed' : !t.done ? 'cursor:pointer' : ''}">
          ${t.done ? '✓' : isCancelled ? '—' : ''}
        </div>
        <div class="task-body">
          <div class="task-title" style="${isCancelled || t.done ? 'text-decoration:line-through;color:var(--muted)' : ''}">${t.title}</div>
          <div class="task-meta">
            ${prioIcon}
            ${t.due_date ? '<span>📅 '+t.due_date+'</span>' : ''}
            ${t.comment ? '<span>💬 '+t.comment+'</span>' : ''}
          </div>
          ${isCancelled ? `
            <div style="margin-top:7px;padding:6px 10px;background:#fee2e2;border-left:3px solid #dc2626;border-radius:4px;display:flex;align-items:flex-start;gap:6px">
              <span style="font-size:13px">🚫</span>
              <div>
                <div style="font-size:11px;font-weight:600;color:#dc2626;text-transform:uppercase;letter-spacing:.04em">Причина отмены</div>
                <div style="font-size:13px;color:#991b1b;margin-top:2px">${t.cancel_reason || '—'}</div>
              </div>
            </div>` : ''}
          ${t.done ? `<div class="conclusion-box">
            <label style="font-size:11px;color:var(--muted);display:block;margin-bottom:4px">Вывод по задаче:</label>
            <textarea id="concl-${t.id}" placeholder="Что сделано, что учесть на следующей неделе...">${t.conclusion||''}</textarea>
            <div style="text-align:right;margin-top:4px">
              <button class="btn" style="font-size:12px;padding:4px 10px" onclick="savePlanConclusion('${t.id}','${g.id}','${dept}')">Сохранить</button>
            </div>
          </div>` : ''}
        </div>
        ${!t.done && !isCancelled ? `<button onclick="cancelPlanTask('${t.id}','${g.id}','${dept}')" class="task-delete" title="Отменить задачу" style="color:var(--warn);font-size:18px">✕</button>` : ''}
      </div>`;
      }); // end weekTaskList.forEach
      html += '</div>'; // end week group
    }); // end activeWeekKeys.forEach

    // ── Closed tasks (done + cancelled) with period filter ──
    const goalId_for_closed = g.id;
    const closedPeriods = [
      { key: 'week', label: 'Неделя' },
      { key: 'month', label: 'Месяц' },
      { key: 'quarter', label: 'Квартал' },
      { key: 'year', label: 'Год' },
      { key: 'all', label: 'Всё время' }
    ];

    if (closedTasks.length > 0) {
      html += `<div style="margin-top:16px;border-top:1px solid var(--border);padding-top:12px">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:10px">
          <div style="display:flex;align-items:center;gap:8px">
            <div style="font-size:12px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.05em">
              История задач (${closedTasks.length})
            </div>
            <button onclick="toggleClosedTasks('${g.id}')"
              id="toggle-hist-${g.id}"
              style="font-size:11px;padding:3px 10px;border-radius:20px;border:0.5px solid var(--border);
              background:transparent;color:var(--muted);cursor:pointer">
              Показать
            </button>
          </div>
          <div style="display:flex;gap:4px;flex-wrap:wrap;display:none" id="hist-period-${g.id}">
            ${closedPeriods.map(p => `<button onclick="filterClosedTasks('${g.id}','${dept}','${p.key}',this)"
              style="font-size:11px;padding:3px 10px;border-radius:20px;border:0.5px solid var(--border);
              background:${p.key==='week'?'var(--color-text-primary, #1e293b)':'transparent'};
              color:${p.key==='week'?'var(--color-bg, #fff)':'var(--muted)'};cursor:pointer">
              ${p.label}
            </button>`).join('')}
          </div>
        </div>
        <div id="closed-tasks-${g.id}" style="display:none"></div>
      </div>`;
    }

    // Render closed tasks with default 'week' period
    if (closedTasks.length > 0) {
      window._closedTasksCache = window._closedTasksCache || {};
      window._closedTasksCache[g.id] = closedTasks;
      // Render after HTML is set - use setTimeout to ensure DOM exists
    }

    // Add task form
    html += `<div style="margin-top:10px;padding:12px;background:var(--bg);border-radius:var(--radius-sm)">
      <div style="font-size:12px;font-weight:500;color:var(--muted);margin-bottom:8px">+ Новая задача на эту неделю</div>
      <div class="form-grid form-grid-2" style="margin-bottom:8px">
        <input type="text" id="ti-${g.id}" placeholder="Название задачи" style="padding:7px 10px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:13px;color:var(--text);background:var(--surface)">
        <input type="date" id="td-${g.id}" style="padding:7px 10px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:13px;color:var(--text);background:var(--surface)">
        <select id="tp-${g.id}" style="padding:7px 10px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:13px;color:var(--text);background:var(--surface)">
          <option value="Высокий">🔴 Высокий</option>
          <option value="Средний" selected>🟡 Средний</option>
          <option value="Низкий">🟢 Низкий</option>
        </select>
        <input type="text" id="tc-${g.id}" placeholder="Комментарий (необязательно)" style="padding:7px 10px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:13px;color:var(--text);background:var(--surface)">
      </div>
      <button class="btn btn-primary" style="font-size:13px;padding:7px 16px" onclick="addPlanTask('${g.id}','${dept}')">Добавить задачу</button>
    </div></div></div>`;
  }

  // ── Closed goals (collapsed) ──────────────────────────
  if (closedGoals.length > 0) {
    html += `<div style="margin-top:20px">
      <div style="font-size:12px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px">
        ✓ Закрытые цели (${closedGoals.length})
      </div>`;
    closedGoals.forEach(g => {
      html += `<div class="card" style="margin-bottom:8px;border-left:4px solid #16a34a;opacity:.8">
        <div style="display:flex;align-items:center;justify-content:space-between">
          <div>
            <div style="font-size:15px;font-weight:500;text-decoration:line-through;color:var(--muted)">${g.title}</div>
            ${g.conclusion ? `<div style="font-size:12px;color:var(--muted);margin-top:4px">💡 ${g.conclusion}</div>` : ''}
            <div style="font-size:11px;color:var(--muted);margin-top:3px">Закрыта: ${g.closed_at ? new Date(g.closed_at).toLocaleDateString('ru') : '—'}</div>
          </div>
          <button onclick="reopenGoal('${g.id}','${dept}')" class="btn" style="font-size:12px;padding:4px 10px;flex-shrink:0">↩ Открыть снова</button>
        </div>
      </div>`;
    });
    html += '</div>';
  }

  // ── Add goal button (max 3 active) ───────────────────
  if (activeGoals.length < 3) {
    html += `<div class="card" style="border:2px dashed var(--border);background:var(--bg);margin-top:16px">
      <div style="font-size:13px;font-weight:500;color:var(--muted);margin-bottom:12px">
        🎯 Новая цель (активных: ${activeGoals.length}/3)
      </div>
      <div class="form-grid form-grid-2">
        <div class="field">
          <label>Название цели</label>
          <input type="text" id="ng-title-${dept}" placeholder="Например: снизить брак на 10%">
        </div>
        <div class="field">
          <label>Описание (необязательно)</label>
          <input type="text" id="ng-desc-${dept}" placeholder="Детали...">
        </div>
      </div>
      <div class="btn-row">
        <button class="btn btn-primary" onclick="addGoal('${dept}')">+ Добавить цель</button>
      </div>
    </div>`;
  } else {
    html += `<div style="font-size:13px;color:var(--muted);padding:12px;text-align:center;margin-top:12px">
      Достигнут максимум — 3 активные цели. Закройте одну чтобы добавить новую.
    </div>`;
  }

  body.innerHTML = html;

  // Pre-cache closed tasks but don't render (hidden by default)
  list.filter(g => !g.closed).forEach(g => {
    const closed = (window._closedTasksCache || {})[g.id] || [];
    if (closed.length) {
      renderClosedTasksList(g.id, closed.filter(t => {
        const d = new Date(t.year, 0, 1);
        d.setDate(d.getDate() + (t.week_number - 1) * 7);
        return (new Date() - d) / (1000*60*60*24) <= 7;
      }));
    }
  });
}

// ── Goal CRUD ─────────────────────────────────────────────
async function addGoal(dept) {
  const title = document.getElementById('ng-title-'+dept)?.value.trim();
  if (!title) { showToast('Введите название цели', true); return; }
  const { error } = await db.from('plan_goals').insert({
    dept, title,
    description: document.getElementById('ng-desc-'+dept)?.value.trim() || null,
    closed: false
  });
  if (error) { showToast('Ошибка: '+error.message, true); return; }
  showToast('✓ Цель добавлена');
  renderPlanDept(dept);
}

async function closeGoal(goalId, dept) {
  const conclusion = prompt('Напишите вывод по достигнутой цели (необязательно):');
  await db.from('plan_goals').update({ closed: true, closed_at: new Date().toISOString(), conclusion: conclusion || null }).eq('id', goalId);
  showToast('✓ Цель закрыта');
  renderPlanDept(dept);
}

async function reopenGoal(goalId, dept) {
  await db.from('plan_goals').update({ closed: false, closed_at: null }).eq('id', goalId);
  showToast('Цель снова активна');
  renderPlanDept(dept);
}

async function deleteGoal(goalId, dept) {
  if (!confirm('Удалить цель и все её задачи?')) return;
  await db.from('plan_tasks').delete().eq('goal_id', goalId);
  await db.from('plan_goals').delete().eq('id', goalId);
  showToast('Цель удалена');
  renderPlanDept(dept);
}

// ── Task CRUD ─────────────────────────────────────────────
async function addPlanTask(goalId, dept) {
  const title = document.getElementById('ti-'+goalId)?.value.trim();
  if (!title) { showToast('Введите название задачи', true); return; }
  const w = getWeek();
  if (!w) { showToast('Выберите неделю', true); return; }
  const { error } = await db.from('plan_tasks').insert({
    goal_id: goalId, dept,
    week_number: w.week_number, year: w.year,
    title,
    due_date: document.getElementById('td-'+goalId)?.value || null,
    priority: document.getElementById('tp-'+goalId)?.value || 'Средний',
    comment: document.getElementById('tc-'+goalId)?.value.trim() || null,
    done: false
  });
  if (error) { showToast('Ошибка: '+error.message, true); return; }
  showToast('✓ Задача добавлена');
  renderPlanDept(dept);
}

async function togglePlanTask(taskId, goalId, dept) {
  const { data } = await db.from('plan_tasks').select('done').eq('id', taskId).single();
  await db.from('plan_tasks').update({ done: !data.done }).eq('id', taskId);
  renderPlanDept(dept);
}

async function cancelPlanTask(taskId, goalId, dept) {
  const reason = prompt('Укажите причину отмены задачи:');
  if (reason === null) return;
  if (!reason.trim()) { showToast('Причина обязательна', true); return; }
  const { error } = await db.from('plan_tasks')
    .update({ cancelled: true, cancel_reason: reason.trim() })
    .eq('id', taskId);
  if (error) { showToast('Ошибка: ' + error.message, true); return; }
  showToast('Задача отменена');
  renderPlanDept(dept);
}

async function savePlanConclusion(taskId, goalId, dept) {
  const val = document.getElementById('concl-'+taskId)?.value.trim();
  await db.from('plan_tasks').update({ conclusion: val }).eq('id', taskId);
  showToast('✓ Вывод сохранён');
}

// ── Planning Dashboard ────────────────────────────────────
let planDashPeriod = 'week';
let planDashDept = 'all';
let planDashData = [];

function setPlanPeriod(period, el) {
  planDashPeriod = period;
  document.querySelectorAll('#plan-period-btns .period-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  renderPlanDashCharts();
}

function filterPlanDash(dept, el) {
  planDashDept = dept;
  document.querySelectorAll('#plan-dept-filter .period-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  loadPlanDash(dept);
}

function weekToDate2(week, year) {
  return new Date(new Date(year,0,1).getTime() + (week-1)*7*86400000);
}

function aggregatePlanByPeriod(data, period) {
  const map = {};
  data.forEach(t => {
    const d = weekToDate2(t.week_number, t.year);
    let key;
    if (period === 'week') key = `Нед ${t.week_number}/${String(t.year).slice(2)}`;
    else if (period === 'month') key = d.toLocaleString('ru',{month:'short',year:'2-digit'});
    else if (period === 'quarter') key = `Q${Math.ceil((d.getMonth()+1)/3)} ${d.getFullYear()}`;
    else key = String(d.getFullYear());
    if (!map[key]) map[key] = {total:0, done:0};
    if (!t.cancelled) map[key].total++;
    if (t.done) map[key].done++;
  });
  return map;
}

function renderPlanDashCharts() {
  const data = planDashData;
  if (!data.length) return;

  const map = aggregatePlanByPeriod(data, planDashPeriod);
  const labels = Object.keys(map).slice(-12);

  const barPlugin = {
    id: 'planBarLabels',
    afterDatasetsDraw(chart) {
      const { ctx } = chart;
      chart.data.datasets.forEach((ds, di) => {
        chart.getDatasetMeta(di).data.forEach((bar, idx) => {
          const v = ds.data[idx];
          if (!v) return;
          ctx.save();
          ctx.font = '600 12px -apple-system,sans-serif';
          ctx.fillStyle = di === 0 ? '#1d4ed8' : '#065f46';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillText(v, bar.x, bar.y - 5);
          ctx.restore();
        });
      });
    }
  };

  const chartOpts = {
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: { top: 30, left: 8, right: 8 } },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          afterBody: ctx => {
            const k = labels[ctx[0].dataIndex];
            if (!k || !map[k] || !map[k].total) return '';
            return [`Выполнено: ${Math.round(map[k].done/map[k].total*100)}%`];
          }
        }
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 12 } }, barPercentage: 0.65, categoryPercentage: 0.75 },
      y: { grid: { color: 'rgba(0,0,0,0.06)' }, ticks: { font: { size: 11 }, stepSize: 1 }, beginAtZero: true }
    }
  };

  destroyChart('ch-plan-dynamic');
  const el1 = document.getElementById('ch-plan-dynamic');
  if (el1) charts['ch-plan-dynamic'] = new Chart(el1, {
    type: 'bar',
    data: { labels, datasets: [
      { label: 'Запланировано', data: labels.map(k => map[k]?.total||0),
        backgroundColor: 'rgba(147,197,253,0.85)', borderColor: '#3b82f6', borderWidth: 1.5, borderRadius: 5 },
      { label: 'Выполнено', data: labels.map(k => map[k]?.done||0),
        backgroundColor: 'rgba(110,231,183,0.85)', borderColor: '#10b981', borderWidth: 1.5, borderRadius: 5 }
    ]},
    options: chartOpts,
    plugins: [barPlugin]
  });

  // Priority chart
  const byPrio = { 'Высокий':{total:0,done:0}, 'Средний':{total:0,done:0}, 'Низкий':{total:0,done:0} };
  data.forEach(t => {
    if (byPrio[t.priority]) {
      if (!t.cancelled) byPrio[t.priority].total++;
      if (t.done) byPrio[t.priority].done++;
    }
  });
  const prioLabels = ['Высокий','Средний','Низкий'];

  const prioPlugin = {
    id: 'prioBarLabels',
    afterDatasetsDraw(chart) {
      const { ctx } = chart;
      chart.data.datasets.forEach((ds, di) => {
        chart.getDatasetMeta(di).data.forEach((bar, idx) => {
          const v = ds.data[idx];
          if (!v) return;
          ctx.save();
          ctx.font = '600 12px -apple-system,sans-serif';
          ctx.fillStyle = di === 0 ? '#991b1b' : '#065f46';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillText(v, bar.x, bar.y - 5);
          ctx.restore();
        });
      });
    }
  };

  destroyChart('ch-plan-priority');
  const el2 = document.getElementById('ch-plan-priority');
  if (el2) charts['ch-plan-priority'] = new Chart(el2, {
    type: 'bar',
    data: { labels: prioLabels, datasets: [
      { label: 'Всего', data: prioLabels.map(p => byPrio[p].total),
        backgroundColor: ['rgba(252,165,165,0.85)','rgba(252,211,77,0.85)','rgba(134,239,172,0.85)'],
        borderColor: ['#ef4444','#f59e0b','#22c55e'], borderWidth: 1.5, borderRadius: 5 },
      { label: 'Выполнено', data: prioLabels.map(p => byPrio[p].done),
        backgroundColor: 'rgba(110,231,183,0.85)', borderColor: '#10b981', borderWidth: 1.5, borderRadius: 5 }
    ]},
    options: {
      responsive: true, maintainAspectRatio: false,
      layout: { padding: { top: 30, left: 8, right: 8 } },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            afterBody: ctx => {
              const p = prioLabels[ctx[0].dataIndex];
              if (!byPrio[p].total) return '';
              return [`Выполнено: ${Math.round(byPrio[p].done/byPrio[p].total*100)}%`];
            }
          }
        }
      },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 12 } } },
        y: { grid: { color: 'rgba(0,0,0,0.06)' }, ticks: { font: { size: 11 }, stepSize: 1 }, beginAtZero: true }
      }
    },
    plugins: [prioPlugin]
  });
}

async function loadPlanDash(deptFilter) {
  if (deptFilter !== undefined) planDashDept = deptFilter;
  let q = db.from('plan_tasks').select('*, plan_goals(title,closed)').order('year').order('week_number');
  if (planDashDept !== 'all') q = q.eq('dept', planDashDept);
  const { data } = await q.limit(500);
  planDashData = data || [];

  if (!planDashData.length) {
    document.getElementById('plan-kpi').innerHTML = '<p style="color:var(--muted);font-size:13px;padding:12px 0">Данных пока нет</p>';
    return;
  }

  const total = planDashData.filter(t=>!t.cancelled).length;
  const done = planDashData.filter(t=>t.done).length;
  const withConclusion = planDashData.filter(t=>t.done&&t.conclusion).length;
  const pct = total ? Math.round(done/total*100) : 0;
  const overdue = planDashData.filter(t=>!t.done&&!t.cancelled&&t.due_date&&new Date(t.due_date)<new Date()).length;
  const cancelled = planDashData.filter(t=>t.cancelled).length;

  document.getElementById('plan-kpi').innerHTML =
    kpiCard('Всего задач', total) +
    kpiCard('Выполнено', done, pct+'%', pct>=80?'ok':pct>=50?'warn':'err') +
    kpiCard('Просрочено', overdue, overdue>0?'требует внимания':'✓ нет', overdue>0?'err':'ok') +
    kpiCard('Отменено', cancelled) +
    kpiCard('Выводов написано', withConclusion, done>0?Math.round(withConclusion/done*100)+'% от выполненных':'');

  renderPlanDashCharts();

  const deptName = {okk:'ОКК',or:'ОР',sklad:'Склад'};
  const allContainer = document.getElementById('plan-all-list');
  if (allContainer) {
    let html = '<div style="overflow-x:auto"><table class="hist-table"><thead><tr>'
      +'<th>Неделя</th><th>Отдел</th><th>Цель</th><th>Задача</th><th>Приоритет</th><th>Статус</th><th>Вывод</th>'
      +'</tr></thead><tbody>';
    planDashData.slice().reverse().slice(0,40).forEach(t=>{
      html+=`<tr>
        <td>Нед ${t.week_number}/${t.year}</td>
        <td>${deptName[t.dept]||t.dept}</td>
        <td style="font-size:12px;color:var(--muted)">${t.plan_goals?.title||'—'}</td>
        <td>${t.title}</td><td>${t.priority}</td>
        <td>${t.done?'<span class="badge badge-ok">✓ Выполнено</span>':t.cancelled?'<span class="badge badge-err">Отменено</span>':'<span class="badge badge-warn">В работе</span>'}</td>
        <td style="max-width:180px;font-size:12px;color:var(--muted)">${t.conclusion||t.cancel_reason||'—'}</td>
      </tr>`;
    });
    html += '</tbody></table></div>';
    allContainer.innerHTML = html;
  }
}



function toggleClosedTasks(goalId) {
  const tasksDiv = document.getElementById('closed-tasks-' + goalId);
  const periodsDiv = document.getElementById('hist-period-' + goalId);
  const btn = document.getElementById('toggle-hist-' + goalId);
  if (!tasksDiv) return;
  const isHidden = tasksDiv.style.display === 'none';
  tasksDiv.style.display = isHidden ? 'block' : 'none';
  if (periodsDiv) periodsDiv.style.display = isHidden ? 'flex' : 'none';
  if (btn) btn.textContent = isHidden ? 'Скрыть' : 'Показать';
}
// ── Filter closed tasks by period ────────────────────
function filterClosedTasks(goalId, dept, period, el) {
  // Update button styles
  const container = document.getElementById('hist-period-' + goalId);
  if (container) {
    container.querySelectorAll('button').forEach(b => {
      b.style.background = 'transparent';
      b.style.color = 'var(--muted)';
    });
    if (el) {
      el.style.background = 'var(--color-text-primary, #1e293b)';
      el.style.color = '#fff';
    }
  }

  const allClosed = window._closedTasksCache?.[goalId] || [];
  const now = new Date();
  let filtered = allClosed;

  if (period === 'week') {
    filtered = allClosed.filter(t => {
      const d = new Date(t.year, 0, 1);
      d.setDate(d.getDate() + (t.week_number - 1) * 7);
      const diff = (now - d) / (1000*60*60*24);
      return diff <= 7;
    });
  } else if (period === 'month') {
    filtered = allClosed.filter(t => {
      const d = new Date(t.year, 0, 1);
      d.setDate(d.getDate() + (t.week_number - 1) * 7);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
  } else if (period === 'quarter') {
    const q = Math.floor(now.getMonth() / 3);
    filtered = allClosed.filter(t => {
      const d = new Date(t.year, 0, 1);
      d.setDate(d.getDate() + (t.week_number - 1) * 7);
      return Math.floor(d.getMonth() / 3) === q && d.getFullYear() === now.getFullYear();
    });
  } else if (period === 'year') {
    filtered = allClosed.filter(t => t.year === now.getFullYear());
  }

  renderClosedTasksList(goalId, filtered);
}

function renderClosedTasksList(goalId, tasks) {
  const container = document.getElementById('closed-tasks-' + goalId);
  if (!container) return;

  if (!tasks.length) {
    container.innerHTML = '<p style="font-size:13px;color:var(--muted)">Нет задач за этот период</p>';
    return;
  }

  let html = '';
  tasks.forEach(t => {
    const isCancelled = !!t.cancelled;
    html += `<div style="display:flex;align-items:flex-start;gap:10px;padding:8px 0;border-bottom:0.5px solid var(--border);opacity:${isCancelled?'.65':'1'}">
      <div style="width:18px;height:18px;border-radius:4px;flex-shrink:0;margin-top:2px;display:flex;align-items:center;justify-content:center;font-size:11px;
        background:${isCancelled?'#fecaca':'#d1fae5'};color:${isCancelled?'#dc2626':'#059669'}">
        ${isCancelled ? '✕' : '✓'}
      </div>
      <div style="flex:1">
        <div style="font-size:13px;text-decoration:line-through;color:var(--muted)">${t.title}</div>
        <div style="font-size:11px;color:var(--muted);margin-top:2px">
          Нед ${t.week_number}/${t.year} · ${t.priority}
          ${isCancelled && t.cancel_reason ? ` · <span style="color:#dc2626">Причина: ${t.cancel_reason}</span>` : ''}
          ${!isCancelled && t.conclusion ? ` · <span style="color:#059669">Вывод: ${t.conclusion}</span>` : ''}
        </div>
      </div>
    </div>`;
  });
  container.innerHTML = html;
}

// ══════════════════════════════════════════════════════════
// ЖУРНАЛ ПРОБЛЕМ
// ══════════════════════════════════════════════════════════
const PROB_DEPTS = { obr: 'Обработка запросов', okk: 'ОКК', sklad: 'Склад Брак', or: 'ОР', rest: 'Реставрация' };
let probTab = 'new';
let probReqId = 0;

function probEsc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function probFmt(d) {
  if (!d) return '';
  return new Date(d).toLocaleString('ru', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function switchProbTab(status, el) {
  probTab = status;
  document.querySelectorAll('#prob-tabs .sub-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  loadProblems();
}

async function loadProblems() {
  const box = document.getElementById('prob-list');
  if (!box) return;
  const reqId = ++probReqId;
  const dept = document.getElementById('prob-filter-dept').value;
  box.innerHTML = '<div class="loading"><div class="spinner"></div>Загрузка...</div>';

  let q = db.from('problems').select('*').eq('status', probTab);
  if (dept) q = q.eq('dept', dept);
  q = probTab === 'new'
    ? q.order('created_at', { ascending: false })
    : q.order('resolved_at', { ascending: false }).limit(10);

  let cq = db.from('problems').select('id', { count: 'exact', head: true }).eq('status', 'new');
  if (dept) cq = cq.eq('dept', dept);

  const [{ data, error }, { count }] = await Promise.all([q, cq]);
  if (reqId !== probReqId) return; // пришёл более новый запрос

  const badge = document.getElementById('prob-count-new');
  if (badge) badge.textContent = count != null ? `(${count})` : '';

  if (error) {
    box.innerHTML = `<div style="color:var(--err);font-size:13px">Не удалось загрузить журнал: ${probEsc(error.message)}
      <button class="btn" style="margin-left:10px;padding:4px 12px;font-size:12px" onclick="loadProblems()">Повторить</button></div>`;
    return;
  }
  if (!data || !data.length) {
    box.innerHTML = `<p style="color:var(--muted);font-size:13px">${probTab === 'new' ? 'Необработанных проблем нет' : 'Обработанных проблем пока нет'}</p>`;
    return;
  }

  box.innerHTML = data.map(p => {
    const isNew = p.status === 'new';
    const btn = isNew
      ? `<button class="btn" style="font-size:12px;padding:5px 12px;color:var(--success);border-color:var(--success);white-space:nowrap" onclick="setProblemStatus('${probEsc(p.id)}','done',this)">✓ Обработана</button>`
      : `<button class="btn" style="font-size:12px;padding:5px 12px;white-space:nowrap" onclick="setProblemStatus('${probEsc(p.id)}','new',this)">↩ Вернуть в работу</button>`;
    return `<div style="display:flex;gap:12px;align-items:flex-start;padding:12px 0;border-bottom:1px solid var(--border)">
      <div style="flex:1;min-width:0">
        <div style="font-size:11px;color:var(--muted);margin-bottom:4px">
          <span class="badge ${isNew ? 'badge-warn' : 'badge-ok'}" style="margin-left:0">${probEsc(PROB_DEPTS[p.dept] || p.dept)}</span>
          ${probEsc(probFmt(p.created_at))}${!isNew && p.resolved_at ? ' · обработана ' + probEsc(probFmt(p.resolved_at)) : ''}
        </div>
        <div style="font-size:14px;line-height:1.4;white-space:pre-wrap;word-break:break-word">${probEsc(p.description)}</div>
      </div>
      ${btn}
    </div>`;
  }).join('');
}

async function addProblem() {
  const dept = document.getElementById('prob-dept').value;
  const descEl = document.getElementById('prob-desc');
  const description = descEl.value.trim();
  if (!description) { showToast('Опишите проблему', true); return; }

  const btn = document.getElementById('prob-add-btn');
  btn.disabled = true; btn.textContent = 'Сохранение...';
  const { error } = await db.from('problems').insert({ dept, description });
  btn.disabled = false; btn.textContent = 'Добавить в журнал';

  if (error) { showToast('Ошибка: ' + error.message, true); return; }
  descEl.value = '';
  showToast('Проблема добавлена в журнал');
  if (probTab !== 'new') {
    switchProbTab('new', document.querySelector('#prob-tabs .sub-tab'));
  } else {
    loadProblems();
  }
}

async function setProblemStatus(id, status, btn) {
  if (btn) btn.disabled = true;
  const patch = { status, resolved_at: status === 'done' ? new Date().toISOString() : null };
  const { data, error } = await db.from('problems').update(patch).eq('id', id).select('id');
  if (error || !data || !data.length) {
    if (btn) btn.disabled = false;
    showToast('Не удалось изменить статус' + (error ? ': ' + error.message : ''), true);
    return;
  }
  showToast(status === 'done' ? 'Отмечена как обработанная' : 'Возвращена в работу');
  loadProblems();
}

async function exportProblems() {
  if (typeof XLSX === 'undefined') { showToast('Библиотека выгрузки не загрузилась, обновите страницу', true); return; }
  const btn = document.getElementById('prob-export-btn');
  btn.disabled = true;
  try {
    const dept = document.getElementById('prob-filter-dept').value;
    const rows = [];
    const PAGE = 1000;
    for (let from = 0; ; from += PAGE) {
      let q = db.from('problems').select('*').order('created_at', { ascending: true }).range(from, from + PAGE - 1);
      if (dept) q = q.eq('dept', dept);
      const { data, error } = await q;
      if (error) throw error;
      rows.push(...data);
      if (data.length < PAGE) break;
    }
    if (!rows.length) { showToast('Нет данных для выгрузки', true); return; }

    const sheetRows = rows.map(p => ({
      'Дата внесения': probFmt(p.created_at),
      'Отдел': PROB_DEPTS[p.dept] || p.dept,
      'Описание': p.description,
      'Статус': p.status === 'done' ? 'Обработана' : 'Не обработана',
      'Дата обработки': probFmt(p.resolved_at)
    }));
    const ws = XLSX.utils.json_to_sheet(sheetRows);
    ws['!cols'] = [{ wch: 18 }, { wch: 20 }, { wch: 80 }, { wch: 16 }, { wch: 18 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Проблемы');
    const today = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `zhurnal-problem_${dept || 'vse'}_${today}.xlsx`);
    showToast(`Выгружено записей: ${rows.length}`);
  } catch (e) {
    showToast('Ошибка выгрузки: ' + (e.message || e), true);
  } finally {
    btn.disabled = false;
  }
}

// ══════════════════════════════════════════════════════════
// АНАЛИЗ С ПОМОЩЬЮ ИИ: готовый текст запроса для GPT / Claude
// ══════════════════════════════════════════════════════════
const AI_NORMS = {
  obr: [
    'Оценка клиентов: не ниже 4.8',
    'Просроченных запросов: не более 1% от количества запросов'
  ],
  okk: [],
  sklad: [
    'Сумма остатка "Альт": порог контроля 500 000 руб. (превышение требует контроля)'
  ],
  or: [
    'Ошибок при разборе рекламаций: не более 1% от количества завершённых задач',
    'Среднее время закрытия: не более 1200 сек (20 мин)',
    'Среднее время принятия: не более 1200 сек (20 мин)',
    'Оценка скорости обработки: не ниже 4.8',
    'Оценка удобства ЛК: не ниже 4.8'
  ]
};

function buildAiPromptText(dep, rows) {
  const cfg = DEP_CFG[dep];
  const norms = AI_NORMS[dep] || [];
  const derived = cfg.derived || [];
  const lines = rows.map(r => {
    const parts = cfg.fields.map(f => `${f.label}: ${fmtVal(f, r[f.col])}`);
    derived.forEach(d => {
      const v = d.calc(r);
      parts.push(`${d.label}: ${v === null ? '—' : v.toFixed(1) + '%'}`);
    });
    const mark = r.corrected_at ? ` (данные скорректированы ${fmtDate(r.corrected_at)})` : '';
    return `Неделя ${r.week_number}/${r.year}${mark}\n${parts.join('; ')}`;
  });
  return [
    `Ты — аналитик по качеству и операционным процессам. Ниже еженедельные метрики подразделения "${cfg.title}" за последние ${rows.length} нед. (от старых к новым). Проанализируй их.`,
    '',
    'Нормы и пороги:',
    norms.length
      ? norms.map(n => '- ' + n).join('\n')
      : '- Для этого подразделения нормы в трекере не заданы: оценивай динамику и резкие изменения, нормы не придумывай.',
    '',
    'Данные ("—" значит, что значение не внесено; если между номерами недель пропуск, данные за неделю не вносились):',
    '',
    lines.join('\n\n'),
    '',
    'Что нужно сделать:',
    '1. Кратко опиши динамику (3–5 предложений): что улучшилось, что ухудшилось.',
    '2. Перечисли отклонения от норм с номерами недель.',
    '3. Назови возможные причины. Это гипотезы: прямо отметь, что их нужно проверить.',
    '4. Дай 3–5 конкретных рекомендаций в порядке приоритета: что сделать и как проверить результат.',
    '5. Укажи, каких данных не хватает для более точных выводов.',
    '',
    'Отвечай на русском, без общих фраз, опирайся только на числа выше.'
  ].join('\n');
}

function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
  document.body.appendChild(ta);
  ta.focus(); ta.select();
  let ok = false;
  try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
  document.body.removeChild(ta);
  return ok;
}

async function copyAiPrompt(dep) {
  const cfg = DEP_CFG[dep];
  const n = parseInt(document.getElementById(dep + '-ai-weeks').value, 10) || 8;
  const btn = document.getElementById(dep + '-ai-btn');
  btn.disabled = true;
  try {
    const { data, error } = await db.from(cfg.table).select('*')
      .order('year', { ascending: false }).order('week_number', { ascending: false }).limit(n);
    if (error) { showToast('Не удалось получить данные: ' + error.message, true); return; }
    if (!data || !data.length) { showToast('Нет данных для анализа', true); return; }
    const text = buildAiPromptText(dep, data.slice().reverse());
    document.getElementById(dep + '-ai-text').value = text;
    let ok = false;
    try { await navigator.clipboard.writeText(text); ok = true; } catch (e) { ok = fallbackCopy(text); }
    if (ok) showToast('Текст скопирован. Вставьте его в чат с ИИ (Ctrl+V)');
    else {
      document.getElementById(dep + '-ai-details').open = true;
      showToast('Не удалось скопировать автоматически. Скопируйте текст вручную из поля ниже', true);
    }
  } finally {
    btn.disabled = false;
  }
}

function renderAiBlock(dep) {
  const box = document.getElementById('ai-block-' + dep);
  if (!box) return;
  box.innerHTML = `<div class="card">
    <div class="card-title">Анализ с помощью ИИ</div>
    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
      <span style="font-size:13px;color:var(--muted)">Период анализа:</span>
      <select id="${dep}-ai-weeks" style="padding:6px 10px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:13px;background:var(--surface);color:var(--text)">
        <option value="4">4 недели</option>
        <option value="8" selected>8 недель</option>
        <option value="12">12 недель</option>
        <option value="26">26 недель</option>
      </select>
      <button class="btn btn-primary" id="${dep}-ai-btn" onclick="copyAiPrompt('${dep}')">📋 Скопировать для ИИ</button>
    </div>
    <div style="margin-top:14px;padding:12px 14px;background:var(--bg);border-radius:var(--radius-sm);font-size:13px;line-height:1.5">
      <div style="font-weight:600;margin-bottom:6px">Как пользоваться</div>
      <ol style="padding-left:20px">
        <li>Выберите период и нажмите "Скопировать для ИИ". Трекер соберёт метрики отдела и нормы в готовый текст запроса и скопирует его.</li>
        <li>Откройте ИИ-ассистента, к которому у вас есть доступ (например, ChatGPT или Claude) и начните новый чат.</li>
        <li>Вставьте текст в поле ввода (Ctrl+V, на телефоне: долгое нажатие и "Вставить") и отправьте.</li>
        <li>Прочитайте ответ. Если нужно, задайте уточняющий вопрос, например: "Что из этого сделать в первую очередь?"</li>
      </ol>
      <div style="margin-top:8px;color:var(--muted)">ИИ видит только эти цифры и не знает причин, поэтому его выводы нужно проверять. Метрики отдела уходят во внешний сервис: делайте это, только если правила компании это разрешают.</div>
    </div>
    <details id="${dep}-ai-details" style="margin-top:10px">
      <summary style="cursor:pointer;font-size:12px;color:var(--muted)">Показать текст запроса</summary>
      <textarea id="${dep}-ai-text" readonly rows="10" style="width:100%;margin-top:8px;padding:8px 10px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:12px;font-family:inherit;background:var(--surface);color:var(--text)"></textarea>
    </details>
  </div>`;
}
['obr', 'okk', 'sklad', 'or'].forEach(renderAiBlock);
