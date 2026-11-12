// HemaBlocks web · núcleo: datos, progreso, inicio y misiones.
const HB = (() => {
  const D = {};
  const W = {};            // widgets: nombre -> (contenedor, argumento) => void
  const LS = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  };
  const S = { done: new Set(LS.get('hb-done', [])), xp: LS.get('hb-xp', 0), streak: 0,
              bestStreak: LS.get('hb-best-streak', 0), days: LS.get('hb-days', 0), lastDay: LS.get('hb-last-day', null),
              quick: LS.get('hb-quick', false), current: LS.get('hb-current', 'x-p1') };

  // ---------- utilidades
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const md = s => esc(s == null ? '' : s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\*(.+?)\*/g, '<i>$1</i>').replace(/\n/g, '<br>');
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstChild; };
  const L = ['A', 'B', 'C', 'D', 'E'];
  const toast = msg => { const t = el(`<div class="toast">${esc(msg)}</div>`); document.body.appendChild(t); setTimeout(() => t.remove(), 1800); };

  // ---------- progreso
  function studiedToday() {
    const today = new Date().toDateString();
    if (S.lastDay === today) return;
    const y = new Date(Date.now() - 864e5).toDateString();
    S.days = S.lastDay === y ? S.days + 1 : 1;
    S.lastDay = today;
    LS.set('hb-days', S.days); LS.set('hb-last-day', today);
  }
  function save() { LS.set('hb-xp', S.xp); LS.set('hb-done', [...S.done]); LS.set('hb-best-streak', S.bestStreak); renderBar(); }
  function addXP(n) { S.xp += n; studiedToday(); save(); }
  function answered(ok, xp) {
    S.streak = ok ? S.streak + 1 : 0;
    if (S.streak > S.bestStreak) S.bestStreak = S.streak;
    if (ok) S.xp += xp;
    studiedToday(); save();
  }
  function markDone(id) { if (!S.done.has(id)) { S.done.add(id); addXP(20); } }
  const missions = () => D.missions;
  const byId = id => D.missions.find(m => m.id === id);

  function renderBar() {
    const bar = document.getElementById('bar');
    const total = D.missions ? D.missions.length : 6;
    bar.innerHTML = `
      <a class="brand" href="#/"><svg class="cube" viewBox="0 0 30 30"><polygon points="15,3 27,10 15,17 3,10" fill="#E46A85"/><polygon points="3,10 15,17 15,28 3,21" fill="#C4234A"/><polygon points="27,10 15,17 15,28 27,21" fill="#8F1734"/></svg>HemaBlocks</a>
      <span class="pill"><b>${S.done.size}</b>/${total}</span>
      <span class="progress"><i style="width:${S.done.size / total * 100}%"></i></span>
      <span class="pill">XP <b>${S.xp}</b></span>
      <span class="pill">Racha <b>${S.streak}</b></span>
      <span class="pill">${S.days} ${S.days === 1 ? 'día' : 'días'}</span>
      <span class="grow"></span>`;
  }

  // ---------- inicio
  function home() {
    const app = document.getElementById('app');
    let html = `<h1>Pruebas y certámenes de hematología</h1><p class="muted">Elige una prueba. Cada intento sortea preguntas nuevas y entrega la nota (escala chilena al 60 %) con la explicación de cada error.</p>`;
    let open = false;
    D.missions.forEach((m, i) => {
      if (m.group) { if (open) html += '</div>'; html += `<div class="group-h">${esc(m.group)}</div><div class="grid">`; open = true; }
      const cls = (S.done.has(m.id) ? 'done ' : '') + (S.current === m.id ? 'cur' : '');
      const star = m.clase === 'Prueba' ? '<span class="star">★</span>' : '';
      html += `<button class="tile ${cls}" data-id="${m.id}"><span class="n"><span>${i + 1} · ${esc(m.clase || '')} ${star}</span><span>${S.done.has(m.id) ? '✓' : m.minutes + ' min'}</span></span><span class="t">${esc(m.title)}</span></button>`;
    });
    html += '</div>';
    app.innerHTML = html;
    app.querySelectorAll('.tile').forEach(t => t.onclick = () => { location.hash = '#/m/' + t.dataset.id; });
  }

  // ---------- bloques
  function renderBlock(b, host) {
    const t = b.t, v = b.v;
    if (t === 'panel') {
      const [title, paras] = v;
      host.append(el(`<div class="panel">${title ? `<h3>${md(title)}</h3>` : ''}${paras.map(p => `<p>${md(p)}</p>`).join('')}</div>`));
    } else if (t === 'table') {
      host.append(el(`<div class="panel tbl">${v.title ? `<h3>${md(v.title)}</h3>` : ''}<table>${v.headers ? `<tr>${v.headers.map(x => `<th>${md(x)}</th>`).join('')}</tr>` : ''}${
        v.rows.map(r => `<tr>${r.map((c, i) => v.headers || i > 0 ? `<td>${md(c)}</td>` : `<td><b>${md(c)}</b></td>`).join('')}</tr>`).join('')}</table>${v.note ? `<p class="small muted">${md(v.note)}</p>` : ''}</div>`));
    } else if (t === 'cards') {
      const [title, cards, note] = v;
      host.append(el(`<div>${title ? `<h2>${md(title)}</h2>` : ''}<div class="cards">${cards.map(c => `<div class="card"><h3>${md(c.title)}</h3><div>${md(c.text)}</div></div>`).join('')}</div>${note ? `<p class="small muted">${md(note)}</p>` : ''}</div>`));
    } else if (t === 'steps') {
      const [title, steps] = v;
      host.append(el(`<div>${title ? `<h2>${md(title)}</h2>` : ''}<div class="steps">${steps.map(s => `<div class="step"><span class="tag">${esc(s.tag)}</span><div><b>${md(s.title)}</b><div>${md(s.text)}</div></div></div>`).join('')}</div></div>`));
    } else if (t === 'deep') {
      if (S.quick) return;
      v.forEach(x => renderBlock(x, host));
    } else if (t === 'widget') {
      const name = typeof v === 'string' ? v : v.t, arg = typeof v === 'string' ? null : v.v;
      const box = el('<div class="widget"></div>');
      host.append(box);
      (W[name] || W._fallback)(box, arg, name);
    }
  }

  function mission(id) {
    const m = byId(id) || D.missions[0];
    S.current = m.id; LS.set('hb-current', m.id);
    const i = D.missions.indexOf(m), app = document.getElementById('app');
    app.innerHTML = '';
    app.append(el(`<div><a href="#/" class="btn" style="text-decoration:none;display:inline-block">‹ Inicio</a>
      <div class="kicker" style="margin-top:14px">${esc(m.clase || 'Misión')} ${i + 1} · ${m.minutes} min</div>
      <h1>${md(m.heading)}</h1><p class="muted">${md(m.lead)}</p></div>`));
    if (m.essentials && m.essentials.length)
      app.append(el(`<div class="panel soft"><div class="kicker">Lo esencial</div><ul>${m.essentials.map(e => `<li>${md(e)}</li>`).join('')}</ul></div>`));
    m.blocks.forEach(b => renderBlock(b, app));
    if (m.trick) app.append(el(`<div class="panel dashed"><span class="kicker">Truco</span> ${md(m.trick)}</div>`));
    if (m.reto) reto(m.reto, app);
    const next = D.missions[i + 1];
    const foot = el(`<footer class="nav"><button class="btn primary" id="done">${S.done.has(m.id) ? '✓ Hecha · ' : 'Marcar como hecha y '}${next ? 'siguiente →' : 'terminar'}</button><a class="btn" href="#/" style="text-decoration:none">Volver al inicio</a></footer>`);
    app.append(foot);
    foot.querySelector('#done').onclick = () => { markDone(m.id); location.hash = next ? '#/m/' + next.id : '#/'; };
    window.scrollTo(0, 0);
  }

  function reto(r, host) {
    const box = el(`<div class="panel key"><div class="kicker">Reto</div><h3>${md(r.question)}</h3><div class="opts"></div><div class="out"></div></div>`);
    const opts = box.querySelector('.opts');
    r.options.forEach((o, i) => {
      const b = el(`<button class="chip"><span class="l">${L[i]}</span><span>${md(o)}</span></button>`);
      b.onclick = () => {
        opts.querySelectorAll('button').forEach((x, k) => { x.disabled = true; if (k === r.answer) x.classList.add('right'); else if (k === i) x.classList.add('wrong'); });
        answered(i === r.answer, 3);
        box.querySelector('.out').innerHTML = `<div class="verdict ${i === r.answer ? 'ok' : 'no'}"><h3>${i === r.answer ? 'Correcto' : 'Todavía no'}</h3>${md(r.why)}</div>`;
      };
      opts.append(b);
    });
    host.append(box);
  }

  W._fallback = (box, _, name) => {
    box.append(el(`<div class="fallback"><b>Diagrama interactivo</b><br>Este diagrama (${esc(name)}) está en la app de Apple TV. Aquí tienes el resumen en «Lo esencial» y las tablas de la misión.</div>`));
  };

  // ---------- rutas
  function route() {
    const h = location.hash || '#/';
    if (HB.disposeViewers) HB.disposeViewers();
    renderBar();
    if (h.startsWith('#/m/')) mission(h.slice(4)); else home();
  }

  async function start() {
    const names = ['missions', 'exams'];
    try {
      await Promise.all(names.map(async n => { D[n] = await (await fetch('data/' + n + '.json')).json(); }));
    } catch (e) {
      document.getElementById('app').innerHTML = '<div class="panel">No se pudieron cargar los datos. Abre la página desde internet (no como archivo) y vuelve a intentar.</div>';
      return;
    }
    D.missions = D.missions.filter(m => m.clase === 'Prueba');
    if (D.missions[0]) D.missions[0].group = 'Pruebas y certámenes';
    window.addEventListener('hashchange', route);
    route();
  }

  const api = { D, W, S, LS, esc, md, shuffle, el, L, toast, addXP, answered, markDone, byId, start, renderBar, save };
  return api;
})();
