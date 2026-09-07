

window.SCKIT_SOUND = (function () {
  'use strict';
  const BASE = {
    next: [660, 880], prev: [880, 660], ff: [988, 1319], rw: [1319, 988],
    like: [1047, 1319, 1568], play: [660, 880], pause: [880, 660],
    mute: [523, 392], unmute: [392, 523],
    shuffle: [784, 988], shuffleOff: [988, 784],
    repeat: [880, 1109], repeatOff: [1109, 880]
  };
  const SCHEMES = {
    classic: { m: 1,    w1: 'sine',     w2: 'triangle' },
    deep:    { m: 0.45, w1: 'square',   w2: 'square' },
    crisp:   { m: 1.5,  w1: 'triangle', w2: 'sine' },
    chip:    { m: 1,    w1: 'square',   w2: 'square' },
    soft:    { m: 0.7,  w1: 'sine',     w2: 'sine' }
  };
  let ctx = null;

  function normVol(v) {
    return Math.max(0, Math.min(100, Number(v) || 0)) / 100 * 0.5;
  }
  function seqPlay(seq, vol) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      if (!ctx) ctx = new AC();
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      const t0 = ctx.currentTime;
      seq.forEach(([f, st, d, tp, g]) => {
        const o = ctx.createOscillator();
        const gn = ctx.createGain();
        o.type = tp;
        o.frequency.setValueAtTime(f, t0 + st);
        gn.gain.setValueAtTime(0, t0 + st);
        gn.gain.linearRampToValueAtTime(vol * g, t0 + st + 0.008);
        gn.gain.exponentialRampToValueAtTime(0.0001, t0 + st + d);
        o.connect(gn);
        gn.connect(ctx.destination);
        o.start(t0 + st);
        o.stop(t0 + st + d + 0.02);
      });
    } catch (e) {  }
  }

  function play(kind, opts) {
    const o = opts || {};
    const vol = normVol(o.volume);
    if (vol <= 0) return;
    const S = SCHEMES[o.scheme] || SCHEMES.classic;
    const ck = kind === 'unlike' ? 'like' : kind;
    const cus = o.scheme === 'custom' && o.custom && o.custom[ck];
    let seq;
    if (cus) {
      seq = [[+cus.f || 660, 0, 0.14, cus.w || 'sine', 1]];
    } else {
      const seek = kind === 'ff' || kind === 'rw';
      const triple = kind === 'like' || kind === 'unlike';
      const w = seek ? S.w2 : S.w1;
      const freqs = kind === 'unlike' ? BASE.like.slice().reverse() : (BASE[kind] || BASE.next);
      const durs = triple ? [0.18, 0.22, 0.3] : (seek ? [0.05, 0.07] : [0.09, 0.12]);
      const gaps = triple ? [0, 0.02, 0.04] : [0, 0.07];
      const gains = triple ? [1, 0.8, 0.6] : [1, 1];
      seq = freqs.map((f, i) => [f * S.m, gaps[i], durs[i], w, gains[i]]);
    }
    seqPlay(seq, vol);
  }
  return { play: play, BASE: BASE, SCHEMES: SCHEMES };
})();
