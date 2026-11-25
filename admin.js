(function(){
"use strict";
/* Refuse to run inside a frame (GitHub Pages cannot send frame-ancestors headers). */
if (window.top !== window.self) { document.getElementById("app").textContent = "Откройте админ-панель в отдельной вкладке."; return; }
/* QDATA rows: [id, subject, domain, topic, difficulty, type, q(html), choices, answer, answer_display, exp_ru] — built from our own question bank. */
const QD = new Map(window.QDATA.map(r => [String(r[0]), {id:r[0], s:r[1], d:r[2], t:r[3], dif:r[4], type:r[5], q:r[6], ch:r[7], ans:r[8], disp:r[9], exp:r[10]}]));
const META = QD;
const DOM = {algebra:"Алгебра", advanced:"Продвинутая математика", psda:"Анализ данных", geometry:"Геометрия и тригонометрия",
  craft:"Ремесло и структура", info:"Информация и идеи", conventions:"Нормы английского", expression:"Выражение идей"};
const WD = {math:["algebra","advanced","psda","geometry"], english:["craft","info","conventions","expression"]};
const WTOTAL = {math:0, english:0}; for (const q of QD.values()) WTOTAL[q.s]++;
const DIFN = {easy:"Лёгкие", medium:"Средние", hard:"Сложные"};
const TOP = {linear_equations:"Линейные уравнения", linear_inequalities:"Линейные неравенства", systems_of_equations:"Системы уравнений", linear_functions:"Линейные функции",
  linear_models:"Линейные модели", quadratics:"Квадратные уравнения", exponents_radicals:"Степени и корни", exponential_models:"Экспоненты", polynomials:"Многочлены",
  functions:"Функции", rational_expressions:"Рациональные уравнения", nonlinear_systems:"Нелинейные системы", percentages:"Проценты", ratios_rates:"Отношения и скорости",
  units_conversion:"Перевод единиц", statistics:"Статистика", probability:"Вероятность", area_volume:"Площадь и объём", lines_angles_triangles:"Углы и треугольники",
  right_triangles:"Прямоугольные треугольники", circles:"Окружности", similarity:"Подобие", trigonometry:"Тригонометрия", coordinate_geometry:"Координаты",
  words_in_context:"Слова в контексте", command_of_evidence:"Аргументы", quantitative_evidence:"Данные из таблиц", subject_verb:"Согласование", pronouns:"Местоимения",
  verb_tense:"Времена", possessives:"Притяжательные", punctuation:"Пунктуация", modifiers:"Обороты", transitions:"Связки", rhetorical_synthesis:"Работа с заметками",
  central_ideas:"Главная мысль", inferences:"Логические выводы", text_structure:"Структура и цель текста", cross_text:"Два текста"};
const app = document.getElementById("app");
/* Every value that comes from a student record goes through esc(), numbers included. */
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const isInt = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;
const pct = (c, n) => n ? Math.round(100 * c / n) : null;
const accCls = p => p == null ? "" : p >= 80 ? "acc-good" : p < 60 ? "acc-bad" : "";
const LET = "ABCD";
const fmtSec = s => s >= 60 ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}` : `${s} с`;
const dstr = ts => new Date(ts).toLocaleDateString("ru", {day:"numeric", month:"short"});
function ago(ts){
  if (!ts) return "—";
  const m = Math.round((Date.now() - ts) / 60000);
  if (m < 1) return "только что"; if (m < 60) return m + " мин назад";
  const h = Math.round(m / 60); if (h < 24) return h + " ч назад";
  const d = Math.round(h / 24); return d + " дн назад";
}
const GOOGLE = '<svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>';

/* ---------- untrusted student records → validated shape ---------- */
const validAns = v => v === null || isInt(v, 0, 3) || (typeof v === "string" && v.length <= 12);
const isScore = v => isInt(v, 200, 800);
function cleanTest(x){
  if (!(x && typeof x === "object" && Number.isFinite(x.d) && (x.w === undefined || ["math","english","full"].includes(x.w)) && isInt(x.n, 1, 200) && isInt(x.s, 0, x.n))) return [null, 1];
  const o = {d: x.d, w: x.w || "math", n: x.n, s: x.s}; let issues = 0;
  if (["full","math","english","quick"].includes(x.mode)) o.mode = x.mode;
  if (x.sc !== undefined) {
    if (x.sc && typeof x.sc === "object" && (x.sc.rw === undefined || isScore(x.sc.rw)) && (x.sc.m === undefined || isScore(x.sc.m)) && (x.sc.rw || x.sc.m)) o.sc = {rw: x.sc.rw, m: x.sc.m};
    else issues++;
  }
  if (x.route && typeof x.route === "object") o.route = {rw: ["hard","easy"].includes(x.route.rw) ? x.route.rw : undefined, m: ["hard","easy"].includes(x.route.m) ? x.route.m : undefined};
  if (x.q !== undefined) {
    const ok = Array.isArray(x.q) && x.q.length === x.n && x.q.every(id => QD.has(String(id)))
      && Array.isArray(x.a) && x.a.length === x.n && x.a.every(validAns)
      && Array.isArray(x.t) && x.t.length === x.n && x.t.every(v => isInt(v, 0, 3600))
      && (x.mk === undefined || (Array.isArray(x.mk) && x.mk.length <= 4 && x.mk.every(v => isInt(v, 1, 200)) && x.mk.reduce((a, b) => a + b, 0) === x.n));
    if (ok) { o.q = x.q.slice(); o.a = x.a.slice(); o.t = x.t.slice(); o.mk = x.mk ? x.mk.slice() : [x.n]; } else issues++;
  }
  return [o, issues];
}
function clean(raw){
  let issues = 0;
  const d = raw && typeof raw === "object" ? raw : (issues++, {});
  const str = (v, max) => typeof v === "string" ? v.slice(0, max) : "";
  const out = {name: str(d.name, 100), email: str(d.email, 200), updated: Number.isFinite(d.updated) ? d.updated : 0, ans: {}, tests: []};
  if (d.ans && typeof d.ans === "object" && !Array.isArray(d.ans)) {
    let k = 0;
    for (const [qid, r] of Object.entries(d.ans)) {
      if (++k > 3500) { issues++; break; }
      if (!QD.has(qid) || !r || typeof r !== "object" || ![0, 1, true, false].includes(r.c)) { issues++; continue; }
      const v = {c: r.c ? 1 : 0, n: isInt(r.n, 1, 1e6) ? r.n : 1};
      if (r.a !== undefined && r.a !== null && validAns(r.a)) v.a = r.a;
      if (Number.isFinite(r.ts)) v.ts = r.ts;
      if (r.x === 1) v.x = 1;
      out.ans[qid] = v;
    }
  } else if (d.ans !== undefined) issues++;
  if (Array.isArray(d.tests)) {
    if (d.tests.length > 300) issues++;
    for (const x of d.tests.slice(0, 300)) { const [o, n] = cleanTest(x); issues += n; if (o) out.tests.push(o); }
  } else if (d.tests !== undefined) issues++;
  out.issues = issues;
  return out;
}
const emptyUser = id => ({id, name:"", email:"", updated:0, tests:[], ans:{}, w:{math:{n:0,c:0}, english:{n:0,c:0}}, dom:{}, top:{}, dif:{}, days:{}, total:0, correct:0, issues:1, broken:true});
function summarize(id, raw){
  try { return summarizeClean(id, clean(raw)); } catch (e) { return emptyUser(id); }
}
const dayKey = ts => { const d = new Date(ts); return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); };
const total = x => x.sc ? (x.sc.rw || 0) + (x.sc.m || 0) : null;
function summarizeClean(id, d){
  const u = {id, name:d.name || "", email:d.email || "", updated:d.updated || 0, ans:d.ans, tests:(d.tests || []).slice().sort((a, b) => b.d - a.d),
    w:{math:{n:0,c:0}, english:{n:0,c:0}}, dom:{}, top:{}, dif:{}, days:{}};
  for (const [qid, r] of Object.entries(d.ans || {})) {
    const m = QD.get(qid); if (!m) continue;
    u.w[m.s].n++; if (r.c) u.w[m.s].c++;
    (u.dom[m.d] = u.dom[m.d] || {n:0,c:0}).n++; if (r.c) u.dom[m.d].c++;
    (u.top[m.t] = u.top[m.t] || {n:0,c:0, s:m.s}).n++; if (r.c) u.top[m.t].c++;
    (u.dif[m.s + m.dif] = u.dif[m.s + m.dif] || {n:0,c:0}).n++; if (r.c) u.dif[m.s + m.dif].c++;
    if (r.ts && !r.x) u.days[dayKey(r.ts)] = (u.days[dayKey(r.ts)] || 0) + 1;
  }
  for (const x of u.tests) u.days[dayKey(x.d)] = (u.days[dayKey(x.d)] || 0) + x.n;
  u.total = u.w.math.n + u.w.english.n; u.correct = u.w.math.c + u.w.english.c; u.issues = d.issues;
  /* latest section scores (from full or single-section tests) give a current estimate */
  const lastRW = u.tests.find(x => x.sc && x.sc.rw), lastM = u.tests.find(x => x.sc && x.sc.m);
  u.est = lastRW && lastM ? lastRW.sc.rw + lastM.sc.m : null;
  u.estParts = {rw: lastRW ? lastRW.sc.rw : null, m: lastM ? lastM.sc.m : null};
  const fulls = u.tests.filter(x => x.w === "full" && x.sc);
  u.best = fulls.length ? Math.max(...fulls.map(total)) : null;
  return u;
}

let users = [], sel = null, selTest = null, selQ = null, hardSel = null, sortKey = "updated", sortDir = -1, unsub = null, demo = false, realUsers = [];

/* ---------- demo: 15 made-up students generated in the browser only; nothing is written to the database ---------- */
function demoUsers(){
  let seed = 20261125;
  const rnd = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const names = ["Алина Каримова","Тимур Юсупов","Мадина Рахимова","Артём Ковалёв","Камила Ахмедова","Даниил Орлов","Сабина Исмаилова","Руслан Назаров",
    "Эмилия Ли","Максим Белов","Асель Нурланова","Иван Соколов","Лейла Гасанова","Бахтияр Алиев","София Миронова"];
  const ids = {math:[], english:[]};
  for (const [id, m] of QD) ids[m.s].push(id);
  const byDom = {}; for (const [id, m] of QD) (byDom[m.d] = byDom[m.d] || []).push(id);
  const MIX = {english:{craft:7, info:7, conventions:7, expression:6}, math:{algebra:8, advanced:8, psda:3, geometry:3}};
  const SKILL = {algebra:0.08, advanced:-0.06, psda:0.05, geometry:-0.1, craft:-0.04, info:0.02, conventions:0.08, expression:0.03};
  const DIFF = {easy:0.18, medium:0, hard:-0.2};
  const DAY = 864e5, now = Date.now();
  const pick = arr => arr[Math.floor(rnd() * arr.length)];
  const answerFor = (m, ok) => m.type === "grid" ? (ok ? String(m.disp).split(" or ")[0] : String(Math.round(rnd() * 40))) : (ok ? m.ans : [0,1,2,3].filter(i => i !== m.ans)[Math.floor(rnd() * 3)]);
  return names.map((name, i) => {
    const level = 0.4 + rnd() * 0.52, engBias = rnd() * 0.3 - 0.15;
    const p = (m, w) => Math.min(0.97, Math.max(0.1, level + (w === "english" ? engBias : 0) + (SKILL[m.d] || 0) + DIFF[m.dif]));
    const ans = {}, tests = [];
    for (const w of ["math", "english"]) {
      const count = Math.floor(rnd() < 0.15 ? rnd() * 15 : 20 + rnd() * 380);
      const pool = ids[w].slice();
      for (let k = 0; k < count && pool.length; k++) {
        const id = pool.splice(Math.floor(rnd() * pool.length), 1)[0], m = QD.get(id), ok = rnd() < p(m, w);
        ans[id] = {c: ok ? 1 : 0, n: 1 + (rnd() < 0.2 ? 1 : 0), a: answerFor(m, ok), ts: now - Math.floor(Math.pow(rnd(), 1.6) * 50 * DAY)};
      }
    }
    const nt = Math.floor(rnd() * 6);
    for (let k = 0; k < nt; k++) {
      const mode = pick(["full","full","math","english"]), secs = mode === "full" ? ["english","math"] : [mode];
      const q = [], a = [], t = [], mk = [], sc = {}, route = {};
      let s = 0;
      const growth = k * 0.025;
      for (const w of secs) {
        let r1 = 0;
        for (const mod of [0, 1]) {
          const level2 = mod === 1 ? (r1 >= 0.6 ? "hard" : "easy") : "mixed";
          let n = 0, got = 0, wsum = 0, wgot = 0;
          for (const [dom, cnt] of Object.entries(MIX[w])) {
            const pool = byDom[dom];
            for (let j = 0; j < cnt; j++) {
              let id, m, tries = 0;
              do { id = pick(pool); m = QD.get(id); tries++; } while ((q.includes(Number(id)) || (level2 === "hard" && m.dif === "easy") || (level2 === "easy" && m.dif === "hard")) && tries < 50);
              const ok = rnd() < p(m, w) + growth;
              const skip = rnd() < 0.03;
              q.push(Number(id)); a.push(skip ? null : answerFor(m, ok)); t.push(Math.round(20 + rnd() * (w === "math" ? 140 : 90)));
              const wt = {easy:1, medium:1.4, hard:1.9}[m.dif]; wsum += wt; n++;
              if (ok && !skip) { got++; wgot += wt; s++; }
            }
          }
          mk.push(n);
          if (mod === 0) r1 = got / n; else route[w === "math" ? "m" : "rw"] = level2;
          (sc["_" + w] = sc["_" + w] || []).push(wgot / wsum);
        }
        const [x1, x2] = sc["_" + w]; delete sc["_" + w];
        const v = route[w === "math" ? "m" : "rw"] === "hard" ? 200 + 600 * (x1 + x2) / 2 : 200 + 450 * (x1 + x2) / 2;
        sc[w === "math" ? "m" : "rw"] = Math.max(200, Math.min(800, Math.round(v / 10) * 10));
      }
      tests.push({d: now - Math.floor((nt - k) * (3 + rnd() * 6) * DAY), w: mode, mode, n: q.length, s, sc, route, q, a, t, mk});
    }
    const updated = now - Math.floor(Math.pow(rnd(), 2) * 20 * DAY) - Math.floor(rnd() * DAY);
    return summarize("demo-" + (i + 1), {name, email: "student" + (i + 1) + "@example.com", ans, tests, updated});
  });
}
function startDemo(){ demo = true; sel = selTest = selQ = hardSel = null; users = demoUsers(); render(); }
function stopDemo(){ demo = false; sel = selTest = selQ = hardSel = null; users = accessState === "ok" ? realUsers : [];
  if (accessState === "ok") render(); else if (accessState === "pending") app.innerHTML = '<div class="empty">Проверяю доступ…</div>'; else gate(accessState, accessEmail); }
let accessState = "signin", accessEmail = "";

/* ---------- rendering ---------- */
const COLS = [["name","Ученик"],["math","Math"],["english","English"],["est","Оценка SAT"],["tests","Тесты"],["updated","Активность"]];
const sortVal = (u, k) => k === "name" ? (u.name || u.email).toLowerCase() : k === "math" ? u.w.math.n : k === "english" ? u.w.english.n : k === "tests" ? u.tests.length : k === "est" ? (u.est || 0) : u.updated;
function typeset(el){ if (window.renderMathInElement) { try { renderMathInElement(el, {delimiters:[{left:"\\(", right:"\\)", display:false}], throwOnError:false}); } catch (e) {} } }
function meter(c, n){ return `<div class="meter"><i class="g" style="width:${n ? 100 * c / n : 0}%"></i><i class="r" style="width:${n ? 100 * (n - c) / n : 0}%"></i></div>`; }
function isRight(m, a){
  if (a === null || a === undefined || a === "") return false;
  if (m.type === "mc") return a === m.ans;
  const s = String(a).trim().replace(",", "."), f = s.match(/^(-?\d+)\/(\d+)$/);
  const v = f ? (+f[2] ? +f[1] / +f[2] : NaN) : parseFloat(s);
  if (!Number.isFinite(v)) return false;
  if (Math.abs(v - m.ans) < 1e-9) return true;
  const dp = f ? 0 : (s.split(".")[1] || "").length;
  return dp >= 3 && Math.abs(v - m.ans) < Math.pow(10, -dp) * 1.01;
}
const showAns = (m, a) => a === null || a === undefined || a === "" ? '<span class="muted">нет ответа</span>' : m.type === "mc" ? (isInt(a, 0, 3) ? LET[a] : "?") : esc(a);
const rightAns = m => m.type === "mc" ? LET[m.ans] : esc(m.disp);
function hardest(){
  const st = new Map();
  for (const u of users) for (const [qid, r] of Object.entries(u.ans || {})) { const s = st.get(qid) || {n:0, w:0, users:0}; s.n++; if (!r.c) s.w++; st.set(qid, s); }
  return [...st.entries()].filter(([, s]) => s.n >= 2).map(([qid, s]) => [qid, s, s.w / s.n]).sort((a, b) => b[2] - a[2] || b[1].n - a[1].n).slice(0, 10);
}
function qCard(m, extra){
  return `<div class="qcard"><div class="qmeta"><span class="tag">#${esc(m.id)}</span><span class="tag">${m.s === "math" ? "Math" : "English"}</span><span class="tag">${esc(DOM[m.d])}</span><span class="tag">${esc(TOP[m.t] || m.t)}</span><span class="tag ${m.dif}">${esc(DIFN[m.dif])}</span></div>
    <div class="qtext">${m.q}</div>
    ${m.type === "mc" ? `<ol class="ch">${m.ch.map((c, i) => `<li class="${i === m.ans ? "right" : ""}${extra && extra.a === i && i !== m.ans ? " wrong" : ""}"><b>${LET[i]}</b><span>${c}</span></li>`).join("")}</ol>` : `<p class="muted" style="margin:6px 0 0">Ответ вводится числом. Правильный: <b>${esc(m.disp)}</b></p>`}
    ${extra ? `<p style="margin:8px 0 0">Ответ ученика: <b class="${isRight(m, extra.a) ? "acc-good" : "acc-bad"}">${showAns(m, extra.a)}</b> · правильный: <b>${rightAns(m)}</b>${extra.t != null ? ` · время: <b class="num">${fmtSec(extra.t)}</b>` : ""}</p>` : ""}
    <details class="exp"><summary>Разбор</summary><div>${m.exp}</div></details></div>`;
}
function render(){
  const week = Date.now() - 7 * 864e5;
  const tot = users.reduce((a, u) => a + u.total, 0), corr = users.reduce((a, u) => a + u.correct, 0);
  const allTests = users.reduce((a, u) => a + u.tests.length, 0);
  const list = users.slice().sort((a, b) => { const x = sortVal(a, sortKey), y = sortVal(b, sortKey); return (x > y ? 1 : x < y ? -1 : 0) * sortDir; });
  const hard = hardest();
  app.innerHTML = `
    ${demo ? `<div class="demo-bar"><b>Демо-режим</b><span class="muted">15 вымышленных учеников, сгенерированы в браузере. В базе их нет.</span><span style="flex:1"></span><button class="btn" id="demo-off" type="button">Выйти из демо</button></div>` : ""}
    <div class="tiles">
      <div class="tile"><span class="label">Учеников</span><b>${esc(users.length)}</b></div>
      <div class="tile"><span class="label">Активны за 7 дней</span><b>${esc(users.filter(u => u.updated > week).length)}</b></div>
      <div class="tile"><span class="label">Решено задач всего</span><b>${esc(tot.toLocaleString("ru"))}</b></div>
      <div class="tile"><span class="label">Средняя точность</span><b>${esc(tot ? Math.round(100 * corr / tot) + "%" : "—")}</b></div>
      <div class="tile"><span class="label">Пробных тестов</span><b>${esc(allTests)}</b></div>
    </div>
    <section class="panel">
      <div class="panel-head"><h2>Ученики</h2>${demo ? "" : `<button class="btn" id="demo-on" type="button">Демо</button>`}<span class="muted" style="font-size:.85rem">Нажмите на строку — откроется подробная аналитика</span></div>
      ${users.length ? `<div class="tablewrap"><table><thead><tr>${COLS.map(([k, l]) => `<th data-k="${k}" ${k === sortKey ? `aria-sort="${sortDir > 0 ? "ascending" : "descending"}"` : ""}>${l}</th>`).join("")}</tr></thead><tbody>
      ${list.map(u => `<tr data-id="${esc(u.id)}" aria-selected="${sel === u.id}" tabindex="0">
          <td><div class="who"><b>${esc(u.name || "Без имени")}</b><small>${esc(u.email || u.id.slice(0, 8) + "…")}</small>${u.issues ? `<span class="pill warn">некорректные данные: ${esc(u.issues)}</span>` : ""}</div></td>
          <td class="n">${esc(u.w.math.n)}${u.w.math.n ? ` · <span class="${accCls(pct(u.w.math.c, u.w.math.n))}">${esc(pct(u.w.math.c, u.w.math.n))}%</span>` : ""}</td>
          <td class="n">${esc(u.w.english.n)}${u.w.english.n ? ` · <span class="${accCls(pct(u.w.english.c, u.w.english.n))}">${esc(pct(u.w.english.c, u.w.english.n))}%</span>` : ""}</td>
          <td class="n">${u.est ? `<b>${esc(u.est)}</b>` : `<span class="muted">${u.estParts.rw || u.estParts.m ? esc((u.estParts.rw ? "R&W " + u.estParts.rw : "") + (u.estParts.m ? " M " + u.estParts.m : "")) : "—"}</span>`}${u.best ? `<small class="muted"> · лучший ${esc(u.best)}</small>` : ""}</td>
          <td class="n">${esc(u.tests.length)}</td>
          <td><span class="pill ${u.updated > week ? "on" : "off"}">${esc(ago(u.updated))}</span></td></tr>`).join("")}
      </tbody></table></div>` : `<div class="empty">Пока никто не вошёл на сайт через Google. Когда друг войдёт и решит задачу, он появится здесь.</div>`}
    </section>
    ${sel && users.find(u => u.id === sel) ? detail(users.find(u => u.id === sel)) : ""}
    ${hard.length ? `<section class="panel"><div class="panel-head"><h2>Самые трудные задачи</h2><span class="muted" style="font-size:.85rem">чаще всего ошибаются (минимум 2 попытки)</span></div>
      <div class="tablewrap"><table><thead><tr><th>Задача</th><th>Тема</th><th>Ошибок</th><th></th></tr></thead><tbody>
      ${hard.map(([qid, s, r]) => { const m = QD.get(qid); return `<tr data-hard="${esc(qid)}" aria-selected="${hardSel === qid}"><td class="n">#${esc(qid)} · ${m.s === "math" ? "Math" : "English"}</td><td>${esc(TOP[m.t] || m.t)} <span class="tag ${m.dif}">${esc(DIFN[m.dif])}</span></td><td class="n"><span class="acc-bad">${esc(Math.round(100 * r))}%</span> <span class="muted">(${esc(s.w)}/${esc(s.n)})</span></td><td>${hardSel === qid ? "▲" : "▼"}</td></tr>${hardSel === qid ? `<tr class="noclick"><td colspan="4">${qCard(m)}</td></tr>` : ""}`; }).join("")}
      </tbody></table></div></section>` : ""}`;
  const on = document.getElementById("demo-on"); if (on) on.addEventListener("click", startDemo);
  const off = document.getElementById("demo-off"); if (off) off.addEventListener("click", stopDemo);
  app.querySelectorAll("th[data-k]").forEach(th => th.addEventListener("click", () => { const k = th.dataset.k; sortDir = sortKey === k ? -sortDir : (k === "name" ? 1 : -1); sortKey = k; render(); }));
  app.querySelectorAll("tbody tr[data-id]").forEach(tr => { const open = () => { sel = sel === tr.dataset.id ? null : tr.dataset.id; selTest = selQ = null; render(); if (sel) document.getElementById("detail")?.scrollIntoView({behavior:"smooth", block:"start"}); };
    tr.addEventListener("click", open); tr.addEventListener("keydown", e => { if (e.key === "Enter") open(); }); });
  app.querySelectorAll("tr[data-hard]").forEach(tr => tr.addEventListener("click", () => { hardSel = hardSel === tr.dataset.hard ? null : tr.dataset.hard; render(); }));
  app.querySelectorAll("[data-test]").forEach(b => b.addEventListener("click", () => { selTest = selTest === +b.dataset.test ? null : +b.dataset.test; selQ = null; render(); document.getElementById("tdetail")?.scrollIntoView({behavior:"smooth", block:"start"}); }));
  app.querySelectorAll("[data-tq]").forEach(b => b.addEventListener("click", () => { selQ = selQ === +b.dataset.tq ? null : +b.dataset.tq; render(); document.getElementById("tq")?.scrollIntoView({behavior:"smooth", block:"nearest"}); }));
  typeset(app);
}
function scoreChart(tests){
  const pts = tests.filter(x => x.sc).slice().sort((a, b) => a.d - b.d);
  if (pts.length < 1) return "";
  const W = 560, H = 190, L = 40, R = 12, T = 12, B = 26;
  const t0 = pts[0].d, t1 = pts[pts.length - 1].d, span = Math.max(1, t1 - t0);
  const X = d => pts.length === 1 ? (L + W - R) / 2 : L + (d - t0) / span * (W - L - R);
  const Y = v => T + (800 - v) / 600 * (H - T - B);
  const grid = [200, 400, 600, 800].map(v => `<line x1="${L}" x2="${W - R}" y1="${Y(v)}" y2="${Y(v)}" class="cg"/><text x="${L - 6}" y="${Y(v) + 4}" text-anchor="end" class="ct">${v}</text>`).join("");
  const series = (key, cls) => { const s = pts.filter(x => x.sc[key]); if (!s.length) return "";
    return `<polyline class="${cls}" points="${s.map(x => `${X(x.d).toFixed(1)},${Y(x.sc[key]).toFixed(1)}`).join(" ")}"/>` + s.map(x => `<circle class="${cls}" cx="${X(x.d).toFixed(1)}" cy="${Y(x.sc[key]).toFixed(1)}" r="4"><title>${esc(dstr(x.d))}: ${esc(x.sc[key])}</title></circle>`).join(""); };
  const lab = [pts[0], pts[pts.length - 1]].filter((x, i, a) => i === 0 || x !== a[0]).map(x => `<text x="${X(x.d)}" y="${H - 6}" text-anchor="middle" class="ct">${esc(dstr(x.d))}</text>`).join("");
  return `<div><div class="sub">Баллы по датам (шкала 200–800 за раздел)</div>
    <svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="График баллов">${grid}${series("rw", "s-rw")}${series("m", "s-m")}${lab}</svg>
    <div class="legend"><span style="--c:var(--eng)">Reading & Writing</span><span style="--c:var(--math)">Math</span></div></div>`;
}
function heatmap(days){
  const DAY = 864e5, today = new Date(); today.setHours(0, 0, 0, 0);
  const start = new Date(today.getTime() - (7 * 8 - 1) * DAY - ((today.getDay() + 6) % 7) * 0);
  const cells = []; let max = 1, active = 0, sum = 0;
  for (let i = 0; i < 56; i++) { const d = new Date(start.getTime() + i * DAY); const v = days[dayKey(d.getTime())] || 0; max = Math.max(max, v); if (v) { active++; sum += v; } cells.push([d, v]); }
  return `<div><div class="sub">Активность за 8 недель</div><div class="heat">${cells.map(([d, v]) => `<i style="--a:${v ? 0.25 + 0.75 * v / max : 0}" title="${esc(d.toLocaleDateString("ru"))}: ${esc(v)}"></i>`).join("")}</div>
    <p class="muted" style="margin:6px 0 0;font-size:.82rem">Дней с занятиями: <b>${esc(active)}</b> из 56 · задач за период: <b>${esc(sum)}</b></p></div>`;
}
function testName(x){ return x.w === "full" ? "Полный SAT" : (x.w === "english" ? "R&W" : "Math") + (x.mode === "quick" ? " · модуль" : !x.sc ? " · модуль" : ""); }
function testScore(x){ return x.sc ? (x.w === "full" ? `<b>${esc(total(x))}</b> <span class="muted">(R&W ${esc(x.sc.rw)} · M ${esc(x.sc.m)})</span>` : `<b>${esc(x.sc.rw || x.sc.m)}</b>`) : `<b>${esc(x.s)}/${esc(x.n)}</b>`; }
function detail(u){
  const block = w => `<div><div class="sub"><span class="dot" style="background:var(${w === "math" ? "--math" : "--eng"})"></span>${w === "math" ? "Math" : "English"} · по разделам</div>
    ${WD[w].map(d => { const s = u.dom[d] || {n:0, c:0}; const p = pct(s.c, s.n);
      return `<div class="drow"><span>${DOM[d]}</span>${meter(s.c, s.n)}<span class="num">${esc(s.n)} · <span class="${accCls(p)}">${esc(p == null ? "—" : p + "%")}</span></span></div>`; }).join("")}
    ${["easy","medium","hard"].map(k => { const s = u.dif[w + k] || {n:0, c:0}; const p = pct(s.c, s.n);
      return `<div class="drow sm"><span>${DIFN[k]}</span>${meter(s.c, s.n)}<span class="num">${esc(s.n)} · <span class="${accCls(p)}">${esc(p == null ? "—" : p + "%")}</span></span></div>`; }).join("")}</div>`;
  const weak = Object.entries(u.top).filter(([, s]) => s.n >= 3).map(([k, s]) => [k, s, pct(s.c, s.n)]).sort((a, b) => a[2] - b[2]).slice(0, 6);
  const mistakes = Object.entries(u.ans || {}).filter(([, r]) => !r.c && r.ts).sort((a, b) => b[1].ts - a[1].ts).slice(0, 8);
  const allT = u.tests.reduce((a, x) => a + (x.t ? x.t.reduce((p, v) => p + v, 0) : 0), 0), allN = u.tests.reduce((a, x) => a + (x.t ? x.n : 0), 0);
  return `<section class="panel" id="detail">
    <div class="panel-head"><h2>${esc(u.name || "Без имени")}</h2><span class="muted">${esc(u.email)}</span></div>${u.broken ? `<p class="acc-bad" style="margin:0 0 10px">Запись повреждена и не может быть показана.</p>` : ""}
    <div class="tiles sm">
      <div class="tile"><span class="label">Оценка SAT сейчас</span><b>${u.est ? esc(u.est) : "—"}</b><small class="muted">${u.estParts.rw ? "R&W " + esc(u.estParts.rw) : ""}${u.estParts.m ? " · Math " + esc(u.estParts.m) : ""}</small></div>
      <div class="tile"><span class="label">Лучший полный тест</span><b>${u.best ? esc(u.best) : "—"}</b></div>
      <div class="tile"><span class="label">Решено задач</span><b>${esc(u.total)}</b><small class="muted">точность ${esc(pct(u.correct, u.total) ?? "—")}%</small></div>
      <div class="tile"><span class="label">Среднее время в тестах</span><b>${allN ? esc(fmtSec(Math.round(allT / allN))) : "—"}</b><small class="muted">на вопрос</small></div>
    </div>
    <div class="detail">
      ${scoreChart(u.tests)}${heatmap(u.days)}
      ${block("math")}${block("english")}
      <div><div class="sub">Слабые темы</div>${weak.length ? `<ul class="plain">${weak.map(([k, s, p]) => `<li><span class="${accCls(p)}">${esc(p)}%</span> — ${esc(TOP[k] || k)} <span class="muted">(${esc(s.c)}/${esc(s.n)}, ${s.s === "math" ? "Math" : "English"})</span></li>`).join("")}</ul>` : `<p class="muted" style="margin:0">Нужно решить хотя бы 3 задачи по теме.</p>`}</div>
      <div><div class="sub">Последние ошибки в практике</div>${mistakes.length ? `<ul class="plain">${mistakes.map(([qid, r]) => { const m = QD.get(qid); return `<li><span class="num">${esc(dstr(r.ts))}</span> · #${esc(qid)} ${esc(TOP[m.t] || m.t)} — выбрал <b class="acc-bad">${showAns(m, r.a)}</b>, верно <b>${rightAns(m)}</b></li>`; }).join("")}</ul>` : `<p class="muted" style="margin:0">Ошибок с сохранённым ответом пока нет.</p>`}</div>
    </div>
    <div class="sub" style="margin-top:18px">Пробные тесты</div>
    ${u.tests.length ? `<div class="tablewrap"><table><thead><tr><th>Дата</th><th>Тест</th><th>Балл</th><th>Верно</th><th>Время</th><th></th></tr></thead><tbody>
      ${u.tests.map((x, i) => `<tr data-test="${i}" aria-selected="${selTest === i}"><td class="n">${esc(new Date(x.d).toLocaleString("ru", {day:"numeric", month:"short", hour:"2-digit", minute:"2-digit"}))}</td><td>${esc(testName(x))}</td><td>${testScore(x)}</td>
        <td class="n"><span class="${accCls(pct(x.s, x.n))}">${esc(x.s)}/${esc(x.n)}</span></td><td class="n">${x.t ? esc(fmtSec(x.t.reduce((a, b) => a + b, 0))) : "—"}</td><td>${x.q ? (selTest === i ? "▲" : "разбор ▼") : '<span class="muted">без деталей</span>'}</td></tr>`).join("")}
      </tbody></table></div><p class="muted" style="margin:8px 0 0;font-size:.8rem">Баллы считает браузер ученика по примерной шкале: это самопроверка, а не официальная оценка.</p>` : `<p class="muted" style="margin:0">Тестов пока не было.</p>`}
    ${selTest !== null && u.tests[selTest] ? testDetail(u.tests[selTest]) : ""}
  </section>`;
}
function testDetail(x){
  if (!x.q) return `<div class="tdetail" id="tdetail"><p class="muted">Это тест старого формата: сохранён только итог.</p></div>`;
  const rows = x.q.map((id, i) => ({i, m: QD.get(String(id)), a: x.a[i], t: x.t[i]}));
  let k = 0; const mods = x.mk.map(n => { const r = rows.slice(k, k + n); k += n; return r; });
  const per = {}, dif = {};
  rows.forEach(r => { const ok = isRight(r.m, r.a); (per[r.m.d] = per[r.m.d] || [0, 0])[1]++; (dif[r.m.dif] = dif[r.m.dif] || [0, 0])[1]++; if (ok) { per[r.m.d][0]++; dif[r.m.dif][0]++; } });
  const wrong = rows.filter(r => !isRight(r.m, r.a));
  const slow = rows.slice().sort((a, b) => b.t - a.t).slice(0, 3);
  const modLabel = (r, j) => { const s = r[0].m.s; const idx = mods.slice(0, j).filter(mm => mm[0].m.s === s).length + 1; const route = s === "math" ? x.route?.m : x.route?.rw;
    return `${s === "math" ? "Math" : "Reading & Writing"} · модуль ${idx}${idx === 2 && route ? (route === "hard" ? " (сложный)" : " (лёгкий)") : ""}`; };
  const sr = selQ !== null ? rows[selQ] : null;
  return `<div class="tdetail" id="tdetail">
    <div class="detail">
      <div><div class="sub">По разделам</div>${Object.keys(per).map(d => `<div class="drow"><span>${DOM[d]}</span>${meter(per[d][0], per[d][1])}<span class="num">${esc(per[d][0])}/${esc(per[d][1])}</span></div>`).join("")}</div>
      <div><div class="sub">По сложности</div>${["easy","medium","hard"].filter(d => dif[d]).map(d => `<div class="drow"><span>${DIFN[d]}</span>${meter(dif[d][0], dif[d][1])}<span class="num">${esc(dif[d][0])}/${esc(dif[d][1])}</span></div>`).join("")}
        <p class="muted" style="margin:10px 0 0;font-size:.85rem">Ошибок и пропусков: <b>${esc(wrong.length)}</b> · дольше всего: ${slow.map(r => `№${r.i + 1} (${esc(fmtSec(r.t))})`).join(", ")}</p></div>
    </div>
    ${mods.map((r, j) => `<div class="mod"><span class="label">${esc(modLabel(r, j))}</span><div class="qgrid">${r.map(rr => `<button type="button" data-tq="${rr.i}" class="${isRight(rr.m, rr.a) ? "ok" : (rr.a === null ? "skip" : "bad")}${selQ === rr.i ? " cur" : ""}" title="${esc(TOP[rr.m.t] || rr.m.t)} · ${esc(fmtSec(rr.t))}">${rr.i + 1}</button>`).join("")}</div></div>`).join("")}
    <div class="legend"><span style="--c:var(--good)">верно</span><span style="--c:var(--bad)">неверно</span><span style="--c:var(--muted)">без ответа</span></div>
    ${sr ? `<div id="tq">${qCard(sr.m, {a: sr.a, t: sr.t})}</div>` : `<p class="muted" style="margin:6px 0 0">Нажмите на номер вопроса, чтобы увидеть условие, ответ ученика и разбор.</p>`}
  </div>`;
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
  if (!demo) { users = []; sel = selTest = selQ = hardSel = null; }
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
