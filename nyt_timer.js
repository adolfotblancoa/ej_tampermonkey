// ==UserScript==
// @name         NYT Games - Temporizador + Récord
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Cronómetro sencillo con mejor tiempo guardado por juego.
// @match        https://www.nytimes.com/games/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

/*
  Qué hace (para el ejercicio):
  - Añado: un cronómetro visible que inicia solo y un botón Detener/Reanudar.
  - Añado: guarda automáticamente el mejor tiempo (récord) por cada juego (ruta) en localStorage.
*/

(function () {
  'use strict';

  // --- utilidades ----------------------------------------------------------
  const fmt = (ms) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${String(m).padStart(2,'0')}:${String(r).padStart(2,'0')}`;
  };
  const keyBest = `nyt:simple-timer:best:${location.pathname}`;
  const getBest = () => Number(localStorage.getItem(keyBest) || 0);
  const setBest = (v) => localStorage.setItem(keyBest, String(v));

  // --- UI mínima -----------------------------------------------------------
  const box = document.createElement('div');
  Object.assign(box.style, {
    position: 'fixed', left: '16px', bottom: '16px', zIndex: 999999,
    background: 'rgba(0,0,0,.75)', color: '#fff', padding: '10px 12px',
    borderRadius: '12px', font: '600 13px system-ui, Arial'
  });
  box.innerHTML = `
    ⏱ <span id="nyt-timer">00:00</span>
    &nbsp;•&nbsp; Récord: <span id="nyt-best">${getBest() ? fmt(getBest()) : '--:--'}</span>
  `;
  document.body.appendChild(box);

  const btns = document.createElement('div');
  Object.assign(btns.style, {
    position: 'fixed', right: '16px', bottom: '16px', zIndex: 999999,
    display: 'flex', gap: '8px'
  });
  const mkBtn = (txt) => {
    const b = document.createElement('button');
    b.textContent = txt;
    Object.assign(b.style, {
      background: '#2e7dff', color: '#fff', border: '0', borderRadius: '10px',
      padding: '10px 12px', font: '600 13px system-ui, Arial', cursor: 'pointer',
      boxShadow: '0 6px 16px rgba(0,0,0,.15)'
    });
    b.onmousedown = () => (b.style.transform = 'translateY(1px)');
    b.onmouseup = () => (b.style.transform = '');
    return b;
  };
  const toggleBtn = mkBtn('Detener');
  const resetBtn  = mkBtn('Reiniciar');
  btns.append(toggleBtn, resetBtn);
  document.body.appendChild(btns);

  // --- lógica del cronómetro -----------------------------------------------
  const timerEl = document.getElementById('nyt-timer');
  const bestEl  = document.getElementById('nyt-best');

  let start = Date.now();
  let acc = 0;           // acumulado cuando pausas
  let running = true;
  let id = 0;

  function tick() {
    const now = running ? acc + (Date.now() - start) : acc;
    timerEl.textContent = fmt(now);
  }

  function loop() {
    tick();
    id = requestAnimationFrame(loop);
  }
  loop(); // empieza solo

  function toggle() {
    if (running) {
      // pasar a PAUSA
      acc += Date.now() - start;
      running = false;
      toggleBtn.textContent = 'Reanudar';
      // comprobar récord al detener
      const current = acc;
      const best = getBest();
      if (!best || current < best) {
        setBest(current);
        bestEl.textContent = fmt(current);
        toast('¡Nuevo récord! 🎉 ' + fmt(current));
      }
    } else {
      // pasar a CORRER
      start = Date.now();
      running = true;
      toggleBtn.textContent = 'Detener';
    }
  }

  function resetAll() {
    if (!confirm('¿Reiniciar cronómetro?')) return;
    start = Date.now();
    acc = 0;
    running = true;
    toggleBtn.textContent = 'Detener';
  }

  toggleBtn.addEventListener('click', toggle);
  resetBtn.addEventListener('click', resetAll);

  // atajos simples: P = detener/reanudar, R = reiniciar
  document.addEventListener('keydown', (e) => {
    if (/input|textarea/i.test(e.target.tagName)) return;
    const k = e.key.toLowerCase();
    if (k === 'p') toggle();
    if (k === 'r') resetAll();
  });

  // --- mini toast (opcional, 2 líneas) --------------------------------------
  function toast(text) {
    const t = document.createElement('div');
    t.textContent = text;
    Object.assign(t.style, {
      position: 'fixed', left: '50%', bottom: '80px', transform: 'translateX(-50%)',
      background: '#10b981', color: '#fff', padding: '10px 14px', borderRadius: '10px',
      font: '600 13px system-ui', zIndex: 999999, opacity: 0, transition: 'opacity .2s ease'
    });
    document.body.appendChild(t);
    requestAnimationFrame(() => (t.style.opacity = 1));
    setTimeout(() => { t.style.opacity = 0; setTimeout(() => t.remove(), 200); }, 1500);
  }
})();
