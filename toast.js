(function () {
  'use strict';
  const ROOT = (typeof self !== 'undefined') ? self : window;
  const STYLE_ID = 'sckit-toast-style';
  const CSS =
    '#sckit-toast{position:fixed;bottom:calc(84px * var(--sckit-s,1));z-index:2147483647;width:max-content;max-width:calc(100vw - 32px);' +
    'display:flex;flex-direction:column;align-items:center;gap:calc(5px * var(--sckit-s,1));' +
    'background:#17181c;border:calc(2px * var(--sckit-s,1)) solid #000;' +
    'border-radius:calc(14px * var(--sckit-s,1));' +
    'box-shadow:0 calc(4px * var(--sckit-s,1)) 0 rgba(0,0,0,.45);' +
    'padding:calc(11px * var(--sckit-s,1)) calc(15px * var(--sckit-s,1)) calc(9px * var(--sckit-s,1));' +
    'font:700 calc(12.5px * var(--sckit-s,1))/1.3 system-ui,sans-serif;color:#e8eaed;pointer-events:none;' +
    'opacity:0;transition:opacity .2s;}' +
    '#sckit-toast.pL{left:16px;right:auto;margin:0}' +
    '#sckit-toast.pC{left:0;right:0;margin:0 auto}' +
    '#sckit-toast.pR{right:16px;left:auto;margin:0}' +
    '#sckit-toast .sckit-key{display:flex;align-items:center;justify-content:center;' +
    'min-width:calc(42px * var(--sckit-s,1));height:calc(42px * var(--sckit-s,1));' +
    'padding:0 calc(9px * var(--sckit-s,1));background:#ff5500;' +
    'border:calc(3px * var(--sckit-s,1)) solid #000;' +
    'border-radius:calc(10px * var(--sckit-s,1));' +
    'box-shadow:0 calc(4px * var(--sckit-s,1)) 0 #000;' +
    'font:800 calc(19px * var(--sckit-s,1))/1 Consolas,monospace;color:#fff;}' +
    '#sckit-toast .sckit-icon{font:400 calc(17px * var(--sckit-s,1))/1 system-ui,"Segoe UI Emoji",sans-serif;}' +
    '#sckit-toast .sckit-txt{letter-spacing:.5px;}' +
    '#sckit-toast.show{animation:sck-in .18s ease-out both;}' +
    '@keyframes sck-in{from{opacity:0;transform:translateY(10px) scale(.85);}to{opacity:1;transform:none;}}';

  function ensureStyle(doc) {
    if (doc.getElementById(STYLE_ID)) return;
    const st = doc.createElement('style');
    st.id = STYLE_ID;
    st.textContent = CSS;
    (doc.head || doc.documentElement).appendChild(st);
  }

  function show(o) {
    const doc = document;
    const opt = o || {};
    ensureStyle(doc);
    const s = Math.max(0.5, Math.min(3, Number(opt.size) || 1));
    let t = doc.getElementById('sckit-toast');
    if (!t) {
      t = doc.createElement('div');
      t.id = 'sckit-toast';
      t.innerHTML = '<span class="sckit-key"></span><span class="sckit-icon"></span><span class="sckit-txt"></span>';
      (doc.body || doc.documentElement).appendChild(t);
    }
    t.style.setProperty('--sckit-s', String(s));
    const pos = opt.pos === 'left' ? 'pL' : opt.pos === 'center' ? 'pC' : 'pR';
    t.classList.remove('pL', 'pC', 'pR');
    t.classList.add(pos);
    const ky = t.querySelector('.sckit-key');
    ky.textContent = opt.key || '';
    ky.style.display = (opt.keyOn && opt.key) ? '' : 'none';
    const ic = t.querySelector('.sckit-icon');
    ic.textContent = opt.icon || '';
    ic.style.display = (opt.iconOn && opt.icon) ? '' : 'none';
    const tx = t.querySelector('.sckit-txt');
    tx.textContent = opt.text || '';
    tx.style.display = (opt.textOn || opt.forceText) ? '' : 'none';
    t.classList.remove('show');
    void t.offsetWidth;
    t.classList.add('show');
    t.style.opacity = '1';
    clearTimeout(t._timer);
    t._timer = setTimeout(() => {
      t.classList.remove('show');
      t.style.opacity = '0';
    }, 950);
  }

  ROOT.SCKIT_TOAST = {
    show: show,
    ICONS: { next: '⏭', prev: '⏮', ff: '⏩', rw: '⏪', like: '❤️', unlike: '💔', unlike_arm: '⚠️', play: '▶️', pause: '⏸️' }
  };
})();
