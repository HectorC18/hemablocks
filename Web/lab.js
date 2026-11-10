// HemaBlocks web · células en 3D (Three.js), guía de LMA y contador diferencial.
(() => {
  const { D, W, esc, md, shuffle, el, L, answered, addXP } = HB;
  const panel = (box, cls = '') => { box.innerHTML = ''; const p = el(`<div class="panel ${cls}"></div>`); box.append(p); return p; };
  const hasGL = () => { try { const c = document.createElement('canvas'); return !!(window.THREE && (c.getContext('webgl') || c.getContext('experimental-webgl'))); } catch (e) { return false; } };

  // ---------- células
  const NUC = 0x5A3EA6;
  const lcg = k => () => { k = (k * 9301 + 49297) % 233280; return k / 233280; };
  const mat = (c, op = 1, rough = .4) => new THREE.MeshStandardMaterial({ color: c, roughness: rough, transparent: op < 1, opacity: op });
  const ball = (r, c, p, op = 1) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 14), mat(c, op, .5)); m.position.set(...p); return m; };
  const body = (d, c, op = .5) => new THREE.Mesh(new THREE.SphereGeometry(d / 2, 28, 20), mat(c, op, .25));
  function granules(g, n, r, within, color, seed) {
    const rnd = lcg(seed), inst = new THREE.InstancedMesh(new THREE.SphereGeometry(r, 6, 5), mat(color, 1, .35), n), m = new THREE.Matrix4();
    for (let i = 0; i < n; i++) {
      const u = rnd() * 2 - 1, a = rnd() * 2 * Math.PI, rr = within * Math.cbrt(rnd()), s = Math.sqrt(Math.max(0, 1 - u * u));
      m.setPosition(rr * s * Math.cos(a), rr * u, rr * s * Math.sin(a)); inst.setMatrixAt(i, m);
    }
    g.add(inst);
  }
  function cell3d(kind) {
    const g = new THREE.Group(), add = (...x) => x.forEach(o => g.add(o));
    switch (kind) {
      case 'rbc': { const m = ball(3.9, 0xD23A55, [0, 0, 0]); m.scale.set(1, .36, 1); add(m); break; }
      case 'neu': { add(body(13, 0xEAD3E4)); const lobes = [[-3, 1, -1], [-1, 2.4, .5], [1.8, .6, -.4], [.6, -2, .8]]; lobes.forEach(p => add(ball(1.9, NUC, p))); for (let k = 0; k < 3; k++) add(ball(.8, NUC, lobes[k].map((v, i) => (v + lobes[k + 1][i]) / 2))); granules(g, 60, .25, 5.6, 0xC9A0C4, 7); break; }
      case 'lin': add(body(8.5, 0xA9C8EE, .55), ball(3.4, NUC, [.3, 0, 0])); break;
      case 'mon': { add(body(18, 0xC9C3E3, .45)); for (let i = 0; i < 5; i++) { const a = i / 4 * 2.4 - 1.2; add(ball(3.3 - Math.abs(i - 2) * .35, 0x5A3EA6, [4 * Math.sin(a), .5, 4 * Math.cos(a) - 1.5])); } granules(g, 14, .3, 7.5, 0xF4F1FF, 3); break; }
      case 'eos': add(body(14, 0xF6D6CF, .45), ball(2.6, NUC, [-2.6, .3, 0]), ball(2.6, NUC, [2.6, -.3, 0]), ball(1, NUC, [0, -.6, .8])); granules(g, 110, .55, 6.1, 0xE8573F, 11); break;
      case 'bas': add(body(12, 0xD9CBE8), ball(3, 0x4B2F96, [0, 0, 0], .8)); granules(g, 90, .7, 4.8, 0x2A1660, 5); break;
      case 'pla': [[0, 0, 0], [3.4, .3, 1.2], [-3, -.2, 1.6], [1.2, .4, -2.8]].forEach((p, i) => { const b = ball(1.4, 0xB8A4DC, p); b.scale.set(1.1, .45, .9); b.rotation.y = i; add(b); }); break;
      case 'band': { add(body(12, 0xEAD3E4)); for (let i = 0; i < 8; i++) { const a = i / 7 * 3.4 - 1.7; add(ball(1.25, NUC, [3 * Math.sin(a), .4, 3 * Math.cos(a) - .8])); } granules(g, 45, .25, 5.2, 0xC9A0C4, 17); break; }
      case 'meta': { add(body(13.5, 0xEAD3E4)); for (let i = 0; i < 5; i++) { const a = i / 4 * 1.9 - .95; add(ball(2.3 - Math.abs(i - 2) * .15, NUC, [3 * Math.sin(a), .3, 3 * Math.cos(a) - 1.6])); } granules(g, 60, .27, 5.8, 0xC9A0C4, 47); break; }
      case 'myelo': add(body(15, 0xE6D0E0), ball(3.7, 0x5A3EA6, [-2.2, .2, 0])); granules(g, 80, .3, 6.5, 0xC48AB8, 23); break;
      case 'reactive': add(body(15, 0xA9C8EE, .45), body(15.8, 0x3F6FC4, .28), ball(3.6, NUC, [-1.4, .3, .4])); break;
      case 'immunoblast': add(body(17, 0x3F6FC4, .68), ball(5, 0x5A3A9E, [-.6, .4, 0]), ball(1.1, 0xB9A8F0, [.4, 1.6, 4.4])); break;
      case 'blast': add(body(15, 0x7FA3D6, .55), ball(5.3, 0x5A3A9E, [0, 0, 0]), ball(.9, 0x9B84D6, [-1.6, 1.4, 4.7]), ball(.75, 0x9B84D6, [1.8, -.6, 4.8])); break;
      case 'promyelo': { add(body(18, 0xD9A0B8), ball(4, 0x5A3A9E, [-2.5, 0, 0])); granules(g, 150, .3, 7.6, 0xB0124A, 31); for (let i = 0; i < 6; i++) { const r = new THREE.Mesh(new THREE.CylinderGeometry(.16, .16, 6.5, 6), mat(0xC4234A)); r.position.set(2.6 + i * .35, 1.2, 2 + (i % 3) * .4); r.rotation.z = .9 + i * .06; add(r); } break; }
      case 'monoblast': add(body(20, 0x8C9CC8), ball(5.2, 0x6A4AAE, [-.8, .3, 0]), ball(1.3, 0xB9A8F0, [.2, 1.4, 4.9])); granules(g, 10, .25, 8.5, 0xF4F1FF, 41); break;
      case 'promono': { add(body(18, 0xB8B4DC, .48)); for (let i = 0; i < 6; i++) { const a = i / 5 * 3 - 1.5; add(ball(2.6, 0x5E40AA, [3.2 * Math.sin(a), i % 2 ? -.6 : .8, 3.2 * Math.cos(a) - 1])); } granules(g, 30, .25, 7.6, 0xD9B3E0, 43); break; }
      case 'erythroblast': add(body(14, 0x2F4FA8, .72), ball(4.6, 0x2A1660, [0, .3, 0])); break;
      case 'megablast': { add(body(16, 0x6F8FD0, .58), ball(5.4, 0x55389A, [0, 0, 0])); [[7.6, 1, 1], [-6.8, .8, 3.4], [2.4, 1.2, -7.4], [-3.4, -.4, -6.8], [5.2, .6, 5.6]].forEach((p, i) => add(ball(1.5 + (i % 2) * .5, 0x5C7FCB, p, .7))); break; }
    }
    return g;
  }

  // ---------- visor 3D
  const viewers = [];
  HB.disposeViewers = () => { while (viewers.length) viewers.pop()(); };
  /** Crea un visor dentro de `stage`. Devuelve {show(cells, field)}: una célula o un campo con varias. */
  function viewer(stage) {
    if (!hasGL()) { stage.innerHTML = '<div class="msg">Tu navegador no puede mostrar 3D. Las fichas y los juegos funcionan igual.</div>'; return { show() {} }; }
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    stage.innerHTML = ''; stage.append(renderer.domElement);
    const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(30, 1, .1, 1000);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x8a7a99, .9));
    const key = new THREE.DirectionalLight(0xffffff, 1.1); key.position.set(-30, 80, 50); scene.add(key);
    const fill = new THREE.DirectionalLight(0xffffff, .4); fill.position.set(60, 30, 30); scene.add(fill);
    const slide = new THREE.Mesh(new THREE.BoxGeometry(60, .6, 42), mat(0xD9C3CB, 1, .85)); slide.position.y = -.3; scene.add(slide);
    let holder = new THREE.Group(); scene.add(holder);
    let spin = 0, drag = null, wide = false, alive = true, visible = true;
    const resize = () => { const w = stage.clientWidth, h = stage.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); };
    const ro = new ResizeObserver(resize); ro.observe(stage);
    const io = new IntersectionObserver(es => { visible = es[0].isIntersecting; }); io.observe(stage);
    renderer.domElement.addEventListener('pointerdown', e => { drag = e.clientX; });
    window.addEventListener('pointerup', () => { drag = null; });
    renderer.domElement.addEventListener('pointermove', e => { if (drag !== null) { spin += (e.clientX - drag) * .01; drag = e.clientX; } });
    function loop() { if (!alive) return; requestAnimationFrame(loop); if (!visible) return; if (drag === null) spin += .004; holder.rotation.y = wide ? spin * .25 : spin; renderer.render(scene, cam); }
    loop();
    viewers.push(() => { alive = false; ro.disconnect(); io.disconnect(); renderer.dispose(); });
    return {
      show(cells) {
        scene.remove(holder); holder = new THREE.Group(); scene.add(holder);
        wide = cells.length > 1;
        const spots = [[0, 0]].concat([...Array(6)].map((_, k) => { const a = k / 6 * 2 * Math.PI + .3; return [Math.cos(a) * 27, Math.sin(a) * 20]; }));
        cells.slice(0, 7).forEach((k, i) => { const c = cell3d(k); if (wide) { c.position.set(spots[i][0], 10, spots[i][1]); c.rotation.y = i * 1.3; } else c.position.y = 10; holder.add(c); });
        const rnd = lcg(cells.join('').length * 31 + 7), rbc = [];
        for (let i = 0; i < (wide ? 10 : 9); i++) { const a = rnd() * 2 * Math.PI, d = (wide ? 36 : 17) + rnd() * (wide ? 18 : 28); const r = cell3d('rbc'); r.position.set(Math.cos(a) * d, 3, Math.sin(a) * d * .7); holder.add(r); }
        if (wide) { cam.position.set(0, 95, 100); cam.lookAt(0, 8, 0); } else { cam.position.set(0, 40, 54); cam.lookAt(0, 9, 0); }
      }
    };
  }
  const stageEl = (h = 380) => `<div class="stage" style="height:${h}px"></div>`;

  // ================= Guía de LMA =================
  W.amlGuide = (box) => {
    const A = D.aml; let tab = 'cells', ci = 0, st = 'M0', round = [], pos = 0, score = 0, picked = null;
    const ids = ['M0', 'M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7'];
    function shell() {
      const p = panel(box, 'key');
      p.innerHTML = `<h3>Aprende a diferenciar las LMA</h3><div class="row">${[['cells', 'Las células'], ['types', 'Los subtipos M0–M7'], ['cuts', 'Los cortes'], ['quiz', '¿Qué subtipo es?']].map(([id, t]) => `<button class="chip ${tab === id ? 'sel' : ''}" data-t="${id}">${t}</button>`).join('')}</div><div class="body" style="margin-top:14px"></div>`;
      p.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { tab = b.dataset.t; if (tab === 'quiz' && !round.length) newRound(); shell(); });
      const body = p.querySelector('.body');
      ({ cells, types, cuts, quiz })[tab](body);
    }
    function cells(b) {
      const c = A.cells[ci];
      b.innerHTML = `<div class="row">${A.cells.map((x, i) => `<button class="chip ${i === ci ? 'sel' : ''}" data-i="${i}">${esc(x.name)}</button>`).join('')}</div>
        <div class="split" style="margin-top:14px">${stageEl()}<div><h3>${esc(c.name)}</h3><table><tr><th>Tamaño</th><td>${esc(c.size)}</td></tr><tr><th>Núcleo</th><td>${md(c.nucleus)}</td></tr><tr><th>Citoplasma</th><td>${md(c.cytoplasm)}</td></tr></table><p><b>Clave:</b> ${md(c.key)}</p><p class="muted"><b>No la confundas con:</b> ${md(c.confuse)}</p></div></div>
        <p class="small muted">Arrastra el modelo para girarlo. Es un esquema para orientarte; practica con las fotos reales del Frotis.</p>`;
      b.querySelectorAll('[data-i]').forEach(x => x.onclick = () => { ci = +x.dataset.i; shell(); });
      viewer(b.querySelector('.stage')).show([c.kind]);
    }
    function types(b) {
      const s = A.subtypes.find(x => x.id === st);
      const counts = {}; s.field.forEach(k => counts[k] = (counts[k] || 0) + 1);
      const nm = k => k === 'promyelo' ? 'promielocito anómalo' : ((A.cells.find(c => c.kind === k) || {}).name || k).toLowerCase();
      b.innerHTML = `<div class="row">${ids.map(i => `<button class="chip ${i === st ? 'sel' : ''}" data-i="${i}">${i}</button>`).join('')}</div>
        <div class="split" style="margin-top:14px"><div>${stageEl()}<p class="small muted">En el campo: ${Object.entries(counts).map(([k, n]) => n + ' ' + nm(k)).join(' · ')}</p></div>
        <div><div class="kicker">FAB ${s.id} · ${esc(s.name)}</div><p><b>Criterio:</b> ${md(s.criterion)}</p><p><b>Cómo se ve:</b> ${md(s.looks)}</p><p><b>Citoquímica:</b> ${md(s.stains)}</p><p><b>Inmunofenotipo:</b> ${md(s.markers)}</p><p><b>Genética y clínica:</b> ${md(s.clinic)}</p><p class="muted"><b>Se confunde con:</b> ${md(s.confuse)}</p></div></div>`;
      b.querySelectorAll('[data-i]').forEach(x => x.onclick = () => { st = x.dataset.i; shell(); });
      viewer(b.querySelector('.stage')).show(s.field);
    }
    function cuts(b) { b.innerHTML = `<div class="tbl"><table><tr><th>Subtipo</th><th>Criterio FAB</th></tr>${A.subtypes.map(s => `<tr><td><b>${s.id} · ${esc(s.name)}</b></td><td>${md(s.criterion)}</td></tr>`).join('')}</table></div><p class="small muted">FAB calcula sobre las células no eritroides y sin linfocitos. Para la OMS basta con ≥ 20 % de blastos.</p>`; }
    function newRound() { round = shuffle(A.clues).slice(0, 8); pos = 0; score = 0; picked = null; }
    function quiz(b) {
      if (pos >= round.length) { b.innerHTML = `<div class="verdict ${score >= 6 ? 'ok' : ''}"><h3>${score} de ${round.length} correctas</h3>${score >= 6 ? 'Ya separas bien los subtipos.' : 'Repasa «Los subtipos» y vuelve a intentarlo.'}</div><button class="btn primary">Otra ronda</button>`; b.querySelector('button').onclick = () => { newRound(); shell(); }; return; }
      const it = round[pos];
      b.innerHTML = `<div class="kicker">Pista ${pos + 1} de ${round.length} · ${score} bien</div><h3>${md(it.clue)}</h3><div class="row">${ids.map(i => `<button class="chip ${picked ? (i === it.answer ? 'right' : (i === picked ? 'wrong' : '')) : ''}" data-i="${i}" ${picked ? 'disabled' : ''}>${i}</button>`).join('')}</div>
        ${picked ? `<div class="verdict ${picked === it.answer ? 'ok' : 'no'}"><h3>${picked === it.answer ? 'Correcto: ' + it.answer : 'Era ' + it.answer + ', no ' + picked}</h3>${md(it.why)}</div><button class="btn primary" id="nx">${pos + 1 < round.length ? 'Siguiente pista →' : 'Ver resultado'}</button>` : ''}`;
      b.querySelectorAll('[data-i]').forEach(x => x.onclick = () => { picked = x.dataset.i; const ok = picked === it.answer; if (ok) score++; answered(ok, 2); quiz(b); });
      const nx = b.querySelector('#nx'); if (nx) nx.onclick = () => { pos++; picked = null; quiz(b); };
    }
    shell();
  };

  // ================= Contador diferencial =================
  const KEYS = {
    general: [['neu', 'Segmentado'], ['band', 'Baciliforme'], ['meta', 'Juvenil'], ['myelo', 'Mielocito'], ['lin', 'Linfocito'], ['reactive', 'Reactivo'], ['immunoblast', 'Inmunoblasto'], ['mon', 'Monocito'], ['eos', 'Eosinófilo'], ['bas', 'Basófilo'], ['blast', 'Blasto'], ['promyelo', 'Promielocito']],
    lma: [['blast', 'Mieloblasto'], ['monoblast', 'Monoblasto'], ['promono', 'Promonocito'], ['mon', 'Monocito'], ['erythroblast', 'Eritroblasto'], ['megablast', 'Megacarioblasto'], ['myelo', 'Mielocito'], ['meta', 'Juvenil'], ['band', 'Baciliforme'], ['neu', 'Segmentado'], ['lin', 'Linfocito']],
  };
  const nameOf = k => (KEYS.general.concat(KEYS.lma).find(x => x[0] === k) || [0, k])[1];
  const fm = v => (Math.round(v * 10) / 10).toString().replace('.', ',');
  const g = (f, k) => f[k] || 0;
  const aml = f => { const ery = g(f, 'erythroblast'), nonEry = Math.max(1, 100 - ery - g(f, 'lin')); return { ery, nonEry, blasts: g(f, 'blast') + g(f, 'monoblast') + g(f, 'promono') + g(f, 'megablast'), mono: g(f, 'monoblast') + g(f, 'promono') + g(f, 'mon'), gran: g(f, 'myelo') + g(f, 'meta') + g(f, 'band') + g(f, 'neu') }; };
  const of = (v, n) => Math.round(v / n * 1000) / 10;
  const CASES = [
    { id: 'normal', title: 'Adulto sano', story: 'Control de rutina, sin síntomas. Sirve para calibrar el ojo.', mix: { neu: 58, band: 3, lin: 29, mon: 6, eos: 3, bas: 1 },
      read: f => { const ok = g(f, 'neu') >= 50 && g(f, 'neu') <= 70 && g(f, 'lin') >= 20 && g(f, 'lin') <= 40; return [ok ? 'ok' : 'neutral', ok ? 'Fórmula dentro de rangos' : 'Revisa la fórmula', ['Neutrófilos 50–70 % · linfocitos 20–40 % · monocitos 2–8 % · eosinófilos 1–4 % · basófilos 0,5–1 %.']]; } },
    { id: 'ebv', title: 'Mononucleosis (EBV)', story: '17 años, fiebre, odinofagia y adenopatías cervicales hace 10 días.', mix: { neu: 24, band: 2, lin: 44, reactive: 23, mon: 6, eos: 1 },
      read: f => { const rea = g(f, 'reactive'), lin = g(f, 'lin') + rea, ok = rea >= 10 && lin > 50; return [ok ? 'ok' : 'neutral', ok ? 'Compatible con síndrome mononucleósico' : 'No alcanza los cortes', [`Linfocitos totales ${fm(lin)} % (corte > 50 %).`, `Reactivos ${fm(rea)} % (corte ≥ 10 %: sensibilidad 75 %, especificidad 92 %).`, 'Confirma con IgM anti-VCA o Paul-Bunnell según la edad.']]; } },
    { id: 'hanta', title: 'Sospecha de hantavirus', story: 'Trabajador forestal de Aysén, fiebre y diarrea; hoy disnea. Hto 54 %, plaquetas 48.000/µL.', mix: { neu: 42, band: 16, myelo: 4, lin: 14, reactive: 7, immunoblast: 15, mon: 2 },
      read: f => { const inm = g(f, 'immunoblast'), mie = g(f, 'myelo'), n = 3 + (inm > 10 ? 1 : 0) + (mie > 1 ? 1 : 0); return [n >= 4 ? 'no' : 'neutral', `${n}/5 criterios de Koster y Jenison`, [`Inmunoblastos ${fm(inm)} % (corte > 10 %).`, `Mielocitos ${fm(mie)} % (corte > 1 %).`, 'Del caso: Hto > 50 %, plaquetas < 150.000/µL y granulación tóxica.', n >= 4 ? 'Compatible con SCPH: avisa, prueba rápida del ISP y precauciones estándar.' : 'Repite el hemograma: las alteraciones evolucionan.']]; } },
    { id: 'bact', title: 'Infección bacteriana', story: 'Neumonía de 3 días, leucocitos 21.000/µL.', mix: { neu: 67, band: 15, meta: 3, myelo: 2, lin: 8, mon: 5 },
      read: f => { const b = g(f, 'band'); return [b > 10 ? 'no' : 'neutral', b > 10 ? 'Desviación a izquierda' : 'Sin desviación clara', [`Baciliformes ${fm(b)} %: más de 10 % indica desviación a izquierda.`, `Juveniles ${fm(g(f, 'meta'))} % y mielocitos ${fm(g(f, 'myelo'))} %: la desviación sigue el orden baciliforme → juvenil → mielocito.`, 'Neutrofilia con formas inmaduras: infección bacteriana o inflamación.']]; } },
    { id: 'lpa', title: 'Leucemia promielocítica', story: '34 años, equimosis y sangrado de encías. Plaquetas 22.000/µL, fibrinógeno bajo.', mix: { promyelo: 68, blast: 7, neu: 6, lin: 15, mon: 4 },
      read: f => { const p = g(f, 'promyelo'); return ['no', p > 20 ? 'Sospecha de LPA: emergencia' : 'Revisa los promielocitos', [`Promielocitos leucémicos ${fm(p)} % (criterio > 20 %).`, 'Células fagot (haces de bastones de Auer): avisa de inmediato, se da ácido transretinoico sin esperar PML::RARA.']]; } },
    { id: 'lmc', title: 'Leucemia mieloide crónica', story: '52 años, saciedad precoz por esplenomegalia. Leucocitos 140.000/µL. Se ven todas las etapas de maduración granulocítica.', mix: { neu: 36, band: 12, meta: 10, myelo: 17, blast: 3, bas: 7, eos: 5, lin: 7, mon: 3 },
      read: f => { const bla = g(f, 'blast'), bas = g(f, 'bas'), fase = bla >= 20 ? 'fase blástica' : (bla >= 10 || bas >= 20) ? 'fase acelerada' : 'fase crónica'; return ['no', 'Compatible con LMC en ' + fase, [`Mielocitos ${fm(g(f, 'myelo'))} % y juveniles ${fm(g(f, 'meta'))} %: **todas las etapas** de maduración, sin hiato leucémico.`, `Basófilos ${fm(bas)} % y eosinófilos ${fm(g(f, 'eos'))} %: la basofilia es típica.`, `Blastos ${fm(bla)} %: < 10 % crónica · 10–19 % acelerada · ≥ 20 % blástica.`, 'Confirma t(9;22) BCR::ABL1 (cromosoma Filadelfia). Tratamiento: imatinib.']]; } },
    { id: 'm0', group: 'lma', title: 'LMA M0 · mínimamente diferenciada', story: 'Aspirado de médula. 62 años, astenia y fiebre. Blastos sin gránulos ni bastones de Auer; MPO negativa.', mix: { blast: 88, lin: 7, neu: 3, mon: 2 },
      read: f => { const a = aml(f), b = of(a.blasts, a.nonEry), ok = b >= 90; return [ok ? 'no' : 'neutral', ok ? 'Compatible con LMA M0' : 'Revisa los blastos', [`Blastos ${fm(b)} % de las células no eritroides (M0 y M1: ≥ 90 %).`, 'M0 se distingue de M1 por la **MPO < 3 %** y sin Auer: la morfología no basta.', 'Confirma por citometría de flujo: CD34, CD13, CD33, CD117 + y marcadores linfoides −.']]; } },
    { id: 'm1', group: 'lma', title: 'LMA M1 · sin maduración', story: 'Aspirado de médula. 48 años, palidez, equimosis y fiebre. Algunos blastos con escasos gránulos y un bastón de Auer.', mix: { blast: 84, myelo: 2, band: 1, neu: 4, lin: 9 },
      read: f => { const a = aml(f), b = of(a.blasts, a.nonEry), gr = of(a.gran, a.nonEry), ok = b >= 90 || (b >= 80 && gr < 10); return [ok ? 'no' : 'neutral', ok ? 'Compatible con LMA M1' : 'Revisa blastos y maduración', [`Blastos ${fm(b)} % de las no eritroides (≥ 90 %).`, `Maduración granulocítica ${fm(gr)} % (M1: < 10 %; si es ≥ 10 % pasa a M2).`, 'MPO ≥ 3 % de los blastos la separa de M0.']]; } },
    { id: 'm2', group: 'lma', title: 'LMA M2 · con maduración', story: 'Aspirado de médula. 35 años, fiebre e infecciones a repetición. Blastos con bastones de Auer y formas granulocíticas maduras.', mix: { blast: 42, myelo: 10, meta: 5, band: 8, neu: 18, mon: 4, lin: 13 },
      read: f => { const a = aml(f), b = of(a.blasts, a.nonEry), gr = of(a.gran, a.nonEry), m = of(a.mono, a.nonEry), ok = b >= 20 && b < 90 && gr >= 10 && m < 20; return [ok ? 'no' : 'neutral', ok ? 'Compatible con LMA M2' : 'Revisa los cortes de M2', [`Blastos ${fm(b)} % (20–89 %).`, `Maduración granulocítica ${fm(gr)} % (≥ 10 %) · serie monocítica ${fm(m)} % (< 20 %).`, 'Se asocia a **t(8;21) RUNX1::RUNX1T1**, de buen pronóstico; busca bastones de Auer.']]; } },
    { id: 'm4', group: 'lma', title: 'LMA M4 · mielomonocítica', story: 'Aspirado de médula. 55 años, hipertrofia gingival y fiebre. Mezcla de blastos mieloides y células monocíticas.', mix: { blast: 26, monoblast: 8, promono: 10, mon: 12, myelo: 6, meta: 4, band: 5, neu: 17, lin: 12 },
      read: f => { const a = aml(f), b = of(a.blasts, a.nonEry), gr = of(a.gran, a.nonEry), m = of(a.mono, a.nonEry), ok = b >= 20 && gr >= 20 && m >= 20 && m < 80; return [ok ? 'no' : 'neutral', ok ? 'Compatible con LMA M4' : 'Revisa las dos series', [`Blastos totales ${fm(b)} % (≥ 20 %; los promonocitos cuentan como equivalentes blásticos).`, `Serie granulocítica ${fm(gr)} % y monocítica ${fm(m)} %: **ambas ≥ 20 %**.`, 'Esterasas: inespecífica (+, se inhibe con fluoruro) y específica (+). Con eosinófilos anómalos e **inv(16)** es M4Eo.']]; } },
    { id: 'm5', group: 'lma', title: 'LMA M5 · monocítica', story: 'Aspirado de médula. 28 años, infiltración de encías y piel, leucocitosis. Predominan células grandes de citoplasma gris azulado.', mix: { monoblast: 68, promono: 8, mon: 6, blast: 3, neu: 5, lin: 10 },
      read: f => { const a = aml(f), m = of(a.mono, a.nonEry), mb = a.mono > 0 ? of(g(f, 'monoblast'), a.mono) : 0, ok = m >= 80; return [ok ? 'no' : 'neutral', ok ? 'Compatible con LMA M5' + (mb >= 80 ? 'a (monoblástica)' : 'b (monocítica)') : 'Revisa la serie monocítica', [`Serie monocítica ${fm(m)} % de las no eritroides (M5: ≥ 80 %).`, `Monoblastos ${fm(mb)} % de la serie monocítica: **≥ 80 % es M5a**, menos es M5b.`, 'Esterasa inespecífica (+) inhibida por fluoruro; lisozima alta. Da infiltración de encías, piel y SNC.']]; } },
    { id: 'm6', group: 'lma', title: 'LMA M6 · eritroleucemia', story: 'Aspirado de médula. 67 años, anemia intensa con eritroblastos en sangre. Precursores rojos megaloblásticos y blastos mieloides.', mix: { erythroblast: 56, blast: 15, myelo: 4, neu: 9, mon: 4, lin: 12 },
      read: f => { const a = aml(f), b = of(a.blasts, a.nonEry), ok = a.ery >= 50 && b >= 20; return [ok ? 'no' : 'neutral', ok ? 'Compatible con LMA M6 (eritroleucemia)' : 'Revisa eritroblastos y blastos', [`Eritroblastos ${fm(a.ery)} % de todas las células nucleadas (M6: ≥ 50 %).`, `Blastos ${fm(b)} % **de las no eritroides** (≥ 20 %): por eso se descuentan los eritroblastos.`, 'PAS en bloque (+) en los eritroblastos. La OMS actual solo reconoce la leucemia eritroide pura.']]; } },
    { id: 'm7', group: 'lma', title: 'LMA M7 · megacarioblástica', story: 'Aspirado difícil (punción seca) en un niño de 2 años con síndrome de Down. Blastos con ampollas citoplasmáticas y mielofibrosis.', mix: { megablast: 38, blast: 8, lin: 32, neu: 15, mon: 7 },
      read: f => { const a = aml(f), b = of(a.blasts, a.nonEry), mk = a.blasts > 0 ? of(g(f, 'megablast'), a.blasts) : 0, ok = b >= 20 && mk >= 50; return [ok ? 'no' : 'neutral', ok ? 'Compatible con LMA M7' : 'Revisa los megacarioblastos', [`Blastos ${fm(b)} % (≥ 20 %) · megacarioblastos ${fm(mk)} % de los blastos (≥ 50 %).`, 'Confirma con citometría: CD41, CD61 (y CD42b) +; MPO −.', 'La fibrosis da punción seca: muchas veces se necesita biopsia. En Down se asocia a mutación de GATA1 y a la TAM previa.']]; } },
  ];

  W.counter = (box) => {
    let group = 'general', cid = 'ebv', total = 50, cells = [], answers = [], view = null;
    const cur = () => CASES.find(c => c.id === cid);
    const keys = () => KEYS[cur().group || 'general'];
    function setup() {
      const p = panel(box);
      p.innerHTML = `<h3>Elige la muestra</h3><div class="row">${[['general', 'Sangre periférica'], ['lma', 'Leucemias mieloides (FAB M0–M7)']].map(([id, t]) => `<button class="chip ${group === id ? 'sel' : ''}" data-g="${id}">${t}</button>`).join('')}</div>
        <div class="row" style="margin-top:10px">${CASES.filter(c => (c.group || 'general') === group).map(c => `<button class="chip ${c.id === cid ? 'sel' : ''}" data-c="${c.id}">${esc(c.title)}</button>`).join('')}</div>
        <div class="row" style="margin-top:10px">${[[50, '50 (rápido)'], [100, '100 (como en el laboratorio)']].map(([n, t]) => `<button class="chip ${total === n ? 'sel' : ''}" data-n="${n}">${t}</button>`).join('')}</div>
        <p><b>${esc(cur().title)}:</b> ${md(cur().story)}</p><button class="btn primary" id="go">Empezar a contar</button>`;
      p.querySelectorAll('[data-g]').forEach(b => b.onclick = () => { group = b.dataset.g; cid = CASES.find(c => (c.group || 'general') === group).id; setup(); });
      p.querySelectorAll('[data-c]').forEach(b => b.onclick = () => { cid = b.dataset.c; setup(); });
      p.querySelectorAll('[data-n]').forEach(b => b.onclick = () => { total = +b.dataset.n; setup(); });
      p.querySelector('#go').onclick = start;
    }
    function start() {
      let list = []; Object.entries(cur().mix).forEach(([k, pct]) => { for (let i = 0; i < Math.round(pct / 100 * total); i++) list.push(k); });
      const first = Object.keys(cur().mix)[0]; while (list.length < total) list.push(first);
      cells = shuffle(list.slice(0, total)); answers = []; play(true);
    }
    function play(fresh) {
      if (answers.length >= cells.length) return results();
      const i = answers.length, right = answers.filter((a, k) => a === cells[k]).length;
      if (fresh || !view) {
        const p = panel(box, 'key');
        p.innerHTML = `<div class="row"><h3 style="margin:0">Célula <span id="n"></span> de ${cells.length}</h3><span class="grow"></span><span class="small muted" id="ok"></span></div><div class="bar2"><i id="pr"></i></div>
          <div class="split">${stageEl(360)}<div><p class="small muted">Toca la célula que ves</p><div class="keys">${keys().map(([k, n]) => `<button class="chip" data-k="${k}"><span>${esc(n)}</span><b id="c-${k}">0</b></button>`).join('')}</div><p><button class="chip" id="undo">↶ Deshacer</button></p><p id="last" class="small"></p></div></div>`;
        view = viewer(p.querySelector('.stage'));
        p.querySelectorAll('[data-k]').forEach(b => b.onclick = () => count(b.dataset.k));
        p.querySelector('#undo').onclick = () => { if (answers.length) { answers.pop(); play(); } };
      }
      box.querySelector('#n').textContent = i + 1; box.querySelector('#ok').textContent = `${right}/${i} bien`;
      box.querySelector('#pr').style.width = (i / cells.length * 100) + '%';
      keys().forEach(([k]) => { const e = box.querySelector('#c-' + k); if (e) e.textContent = answers.filter(a => a === k).length; });
      const last = box.querySelector('#last');
      if (answers.length) { const prev = cells[answers.length - 1], a = answers[answers.length - 1]; last.innerHTML = a === prev ? `<span style="color:var(--ok)">✓ La anterior era <b>${esc(nameOf(prev))}</b>.</span>` : `<span style="color:var(--bad)">✗ La anterior era <b>${esc(nameOf(prev))}</b>, no ${esc(nameOf(a))}.</span>`; } else last.textContent = '';
      view.show([cells[i]]);
    }
    function count(k) {
      if (answers.length >= cells.length) return;
      const ok = k === cells[answers.length]; answers.push(k); answered(ok, 1);
      if (answers.length === cells.length) { const acc = answers.filter((a, i) => a === cells[i]).length / cells.length; if (acc >= .9) addXP(20); }
      play();
    }
    function results() {
      view = null;
      const n = cells.length, pctOf = (list, k) => Math.round(list.filter(x => x === k).length / n * 1000) / 10;
      const mine = {}; keys().forEach(([k]) => mine[k] = pctOf(answers, k));
      const [kind, title, notes] = cur().read(mine);
      const right = answers.filter((a, i) => a === cells[i]).length, acc = Math.round(right / n * 1000) / 10;
      const present = keys().filter(([k]) => cells.includes(k) || answers.includes(k));
      const misses = {}; answers.forEach((a, i) => { if (a !== cells[i]) misses[cells[i]] = (misses[cells[i]] || 0) + 1; });
      const worst = Object.entries(misses).sort((a, b) => b[1] - a[1])[0];
      const p = panel(box, 'key');
      p.innerHTML = `<div class="verdict ${kind === 'ok' ? 'ok' : kind === 'no' ? 'no' : ''}"><h3>${esc(title)}</h3>${notes.map(x => `<p>${md(x)}</p>`).join('')}<p class="small muted">Interpretación con tu conteo. Ejercicio de estudio, no diagnóstico.</p></div>
        <h3>Tu fórmula vs la muestra · precisión ${fm(acc)} %</h3><div class="tbl"><table><tr><th>Célula</th><th>Tu conteo</th><th>Muestra</th></tr>${present.map(([k, nm]) => `<tr><td>${esc(nm)}</td><td>${fm(pctOf(answers, k))} %</td><td>${fm(pctOf(cells, k))} %</td></tr>`).join('')}</table></div>
        <p>${worst ? `<b>Donde más fallaste:</b> ${esc(nameOf(worst[0]))} (${worst[1]} ${worst[1] === 1 ? 'vez' : 'veces'}).` : '<b>Sin errores.</b> Ojo de laboratorio.'}</p>
        <div class="row"><button class="btn primary" id="again">Contar otra muestra</button><button class="btn" id="setup">Cambiar de caso</button></div>`;
      p.querySelector('#again').onclick = start; p.querySelector('#setup').onclick = setup;
    }
    setup();
  };
})();
