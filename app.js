'use strict';
/* =========================================================
   يومي ✦ منطق التطبيق
   كل البيانات تنحفظ في المتصفح (localStorage) بدون سيرفر.
   ========================================================= */

/* ---------- 1) أدوات صغيرة ---------- */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const pad = n => String(n).padStart(2, '0');
const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromIso = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const diffDays = (a, b) => Math.round((fromIso(a) - fromIso(b)) / 864e5);
const uid = () => Math.random().toString(36).slice(2, 9);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const mins = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const fmtTime = t => { if (!t) return ''; let [h, m] = t.split(':').map(Number); const ap = h >= 12 ? 'م' : 'ص'; h = h % 12 || 12; return `${h}:${pad(m)} ${ap}`; };
const money = n => Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 2 }) + ' ر.س';

const DAYS  = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const SHORT = ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
const DINI  = ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'];
const MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const TONES = ['lav', 'pink', 'mint', 'peach', 'sky', 'butter'];
const tone = n => `--c:var(--${n});--cd:var(--${n}-d)`;

const monthKey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
const shiftMonth = (k, n) => { const [y, m] = k.split('-').map(Number); return monthKey(new Date(y, m - 1 + n, 1)); };
const monthLabel = k => { const [y, m] = k.split('-').map(Number); return `${MONTHS[m - 1]} ${y}`; };

/* ---------- 2) الحالة والحفظ ---------- */
const KEY = 'yawmi.v1';
const base = {
  name: '', asked: false,
  tasks: [],            // {id,title,date,time,cat,repeat,done:[dates]}
  goals: [],            // {id,title,year,cat,note,p}
  money: [],            // {id,type,amount,cat,note,date}
  saveTarget: {},       // {'2026-10': 1000}
  semesters: [],        // {id,name,start,end,courses:[{id,name,code,room,days,start,end,tone}]}
  activeSem: null,
  cycle: { last: '', len: 28, period: 5, logs: {} }
};
let S;
try { S = { ...base, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { S = { ...base }; }
S.cycle = { ...base.cycle, ...S.cycle };
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { } };

/* حالة الواجهة (ما تنحفظ) */
const U = {
  tab: 'today', mode: 'day', date: iso(new Date()),
  goalYear: new Date().getFullYear(),
  moneyMonth: monthKey(new Date()),
  cycleMonth: monthKey(new Date())
};

/* ---------- 3) تصنيفات ---------- */
const CATS  = { work: ['عمل', 'sky'], study: ['دراسة', 'lav'], personal: ['شخصي', 'pink'], health: ['صحة', 'mint'], family: ['عائلة', 'peach'] };
const GCATS = { health: ['صحة', 'mint'], money: ['مال', 'butter'], study: ['دراسة', 'lav'], work: ['مهنة', 'sky'], self: ['تطوير الذات', 'pink'], travel: ['سفر', 'peach'] };
const MCATS = {
  exp: ['أكل', 'مواصلات', 'تسوق', 'ترفيه', 'فواتير', 'دراسة', 'صحة', 'أخرى'],
  inc: ['راتب', 'مكافأة', 'عمل حر', 'هدية', 'أخرى'],
  sav: ['حصالة', 'طوارئ', 'هدف', 'استثمار']
};
const TYPES = { exp: ['مصروف', 'pink'], inc: ['دخل', 'mint'], sav: ['ادخار', 'lav'] };

/* ---------- 4) أيقونات ---------- */
const ICON = {
  home: '<path d="M3 11l9-8 9 8v9a2 2 0 0 1-2 2h-4v-6H9v6H5a2 2 0 0 1-2-2z"/>',
  cal: '<rect x="3" y="4" width="18" height="18" rx="4"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  goal: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  wallet: '<path d="M3 7a2 2 0 0 1 2-2h13v4"/><path d="M3 7v11a2 2 0 0 0 2 2h15V9H5a2 2 0 0 1-2-2z"/><circle cx="16.5" cy="14.5" r="1"/>',
  uni: '<path d="M22 9L12 4 2 9l10 5 10-5z"/><path d="M6 11.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-4.5"/>',
  heart: '<path d="M12 21s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.8-8 11-8 11z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  x: '<path d="M18 6L6 18M6 6l12 12"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  prev: '<path d="M9 6l6 6-6 6"/>',
  next: '<path d="M15 6l-6 6 6 6"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/>'
};
const ic = (n, s = 22) => `<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICON[n]}</svg>`;

const TABS = [
  ['today', 'اليوم', 'home'], ['schedule', 'الجدول', 'cal'], ['goals', 'الأهداف', 'goal'],
  ['money', 'المال', 'wallet'], ['uni', 'الجامعة', 'uni'], ['cycle', 'الدورة', 'heart']
];

/* ---------- 5) منطق المهام والمحاضرات ---------- */
const occurs = (t, d) => {
  if (t.repeat === 'daily') return d >= t.date;
  if (t.repeat === 'weekly') return d >= t.date && fromIso(d).getDay() === fromIso(t.date).getDay();
  return t.date === d;
};
const isDone = (t, d) => (t.done || []).includes(d);
const tasksOn = d => S.tasks.filter(t => occurs(t, d)).sort((a, b) => (a.time || '99').localeCompare(b.time || '99'));
const activeSem = () => S.semesters.find(s => s.id === S.activeSem) || null;
/* المحاضرات تظهر في أي تاريخ يقع داخل فترة أي ترم، فكل ترم له جدوله */
const classesOn = d => {
  const wd = fromIso(d).getDay(), out = [];
  S.semesters.forEach(s => {
    if (d >= s.start && d <= s.end) s.courses.forEach(c => { if (c.days.includes(wd)) out.push({ ...c, sem: s.name }); });
  });
  return out.sort((a, b) => a.start.localeCompare(b.start));
};
const monthStats = k => {
  const r = { inc: 0, exp: 0, sav: 0 };
  S.money.forEach(t => { if (t.date.startsWith(k)) r[t.type] += +t.amount; });
  r.left = r.inc - r.exp - r.sav;
  return r;
};

/* ---------- 6) مكونات واجهة مشتركة ---------- */
const empty = (t, s) => `<div class="empty"><div class="spark">✦</div><b>${t}</b><p>${s}</p></div>`;

const ring = (pct, size = 100, stroke = 11, color = 'var(--lav-d)') => {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r, h = size / 2;
  return `<svg class="ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="${h}" cy="${h}" r="${r}" fill="none" stroke="rgba(255,255,255,.7)" stroke-width="${stroke}"/>
    <circle cx="${h}" cy="${h}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round"
      stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - pct / 100)}" transform="rotate(-90 ${h} ${h})"/>
    <text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" class="ring-t">${Math.round(pct)}%</text></svg>`;
};

const taskItem = (t, d) => {
  const [n, c] = CATS[t.cat] || CATS.personal, dn = isDone(t, d);
  const rep = t.repeat === 'daily' ? ' · كل يوم' : t.repeat === 'weekly' ? ' · كل أسبوع' : '';
  return `<div class="task ${dn ? 'done' : ''}" style="${tone(c)}">
    <button class="check" data-act="toggle" data-id="${t.id}" data-d="${d}" aria-label="إنجاز">${dn ? ic('check', 16) : ''}</button>
    <div class="t-body"><b>${esc(t.title)}</b><small>${t.time ? fmtTime(t.time) + ' · ' : ''}${n}${rep}</small></div>
    <button class="mini" data-act="delTask" data-id="${t.id}" aria-label="حذف">${ic('x', 16)}</button></div>`;
};
const classItem = c => `<div class="task cls" style="${tone(c.tone)}">
    <div class="clock">${fmtTime(c.start)}<small>${fmtTime(c.end)}</small></div>
    <div class="t-body"><b>${esc(c.name)}</b><small>${esc([c.code, c.room].filter(Boolean).join(' · ') || 'محاضرة')}</small></div></div>`;

const dayList = k => {
  const cl = classesOn(k), ts = tasksOn(k);
  if (!cl.length && !ts.length) return empty('يوم هادئ', 'ما فيه شيء مجدول. أضف مهمة بزر +');
  return cl.map(classItem).join('') + ts.map(t => taskItem(t, k)).join('');
};

/* ---------- 7) النماذج (Sheet) ---------- */
function openSheet(title, body, onSubmit, onOpen) {
  const sh = $('#sheet');
  sh.innerHTML = `<div class="sheet-card"><div class="grab"></div><h3>${title}</h3><form id="sheetForm">${body}</form></div>`;
  sh.classList.add('open');
  const f = $('#sheetForm');
  f.addEventListener('submit', e => {
    e.preventDefault();
    if (onSubmit(new FormData(f), f) === false) return;
    save(); closeSheet(); render();
  });
  onOpen?.(f);
}
const closeSheet = () => $('#sheet').classList.remove('open');
const chipRadio = (name, opts, sel, toneOf) => opts.map(([v, l]) =>
  `<label class="chip ${toneOf ? 't-' + toneOf(v) : ''}"><input type="radio" name="${name}" value="${v}" ${String(v) === String(sel) ? 'checked' : ''}><span>${l}</span></label>`).join('');
const chipCheck = (name, opts, sel = []) => opts.map(([v, l]) =>
  `<label class="chip"><input type="checkbox" name="${name}" value="${v}" ${sel.map(String).includes(String(v)) ? 'checked' : ''}><span>${l}</span></label>`).join('');

/* ---------- 8) صفحة: اليوم ---------- */
function vToday() {
  const now = new Date(), td = iso(now), h = now.getHours();
  const greet = h < 12 ? 'صباح الخير' : h < 17 ? 'نهارك سعيد' : h < 21 ? 'مساء الخير' : 'ليلة هادئة';
  const ts = tasksOn(td), done = ts.filter(t => isDone(t, td)).length;
  const pct = ts.length ? done / ts.length * 100 : 0;
  const cl = classesOn(td), m = monthStats(monthKey(now));
  return `
  <header class="top"><div>
    <p class="sub">${DAYS[now.getDay()]} ${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}</p>
    <h1>${greet}${S.name ? '، ' + esc(S.name) : ''}</h1></div>
    <button class="round" data-act="name" aria-label="الاسم">${ic('edit', 20)}</button></header>

  <section class="hero-card">
    ${ring(pct, 104)}
    <div class="stats">
      <div class="stat"><span>كل المهام</span><b>${ts.length}</b></div>
      <div class="stat"><span>منجزة</span><b>${done}</b></div>
      <div class="stat"><span>متبقية</span><b>${ts.length - done}</b></div>
    </div>
  </section>

  ${cl.length ? `<div class="section-title"><b>محاضرات اليوم</b><small>${cl.length}</small></div>${cl.map(classItem).join('')}` : ''}

  <div class="section-title"><b>مهام اليوم</b><small>${done}/${ts.length}</small></div>
  ${ts.length ? ts.map(t => taskItem(t, td)).join('') : empty('ابدأ يومك بخطوة صغيرة', 'اضغط + وأضف أول مهمة')}

  <div class="section-title"><b>مالك هالشهر</b><small>${MONTHS[now.getMonth()]}</small></div>
  <div class="big-left"><small>المتبقي بعد المصروف والادخار</small><b>${money(m.left)}</b></div>`;
}

/* ---------- 9) صفحة: الجدول (يومي / أسبوعي / شهري) ---------- */
function vSchedule() {
  const d = fromIso(U.date), ws = addDays(d, -d.getDay()), we = addDays(ws, 6), tdk = iso(new Date());
  const seg = `<div class="seg">${[['day', 'يومي'], ['week', 'أسبوعي'], ['month', 'شهري']].map(([k, l]) =>
    `<button class="${U.mode === k ? 'on' : ''}" data-act="mode" data-v="${k}">${l}</button>`).join('')}</div>`;
  const label = U.mode === 'month' ? `${MONTHS[d.getMonth()]} ${d.getFullYear()}`
    : U.mode === 'week' ? `${ws.getDate()} ${MONTHS[ws.getMonth()]} – ${we.getDate()} ${MONTHS[we.getMonth()]}`
      : `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
  const nav = `<div class="nav"><button class="round" data-act="shift" data-n="-1">${ic('prev')}</button>
    <b>${label}</b><button class="round" data-act="shift" data-n="1">${ic('next')}</button></div>`;

  const strip = () => `<div class="strip">${[...Array(7)].map((_, i) => {
    const x = addDays(ws, i), k = iso(x), n = tasksOn(k).length + classesOn(k).length;
    return `<button class="dchip ${k === U.date ? 'on' : ''} ${k === tdk ? 'today' : ''}" data-act="pickDate" data-d="${k}">
      <small>${SHORT[i]}</small><b>${x.getDate()}</b><i class="${n ? 'has' : ''}"></i></button>`;
  }).join('')}</div>`;

  let body = '';
  if (U.mode === 'day') {
    body = strip() + dayList(U.date);
  } else if (U.mode === 'week') {
    body = [...Array(7)].map((_, i) => {
      const x = addDays(ws, i), k = iso(x), list = classesOn(k).map(classItem).join('') + tasksOn(k).map(t => taskItem(t, k)).join('');
      return `<div class="wday ${k === tdk ? 'today' : ''}">
        <div class="wh" data-act="goDay" data-d="${k}"><b>${DAYS[i]}</b><span>${x.getDate()} ${MONTHS[x.getMonth()]}</span></div>
        ${list || '<p class="faint">لا شيء</p>'}</div>`;
    }).join('');
  } else {
    const y = d.getFullYear(), m = d.getMonth(), first = new Date(y, m, 1), dim = new Date(y, m + 1, 0).getDate();
    let cells = DINI.map(x => `<i class="dh">${x}</i>`).join('');
    for (let i = 0; i < first.getDay(); i++) cells += '<i></i>';
    for (let n = 1; n <= dim; n++) {
      const k = `${y}-${pad(m + 1)}-${pad(n)}`;
      const dots = tasksOn(k).slice(0, 3).map(t => `<s style="background:var(--${(CATS[t.cat] || CATS.personal)[1]}-d)"></s>`).join('')
        + (classesOn(k).length ? '<s style="background:var(--lav-d)"></s>' : '');
      cells += `<button class="mday ${k === U.date ? 'on' : ''} ${k === tdk ? 'today' : ''}" data-act="pickDate" data-d="${k}">${n}<span class="dots">${dots}</span></button>`;
    }
    body = `<div class="mgrid">${cells}</div>
      <div class="section-title"><b>${d.getDate()} ${MONTHS[m]}</b><small>${DAYS[d.getDay()]}</small></div>${dayList(U.date)}`;
  }
  return `<header class="top"><div><p class="sub">رتّب وقتك</p><h1>الجدول</h1></div></header>${seg}${nav}${body}`;
}

/* ---------- 10) صفحة: الأهداف (لأي سنة تبغى) ---------- */
function vGoals() {
  const y = U.goalYear, cy = new Date().getFullYear();
  const gs = S.goals.filter(g => g.year === y);
  const avg = gs.length ? gs.reduce((a, g) => a + g.p, 0) / gs.length : 0;
  const badge = y === cy ? 'هذه السنة' : y > cy ? `بعد ${y - cy} ${y - cy === 1 ? 'سنة' : 'سنوات'}` : 'سنة مضت';
  const years = [...new Set([...S.goals.map(g => g.year), cy, cy + 1])].sort();
  const card = g => {
    const [n, c] = GCATS[g.cat] || GCATS.self;
    return `<div class="goal" style="${tone(c)}">
      <div class="gh"><div><b>${esc(g.title)}</b><br><span class="tag">${n}</span></div>
        <button class="mini" data-act="delGoal" data-id="${g.id}" aria-label="حذف">${ic('x', 16)}</button></div>
      ${g.note ? `<p class="note">${esc(g.note)}</p>` : ''}
      <div class="bar"><div class="fill" style="width:${g.p}%"></div></div>
      <div class="pr"><span>التقدم</span><span class="pv">${g.p}%</span></div>
      <input type="range" min="0" max="100" step="5" value="${g.p}" data-act="goalP" data-id="${g.id}" aria-label="التقدم">
      <div class="acts"><button data-act="moveGoal" data-id="${g.id}">ترحيل للسنة التالية ←</button></div></div>`;
  };
  return `
  <header class="top"><div><p class="sub">${badge}</p><h1>أهداف ${y}</h1></div></header>
  <div class="nav"><button class="round" data-act="gShift" data-n="-1">${ic('prev')}</button>
    <b>${y}</b><button class="round" data-act="gShift" data-n="1">${ic('next')}</button></div>
  <section class="hero-card">${ring(avg, 104, 11, 'var(--mint-d)')}
    <div class="stats"><div class="stat"><span>الأهداف</span><b>${gs.length}</b></div>
    <div class="stat"><span>مكتملة</span><b>${gs.filter(g => g.p >= 100).length}</b></div>
    <div class="stat"><span>جارية</span><b>${gs.filter(g => g.p < 100).length}</b></div></div></section>
  <div class="section-title"><b>أهداف السنة</b></div>
  ${gs.length ? gs.map(card).join('') : empty('ما فيه أهداف لهالسنة', 'اضغط + وارسم حلمك')}
  <div class="section-title"><b>رحلة السنوات</b><small>انتقل لأي سنة</small></div>
  <div class="scroll-row">${years.map(yy => `<button class="chip-btn ${yy === y ? 'on' : ''}" data-act="gYear" data-v="${yy}">${yy} · ${S.goals.filter(g => g.year === yy).length}</button>`).join('')}</div>`;
}

/* ---------- 11) صفحة: المال ---------- */
function vMoney() {
  const k = U.moneyMonth, st = monthStats(k), tg = +S.saveTarget[k] || 0;
  const list = S.money.filter(t => t.date.startsWith(k)).sort((a, b) => b.date.localeCompare(a.date));
  const by = {}; list.filter(t => t.type === 'exp').forEach(t => by[t.cat] = (by[t.cat] || 0) + +t.amount);
  const rows = Object.entries(by).sort((a, b) => b[1] - a[1]), mx = rows[0]?.[1] || 1;
  const y = k.slice(0, 4);
  const per = [...Array(12)].map((_, i) => monthStats(`${y}-${pad(i + 1)}`));
  const top = Math.max(1, ...per.flatMap(p => [p.inc, p.exp, p.sav]));
  const spct = tg ? Math.min(100, st.sav / tg * 100) : 0;
  return `
  <header class="top"><div><p class="sub">دخلك ومصروفك وادخارك</p><h1>المال</h1></div></header>
  <div class="nav"><button class="round" data-act="mShift" data-n="-1">${ic('prev')}</button>
    <b>${monthLabel(k)}</b><button class="round" data-act="mShift" data-n="1">${ic('next')}</button></div>
  <div class="big-left"><small>المتبقي هالشهر</small><b>${money(st.left)}</b></div>
  <div class="trio">
    <div class="mini-card" style="background:var(--mint)"><small>دخل</small><b>${money(st.inc)}</b></div>
    <div class="mini-card" style="background:var(--pink)"><small>مصروف</small><b>${money(st.exp)}</b></div>
    <div class="mini-card" style="background:var(--lav)"><small>ادخار</small><b>${money(st.sav)}</b></div>
  </div>

  <div class="card"><div class="gh" style="display:flex;justify-content:space-between;align-items:center">
    <b>هدف الادخار الشهري</b><button class="btn sm" data-act="setTarget">${tg ? 'تعديل' : 'تحديد'}</button></div>
    ${tg ? `<div class="bar" style="--cd:var(--lav-d)"><div class="fill" style="width:${spct}%"></div></div>
    <div class="pr" style="display:flex;justify-content:space-between;font-size:13px;color:var(--muted)"><span>${money(st.sav)}</span><span>من ${money(tg)}</span></div>`
      : '<p class="faint">حدد مبلغ تبغى توفره هالشهر</p>'}</div>

  <div class="section-title"><b>وين راحت فلوسك</b></div>
  <div class="card">${rows.length ? rows.map(([c, v], i) => `<div class="catrow"><span>${esc(c)}</span>
    <div class="bar"><div class="fill" style="width:${v / mx * 100}%;--cd:var(--${TONES[i % 6]}-d)"></div></div><em>${money(v)}</em></div>`).join('')
      : '<p class="faint">ما فيه مصاريف مسجلة</p>'}</div>

  <div class="section-title"><b>السنة بنظرة</b><small>${y}</small></div>
  <div class="card"><div class="ychart">${per.map((p, i) => `<div class="ycol"><div class="bars">
    <i style="height:${p.inc / top * 100}%;background:var(--mint-d)"></i><i style="height:${p.exp / top * 100}%;background:var(--pink-d)"></i><i style="height:${p.sav / top * 100}%;background:var(--lav-d)"></i></div><small>${i + 1}</small></div>`).join('')}</div>
    <div class="legend"><span><i style="background:var(--mint-d)"></i>دخل</span><span><i style="background:var(--pink-d)"></i>مصروف</span><span><i style="background:var(--lav-d)"></i>ادخار</span></div></div>

  <div class="section-title"><b>العمليات</b><small>${list.length}</small></div>
  ${list.length ? list.map(t => {
      const [tn, tc] = TYPES[t.type], sign = t.type === 'inc' ? '+' : '−', d = fromIso(t.date);
      return `<div class="tx"><div class="dot" style="background:var(--${tc})">${t.type === 'inc' ? '↓' : t.type === 'sav' ? '★' : '↑'}</div>
        <div class="t-body"><b>${esc(t.cat)}${t.note ? ' · ' + esc(t.note) : ''}</b><small>${d.getDate()} ${MONTHS[d.getMonth()]} · ${tn}</small></div>
        <span class="amt ${t.type}">${sign}${Number(t.amount).toLocaleString('en-US')}</span>
        <button class="mini" data-act="delTx" data-id="${t.id}" aria-label="حذف">${ic('x', 16)}</button></div>`;
    }).join('') : empty('ما فيه عمليات', 'سجّل أول دخل أو مصروف بزر +')}`;
}

/* ---------- 12) صفحة: الجامعة (كل ترم له جدوله) ---------- */
function vUni() {
  const cur = activeSem();
  const chips = S.semesters.map(s => `<button class="chip-btn ${cur && s.id === cur.id ? 'on' : ''}" data-act="semPick" data-id="${s.id}">${esc(s.name)}</button>`).join('')
    + '<button class="chip-btn add" data-act="addSem">+ ترم جديد</button>';
  let body;
  if (!cur) {
    body = empty('ابدأ بترمك الأول', 'أضف الترم ثم موادك ومحاضراتك. كل ترم له جدوله وتقدر تبدّل بينها.') + '<button class="btn" data-act="addSem">إضافة ترم</button>';
  } else {
    const byDay = DAYS.map((n, i) => [i, n, cur.courses.filter(c => c.days.includes(i)).sort((a, b) => a.start.localeCompare(b.start))]).filter(x => x[2].length);
    const weekly = cur.courses.reduce((a, c) => a + (mins(c.end) - mins(c.start)) * c.days.length, 0) / 60;
    const sd = fromIso(cur.start), ed = fromIso(cur.end);
    body = `
    <section class="hero-card"><div class="stats">
      <div class="stat"><span>المواد</span><b>${cur.courses.length}</b></div>
      <div class="stat"><span>ساعات الأسبوع</span><b>${+weekly.toFixed(1)}</b></div>
      <div class="stat"><span>الفترة</span><b>${sd.getDate()}/${sd.getMonth() + 1} – ${ed.getDate()}/${ed.getMonth() + 1}</b></div></div></section>
    <div class="row-btns"><button class="btn sm ghost" style="flex:1" data-act="addExam">+ اختبار / تسليم</button>
      <button class="btn sm ghost" style="flex:1" data-act="delSem">حذف الترم</button></div>
    ${byDay.length ? byDay.map(([i, n, list]) => `<div class="uday"><h4>${n}</h4>${list.map(c => `
      <div class="session" style="${tone(c.tone)}"><div class="clock">${fmtTime(c.start)}<small>${fmtTime(c.end)}</small></div>
      <div class="t-body"><b>${esc(c.name)}</b><small>${esc([c.code, c.room].filter(Boolean).join(' · '))}</small></div>
      <button class="mini" data-act="delCourse" data-id="${c.id}" aria-label="حذف المادة">${ic('x', 16)}</button></div>`).join('')}</div>`).join('')
        : empty('ما أضفت مواد بعد', 'اضغط + وأضف أول مادة')}`;
  }
  return `<header class="top"><div><p class="sub">جدولك الدراسي</p><h1>الجامعة</h1></div></header>
    <div class="scroll-row">${chips}</div>${body}`;
}

/* ---------- 13) صفحة: الدورة ---------- */
function phase(d) {
  const c = S.cycle; if (!c.last) return null;
  const diff = diffDays(d, c.last); if (diff < 0) return null;
  const len = +c.len, per = +c.period, m = diff % len, ov = len - 14;
  if (m < per) return { k: 'period', day: m + 1 };
  if (m === ov - 1) return { k: 'ov', day: m + 1 };
  if (m >= ov - 6 && m < ov - 1) return { k: 'fertile', day: m + 1 };
  if (m >= len - 5) return { k: 'pms', day: m + 1 };
  return { k: 'normal', day: m + 1 };
}
function vCycle() {
  const c = S.cycle, td = iso(new Date()), len = +c.len;
  let hero;
  if (!c.last) {
    hero = `<section class="hero-card cyc"><div><p class="sub">ابدأ بتسجيل آخر دورة</p><h2>تتبّع الدورة</h2></div>
      <button class="btn sm" data-act="cSetup">إعداد</button></section>`;
  } else {
    const p = phase(td), diff = diffDays(td, c.last);
    const nxt = diff < 0 ? -diff : len - (diff % len);
    let start = diff < 0 ? fromIso(c.last) : addDays(fromIso(c.last), Math.floor(diff / len) * len);
    if (addDays(start, len - 15) < fromIso(td)) start = addDays(start, len);
    const ovd = addDays(start, len - 15);
    hero = `<section class="hero-card cyc"><div>
      <p class="sub">${p && p.k === 'period' ? 'أنتِ في أيام الدورة' : 'الدورة القادمة'}</p>
      <h2>${p && p.k === 'period' ? `اليوم ${p.day} من الدورة` : `بعد ${nxt} ${nxt === 1 ? 'يوم' : 'أيام'}`}</h2>
      <p class="sub" style="margin-top:6px">التبويض المتوقع: ${ovd.getDate()} ${MONTHS[ovd.getMonth()]}</p></div>
      <button class="round" data-act="cSetup" aria-label="إعداد">${ic('edit', 20)}</button></section>`;
  }
  const k = U.cycleMonth, [y, m] = k.split('-').map(Number), first = new Date(y, m - 1, 1), dim = new Date(y, m, 0).getDate();
  let cells = DINI.map(x => `<i class="dh">${x}</i>`).join('');
  for (let i = 0; i < first.getDay(); i++) cells += '<i></i>';
  for (let n = 1; n <= dim; n++) {
    const dk = `${y}-${pad(m)}-${pad(n)}`, p = phase(dk), lg = c.logs[dk];
    cells += `<button class="mday ${p && p.k !== 'normal' ? 'c-' + p.k : ''} ${dk === td ? 'today' : ''}" data-act="cDay" data-d="${dk}">${n}${lg ? '<span class="lg"></span>' : ''}</button>`;
  }
  return `
  <header class="top"><div><p class="sub">مساحتك الخاصة</p><h1>الدورة</h1></div></header>
  ${hero}
  <div class="nav" style="margin-top:14px"><button class="round" data-act="cShift" data-n="-1">${ic('prev')}</button>
    <b>${monthLabel(k)}</b><button class="round" data-act="cShift" data-n="1">${ic('next')}</button></div>
  <div class="mgrid">${cells}</div>
  <div class="legend">
    <span><i style="background:var(--pink-d)"></i>الدورة</span><span><i style="background:var(--sky)"></i>خصوبة</span>
    <span><i style="background:var(--mint-d)"></i>تبويض</span><span><i style="background:var(--peach)"></i>ما قبل الدورة</span></div>
  <div class="card" style="margin-top:14px"><div style="display:flex;justify-content:space-between">
    <span>طول الدورة</span><b>${len} يوم</b></div><div style="display:flex;justify-content:space-between;margin-top:6px">
    <span>مدة الدورة</span><b>${c.period} أيام</b></div></div>
  <p class="disc">اضغط أي يوم لتسجيل المزاج والأعراض. التواريخ تقديرية فقط ولا تغني عن استشارة الطبيبة.</p>`;
}

/* ---------- 14) نماذج الإضافة ---------- */
function sheetName() {
  openSheet('وش نناديك؟', `<label>الاسم<input name="n" value="${esc(S.name)}" placeholder="اسمك" autofocus></label><button class="btn">حفظ ✦</button>`,
    fd => { S.name = fd.get('n').trim(); S.asked = true; });
}
function sheetTask(pref = {}) {
  openSheet('مهمة جديدة', `
    <label>العنوان<input name="title" required placeholder="مثلاً: مراجعة الفيزياء" value="${esc(pref.title || '')}"></label>
    <div class="two"><label>التاريخ<input type="date" name="date" value="${pref.date || U.date}" required></label>
    <label>الوقت<input type="time" name="time"></label></div>
    <p class="lbl">التصنيف</p><div class="chips">${chipRadio('cat', Object.entries(CATS).map(([k, v]) => [k, v[0]]), pref.cat || 'personal', v => CATS[v][1])}</div>
    <p class="lbl">التكرار</p><div class="chips">${chipRadio('repeat', [['none', 'مرة وحدة'], ['daily', 'كل يوم'], ['weekly', 'كل أسبوع']], 'none')}</div>
    <button class="btn">إضافة ✦</button>`,
    fd => S.tasks.push({ id: uid(), title: fd.get('title').trim(), date: fd.get('date'), time: fd.get('time') || '', cat: fd.get('cat'), repeat: fd.get('repeat'), done: [] }));
}
function sheetGoal() {
  openSheet('هدف جديد', `
    <label>الهدف<input name="title" required placeholder="مثلاً: أختم القرآن، أوفر 20 ألف"></label>
    <label>السنة<input type="number" name="year" min="2020" max="2100" value="${U.goalYear}" required></label>
    <p class="lbl">المجال</p><div class="chips">${chipRadio('cat', Object.entries(GCATS).map(([k, v]) => [k, v[0]]), 'self', v => GCATS[v][1])}</div>
    <label>ملاحظة<textarea name="note" rows="2" placeholder="ليش هذا الهدف مهم؟ (اختياري)"></textarea></label>
    <button class="btn">إضافة ✦</button>`,
    fd => { const y = +fd.get('year'); S.goals.push({ id: uid(), title: fd.get('title').trim(), year: y, cat: fd.get('cat'), note: fd.get('note').trim(), p: 0 }); U.goalYear = y; });
}
function sheetTx() {
  const opts = t => MCATS[t].map(c => `<option>${c}</option>`).join('');
  const now = new Date(), defDate = U.moneyMonth === monthKey(now) ? iso(now) : U.moneyMonth + '-01';
  openSheet('عملية جديدة', `
    <div class="chips big">${chipRadio('type', Object.entries(TYPES).map(([k, v]) => [k, v[0]]), 'exp', v => TYPES[v][1])}</div>
    <label>المبلغ (ر.س)<input name="amount" type="number" inputmode="decimal" min="0" step="0.01" required placeholder="0"></label>
    <label>التصنيف<select name="cat">${opts('exp')}</select></label>
    <label>ملاحظة<input name="note" placeholder="اختياري"></label>
    <label>التاريخ<input type="date" name="date" value="${defDate}" required></label>
    <button class="btn">حفظ ✦</button>`,
    fd => { S.money.push({ id: uid(), type: fd.get('type'), amount: +fd.get('amount'), cat: fd.get('cat'), note: fd.get('note').trim(), date: fd.get('date') }); },
    f => f.addEventListener('change', e => { if (e.target.name === 'type') f.elements.cat.innerHTML = opts(e.target.value); }));
}
function sheetTarget() {
  openSheet('هدف الادخار', `<label>المبلغ لهالشهر (ر.س)<input name="t" type="number" min="0" value="${S.saveTarget[U.moneyMonth] || ''}" required></label><button class="btn">حفظ ✦</button>`,
    fd => { S.saveTarget[U.moneyMonth] = +fd.get('t'); });
}
function sheetSem() {
  const t = iso(new Date());
  openSheet('ترم جديد', `
    <label>اسم الترم<input name="name" required placeholder="مثلاً: الترم الأول 1448"></label>
    <div class="two"><label>يبدأ<input type="date" name="start" value="${t}" required></label>
    <label>ينتهي<input type="date" name="end" value="${iso(addDays(new Date(), 120))}" required></label></div>
    <button class="btn">إنشاء ✦</button>`,
    fd => {
      if (fd.get('end') < fd.get('start')) { alert('تاريخ النهاية قبل البداية'); return false; }
      const s = { id: uid(), name: fd.get('name').trim(), start: fd.get('start'), end: fd.get('end'), courses: [] };
      S.semesters.push(s); S.activeSem = s.id;
    });
}
function sheetCourse() {
  openSheet('مادة جديدة', `
    <label>اسم المادة<input name="name" required placeholder="مثلاً: الفيزياء العامة"></label>
    <div class="two"><label>الرمز<input name="code" placeholder="PHYS101"></label><label>القاعة<input name="room" placeholder="مبنى 4 · 201"></label></div>
    <p class="lbl">الأيام</p><div class="chips">${chipCheck('day', DAYS.map((n, i) => [i, n]))}</div>
    <div class="two"><label>من<input type="time" name="start" value="08:00" required></label><label>إلى<input type="time" name="end" value="09:30" required></label></div>
    <p class="lbl">اللون</p><div class="chips">${chipRadio('tone', TONES.map(t => [t, '●']), TONES[activeSem().courses.length % 6], v => v)}</div>
    <button class="btn">إضافة ✦</button>`,
    fd => {
      const days = fd.getAll('day').map(Number);
      if (!days.length) { alert('اختر يوم واحد على الأقل'); return false; }
      if (fd.get('end') <= fd.get('start')) { alert('وقت النهاية لازم يكون بعد البداية'); return false; }
      activeSem().courses.push({ id: uid(), name: fd.get('name').trim(), code: fd.get('code').trim(), room: fd.get('room').trim(), days, start: fd.get('start'), end: fd.get('end'), tone: fd.get('tone') });
    });
}
function sheetCycleSetup() {
  const c = S.cycle;
  openSheet('إعداد الدورة', `
    <label>أول يوم في آخر دورة<input type="date" name="last" value="${c.last || iso(new Date())}" required></label>
    <div class="two"><label>طول الدورة (يوم)<input type="number" name="len" min="20" max="45" value="${c.len}" required></label>
    <label>مدة الدورة (أيام)<input type="number" name="period" min="2" max="10" value="${c.period}" required></label></div>
    <button class="btn">حفظ ✦</button>`,
    fd => { c.last = fd.get('last'); c.len = +fd.get('len'); c.period = +fd.get('period'); });
}
function sheetLog(date) {
  const lg = S.cycle.logs[date] || {}, d = fromIso(date);
  openSheet(`${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`, `
    <p class="lbl">التدفق</p><div class="chips">${chipRadio('flow', [['', 'بدون'], ['light', 'خفيف'], ['medium', 'متوسط'], ['heavy', 'غزير']], lg.flow || '')}</div>
    <p class="lbl">المزاج</p><div class="chips">${chipCheck('mood', ['هدوء', 'سعادة', 'توتر', 'حزن', 'نعاس', 'تشتت', 'طاقة'].map(x => [x, x]), lg.mood)}</div>
    <p class="lbl">الأعراض</p><div class="chips">${chipCheck('sym', ['تقلصات', 'صداع', 'تعب', 'انتفاخ', 'ألم ظهر', 'حبوب', 'غثيان'].map(x => [x, x]), lg.sym)}</div>
    <label>ملاحظة<textarea name="note" rows="2">${esc(lg.note || '')}</textarea></label>
    <button class="btn">حفظ ✦</button>
    <button type="button" class="btn ghost" id="startToday">بدأت الدورة بهذا اليوم</button>`,
    fd => {
      const r = { flow: fd.get('flow'), mood: fd.getAll('mood'), sym: fd.getAll('sym'), note: fd.get('note').trim() };
      if (!r.flow && !r.mood.length && !r.sym.length && !r.note) delete S.cycle.logs[date]; else S.cycle.logs[date] = r;
    },
    () => $('#startToday').onclick = () => { S.cycle.last = date; save(); closeSheet(); render(); });
}

/* ---------- 15) الأحداث (event delegation) ---------- */
const ACT = {
  tab(b) { U.tab = b.dataset.v; render(); scrollTo({ top: 0 }); },
  fab() { ({
    today: () => sheetTask({ date: iso(new Date()) }),
    schedule: () => sheetTask({ date: U.date }),
    goals: sheetGoal, money: sheetTx,
    uni: () => activeSem() ? sheetCourse() : sheetSem(),
    cycle: () => S.cycle.last ? sheetLog(iso(new Date())) : sheetCycleSetup()
  })[U.tab](); },
  name: sheetName,

  /* الجدول */
  mode(b) { U.mode = b.dataset.v; render(); },
  shift(b) {
    const n = +b.dataset.n, d = fromIso(U.date);
    if (U.mode === 'day') U.date = iso(addDays(d, n));
    else if (U.mode === 'week') U.date = iso(addDays(d, 7 * n));
    else { const t = new Date(d.getFullYear(), d.getMonth() + n, 1), dim = new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate(); t.setDate(Math.min(d.getDate(), dim)); U.date = iso(t); }
    render();
  },
  pickDate(b) { U.date = b.dataset.d; render(); },
  goDay(b) { U.date = b.dataset.d; U.mode = 'day'; render(); },
  toggle(b) {
    const t = S.tasks.find(x => x.id === b.dataset.id), d = b.dataset.d;
    t.done = t.done || []; const i = t.done.indexOf(d); i < 0 ? t.done.push(d) : t.done.splice(i, 1);
    save(); render();
  },
  delTask(b) {
    const t = S.tasks.find(x => x.id === b.dataset.id);
    if (!confirm(t.repeat !== 'none' ? 'هذي مهمة متكررة وبتنحذف كل مراتها. تأكيد الحذف؟' : 'تأكيد حذف المهمة؟')) return;
    S.tasks = S.tasks.filter(x => x !== t); save(); render();
  },

  /* الأهداف */
  gShift(b) { U.goalYear += +b.dataset.n; render(); },
  gYear(b) { U.goalYear = +b.dataset.v; render(); },
  delGoal(b) { if (!confirm('تأكيد حذف الهدف؟')) return; S.goals = S.goals.filter(g => g.id !== b.dataset.id); save(); render(); },
  moveGoal(b) { const g = S.goals.find(x => x.id === b.dataset.id); g.year++; g.p = Math.min(g.p, 95); save(); render(); },

  /* المال */
  mShift(b) { U.moneyMonth = shiftMonth(U.moneyMonth, +b.dataset.n); render(); },
  setTarget: sheetTarget,
  delTx(b) { if (!confirm('تأكيد حذف العملية؟')) return; S.money = S.money.filter(t => t.id !== b.dataset.id); save(); render(); },

  /* الجامعة */
  semPick(b) { S.activeSem = b.dataset.id; save(); render(); },
  addSem: sheetSem,
  delSem() {
    const s = activeSem(); if (!s || !confirm(`تأكيد حذف «${s.name}» بكل موادها؟`)) return;
    S.semesters = S.semesters.filter(x => x !== s); S.activeSem = S.semesters.at(-1)?.id || null; save(); render();
  },
  delCourse(b) { const s = activeSem(); if (!confirm('تأكيد حذف المادة؟')) return; s.courses = s.courses.filter(c => c.id !== b.dataset.id); save(); render(); },
  addExam() { sheetTask({ cat: 'study', title: 'اختبار: ' }); },

  /* الدورة */
  cShift(b) { U.cycleMonth = shiftMonth(U.cycleMonth, +b.dataset.n); render(); },
  cSetup: sheetCycleSetup,
  cDay(b) { sheetLog(b.dataset.d); }
};
document.addEventListener('click', e => { const b = e.target.closest('[data-act]'); if (b) ACT[b.dataset.act]?.(b, e); });

/* سلايدر تقدم الهدف: تحديث لحظي أثناء السحب ثم حفظ عند الإفلات */
document.addEventListener('input', e => {
  const r = e.target.closest('[data-act="goalP"]'); if (!r) return;
  const g = S.goals.find(x => x.id === r.dataset.id); g.p = +r.value;
  const card = r.closest('.goal'); card.querySelector('.fill').style.width = g.p + '%'; card.querySelector('.pv').textContent = g.p + '%';
});
document.addEventListener('change', e => { if (e.target.closest('[data-act="goalP"]')) { save(); render(); } });
$('#sheet').addEventListener('click', e => { if (e.target.id === 'sheet') closeSheet(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSheet(); });

/* ---------- 16) الرسم ---------- */
const VIEWS = { today: vToday, schedule: vSchedule, goals: vGoals, money: vMoney, uni: vUni, cycle: vCycle };
function render() {
  $$('.view').forEach(v => v.classList.toggle('active', v.id === 'view-' + U.tab));
  $('#view-' + U.tab).innerHTML = VIEWS[U.tab]();
  $('#tabbar').innerHTML = TABS.map(([k, l, i]) => `<button class="tab ${U.tab === k ? 'on' : ''}" data-act="tab" data-v="${k}">${ic(i, 22)}<span>${l}</span></button>`).join('');
  $('#fab').innerHTML = ic('plus', 26);
}
render();
if (!S.asked) { S.asked = true; save(); sheetName(); }