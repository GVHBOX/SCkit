const $ = (id) => document.getElementById(id);
const DEFAULTS = window.SCKIT_DEFAULTS;
const ui = {
  title: $('title'), artist: $('artist'), art: $('art'), tcur: $('tcur'), tdur: $('tdur'),
  seek: $('seek'), wave: $('wave'), btnPrev: $('btnPrev'), btnNext: $('btnNext'), btnToggle: $('btnToggle'),
  btnShuffle: $('btnShuffle'), btnRepeat: $('btnRepeat'),
  icoPlay: $('icoPlay'), icoPause: $('icoPause'), icoSpin: $('icoSpin'),
  btnMute: $('btnMute'), vol: $('vol'), volWhite: $('volWhite'), volWFill: $('volWFill'), volPct: $('volPct'), openOpts: $('openOpts'),
  btnLike: $('btnLike'), likeConfirm: $('likeConfirm'), lcCancel: $('lcCancel'), lcOk: $('lcOk'),
  btnTheme: $('btnTheme'), openSc: $('openSc'), staleTip: $('staleTip')
};
let tabId = null;
let titleKey = null;
let seeking = false;
let lang = 'zh';
let curLiked = false;
let likeConfirm = true;
let hotkeys = { nextKey: DEFAULTS.nextKey, prevKey: DEFAULTS.prevKey, ffKey: DEFAULTS.ffKey, rwKey: DEFAULTS.rwKey, likeKey: DEFAULTS.likeKey };
let keyOff = Object.assign({}, DEFAULTS.keyOff);
let ffSeconds = DEFAULTS.ffSeconds, rwSeconds = DEFAULTS.rwSeconds;
let theme = 'dark';
let soundUi = true, soundScheme = 'classic', soundVolume = 20;
let swapAnim = true;
let pendingSwap = 0;
let swapWait = null;
let lastTitle = null;
let lastArtist = null;

let lastCur = -1;
let frozenAt = 0;
let lastAdvanceAt = 0;
let buffering = false;
let curArtUrl = '';
let pendingArt = '';
let progressStyle = 'wave';
let waveSpans = [];
let waveCur = null;
let waveKey = null;
let waveDrag = false;
const WAVE_N = 90;
let volumeStyle = 'slider';
let volDrag = false;
let volLock = null;
let lastVol = 50;
let lastVolTimer = 0;

let seekCommitted = false;
let seekLock = 0;
function applyTheme(v) {
  theme = v === 'light' ? 'light' : 'dark';
  document.body.classList.toggle('light', theme === 'light');
  ui.btnTheme.textContent = theme === 'light' ? '🌙' : '☀️';
}
function uiPlay(kind) {
  if (!soundUi) return;
  window.SCKIT_SOUND.play(kind, { volume: soundVolume, scheme: soundScheme });
}

function applyHoverRing(on) {
  document.documentElement.style.setProperty('--hover-stroke', on === true ? '1' : '0');
}
function applyTilt(n) {
  const d = Math.max(0, Math.min(45, Number(n) || 0));
  document.documentElement.style.setProperty('--tiltn', String(d));
}

function applyHotkeyCfg(v) {
  hotkeys = {
    nextKey: (v.nextKey || DEFAULTS.nextKey).toString().toLowerCase().charAt(0),
    prevKey: (v.prevKey || DEFAULTS.prevKey).toString().toLowerCase().charAt(0),
    ffKey: (v.ffKey || DEFAULTS.ffKey).toString().toLowerCase().charAt(0),
    rwKey: (v.rwKey || DEFAULTS.rwKey).toString().toLowerCase().charAt(0),
    likeKey: (v.likeKey || DEFAULTS.likeKey).toString().toLowerCase().charAt(0)
  };
  keyOff = Object.assign({}, DEFAULTS.keyOff, v.keyOff);
  ffSeconds = Number.isFinite(Number(v.ffSeconds)) && Number(v.ffSeconds) > 0 ? Number(v.ffSeconds) : DEFAULTS.ffSeconds;
  rwSeconds = Number.isFinite(Number(v.rwSeconds)) && Number(v.rwSeconds) > 0 ? Number(v.rwSeconds) : DEFAULTS.rwSeconds;
}
if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
  chrome.storage.sync.get({ lang: DEFAULTS.lang, likeConfirm: DEFAULTS.likeConfirm, theme: DEFAULTS.theme, soundUi: DEFAULTS.soundUi, soundScheme: DEFAULTS.soundScheme, soundVolume: DEFAULTS.soundVolume, tilt: DEFAULTS.tilt, swapAnim: DEFAULTS.swapAnim, hoverRing: DEFAULTS.hoverRing, progressStyle: DEFAULTS.progressStyle, volumeStyle: DEFAULTS.volumeStyle, progressColor: DEFAULTS.progressColor, volumeColor: DEFAULTS.volumeColor, lastVol: 50, nextKey: DEFAULTS.nextKey, prevKey: DEFAULTS.prevKey, ffKey: DEFAULTS.ffKey, rwKey: DEFAULTS.rwKey, likeKey: DEFAULTS.likeKey, ffSeconds: DEFAULTS.ffSeconds, rwSeconds: DEFAULTS.rwSeconds, keyOff: DEFAULTS.keyOff }, (v) => {
    applyHotkeyCfg(v);
    lang = v.lang || DEFAULTS.lang;
    lastVol = Number.isFinite(Number(v.lastVol)) ? Number(v.lastVol) : 50;
    likeConfirm = v.likeConfirm !== false;
    soundUi = v.soundUi !== false;
    soundScheme = v.soundScheme || DEFAULTS.soundScheme;
    soundVolume = v.soundVolume;
    swapAnim = v.swapAnim !== false;
    applyHoverRing(v.hoverRing);
    applyTilt(v.tilt);
    applyTheme(v.theme);
    const ps = v.progressStyle === 'wave' ? 'wave' : 'bar';
    applyProgressStyle(ps);
    applyVolumeStyle(v.volumeStyle);
    applyProgressColor(v.progressColor);
    applyVolumeColor(v.volumeColor);
    window.SCKIT_applyLang(lang);
    poll();
  });
  if (chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener((ch, area) => {
      if (area !== 'sync') return;

      if (ch.theme !== undefined) applyTheme(ch.theme.newValue);
      if (ch.likeConfirm !== undefined) likeConfirm = ch.likeConfirm.newValue !== false;

      if (ch.nextKey !== undefined || ch.prevKey !== undefined || ch.ffKey !== undefined ||
          ch.rwKey !== undefined || ch.likeKey !== undefined || ch.keyOff !== undefined ||
          ch.ffSeconds !== undefined || ch.rwSeconds !== undefined) applyHotkeyCfg({
        nextKey: ch.nextKey ? ch.nextKey.newValue : hotkeys.nextKey,
        prevKey: ch.prevKey ? ch.prevKey.newValue : hotkeys.prevKey,
        ffKey: ch.ffKey ? ch.ffKey.newValue : hotkeys.ffKey,
        rwKey: ch.rwKey ? ch.rwKey.newValue : hotkeys.rwKey,
        likeKey: ch.likeKey ? ch.likeKey.newValue : hotkeys.likeKey,
        keyOff: ch.keyOff ? ch.keyOff.newValue : keyOff,
        ffSeconds: ch.ffSeconds ? ch.ffSeconds.newValue : ffSeconds,
        rwSeconds: ch.rwSeconds ? ch.rwSeconds.newValue : rwSeconds
      });
      if (ch.soundUi !== undefined) soundUi = ch.soundUi.newValue !== false;
      if (ch.soundScheme !== undefined) soundScheme = ch.soundScheme.newValue || 'classic';
      if (ch.soundVolume !== undefined) soundVolume = ch.soundVolume.newValue;
      if (ch.tilt !== undefined) applyTilt(ch.tilt.newValue);
      if (ch.swapAnim !== undefined) swapAnim = ch.swapAnim.newValue !== false;
      if (ch.hoverRing !== undefined) applyHoverRing(ch.hoverRing.newValue);
      if (ch.progressStyle !== undefined) applyProgressStyle(ch.progressStyle.newValue);
      if (ch.volumeStyle !== undefined) applyVolumeStyle(ch.volumeStyle.newValue);
      if (ch.progressColor !== undefined) applyProgressColor(ch.progressColor.newValue);
      if (ch.volumeColor !== undefined) applyVolumeColor(ch.volumeColor.newValue);
      if (ch.lang !== undefined) { lang = ch.lang.newValue || DEFAULTS.lang; window.SCKIT_applyLang(lang); }
    });
  }
}
document.querySelectorAll('button').forEach((b) => {
  b.addEventListener('click', () => {
    b.classList.remove('fx');
    void b.offsetWidth;
    b.classList.add('fx');
  });
});
function fmt(s) {
  s = Math.max(0, Math.round(s || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60), r = s % 60;
  return h > 0
    ? h + ':' + String(m).padStart(2, '0') + ':' + String(r).padStart(2, '0')
    : m + ':' + String(r).padStart(2, '0');
}
function setFill(el) {
  const min = Number(el.min) || 0, max = Number(el.max) || 100;
  const pct = ((Number(el.value) - min) / (max - min)) * 100;
  el.style.setProperty('--fill', pct + '%');
}
function findTab(cb) {
  if (typeof chrome === 'undefined' || !chrome.tabs) { cb(null); return; }
  chrome.tabs.query({ url: ['https://soundcloud.com/*', 'https://*.soundcloud.com/*'] }, (tabs) => {
    void chrome.runtime.lastError;
    if (!tabs || !tabs.length) { cb(null); return; }

    const audible = tabs.find((t) => t.audible);
    const active = tabs.find((t) => t.active);
    cb(audible || active || tabs[0]);
  });
}
function send(msg, cb) {
  if (tabId == null) { cb(null); return; }
  chrome.tabs.sendMessage(tabId, msg, (r) => {
    const failed = !!chrome.runtime.lastError;
    void chrome.runtime.lastError;
    if (failed) {
      ui.staleTip.textContent = window.SCKIT_t(lang, 'stale_tip');
      document.body.classList.add('stale');
    } else {
      document.body.classList.remove('stale');
    }
    cb(r || null);
  });
}
function render(st) {
  if (!st || !st.ok) {
    if (swapWait) finishSwap(swapWait.dir);
    else if (pendingSwap) { const d = pendingSwap; pendingSwap = 0; finishSwap(d); }
    return;
  }
  const FREEZE_MS = 1800;
  if ((st.title || '') !== (lastTitle || '') || (st.artist || '') !== (lastArtist || '')) {
    lastAdvanceAt = 0;
    frozenAt = 0;
    lastCur = st.cur;
  }
  if (st.playing && st.dur > 0) {
    if (!seeking) {
      const diff = st.cur - lastCur;
      if (diff > 0.001) {
        lastCur = st.cur;
        frozenAt = 0;
        lastAdvanceAt = Date.now();
      } else if (Math.abs(diff) >= 0.5 && lastCur >= 0) {
        lastCur = st.cur;
        frozenAt = 0;
      } else {
        if (lastCur < 0 || st.cur >= st.dur - 0.5) {
          frozenAt = 0;
        } else if (!frozenAt) {
          frozenAt = Date.now();
        }
      }
      if (lastCur < 0) lastCur = st.cur;
    }
  } else {
    frozenAt = 0;
    lastAdvanceAt = 0;
    lastCur = st.cur;
  }
  const stalled = !!frozenAt && (Date.now() - frozenAt) >= FREEZE_MS;
  const recentlyAdvanced = !!lastAdvanceAt && (Date.now() - lastAdvanceAt) < FREEZE_MS;
  const nextBuf = st.playing && !seeking && ((!!st.buffering && !recentlyAdvanced) || stalled);
  buffering = nextBuf;
  if (buffering) ui.btnToggle.classList.add('buffering');
  else ui.btnToggle.classList.remove('buffering');
  ui.icoPlay.style.display = st.playing ? 'none' : '';
  ui.icoPause.style.display = st.playing && !buffering ? '' : 'none';
  ui.icoSpin.style.display = st.playing && buffering ? '' : 'none';
  ui.btnToggle.classList.toggle('playing', !!st.playing);
  document.body.classList.toggle('paused', !st.playing);
  if (swapWait) {
    const identityChanged = (st.title || '') !== (swapWait.title || '') || (st.artist || '') !== (swapWait.artist || '');
    if (identityChanged || Date.now() > swapWait.deadline) finishSwap(swapWait.dir);
  }
  if (pendingSwap) {
    const d = pendingSwap;
    pendingSwap = 0;
    const now = document.querySelector('.now');
    now.classList.remove('swapOutL', 'swapOutR');
    void now.offsetWidth;
    now.classList.add(d > 0 ? 'swapOutL' : 'swapOutR');
    swapWait = { title: lastTitle, artist: lastArtist, dir: d, deadline: Date.now() + 1500 };
    lastTitle = null;
    lastArtist = null;
  }
  ui.artist.textContent = st.artist || '';
  ui.artist.style.display = st.artist ? '' : 'none';
  if (st.art) applyArt(st.art);
  else clearArt();
  ui.tcur.textContent = fmt(st.cur);
  ui.tdur.textContent = fmt(st.dur);
  ui.tdur.dataset.dur = String(st.dur || 0);

  if (seekLock && st.dur > 0 && Math.abs(st.cur / st.dur - seekLock) <= 0.02) { seeking = false; seekLock = 0; }
  if (progressStyle === 'wave') {
    buildWave((st.title || '') + '|' + (st.artist || ''));
    if (!seeking) updateWave(st.dur > 0 ? st.cur / st.dur : 0);
  } else {
    if (!seeking && st.dur > 0) ui.seek.value = Math.round((st.cur / st.dur) * 1000);
    setFill(ui.seek);
  }
  ui.btnShuffle.classList.toggle('on', !!st.shuffle);
  ui.btnRepeat.classList.toggle('on', st.repeat === 'all' || st.repeat === 'one');
  ui.btnRepeat.classList.toggle('rone', st.repeat === 'one');
  ui.btnLike.classList.toggle('on', !!st.liked);
  curLiked = !!st.liked;
  if (st.vol != null) {
    if (!st.muted && st.vol > 0 && st.vol !== lastVol) {
      lastVol = st.vol;
      if (chrome.storage && chrome.storage.sync) {
        clearTimeout(lastVolTimer);
        lastVolTimer = setTimeout(() => {
          chrome.storage.sync.set({ lastVol: lastVol });
        }, 800);
      }
    }
    const reported = st.muted ? 0 : st.vol;
    if (volLock != null) {
      const confirmed = volLock.expectMuted != null && st.muted === volLock.expectMuted;
      if (confirmed || Math.abs(reported - volLock.v) <= 2 || Date.now() > volLock.until) volLock = null;
    }
    const shownVol = volLock ? volLock.v : reported;
    if (!volDrag) {
      const shown = snapVol(shownVol);
      ui.vol.value = shown;
      if (volumeStyle === 'white') {
        volWhiteApply(shown);
      } else {
        ui.volPct.textContent = shown + '%';
        setFill(ui.vol);
      }
    }
  }
  $('volWave').style.opacity = (st.muted || st.vol === 0) ? '0' : '1';
  ui.btnMute.classList.toggle('muted', !!st.muted);
  applyTitleLayout(st.title);
  lastTitle = st.title;
  lastArtist = st.artist;
}
function finishSwap(dir) {
  if (!swapWait) return;
  swapWait = null;
  const now = document.querySelector('.now');
  if (!now) return;
  now.classList.remove('swapOutL', 'swapOutR', 'swapInL', 'swapInR');
  void now.offsetWidth;
  now.classList.add(dir > 0 ? 'swapInL' : 'swapInR');
}
function lockVol(v, expectMuted) {
  volLock = { v: Math.round(v), until: Date.now() + 1800, expectMuted: expectMuted };
}
function artKey(u) { return u.replace(/[?#].*$/, ''); }
function applyArt(url) {
  if (!url) return;
  const k = artKey(url);
  if (k === artKey(curArtUrl) || k === artKey(pendingArt)) return;
  pendingArt = url;
  const img = new Image();
  img.onload = () => {
    if (pendingArt !== url) return;
    pendingArt = '';
    curArtUrl = url;
    ui.art.style.backgroundImage = 'url("' + url.replace(/"/g, '\\"') + '")';
    ui.art.classList.remove('art-in');
    void ui.art.offsetWidth;
    ui.art.classList.add('art-in');
  };
  img.onerror = () => {
    if (pendingArt === url) {
      pendingArt = '';
      curArtUrl = url;
    }
  };
  img.src = url;
}
function clearArt() {
  if (!curArtUrl && !pendingArt) return;
  pendingArt = '';
  curArtUrl = '';
  ui.art.style.backgroundImage = '';
  ui.art.classList.remove('art-in');
}
function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function buildWave(key) {
  if (key === waveKey && waveSpans.length) return;
  waveKey = key;
  const rnd = mulberry32(hashStr(key));
  let html = '';
  for (let i = 0; i < WAVE_N; i++) {
    const env = Math.min(1, (i + 3) / 10, (WAVE_N - i) / 6);
    const h = Math.max(8, Math.round((22 + rnd() * 78) * env));
    html += '<span style="height:' + h + '%"></span>';
  }
  ui.wave.innerHTML = html + '<i class="wcur"></i>';
  waveSpans = ui.wave.querySelectorAll('span');
  waveCur = ui.wave.querySelector('.wcur');
}
function updateWave(frac) {
  if (!waveSpans.length) return;
  const p = Math.max(0, Math.min(1, frac || 0));
  const nOn = Math.round(p * WAVE_N);
  for (let i = 0; i < waveSpans.length; i++) waveSpans[i].classList.toggle('on', i < nOn);
  if (waveCur) waveCur.style.left = (p * 100) + '%';
}
function applyProgressStyle(v) {
  progressStyle = v === 'wave' ? 'wave' : 'bar';
  ui.seek.style.display = progressStyle === 'wave' ? 'none' : '';
  ui.wave.style.display = progressStyle === 'wave' ? '' : 'none';
}
function waveFrac(e) {
  const r = ui.wave.getBoundingClientRect();
  return Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
}
function wavePreview(frac) {
  updateWave(frac);
  const dur = parseFloat(ui.tdur.dataset.dur || '0');
  if (dur > 0) ui.tcur.textContent = fmt(frac * dur);
}
ui.wave.addEventListener('pointerdown', (e) => {
  waveDrag = true;
  seeking = true;
  try { ui.wave.setPointerCapture(e.pointerId); } catch (err) {  }
  wavePreview(waveFrac(e));
});
ui.wave.addEventListener('pointermove', (e) => { if (waveDrag) wavePreview(waveFrac(e)); });
ui.wave.addEventListener('pointerup', (e) => {
  if (!waveDrag) return;
  waveDrag = false;
  commitSeek(waveFrac(e));
});
ui.wave.addEventListener('pointercancel', () => {
  if (!waveDrag) return;
  waveDrag = false;
  setTimeout(() => { seeking = false; }, 0);
});
function applyVolumeStyle(v) {
  volumeStyle = v === 'white' ? 'white' : 'slider';
  ui.vol.style.display = volumeStyle === 'white' ? 'none' : '';
  ui.volWhite.style.display = volumeStyle === 'white' ? '' : 'none';
}
function applyProgressColor(v) {
  document.body.classList.toggle('pwhite', v === 'white');
}
function applyVolumeColor(v) {
  document.body.classList.toggle('vwhite', v === 'white');
}
function volWhiteApply(v) {
  ui.volWFill.style.width = Math.max(0, Math.min(100, v)) + '%';
  ui.volPct.textContent = Math.round(v) + '%';
}
function volFrac(e) {

  const r = ui.volWhite.getBoundingClientRect();
  const padL = ui.volWhite.clientLeft || 0;
  const w = ui.volWhite.clientWidth || r.width;
  return Math.max(0, Math.min(1, (e.clientX - r.left - padL) / w));
}
function snapVol(raw) {
  return Math.round(raw / 5) * 5;
}
ui.volWhite.addEventListener('pointerdown', (e) => {
  volDrag = true;
  try { ui.volWhite.setPointerCapture(e.pointerId); } catch (err) {  }
  volWhiteApply(snapVol(volFrac(e) * 100));
});
ui.volWhite.addEventListener('pointermove', (e) => { if (volDrag) volWhiteApply(snapVol(volFrac(e) * 100)); });
ui.volWhite.addEventListener('pointerup', (e) => {
  if (!volDrag) return;
  volDrag = false;
  const v = snapVol(volFrac(e) * 100);
  lockVol(v);
  cmd('volume', { value: v / 100 });
});
ui.volWhite.addEventListener('pointercancel', () => { volDrag = false; });
function applyTitleLayout(titleText) {
  ui.title.title = titleText || '';
  ui.artist.title = ui.artist.textContent || '';
  const k = titleText || '';
  if (k === titleKey) return;
  titleKey = k;
  const span = ui.title.querySelector('.tscroll') || ui.title.appendChild(document.createElement('span'));
  span.className = 'tscroll';
  span.id = 'tscroll';
  span.textContent = k || '—';
  span.removeAttribute('data-dup');

  const view = ui.title.clientWidth;
  if (span.scrollWidth > view + 1) {
    ui.title.classList.add('scroll');
    span.classList.add('scroll');
    span.setAttribute('data-dup', k);
    const scrollSec = Math.min(36, Math.max(6, span.scrollWidth / 35));
    const total = scrollSec + 5;
    updateMarqueeKeyframes(Math.round(5 / total * 100));
    span.style.animation = 'none';
    void span.offsetWidth;
    span.style.animation = '';
    span.style.animationDuration = total + 's';
  } else {
    ui.title.classList.remove('scroll');
    span.classList.remove('scroll');
    span.style.animationDuration = '';
  }
}
function updateMarqueeKeyframes(holdPct) {
  let st = document.getElementById('sckit-marquee-style');
  if (!st) {
    st = document.createElement('style');
    st.id = 'sckit-marquee-style';
    document.head.appendChild(st);
  }
  st.textContent = '@keyframes sck-marquee{0%,' + holdPct + '%{transform:translateX(0)}100%{transform:translateX(-50%)}}';
}
function poll() {
  findTab((tab) => {
    if (!tab) {
      tabId = null;
      document.body.classList.remove('stale');
      document.body.classList.add('nofound');
      return;
    }
    tabId = tab.id;
    document.body.classList.remove('nofound');
    send({ type: 'sckit', action: 'getState' }, render);
  });
}
function cmd(action, extra) {
  send(Object.assign({ type: 'sckit', action: 'cmd', cmd: action }, extra || {}), render);
}
function cancelSwapWait() {
  if (!swapWait) return;
  swapWait = null;
  const now = document.querySelector('.now');
  if (now) now.classList.remove('swapOutL', 'swapOutR', 'swapInL', 'swapInR');
}
function startSwap(dir) {
  if (!swapAnim) return;
  pendingSwap = dir;
  if (swapWait) cancelSwapWait();
  const now = document.querySelector('.now');
  now.classList.remove('swapOutL', 'swapOutR', 'swapInL', 'swapInR');
  void now.offsetWidth;
  now.classList.add(dir > 0 ? 'swapOutL' : 'swapOutR');
}
ui.btnNext.addEventListener('click', () => { startSwap(1); uiPlay('next'); cmd('next'); });
ui.btnPrev.addEventListener('click', () => { startSwap(-1); uiPlay('prev'); cmd('prev'); });
function togglePlay() {
  const willPlay = ui.icoPlay.style.display !== 'none';
  uiPlay(willPlay ? 'play' : 'pause');
  cmd('toggle');
}
ui.btnToggle.addEventListener('click', togglePlay);
function popupKeyChar(e) {
  const k = (e.key || '').toLowerCase();
  if (/^[a-z]$/.test(k)) return k;
  const m = /^Key([A-Z])$/.exec(e.code || '');
  return m ? m[1].toLowerCase() : null;
}
function doLike() {
  if (curLiked && likeConfirm) ui.likeConfirm.classList.add('show');
  else { uiPlay(curLiked ? 'unlike' : 'like'); cmd('like'); }
}
document.addEventListener('keydown', (e) => {
  if (e.repeat) return;
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const ae = document.activeElement;
  if (ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.isContentEditable)) return;
  if (ui.likeConfirm.classList.contains('show')) {
    if (e.key === 'Enter') { e.preventDefault(); hideLikeConfirm(); uiPlay('unlike'); cmd('like'); }
    else if (e.key === 'Escape') { e.preventDefault(); hideLikeConfirm(); }
    return;
  }
  const off = (a) => !!(keyOff && keyOff[a]);
  const c = popupKeyChar(e);
  if (!c) {
    if (e.code === 'Space' || e.key === ' ') { e.preventDefault(); togglePlay(); }
    return;
  }
  if (c === hotkeys.nextKey && !off('next')) {
    e.preventDefault(); startSwap(1); uiPlay('next'); cmd('next');
  } else if (c === hotkeys.prevKey && !off('prev')) {
    e.preventDefault(); startSwap(-1); uiPlay('prev'); cmd('prev');
  } else if (c === hotkeys.ffKey && !off('ff')) {
    e.preventDefault(); uiPlay('ff'); cmd('seekBy', { delta: ffSeconds });
  } else if (c === hotkeys.rwKey && !off('rw')) {
    e.preventDefault(); uiPlay('rw'); cmd('seekBy', { delta: -rwSeconds });
  } else if (c === hotkeys.likeKey && !off('like')) {
    e.preventDefault(); doLike();
  }
});
ui.btnMute.addEventListener('click', () => {
  const toMute = !ui.btnMute.classList.contains('muted');
  lockVol(toMute ? 0 : lastVol, toMute);
  uiPlay(toMute ? 'mute' : 'unmute');
  cmd('mute');
});
ui.btnShuffle.addEventListener('click', () => {
  uiPlay(ui.btnShuffle.classList.contains('on') ? 'shuffleOff' : 'shuffle');
  cmd('shuffle');
});
ui.btnRepeat.addEventListener('click', () => {
  uiPlay(ui.btnRepeat.classList.contains('on') ? 'repeatOff' : 'repeat');
  cmd('repeat');
});
function hideLikeConfirm() { ui.likeConfirm.classList.remove('show'); }
ui.btnLike.addEventListener('click', doLike);
ui.lcCancel.addEventListener('click', hideLikeConfirm);
ui.lcOk.addEventListener('click', () => { hideLikeConfirm(); uiPlay('unlike'); cmd('like'); });
document.addEventListener('click', (e) => {
  if (!e.target.closest('#likeConfirm') && !e.target.closest('#btnLike')) hideLikeConfirm();
});
ui.btnTheme.addEventListener('click', () => {
  const next = theme === 'light' ? 'dark' : 'light';
  applyTheme(next);
  chrome.storage.sync.set({ theme: next });
});
ui.seek.addEventListener('input', () => {
  seeking = true;
  setFill(ui.seek);
  const dur = parseFloat(ui.tdur.dataset.dur || '0');
  if (dur > 0) ui.tcur.textContent = fmt((ui.seek.value / 1000) * dur);
});
function commitSeek(frac) {
  seekLock = Math.max(0, Math.min(1, frac));
  cmd('seek', { fraction: seekLock });
  setTimeout(() => { seeking = false; seekLock = 0; }, 1500);
}
function endSeekDrag() {
  if (!seeking || seekCommitted) return;
  seekCommitted = true;
  commitSeek(ui.seek.value / 1000);
  setTimeout(() => { seekCommitted = false; }, 0);
}
ui.seek.addEventListener('change', endSeekDrag);
ui.seek.addEventListener('pointerup', endSeekDrag);
ui.seek.addEventListener('blur', () => {
  if (seeking && !seekCommitted) endSeekDrag();
  else if (seeking) setTimeout(() => { seeking = false; }, 0);
});
ui.vol.addEventListener('input', () => {
  volDrag = true;
  setFill(ui.vol);
  ui.volPct.textContent = ui.vol.value + '%';
});
function endVolDrag(commit) {
  if (!volDrag) return;
  volDrag = false;
  if (commit) {
    lockVol(Number(ui.vol.value));
    cmd('volume', { value: ui.vol.value / 100 });
  }
}
ui.vol.addEventListener('change', () => endVolDrag(true));
ui.vol.addEventListener('pointerup', () => endVolDrag(true));
ui.vol.addEventListener('blur', () => endVolDrag(true));
ui.vol.addEventListener('pointercancel', () => { volDrag = false; });
ui.openOpts.addEventListener('click', () => {
  if (chrome.runtime && chrome.runtime.openOptionsPage) chrome.runtime.openOptionsPage();
});
ui.openSc.addEventListener('click', () => {
  chrome.tabs.create({ url: 'https://soundcloud.com/' }, () => { void chrome.runtime.lastError; });
  poll();
});
setInterval(poll, 600);
