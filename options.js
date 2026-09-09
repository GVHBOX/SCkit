const DEFAULTS = window.SCKIT_DEFAULTS;
const ids = ['nextKey', 'prevKey', 'ffKey', 'rwKey', 'likeKey', 'ffSeconds', 'rwSeconds'];
const ACTS = ['next', 'prev', 'ff', 'rw', 'like'];
const PREV = window.SCKIT_SOUND.BASE;
let lang = DEFAULTS.lang || 'zh';
const t = (k, v) => (window.SCKIT_t ? window.SCKIT_t(lang, k, v) : k);
const els = {};
ids.concat(['soundKeys', 'soundUi', 'toastKey', 'toastIcon', 'toastText', 'toastSize', 'soundVolume', 'soundScheme', 'toastPos', 'lang', 'likeConfirm', 'tilt', 'swapAnim', 'btnFx', 'hoverRing', 'progressStyle', 'volumeStyle', 'progressWhite', 'progressOrange', 'volumeWhite', 'volumeOrange']).forEach((id) => { els[id] = document.getElementById(id); });
const volVal = document.getElementById('volVal');
const customBox = document.getElementById('customBox');
const stage = document.getElementById('stage');
const saveBtn = document.getElementById('save');
const resetBtn = document.getElementById('reset');
const tiltVal = document.getElementById('tiltVal');
const themeBtn = document.getElementById('btnTheme');
function applyTheme(v) {
  const light = v === 'light';
  document.body.classList.toggle('light', light);
  themeBtn.textContent = light ? '🌙' : '☀️';
}
themeBtn.addEventListener('click', () => {
  const next = document.body.classList.contains('light') ? 'dark' : 'light';
  applyTheme(next);
  chrome.storage.sync.set({ theme: next });
});
chrome.storage.onChanged.addListener((ch, area) => {
  if (area === 'sync' && ch.theme) applyTheme(ch.theme.newValue);
});
function applyLang(l) {
  lang = l;
  window.SCKIT_applyLang(lang);
  ACTS.forEach(applyOff);
  GLOBAL_CMDS.forEach(applyOff);
}
const keyOffState = {};
const cmdOffState = {};
const offBtns = {};
ACTS.forEach((a) => { offBtns[a] = document.getElementById('off_' + a); });
const GLOBAL_CMDS = ['sc-toggle', 'sc-next', 'sc-prev'];
GLOBAL_CMDS.forEach((c) => { offBtns[c] = document.getElementById('off_' + c); });
function applyOff(a) {
  const off = GLOBAL_CMDS.indexOf(a) >= 0 ? cmdOffState : keyOffState;
  const isOff = !!off[a];
  offBtns[a].classList.toggle('off', isOff);
  const row = offBtns[a].closest('.row');
  if (row) row.classList.toggle('off', isOff);
  offBtns[a].title = t(isOff ? 'kx_on' : 'kx_off');
}
ACTS.forEach((a) => {
  offBtns[a].addEventListener('click', () => {
    keyOffState[a] = !keyOffState[a];
    applyOff(a);
  });
});
GLOBAL_CMDS.forEach((c) => {
  offBtns[c].addEventListener('click', () => {
    cmdOffState[c] = !cmdOffState[c];
    applyOff(c);
  });
});
document.querySelectorAll('button').forEach((b) => {
  b.addEventListener('click', () => {
    b.classList.remove('fx');
    void b.offsetWidth;
    b.classList.add('fx');
  });
});
function refreshVolLabel() {
  volVal.textContent = els.soundVolume.value + '%';
  els.soundVolume.style.setProperty('--fill', els.soundVolume.value + '%');
}
els.soundVolume.addEventListener('input', refreshVolLabel);
function applyTiltCss(n) {
  document.documentElement.style.setProperty('--tiltn', String(n));
}
function refreshTilt() {
  tiltVal.textContent = els.tilt.value + '°';
  els.tilt.style.setProperty('--fill', (els.tilt.value / 45) * 100 + '%');
  applyTiltCss(els.tilt.value);
}
els.tilt.addEventListener('input', refreshTilt);
const toastSizeVal = document.getElementById('toastSizeVal');
function applyToastSize(v) {
  const n = Math.max(0.5, Math.min(3, Number(v) || 1.5));
  document.documentElement.style.setProperty('--sckit-s', String(n));
  if (toastSizeVal) toastSizeVal.textContent = Math.round(n * 100) + '%';
  if (els.toastSize) els.toastSize.style.setProperty('--fill', ((n - 0.5) / 2.5) * 100 + '%');
}
if (els.toastSize) els.toastSize.addEventListener('input', () => applyToastSize(els.toastSize.value));
function applyToastPreview() {
  document.querySelector('#toastDemo .sckit-key').style.display = els.toastKey.checked ? '' : 'none';
  document.querySelector('#toastDemo .sckit-icon').style.display = els.toastIcon.checked ? '' : 'none';
  document.querySelector('#toastDemo .sckit-txt').style.display = els.toastText.checked ? '' : 'none';
}
const pvProg = document.getElementById('pvProg');
const pvVol = document.getElementById('pvVol');
function applyStylePreview() {
  const ps = els.progressStyle.value === 'wave' ? 'wave' : 'bar';
  const vs = els.volumeStyle.value === 'white' ? 'white' : 'slider';
  const pc = els.progressWhite.classList.contains('sel') ? 'white' : 'orange';
  const vc = els.volumeWhite.classList.contains('sel') ? 'white' : 'orange';
  if (ps === 'wave') {
    let html = '<div class="pv-wave' + (pc === 'white' ? ' white' : '') + '">';
    for (let i = 0; i < 36; i++) {
      const env = Math.min(1, (i + 2) / 6, (36 - i) / 4);
      const h = Math.max(12, Math.round((25 + ((i * 37) % 70)) * env));
      html += '<span class="' + (i < 15 ? 'on' : '') + '" style="height:' + h + '%"></span>';
    }
    pvProg.innerHTML = html + '</div>';
  } else {
    pvProg.innerHTML = '<div class="pv-slider' + (pc === 'white' ? ' white' : '') + '"><i></i><b></b></div>';
  }
  if (vs === 'white') {
    pvVol.innerHTML = '<div class="pv-slider pv-white' + (vc === 'white' ? ' white' : '') + '"><i style="width:65%"></i></div>';
  } else {
    pvVol.innerHTML = '<div class="pv-slider' + (vc === 'white' ? ' white' : '') + '"><i style="width:65%"></i><b style="left:65%"></b></div>';
  }
}
function applySwCol(pre, val) {
  els[pre + 'White'].classList.toggle('sel', val === 'white');
  els[pre + 'Orange'].classList.toggle('sel', val !== 'white');
}
els.progressWhite.addEventListener('click', () => { applySwCol('progress', 'white'); applyStylePreview(); });
els.progressOrange.addEventListener('click', () => { applySwCol('progress', 'orange'); applyStylePreview(); });
els.volumeWhite.addEventListener('click', () => { applySwCol('volume', 'white'); applyStylePreview(); });
els.volumeOrange.addEventListener('click', () => { applySwCol('volume', 'orange'); applyStylePreview(); });
els.progressStyle.addEventListener('change', applyStylePreview);
els.volumeStyle.addEventListener('change', applyStylePreview);
els.toastKey.addEventListener('change', applyToastPreview);
els.toastIcon.addEventListener('change', applyToastPreview);
els.toastText.addEventListener('change', applyToastPreview);
function applyPos(p) {
  stage.classList.remove('posL', 'posC', 'posR');
  stage.classList.add(p === 'left' ? 'posL' : p === 'center' ? 'posC' : 'posR');
}
els.toastPos.addEventListener('change', () => applyPos(els.toastPos.value));
els.lang.addEventListener('change', () => {
  applyLang(els.lang.value);
  chrome.storage.sync.set({ lang: els.lang.value });
});
function toggleCustom() { customBox.style.display = els.soundScheme.value === 'custom' ? '' : 'none'; }
els.soundScheme.addEventListener('change', toggleCustom);

function preview(kind) {
  const f = parseInt(document.getElementById('cf_' + kind).value, 10);
  const w = document.getElementById('cw_' + kind).value;
  window.SCKIT_SOUND.play(kind, {
    volume: els.soundVolume.value,
    scheme: els.soundScheme.value,
    custom: { [kind]: { f: Number.isFinite(f) && f > 0 ? f : PREV[kind][0], w: w || 'sine' } }
  });
}
ACTS.forEach((a) => {
  document.getElementById('pv_' + a).addEventListener('click', () => preview(a));
});
document.getElementById('audition').addEventListener('click', () => preview('like'));

function fmtShortcut(s) {
  if (!s) return '—';
  return String(s)
    .replace(/Command/g, 'Ctrl')
    .replace(/MacCtrl/g, 'Ctrl')
    .split('+')
    .map((p) => (p.length === 1 ? p.toUpperCase() : p))
    .join(' + ');
}
function loadGlobalCmds() {
  if (!(typeof chrome !== 'undefined' && chrome.commands && chrome.commands.getAll)) return;
  chrome.commands.getAll((cmds) => {
    void chrome.runtime.lastError;
    (cmds || []).forEach((c) => {
      const el = document.getElementById('g_' + c.name);
      if (el) el.textContent = fmtShortcut(c.shortcut) || '—';
    });
  });
}
document.getElementById('openShortcuts').addEventListener('click', () => {
  chrome.tabs.create({ url: 'chrome://extensions/shortcuts' }, () => { void chrome.runtime.lastError; });
});

function fillForm(v, cs, ko) {
  ids.forEach((id) => { els[id].value = v[id] != null ? v[id] : DEFAULTS[id]; });

  els.soundKeys.checked = v.soundKeys !== undefined ? !!v.soundKeys : !(v.soundOn === false);
  els.soundUi.checked = v.soundUi !== undefined ? !!v.soundUi : true;
  els.toastKey.checked = !!v.toastKey;
  if (v.toastIcon === undefined && v.toastText === undefined && v.toastOn === false) {
    els.toastIcon.checked = false;
    els.toastText.checked = false;
  } else {
    els.toastIcon.checked = !!v.toastIcon;
    els.toastText.checked = !!v.toastText;
  }
  els.soundVolume.value = v.soundVolume != null ? v.soundVolume : DEFAULTS.soundVolume;
  els.soundScheme.value = v.soundScheme || DEFAULTS.soundScheme;
  els.toastPos.value = v.toastPos || DEFAULTS.toastPos;
  if (els.toastSize) {
    els.toastSize.value = Number.isFinite(Number(v.toastSize)) ? Number(v.toastSize) : DEFAULTS.toastSize;
    applyToastSize(els.toastSize.value);
  }
  els.lang.value = v.lang || DEFAULTS.lang;
  els.likeConfirm.checked = v.likeConfirm !== false;
  const cmdOff = v.cmdOff && typeof v.cmdOff === 'object' ? v.cmdOff : {};
  GLOBAL_CMDS.forEach((c) => { cmdOffState[c] = cmdOff[c] === true; applyOff(c); });
  els.tilt.value = v.tilt != null ? v.tilt : DEFAULTS.tilt;
  els.swapAnim.checked = v.swapAnim !== false;
  els.btnFx.checked = v.btnFx !== false;
  els.hoverRing.checked = v.hoverRing === true;
  els.progressStyle.value = v.progressStyle === 'bar' ? 'bar' : DEFAULTS.progressStyle;
  els.volumeStyle.value = v.volumeStyle === 'white' ? 'white' : 'slider';
  applySwCol('progress', v.progressColor === 'white' ? 'white' : 'orange');
  applySwCol('volume', v.volumeColor === 'white' ? 'white' : 'orange');
  ACTS.forEach((a) => {
    document.getElementById('cf_' + a).value = (cs[a] && cs[a].f) || PREV[a][0];
    document.getElementById('cw_' + a).value = (cs[a] && cs[a].w) || 'sine';
    keyOffState[a] = !!(ko && ko[a]);
    applyOff(a);
    els[a + 'Key'].classList.remove('dup');
  });
  refreshVolLabel();
  refreshTilt();
  applyToastPreview();
  applyStylePreview();
  toggleCustom();
  applyPos(els.toastPos.value);
  loadGlobalCmds();
}
chrome.storage.sync.get(null, (v) => {
  fillForm(v, v.customSounds || {}, Object.assign({}, DEFAULTS.keyOff, v.keyOff));
  applyTheme(v.theme);
  applyLang(els.lang.value);
});
document.getElementById('save').addEventListener('click', () => {
  const data = {};
  ids.forEach((id) => {
    let val = els[id].value;
    if (id.endsWith('Seconds')) {

      const n = parseInt(val, 10);
      val = Number.isFinite(n) && n >= 1 ? n : DEFAULTS[id];
    } else {
      val = (val || '').toLowerCase().charAt(0) || DEFAULTS[id];
    }
    data[id] = val;
  });

  ACTS.forEach((a) => els[a + 'Key'].classList.remove('dup'));
  const owners = {};
  let dup = null;
  ACTS.forEach((a) => {
    if (keyOffState[a]) return;
    const k = data[a + 'Key'];
    if (owners[k] != null) { dup = k; els[a + 'Key'].classList.add('dup'); }
    else owners[k] = a;
  });
  if (dup) {
    alert(t('dup_key', { k: dup.toUpperCase() }));
    return;
  }
  data.soundKeys = els.soundKeys.checked;
  data.soundUi = els.soundUi.checked;
  data.toastKey = els.toastKey.checked;
  data.toastIcon = els.toastIcon.checked;
  data.toastText = els.toastText.checked;

  const volNum = parseInt(els.soundVolume.value, 10);
  data.soundVolume = Math.max(0, Math.min(100, Number.isFinite(volNum) ? volNum : DEFAULTS.soundVolume));
  data.soundScheme = els.soundScheme.value;
  data.toastPos = els.toastPos.value;
  data.toastSize = Number(els.toastSize.value);
  data.lang = els.lang.value;
  data.likeConfirm = els.likeConfirm.checked;
  const tiltNum = parseInt(els.tilt.value, 10);
  data.tilt = Math.max(0, Math.min(45, Number.isFinite(tiltNum) ? tiltNum : DEFAULTS.tilt));
  data.swapAnim = els.swapAnim.checked;
  data.btnFx = els.btnFx.checked;
  data.hoverRing = els.hoverRing.checked;
  data.progressStyle = els.progressStyle.value === 'wave' ? 'wave' : 'bar';
  data.volumeStyle = els.volumeStyle.value === 'white' ? 'white' : 'slider';
  data.progressColor = els.progressWhite.classList.contains('sel') ? 'white' : 'orange';
  data.volumeColor = els.volumeWhite.classList.contains('sel') ? 'white' : 'orange';
  data.keyOff = Object.assign({}, keyOffState);
  data.cmdOff = {};
  GLOBAL_CMDS.forEach((c) => { data.cmdOff[c] = !!cmdOffState[c]; });
  data.customSounds = {};
  ACTS.forEach((a) => {
    const f = parseInt(document.getElementById('cf_' + a).value, 10);
    data.customSounds[a] = {
      f: Number.isFinite(f) && f > 0 ? f : PREV[a][0],
      w: document.getElementById('cw_' + a).value
    };
  });
  chrome.storage.sync.set(data, () => {

    chrome.storage.sync.remove(['soundOn', 'toastOn']);
    saveBtn.textContent = t('save') + ' ✅';
    setTimeout(() => { saveBtn.textContent = t('save'); }, 1000);
  });
});
document.getElementById('reset').addEventListener('click', () => {

  fillForm(DEFAULTS, {}, {});
  applyLang(els.lang.value);
  const resetData = {
    soundKeys: DEFAULTS.soundKeys,
    soundUi: DEFAULTS.soundUi,
    toastKey: DEFAULTS.toastKey,
    toastIcon: DEFAULTS.toastIcon,
    toastText: DEFAULTS.toastText,
    soundVolume: DEFAULTS.soundVolume,
    soundScheme: DEFAULTS.soundScheme,
    toastPos: DEFAULTS.toastPos,
    toastSize: DEFAULTS.toastSize,
    lang: DEFAULTS.lang,
    likeConfirm: DEFAULTS.likeConfirm,
    tilt: DEFAULTS.tilt,
    swapAnim: DEFAULTS.swapAnim,
    btnFx: DEFAULTS.btnFx,
    hoverRing: DEFAULTS.hoverRing,
    progressStyle: DEFAULTS.progressStyle,
    volumeStyle: DEFAULTS.volumeStyle,
    progressColor: DEFAULTS.progressColor,
    volumeColor: DEFAULTS.volumeColor,
    keyOff: {},
    cmdOff: {},
    customSounds: {}
  };
  ACTS.forEach((a) => {
    resetData[a + 'Key'] = DEFAULTS[a + 'Key'];
    resetData[a + 'Seconds'] = DEFAULTS[a + 'Seconds'];
  });
  chrome.storage.sync.set(resetData);
  chrome.storage.sync.remove(['soundOn', 'toastOn']);
  resetBtn.textContent = t('reset') + ' ✅';
  setTimeout(() => { resetBtn.textContent = t('reset'); }, 1000);
});
stage.addEventListener('click', () => {
  stage.classList.remove('play');
  void stage.offsetWidth;
  stage.classList.add('play');
});
