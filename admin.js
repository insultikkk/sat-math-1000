(function(){
"use strict";
/* Refuse to run inside a frame (GitHub Pages cannot send frame-ancestors headers). */
if (window.top !== window.self) { document.getElementById("app").textContent = "Откройте админ-панель в отдельной вкладке."; return; }
const META = new Map(window.META.map(m => [String(m[0]), {s:m[1], d:m[2], t:m[3]}]));
const DOM = {algebra:"Алгебра", advanced:"Продвинутая математика", psda:"Анализ данных", geometry:"Геометрия и тригонометрия",
  craft:"Ремесло и структура", info:"Информация и идеи", conventions:"Нормы английского", expression:"Выражение идей"};
const WD = {math:["algebra","advanced","psda","geometry"], english:["craft","info","conventions","expression"]};
const TOP = {linear_equations:"Линейные уравнения", linear_inequalities:"Линейные неравенства", systems_of_equations:"Системы уравнений", linear_functions:"Линейные функции",
  linear_models:"Линейные модели", quadratics:"Квадратные уравнения", exponents_radicals:"Степени и корни", exponential_models:"Экспоненты", polynomials:"Многочлены",
  functions:"Функции", rational_expressions:"Рациональные уравнения", nonlinear_systems:"Нелинейные системы", percentages:"Проценты", ratios_rates:"Отношения и скорости",
  units_conversion:"Перевод единиц", statistics:"Статистика", probability:"Вероятность", area_volume:"Площадь и объём", lines_angles_triangles:"Углы и треугольники",
  right_triangles:"Прямоугольные треугольники", circles:"Окружности", similarity:"Подобие", trigonometry:"Тригонометрия", coordinate_geometry:"Координаты",
  words_in_context:"Слова в контексте", command_of_evidence:"Аргументы", quantitative_evidence:"Данные из таблиц", subject_verb:"Согласование", pronouns:"Местоимения",
  verb_tense:"Времена", possessives:"Притяжательные", punctuation:"Пунктуация", modifiers:"Обороты", transitions:"Связки", rhetorical_synthesis:"Работа с заметками"};
const app = document.getElementById("app");
/* Every value placed into HTML goes through esc(), numbers included. */
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const isInt = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;
const pct = (c, n) => n ? Math.round(100 * c / n) : null;
const accCls = p => p == null ? "" : p >= 80 ? "acc-good" : p < 60 ? "acc-bad" : "";
function ago(ts){
  if (!ts) return "—";
  const m = Math.round((Date.now() - ts) / 60000);
  if (m < 1) return "только что"; if (m < 60) return m + " мин назад";
  const h = Math.round(m / 60); if (h < 24) return h + " ч назад";
  const d = Math.round(h / 24); return d + " дн назад";
}
const GOOGLE = '<svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>';

/* Records are written by students' browsers, so treat them as untrusted: keep only well-formed values. */
function clean(raw){
  let issues = 0;
  const d = raw && typeof raw === "object" ? raw : (issues++, {});
  const str = (v, max) => typeof v === "string" ? v.slice(0, max) : "";
  const out = {name: str(d.name, 100), email: str(d.email, 200), updated: Number.isFinite(d.updated) ? d.updated : 0, ans: {}, tests: []};
  if (d.ans && typeof d.ans === "object" && !Array.isArray(d.ans)) {
    let k = 0;
    for (const [qid, r] of Object.entries(d.ans)) {
      if (++k > 2500) { issues++; break; }
      if (!META.has(qid) || !r || typeof r !== "object" || ![0, 1, true, false].includes(r.c)) { issues++; continue; }
      out.ans[qid] = {c: r.c ? 1 : 0};
    }
  } else if (d.ans !== undefined) issues++;
  if (Array.isArray(d.tests)) {
    if (d.tests.length > 300) issues++;
    for (const x of d.tests.slice(0, 300)) {
      if (x && typeof x === "object" && Number.isFinite(x.d) && (x.w === undefined || x.w === "math" || x.w === "english") && isInt(x.n, 1, 100) && isInt(x.s, 0, x.n))
        out.tests.push({d: x.d, w: x.w || "math", n: x.n, s: x.s});
      else issues++;
    }
  } else if (d.tests !== undefined) issues++;
  out.issues = issues;
  return out;
}
const emptyUser = id => ({id, name:"", email:"", updated:0, tests:[], w:{math:{n:0,c:0}, english:{n:0,c:0}}, dom:{}, top:{}, total:0, correct:0, issues:1, broken:true});
/* Summaries computed from each user's progress document; one bad record never breaks the list. */
function summarize(id, raw){
  try { return summarizeClean(id, clean(raw)); } catch (e) { return emptyUser(id); }
}
function summarizeClean(id, d){
  const u = {id, name:d.name || "", email:d.email || "", updated:d.updated || 0, tests:(d.tests || []).slice().sort((a, b) => b.d - a.d),
    w:{math:{n:0,c:0}, english:{n:0,c:0}}, dom:{}, top:{}};
  for (const [qid, r] of Object.entries(d.ans || {})) {
    const m = META.get(qid); if (!m) continue;
    u.w[m.s].n++; if (r.c) u.w[m.s].c++;
    (u.dom[m.d] = u.dom[m.d] || {n:0,c:0}).n++; if (r.c) u.dom[m.d].c++;
    (u.top[m.t] = u.top[m.t] || {n:0,c:0, s:m.s}).n++; if (r.c) u.top[m.t].c++;
  }
  u.total = u.w.math.n + u.w.english.n; u.correct = u.w.math.c + u.w.english.c; u.issues = d.issues;
  return u;
}

let users = [], sel = null, sortKey = "updated", sortDir = -1, unsub = null, demo = false, realUsers = [];

/* Demo mode: 15 made-up students generated in the browser only. Nothing is written to the database. */
function demoUsers(){
  let seed = 20261118;
  const rnd = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const names = ["Алина Каримова","Тимур Юсупов","Мадина Рахимова","Артём Ковалёв","Камила Ахмедова","Даниил Орлов","Сабина Исмаилова","Руслан Назаров",
    "Эмилия Ли","Максим Белов","Асель Нурланова","Иван Соколов","Лейла Гасанова","Бахтияр Алиев","София Миронова"];
  const ids = {math:[], english:[]};
  for (const [id, m] of META) ids[m.s].push(id);
  const DAY = 864e5, now = Date.now();
  return names.map((name, i) => {
    const level = 0.45 + rnd() * 0.5, engBias = rnd() * 0.3 - 0.15;
    const ans = {}, tests = [];
    for (const w of ["math", "english"]) {
      const count = Math.floor(rnd() < 0.15 ? rnd() * 15 : 20 + rnd() * 380);
      const pool = ids[w].slice();
      for (let k = 0; k < count && pool.length; k++) {
        const id = pool.splice(Math.floor(rnd() * pool.length), 1)[0], m = META.get(id);
        const domainSkill = ({algebra:0.08, advanced:-0.06, psda:0.05, geometry:-0.1, craft:-0.04, info:0.02, conventions:0.08, expression:0.03})[m.d] || 0;
        const p = Math.min(0.97, Math.max(0.15, level + (w === "english" ? engBias : 0) + domainSkill));
        ans[id] = {c: rnd() < p ? 1 : 0, n: 1 + (rnd() < 0.2 ? 1 : 0)};
      }
      const nt = Math.floor(rnd() * 5);
      for (let k = 0; k < nt; k++) { const n = w === "math" ? 22 : 27; tests.push({d: now - Math.floor(rnd() * 30) * DAY, w, n, s: Math.round(n * Math.min(0.98, level + (rnd() - 0.4) * 0.25))}); }
    }
    const updated = now - Math.floor(Math.pow(rnd(), 2) * 20 * DAY) - Math.floor(rnd() * DAY);
    return summarize("demo-" + (i + 1), {name, email: "student" + (i + 1) + "@example.com", ans, tests, updated});
  });
}
function startDemo(){ demo = true; sel = null; users = demoUsers(); render(); }
function stopDemo(){ demo = false; sel = null; users = accessState === "ok" ? realUsers : [];
  if (accessState === "ok") render(); else if (accessState === "pending") app.innerHTML = '<div class="empty">Проверяю доступ…</div>'; else gate(accessState, accessEmail); }
let accessState = "signin", accessEmail = "";
const COLS = [["name","Ученик"],["math","Math"],["english","English"],["tests","Тесты"],["updated","Активность"]];
const sortVal = (u, k) => k === "name" ? (u.name || u.email).toLowerCase() : k === "math" ? u.w.math.n : k === "english" ? u.w.english.n : k === "tests" ? u.tests.length : u.updated;

function render(){
  const week = Date.now() - 7 * 864e5;
  const total = users.reduce((a, u) => a + u.total, 0), corr = users.reduce((a, u) => a + u.correct, 0);
  const list = users.slice().sort((a, b) => { const x = sortVal(a, sortKey), y = sortVal(b, sortKey); return (x > y ? 1 : x < y ? -1 : 0) * sortDir; });
  const cell = w => { const p = pct(w.c, w.n); return `${esc(w.n)}<span class="muted"> / 1000</span>${p == null ? "" : ` · <span class="${accCls(p)}">${esc(p)}%</span>`}`; };
  app.innerHTML = `
    ${demo ? `<div class="demo-bar"><b>Демо-режим</b><span class="muted">15 вымышленных учеников, сгенерированы в браузере. В базе их нет.</span><span style="flex:1"></span><button class="btn" id="demo-off" type="button">Выйти из демо</button></div>` : ""}
    <div class="tiles">
      <div class="tile"><span class="label">Учеников</span><b>${esc(users.length)}</b></div>
      <div class="tile"><span class="label">Активны за 7 дней</span><b>${esc(users.filter(u => u.updated > week).length)}</b></div>
      <div class="tile"><span class="label">Решено задач всего</span><b>${esc(total.toLocaleString("ru"))}</b></div>
      <div class="tile"><span class="label">Средняя точность</span><b>${esc(total ? Math.round(100 * corr / total) + "%" : "—")}</b></div>
    </div>
    <section class="panel">
      <div class="panel-head"><h2>Ученики</h2>${demo ? "" : `<button class="btn" id="demo-on" type="button">Демо</button>`}<span class="muted" style="font-size:.85rem">Нажмите на строку, чтобы увидеть подробности</span></div>
      ${users.length ? `<div class="tablewrap"><table><thead><tr>${COLS.map(([k, l]) => `<th data-k="${k}" ${k === sortKey ? `aria-sort="${sortDir > 0 ? "ascending" : "descending"}"` : ""}>${l}</th>`).join("")}</tr></thead><tbody>
      ${list.map(u => { const best = u.tests.length ? Math.max(...u.tests.map(x => Math.round(100 * x.s / (x.n || 1)))) : null;
        return `<tr data-id="${esc(u.id)}" aria-selected="${sel === u.id}" tabindex="0">
          <td><div class="who"><b>${esc(u.name || "Без имени")}</b><small>${esc(u.email || u.id.slice(0, 8) + "…")}</small>${u.issues ? `<span class="pill warn">некорректные данные: ${esc(u.issues)}</span>` : ""}</div></td>
          <td class="n">${cell(u.w.math)}</td><td class="n">${cell(u.w.english)}</td>
          <td class="n">${esc(u.tests.length)}${best == null ? "" : ` · лучший ${esc(best)}%`}</td>
          <td><span class="pill ${u.updated > week ? "on" : "off"}">${esc(ago(u.updated))}</span></td></tr>`; }).join("")}
      </tbody></table></div>` : `<div class="empty">Пока никто не вошёл на сайт через Google. Когда друг войдёт и решит задачу, он появится здесь.</div>`}
    </section>
    ${sel && users.find(u => u.id === sel) ? detail(users.find(u => u.id === sel)) : ""}`;
  const on = document.getElementById("demo-on"); if (on) on.addEventListener("click", startDemo);
  const off = document.getElementById("demo-off"); if (off) off.addEventListener("click", stopDemo);
  app.querySelectorAll("th[data-k]").forEach(th => th.addEventListener("click", () => { const k = th.dataset.k; sortDir = sortKey === k ? -sortDir : (k === "name" ? 1 : -1); sortKey = k; render(); }));
  app.querySelectorAll("tbody tr").forEach(tr => { const open = () => { sel = sel === tr.dataset.id ? null : tr.dataset.id; render(); if (sel) document.getElementById("detail")?.scrollIntoView({behavior:"smooth", block:"start"}); };
    tr.addEventListener("click", open); tr.addEventListener("keydown", e => { if (e.key === "Enter") open(); }); });
}
function detail(u){
  const block = w => `<div><div class="sub"><span class="dot" style="background:var(${w === "math" ? "--math" : "--eng"})"></span>${w === "math" ? "Math" : "English"}</div>
    ${WD[w].map(d => { const s = u.dom[d] || {n:0, c:0}; const p = pct(s.c, s.n);
      return `<div class="drow"><span>${DOM[d]}</span><div class="meter"><i class="g" style="width:${s.n ? 100 * s.c / s.n : 0}%"></i><i class="r" style="width:${s.n ? 100 * (s.n - s.c) / s.n : 0}%"></i></div><span class="num">${esc(s.n)} · <span class="${accCls(p)}">${esc(p == null ? "—" : p + "%")}</span></span></div>`; }).join("")}</div>`;
  const weak = Object.entries(u.top).filter(([, s]) => s.n >= 3).map(([k, s]) => [k, s, pct(s.c, s.n)]).sort((a, b) => a[2] - b[2]).slice(0, 6);
  return `<section class="panel" id="detail">
    <div class="panel-head"><h2>${esc(u.name || "Без имени")}</h2><span class="muted">${esc(u.email)}</span></div>${u.broken ? `<p class="acc-bad" style="margin:0 0 10px">Запись повреждена и не может быть показана.</p>` : ""}
    <div class="detail">
      ${block("math")}${block("english")}
      <div><div class="sub">Слабые темы</div>${weak.length ? `<ul class="plain">${weak.map(([k, s, p]) => `<li><span class="${accCls(p)}">${esc(p)}%</span> — ${esc(TOP[k] || k)} <span class="muted">(${esc(s.c)}/${esc(s.n)}, ${s.s === "math" ? "Math" : "English"})</span></li>`).join("")}</ul>` : `<p class="muted" style="margin:0">Нужно решить хотя бы 3 задачи по теме.</p>`}</div>
      <div><div class="sub">Пробные тесты</div>${u.tests.length ? `<ul class="plain">${u.tests.slice(0, 10).map(x => `<li><span class="num">${esc(new Date(x.d).toLocaleDateString("ru"))}</span> · ${x.w === "math" ? "Math" : "English"} · <b>${esc(x.s)}/${esc(x.n)}</b> <span class="${accCls(pct(x.s, x.n))}">(${esc(pct(x.s, x.n))}%)</span></li>`).join("")}</ul><p class="muted" style="margin:8px 0 0;font-size:.8rem">Баллы считает браузер ученика: это самопроверка, а не проверенная оценка.</p>` : `<p class="muted" style="margin:0">Тестов пока не было.</p>`}</div>
    </div></section>`;
}

function gate(kind, extra){
  const signIn = `<button class="google-btn" id="g-in" type="button">${GOOGLE}Войти через Google</button>`;
  app.innerHTML = kind === "signin"
    ? `<div class="gate"><div class="lock" aria-hidden="true">🔒</div><h1>Админ-панель</h1><p class="muted" style="margin:0">Войдите аккаунтом администратора.</p>${signIn}</div>`
    : kind === "denied"
    ? `<div class="gate"><div class="lock" aria-hidden="true">⛔</div><h1>Нет доступа</h1><p class="muted" style="margin:0">У аккаунта ${esc(extra)} нет прав администратора.</p><button class="btn primary" id="g-out" type="button">Выйти</button></div>`
    : `<div class="gate"><h1>Ошибка</h1><p class="muted" style="margin:0">${esc(extra)}</p></div>`;
  if (kind !== "error") app.querySelector(".gate").insertAdjacentHTML("beforeend", '<button class="btn" id="g-demo" type="button">Посмотреть демо: 15 учеников</button>');
  const dm = document.getElementById("g-demo"); if (dm) dm.addEventListener("click", startDemo);
  const b = document.getElementById("g-in"); if (b) b.addEventListener("click", signInGoogle);
  const o = document.getElementById("g-out"); if (o) o.addEventListener("click", () => firebase.auth().signOut());
}
function signInGoogle(){
  const auth = firebase.auth(), prov = new firebase.auth.GoogleAuthProvider();
  prov.setCustomParameters({prompt:"select_account"});
  auth.signInWithPopup(prov).catch(e => { if (e && e.code === "auth/popup-blocked") auth.signInWithRedirect(prov); });
}

if (!window.firebase || !window.FIREBASE_CONFIG) { gate("error", "Firebase не загрузился."); return; }
firebase.initializeApp(window.FIREBASE_CONFIG);
const auth = firebase.auth(), db = firebase.firestore();
document.getElementById("sign-out").addEventListener("click", () => auth.signOut());
auth.onAuthStateChanged(u => {
  if (unsub) { unsub(); unsub = null; }
  /* New session: forget everything loaded for the previous account. */
  realUsers = []; accessState = u ? "pending" : "signin";
  if (!demo) { users = []; sel = null; }
  document.getElementById("who").textContent = u ? (u.email || "") : "";
  document.getElementById("sign-out").hidden = !u;
  accessEmail = u ? (u.email || "") : "";
  if (!u) return demo ? render() : gate("signin");
  if (!demo) app.innerHTML = '<div class="empty">Проверяю доступ…</div>';
  /* The database rules decide access: only the admin account may list all users. */
  unsub = db.collection("users").onSnapshot({includeMetadataChanges: true}, snap => {
    /* Show the list only once the server has answered for this session. */
    if (snap.metadata.fromCache) return;
    accessState = "ok"; realUsers = snap.docs.map(d => summarize(d.id, d.data()));
    if (!demo) { users = realUsers; render(); }
  }, err => {
    realUsers = []; if (!demo) { users = []; sel = null; }
    if (err && err.code === "permission-denied") { accessState = "denied"; if (!demo) gate("denied", u.email || ""); }
    else { accessState = "error"; accessEmail = "Не удалось загрузить данные."; if (!demo) gate("error", accessEmail); }
  });
});
})();
