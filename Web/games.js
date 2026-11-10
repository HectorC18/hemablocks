// HemaBlocks web · pruebas y juegos de estudio.
(() => {
  const { D, W, S, LS, esc, md, shuffle, el, L, addXP, answered, markDone } = HB;
  const panel = (box, cls = '') => { box.innerHTML = ''; const p = el(`<div class="panel ${cls}"></div>`); box.append(p); return p; };
  const pct = r => Math.round(r * 100);

  // ================= Pruebas (certamen) =================
  const rec = {
    k: (id, f) => `hb-exam-${id}-${f}`,
    attempts: id => LS.get(rec.k(id, 'attempts'), 0),
    best: id => LS.get(rec.k(id, 'best'), null),
    last: id => LS.get(rec.k(id, 'last'), null),
    save(id, r) { LS.set(rec.k(id, 'attempts'), rec.attempts(id) + 1); LS.set(rec.k(id, 'last'), r); if (r > (rec.best(id) ?? -1)) LS.set(rec.k(id, 'best'), r); },
    grade(r) { const g = r < 0.6 ? 1 + 3 * r / 0.6 : 4 + 3 * (r - 0.6) / 0.4; return Math.round(g * 10) / 10; },
    gt(r) { return rec.grade(r).toFixed(1).replace('.', ','); },
  };
  HB.rec = rec;

  W.exam = (box, id) => {
    const exam = D.exams.find(e => e.id === id);
    let items = [], picks = [], pos = 0;
    const count = exam.draw ? Math.min(exam.draw, exam.questions.length) : exam.questions.length;

    function intro() {
      const p = panel(box, 'key');
      const n = rec.attempts(id);
      p.innerHTML = `<h3><span class="star">★</span> ${esc(exam.title)}</h3><p class="muted">${md(exam.scope)}</p>
        <p><b>${count} preguntas</b>${exam.draw ? ' sorteadas de un banco de ' + exam.questions.length : ''}, una alternativa correcta. Cada intento cambia las preguntas, su orden y la letra de la respuesta correcta. Puedes volver atrás; la corrección llega al final.</p>
        ${n ? `<p class="small"><b>Intentos ${n}</b> · último ${pct(rec.last(id))} % (nota ${rec.gt(rec.last(id))}) · mejor ${pct(rec.best(id))} % (nota ${rec.gt(rec.best(id))})</p>` : ''}
        <button class="btn primary">${n ? 'Volver a rendir' : 'Comenzar la prueba'}</button>`;
      p.querySelector('button').onclick = start;
    }
    function start() {
      let pool = shuffle(exam.questions); if (exam.draw) pool = pool.slice(0, exam.draw);
      const last = LS.get('hb-exam-last-letter', {});
      items = pool.map(q => {
        let order = shuffle(q.options.map((_, i) => i)), tries = 0;
        while (order.indexOf(q.answer) === last[q.q] && tries++ < 20) order = shuffle(order);
        const answer = order.indexOf(q.answer); last[q.q] = answer;
        return { q, options: order.map(i => q.options[i]), answer };
      });
      LS.set('hb-exam-last-letter', last);
      picks = items.map(() => null); pos = 0; ask();
    }
    function ask() {
      const it = items[pos], p = panel(box, 'key');
      const done = picks.filter(x => x !== null).length;
      p.innerHTML = `<div class="row"><span class="kicker">Pregunta ${pos + 1} de ${items.length} · ${esc(it.q.topic)}</span><span class="grow"></span><span class="small muted">${done} respondidas</span></div>
        <div class="bar2"><i style="width:${(pos + 1) / items.length * 100}%"></i></div>
        <h3>${md(it.q.q)}</h3><div class="opts">${it.options.map((o, i) => `<button class="chip ${picks[pos] === i ? 'sel' : ''}" data-i="${i}"><span class="l">${L[i]}</span><span>${md(o)}</span></button>`).join('')}</div>
        <div class="row">${pos > 0 ? '<button class="btn" id="prev">← Anterior</button>' : ''}<span class="grow"></span>
        ${pos + 1 < items.length ? `<button class="btn ${picks[pos] !== null ? 'primary' : ''}" id="next">Siguiente →</button>` : '<button class="btn primary" id="fin">Entregar la prueba</button>'}</div>
        ${pos + 1 === items.length && picks.includes(null) ? `<p class="small muted">Te quedan ${picks.filter(x => x === null).length} sin responder; cuentan como incorrectas.</p>` : ''}`;
      p.querySelectorAll('.opts .chip').forEach(b => b.onclick = () => { picks[pos] = +b.dataset.i; ask(); });
      const nx = p.querySelector('#next'), pv = p.querySelector('#prev'), fn = p.querySelector('#fin');
      if (nx) nx.onclick = () => { pos++; ask(); }; if (pv) pv.onclick = () => { pos--; ask(); }; if (fn) fn.onclick = finish;
    }
    function finish() {
      const right = items.filter((it, i) => picks[i] === it.answer).length, r = right / items.length;
      rec.save(id, r); addXP(right * 2);
      if (r >= 0.6) markDone('x-' + id);
      results(right, r);
    }
    function results(right, r) {
      const passed = r >= 0.6, p = panel(box, 'key');
      const topics = {}; items.forEach((it, i) => { const t = it.q.topic; topics[t] = topics[t] || [0, 0]; topics[t][1]++; if (picks[i] === it.answer) topics[t][0]++; });
      const wrong = items.map((_, i) => i).filter(i => picks[i] !== items[i].answer);
      p.innerHTML = `<h3>Resultado · ${esc(exam.title)}</h3>
        <div class="row"><div class="verdict ${passed ? 'ok' : 'no'}" style="margin:0"><div class="small muted">NOTA</div><div style="font-size:42px;font-weight:800;line-height:1">${rec.gt(r)}</div></div>
        <div><b>${right} de ${items.length}</b> correctas · ${pct(r)} %<br><span class="muted">${passed ? '<b>Aprobada.</b> Escala al 60 %: 60 % de logro es un 4,0.' : '<b>Reprobada por ahora.</b> Con 60 % de logro se obtiene un 4,0. Repasa los temas marcados.'}</span></div></div>
        <div class="tbl"><table><tr><th>Tema</th><th>Correctas</th><th>Logro</th></tr>${Object.entries(topics).map(([t, [a, b]]) => { const q = Math.round(a / b * 100); return `<tr><td>${esc(t)}</td><td>${a} de ${b}</td><td>${q >= 60 ? q + ' %' : '<b>' + q + ' %</b> · repasar'}</td></tr>`; }).join('')}</table></div>
        ${wrong.length ? `<h3>Tus errores (${wrong.length})</h3>` + wrong.map(i => { const it = items[i], pk = picks[i]; return `<div class="card" style="margin:10px 0"><div class="kicker">Pregunta ${i + 1} · ${esc(it.q.topic)}</div><b>${md(it.q.q)}</b><p style="color:var(--bad)">${pk === null ? 'Sin responder' : 'Tu respuesta: ' + L[pk] + ' · ' + md(it.options[pk])}</p><p style="color:var(--ok)">Correcta: <b>${L[it.answer]} · ${md(it.options[it.answer])}</b></p><p class="muted">${md(it.q.why)}</p></div>`; }).join('') : '<p><b>¡Sin errores!</b></p>'}
        <div class="row"><button class="btn primary" id="again">Volver a rendir</button><button class="btn" id="home">Portada de la prueba</button></div>`;
      p.querySelector('#again').onclick = start; p.querySelector('#home').onclick = intro;
    }
    intro();
  };

  // ================= Mazo de rondas sin repetir =================
  function draw(key, total, per) {
    let deck = LS.get(key, []).filter(i => i < total);
    if (deck.length < per) deck = deck.concat(shuffle([...Array(total).keys()].filter(i => !deck.includes(i))));
    LS.set(key, deck.slice(per));
    return deck.slice(0, per);
  }

  // ================= Caso por pistas =================
  W.clues = (box) => {
    const cases = D.clues; let order = [], pos = 0, shown = 1, score = 0, opts = [], picked = null;
    function intro() {
      const p = panel(box);
      p.innerHTML = `<h3>Caso por pistas</h3><p class="muted">${cases.length} casos. Las pistas aparecen de a una, de lo general a lo que define el diagnóstico: mientras menos pistas uses, más puntos.</p><button class="btn primary">Empezar una ronda de 10</button>`;
      p.querySelector('button').onclick = () => { order = draw('hb-clue-deck', cases.length, 10); pos = 0; score = 0; next(); };
    }
    function next() {
      if (pos >= order.length) return end();
      const c = cases[order[pos]]; shown = 1; picked = null;
      const o = shuffle(c.options.map((_, i) => i)); opts = o; draw1();
    }
    function draw1() {
      const c = cases[order[pos]], p = panel(box, 'key');
      p.innerHTML = `<div class="kicker">Caso ${pos + 1} de ${order.length} · ${score} puntos</div>
        <ol>${c.clues.slice(0, shown).map(x => `<li>${md(x)}</li>`).join('')}</ol>
        ${picked === null && shown < c.clues.length ? '<button class="btn" id="more">Otra pista</button>' : ''}
        <h3 style="margin-top:12px">${esc(c.question || '¿Cuál es el diagnóstico más probable?')}</h3>
        <div class="opts">${opts.map((oi, k) => `<button class="chip ${picked !== null ? (oi === c.answer ? 'right' : (oi === picked ? 'wrong' : '')) : ''}" data-i="${oi}" ${picked !== null ? 'disabled' : ''}><span class="l">${L[k]}</span><span>${md(c.options[oi])}</span></button>`).join('')}</div>
        ${picked !== null ? `<div class="verdict ${picked === c.answer ? 'ok' : 'no'}"><h3>${picked === c.answer ? 'Correcto' : 'Era: ' + esc(c.options[c.answer])}</h3>${md(c.why)}</div><button class="btn primary" id="nx">${pos + 1 < order.length ? 'Siguiente caso →' : 'Ver resultado'}</button>` : ''}`;
      const more = p.querySelector('#more'); if (more) more.onclick = () => { shown++; draw1(); };
      p.querySelectorAll('.opts .chip').forEach(b => b.onclick = () => {
        picked = +b.dataset.i; const ok = picked === c.answer;
        if (ok) score += Math.max(2, 10 - 2 * (shown - 1)); answered(ok, 2); draw1();
      });
      const nx = p.querySelector('#nx'); if (nx) nx.onclick = () => { pos++; next(); };
    }
    function end() {
      const p = panel(box); p.innerHTML = `<h3>Ronda terminada: ${score} puntos</h3><p class="muted">Máximo 100 (acertar con la primera pista).</p><button class="btn primary">Otra ronda</button>`;
      p.querySelector('button').onclick = () => { order = draw('hb-clue-deck', cases.length, 10); pos = 0; score = 0; next(); };
    }
    intro();
  };

  // ================= Clasifica en la caja =================
  W.sorting = (box) => {
    let set = D.sorting[0], items = [], pos = 0, ok = 0, last = null;
    function pick() {
      const p = panel(box);
      p.innerHTML = `<h3>Clasifica en la caja</h3><div class="row">${D.sorting.map(s => `<button class="chip ${s.id === set.id ? 'sel' : ''}" data-id="${s.id}">${esc(s.title)}</button>`).join('')}</div><p><button class="btn primary" id="go">Empezar</button></p>`;
      p.querySelectorAll('[data-id]').forEach(b => b.onclick = () => { set = D.sorting.find(s => s.id === b.dataset.id); pick(); });
      p.querySelector('#go').onclick = () => { items = shuffle(set.items); pos = 0; ok = 0; last = null; play(); };
    }
    function play() {
      const p = panel(box, 'key');
      if (pos >= items.length) { p.innerHTML = `<h3>${ok} de ${items.length} bien</h3><p>${md(set.note)}</p><button class="btn primary">Otra caja</button>`; p.querySelector('button').onclick = pick; return; }
      const [text] = items[pos];
      p.innerHTML = `<div class="kicker">${esc(set.title)} · ${pos + 1} de ${items.length}</div>${last ? `<p style="color:var(--${last.ok ? 'ok' : 'bad'})">${last.ok ? '✓ Bien' : '✗ ' + esc(last.text) + ' va en «' + esc(set.bins[last.bin]) + '»'}</p>` : ''}<h2>${md(text)}</h2><div class="row">${set.bins.map((b, i) => `<button class="btn" data-b="${i}">${esc(b)}</button>`).join('')}</div>`;
      p.querySelectorAll('[data-b]').forEach(b => b.onclick = () => { const right = +b.dataset.b === items[pos][1]; if (right) ok++; answered(right, 1); last = { ok: right, text, bin: items[pos][1] }; pos++; play(); });
    }
    pick();
  };

  // ================= Ordena la secuencia =================
  W.sequence = (box) => {
    let s = D.sequences[0], pool = [], got = [], wrong = 0;
    function pick() {
      const p = panel(box);
      p.innerHTML = `<h3>Ordena la secuencia</h3><div class="row">${D.sequences.map(x => `<button class="chip ${x.id === s.id ? 'sel' : ''}" data-id="${x.id}">${esc(x.title)}</button>`).join('')}</div><p><button class="btn primary" id="go">Empezar</button></p>`;
      p.querySelectorAll('[data-id]').forEach(b => b.onclick = () => { s = D.sequences.find(x => x.id === b.dataset.id); pick(); });
      p.querySelector('#go').onclick = () => { pool = shuffle(s.steps.map((t, i) => ({ t, i }))); got = []; wrong = 0; play(); };
    }
    function play() {
      const p = panel(box, 'key');
      p.innerHTML = `<div class="kicker">${esc(s.title)}</div><p class="muted">Toca los pasos en el orden correcto. Errores: ${wrong}</p>
        <ol>${got.map(g => `<li>${md(g.t)}</li>`).join('')}</ol>
        ${pool.length ? `<div class="col">${pool.map(x => `<button class="chip" data-i="${x.i}">${md(x.t)}</button>`).join('')}</div>` : `<div class="verdict ok"><h3>¡Listo!</h3>${md(s.note)}</div><button class="btn primary" id="again">Otra secuencia</button>`}`;
      p.querySelectorAll('[data-i]').forEach(b => b.onclick = () => {
        const i = +b.dataset.i, need = got.length; const right = i === need; answered(right, 1);
        if (right) { got.push(pool.find(x => x.i === i)); pool = pool.filter(x => x.i !== i); } else wrong++;
        play();
      });
      const a = p.querySelector('#again'); if (a) a.onclick = pick;
    }
    pick();
  };

  // ================= Repaso espaciado (tarjetas) y Examen de repaso =================
  const DAYS = [0, 1, 3, 7, 14, 30];
  W.spaced = (box) => {
    let deckName = 'all', queue = [], cur = null, shownA = false;
    const boxes = LS.get('hb-leitner', {});
    const key = c => c.q;
    const inDeck = c => deckName === 'all' || c.deck === deckName;
    const due = c => { const b = boxes[key(c)]; return !b || b.due <= Date.now(); };
    function menu() {
      const p = panel(box);
      const nDue = D.flashcards.filter(c => inDeck(c) && due(c)).length;
      p.innerHTML = `<h3>Repaso espaciado</h3><div class="row">${[['all', 'Todo'], ['base', 'Base'], ['classes', 'Mis clases (4–9)']].map(([id, t]) => `<button class="chip ${deckName === id ? 'sel' : ''}" data-d="${id}">${t}</button>`).join('')}</div>
        <p class="muted">${nDue} tarjetas para hoy. «Lo sabía» sube la tarjeta de caja y la aleja en el tiempo; «Repasar» la devuelve al inicio.</p><button class="btn primary" id="go" ${nDue ? '' : 'disabled'}>Empezar</button>`;
      p.querySelectorAll('[data-d]').forEach(b => b.onclick = () => { deckName = b.dataset.d; menu(); });
      p.querySelector('#go').onclick = () => { queue = shuffle(D.flashcards.filter(c => inDeck(c) && due(c))).slice(0, 20); next(); };
    }
    function next() { cur = queue.shift(); shownA = false; if (!cur) return menu(); card(); }
    function card() {
      const p = panel(box, 'key');
      p.innerHTML = `<div class="kicker">${queue.length + 1} por ver</div><h3>${md(cur.q)}</h3>${shownA ? `<div class="verdict ok">${md(cur.a)}</div><div class="row"><button class="btn primary" id="yes">Lo sabía</button><button class="btn" id="no">Repasar</button></div>` : '<button class="btn primary" id="show">Mostrar respuesta</button>'}`;
      const s = p.querySelector('#show'); if (s) s.onclick = () => { shownA = true; card(); };
      const rate = ok => { const b = boxes[key(cur)] || { box: 0 }; b.box = ok ? Math.min(5, b.box + 1) : 0; b.due = Date.now() + DAYS[b.box] * 864e5; boxes[key(cur)] = b; LS.set('hb-leitner', boxes); answered(ok, 1); next(); };
      const y = p.querySelector('#yes'), n = p.querySelector('#no'); if (y) y.onclick = () => rate(true); if (n) n.onclick = () => rate(false);
    }
    menu();
  };

  W.review = (box) => {
    let deckName = 'all', qs = [], pos = 0, score = 0, picked = null;
    function menu() {
      const p = panel(box);
      p.innerHTML = `<h3>Examen de repaso</h3><div class="row">${[['all', 'Todo'], ['base', 'Base'], ['classes', 'Mis clases (4–9)']].map(([id, t]) => `<button class="chip ${deckName === id ? 'sel' : ''}" data-d="${id}">${t}</button>`).join('')}</div><p><button class="btn primary" id="go">Empezar (10 preguntas)</button></p>`;
      p.querySelectorAll('[data-d]').forEach(b => b.onclick = () => { deckName = b.dataset.d; menu(); });
      p.querySelector('#go').onclick = () => { qs = shuffle(D.quiz.filter(q => deckName === 'all' || q.deck === deckName)).slice(0, 10); pos = 0; score = 0; ask(); };
    }
    function ask() {
      if (pos >= qs.length) { const p = panel(box); p.innerHTML = `<h3>${score} de ${qs.length}</h3><button class="btn primary">Otra vez</button>`; p.querySelector('button').onclick = menu; return; }
      const q = qs[pos], p = panel(box, 'key'); picked = null;
      p.innerHTML = `<div class="kicker">Pregunta ${pos + 1} de ${qs.length}</div><h3>${md(q.q)}</h3><div class="opts">${q.options.map((o, i) => `<button class="chip" data-i="${i}"><span class="l">${L[i]}</span><span>${md(o)}</span></button>`).join('')}</div><div class="out"></div>`;
      p.querySelectorAll('.opts .chip').forEach(b => b.onclick = () => {
        const i = +b.dataset.i; p.querySelectorAll('.opts .chip').forEach((x, k) => { x.disabled = true; if (k === q.answer) x.classList.add('right'); else if (k === i) x.classList.add('wrong'); });
        const ok = i === q.answer; if (ok) score++; answered(ok, 2);
        p.querySelector('.out').innerHTML = `<button class="btn primary" id="nx">Siguiente →</button>`; p.querySelector('#nx').onclick = () => { pos++; ask(); };
      });
    }
    menu();
  };

  // ================= Frotis =================
  W.frotis = (box) => {
    const photos = D.frotis.photos, why = D.frotis.why;
    const clashes = [['Esferocitosis hereditaria', 'Esferocitos y acantocitos'], ['Cuerpos de Howell-Jolly', 'Punteado basófilo y Howell-Jolly'], ['Anillos de Cabot', 'Punteado basófilo y Howell-Jolly'], ['Megalocitos y dacriocitos', 'Dacriocitos y eliptocitos'], ['Megalocitos y dacriocitos', 'Cuerpos de Howell-Jolly'], ['Megalocitos y dacriocitos', 'Punteado basófilo y Howell-Jolly'], ['Megalocitos y dacriocitos', 'Anillos de Cabot'], ['Neutrófilo segmentado', 'Granulación tóxica'], ['Neutrófilo segmentado', 'Neutrófilo con vacuolas'], ['Neutrófilo segmentado', 'Neutrófilo hipersegmentado'], ['Neutrófilo segmentado', 'Pelger-Huët'], ['Granulación tóxica', 'Neutrófilo con vacuolas'], ['Blastos', 'Bastones de Auer']];
    const clash = (a, b) => { const x = a.toLowerCase(), y = b.toLowerCase(); if (x.includes(y) || y.includes(x)) return true; if (clashes.some(c => c.includes(a) && c.includes(b))) return true; const gen = ['Blastos', 'Bastones de Auer'], fab = s => s.startsWith('LMA ') || s.includes('(LMA M3)'); return (fab(a) && gen.includes(b)) || (fab(b) && gen.includes(a)); };
    const options = p => { const fits = q => q.answer !== p.answer && !clash(q.answer, p.answer); let pool = shuffle([...new Set(photos.filter(q => q.group === p.group && fits(q)).map(q => q.answer))]); if (pool.length < 3) pool = pool.concat(shuffle([...new Set(photos.filter(q => q.group !== p.group && fits(q)).map(q => q.answer))])); return shuffle([p.answer, ...pool.slice(0, 3)]); };
    let order = [], pos = 0, score = 0;
    function intro() { const p = panel(box); p.innerHTML = `<h3>¿Qué ves en el frotis?</h3><p class="muted">${photos.length} fotos reales de microscopio (leucocitos, leucemias y formas de eritrocitos). Cada ronda trae 10 sin repetir.</p><button class="btn primary">Empezar</button>`; p.querySelector('button').onclick = () => { order = draw('hb-frotis-deck', photos.length, 10); pos = 0; score = 0; ask(); }; }
    function ask() {
      if (pos >= order.length) { const p = panel(box); p.innerHTML = `<h3>${score} de ${order.length} correctas</h3><button class="btn primary">Otra ronda</button>`; p.querySelector('button').onclick = intro; return; }
      const ph = photos[order[pos]], opts = options(ph), p = panel(box, 'key');
      p.innerHTML = `<div class="kicker">Foto ${pos + 1} de ${order.length}</div><img class="photo" src="frotis/${ph.file}.jpg" alt="Foto de frotis"><div class="opts">${opts.map(o => `<button class="chip">${md(o)}</button>`).join('')}</div><div class="out"></div>`;
      p.querySelectorAll('.opts .chip').forEach((b, i) => b.onclick = () => {
        const ok = opts[i] === ph.answer; if (ok) score++; answered(ok, 2);
        p.querySelectorAll('.opts .chip').forEach((x, k) => { x.disabled = true; if (opts[k] === ph.answer) x.classList.add('right'); else if (k === i) x.classList.add('wrong'); });
        p.querySelector('.out').innerHTML = `<div class="verdict ${ok ? 'ok' : 'no'}"><h3>${ok ? 'Correcto' : 'Era: ' + esc(ph.answer)}</h3>${md(why[ph.answer] || '')}</div><button class="btn primary" id="nx">Siguiente →</button>`;
        p.querySelector('#nx').onclick = () => { pos++; ask(); };
      });
    }
    intro();
  };

  // ================= Informe de frotis =================
  W.informe = (box) => {
    const R = D.informes, COLS = ['Rojos', 'Blancos', 'Plaquetas', 'Otras alteraciones', 'Citogenética'];
    const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
    const counts = COLS.map((_, c) => { const m = {}; R.forEach(r => new Set(r.columns[c].map(norm)).forEach(p => m[p] = (m[p] || 0) + 1)); return m; });
    const key = (r, c) => r.columns[c].find(p => counts[c][norm(p)] === 1 && norm(p).length >= 12) || null;
    const topics = [...new Set(R.map(r => r.topic))];
    let mode = 'read', topic = 'all', round = [], pos = 0, score = 0;
    function menu() {
      const p = panel(box);
      p.innerHTML = `<h3>Informe de frotis</h3><div class="row"><button class="chip ${mode === 'read' ? 'sel' : ''}" data-m="read">Lee el informe</button><button class="chip ${mode === 'build' ? 'sel' : ''}" data-m="build">Arma el informe</button></div>
        <p class="muted">${mode === 'read' ? 'El informe aparece columna por columna y eliges la patología. Menos columnas abiertas, más puntos.' : 'Te damos la patología y eliges el hallazgo correcto de cada casilla.'}</p>
        <div class="row"><button class="chip ${topic === 'all' ? 'sel' : ''}" data-t="all">Todos los temas</button>${topics.map(t => `<button class="chip ${topic === t ? 'sel' : ''}" data-t="${esc(t)}">${esc(t)}</button>`).join('')}</div>
        <p><button class="btn primary" id="go">Empezar una ronda</button></p>`;
      p.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { mode = b.dataset.m; menu(); });
      p.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { topic = b.dataset.t; menu(); });
      p.querySelector('#go').onclick = () => { round = shuffle(R.filter(r => topic === 'all' || r.topic === topic)).slice(0, 10); pos = 0; score = 0; mode === 'read' ? read(1, 0) : build(0, null); };
    }
    const cell = (r, c) => r.columns[c].length ? r.columns[c].map(md).join('<br>') : '<span class="muted">Sin hallazgo propio</span>';
    function read(shown, wrong) {
      if (pos >= round.length) return end();
      const r = round[pos], p = panel(box, 'key');
      const names = shuffle([r.name, ...shuffle(R.filter(x => x.name !== r.name && x.topic === r.topic)).slice(0, 3).map(x => x.name)]);
      while (names.length < 4) { const x = R[Math.floor(Math.random() * R.length)].name; if (!names.includes(x)) names.push(x); }
      p.innerHTML = `<div class="kicker">Informe ${pos + 1} de ${round.length} · ${score} puntos</div>
        <div class="tbl"><table>${COLS.slice(0, shown).map((n, c) => `<tr><th>${n}</th><td>${cell(r, c)}</td></tr>`).join('')}</table></div>
        <h3>¿Qué patología es?</h3><div class="opts">${shuffle(names).map(n => `<button class="chip">${md(n)}</button>`).join('')}</div>`;
      p.querySelectorAll('.opts .chip').forEach(b => b.onclick = () => {
        const ok = b.textContent === r.name.replace(/\*/g, '');
        if (ok) { score += Math.max(2, 10 - 2 * (shown - 1 + wrong)); answered(true, 2); finishRead(r, true); }
        else { answered(false, 0); if (shown < 5) read(shown + 1, wrong + 1); else finishRead(r, false); }
      });
    }
    function finishRead(r, ok) {
      const p = panel(box, 'key');
      p.innerHTML = `<div class="verdict ${ok ? 'ok' : 'no'}"><h3>${ok ? 'Correcto' : 'Era'}: ${md(r.name)}</h3><span class="muted">${esc(r.clase)}</span></div><div class="tbl"><table>${COLS.map((n, c) => `<tr><th>${n}</th><td>${cell(r, c)}</td></tr>`).join('')}</table></div><button class="btn primary" id="nx">Siguiente →</button>`;
      p.querySelector('#nx').onclick = () => { pos++; read(1, 0); };
    }
    function build(ci, _) {
      if (pos >= round.length) return end();
      const r = round[pos], askable = COLS.map((_, c) => c).filter(c => key(r, c)); const c = askable[ci];
      if (c === undefined) { const p = panel(box, 'key'); p.innerHTML = `<h3>${md(r.name)}</h3><div class="tbl"><table>${COLS.map((n, k) => `<tr><th>${n}</th><td>${cell(r, k)}</td></tr>`).join('')}</table></div><button class="btn primary" id="nx">Siguiente patología →</button>`; p.querySelector('#nx').onclick = () => { pos++; build(0); }; return; }
      const right = key(r, c), pool = shuffle([...new Set(R.filter(x => x !== r).flatMap(x => x.columns[c]).filter(t => t.length > 3 && norm(t) !== norm(right)))]).slice(0, 3);
      const opts = shuffle([right, ...pool]), p = panel(box, 'key');
      p.innerHTML = `<div class="kicker">${pos + 1} de ${round.length} · ${score} puntos</div><h3>${md(r.name)}</h3><p class="muted">¿Qué corresponde en la columna <b>${COLS[c]}</b>?</p><div class="opts">${opts.map(o => `<button class="chip">${md(o)}</button>`).join('')}</div><div class="out"></div>`;
      p.querySelectorAll('.opts .chip').forEach((b, i) => b.onclick = () => {
        const ok = opts[i] === right; if (ok) score += 2; answered(ok, 1);
        p.querySelectorAll('.opts .chip').forEach((x, k) => { x.disabled = true; if (opts[k] === right) x.classList.add('right'); else if (k === i) x.classList.add('wrong'); });
        p.querySelector('.out').innerHTML = '<button class="btn primary" id="nx">Siguiente →</button>'; p.querySelector('#nx').onclick = () => build(ci + 1);
      });
    }
    function end() { const p = panel(box); p.innerHTML = `<h3>Ronda terminada: ${score} puntos</h3><button class="btn primary">Otra ronda</button>`; p.querySelector('button').onclick = menu; }
    menu();
  };

  // ================= Patologías =================
  W.pathology = (box) => {
    const p = panel(box);
    p.innerHTML = `<h3>Patologías frecuentes</h3>` + D.pathology.map(([g, rows]) => `<h2>${esc(g)}</h2><div class="cards">${rows.map(([n, a, b]) => `<div class="card"><h3>${md(n)}</h3><p>${md(a)}</p><p class="muted">${md(b)}</p></div>`).join('')}</div>`).join('');
  };
})();
