(function () {
  'use strict';
  const DEFAULTS = window.SCKIT_DEFAULTS;

  const SEL = {
    next: ['button.playControls__next', 'button[aria-label="Next"]'],
    prev: ['button.playControls__prev', 'button[aria-label="Previous"]'],
    like: ['.playControls .sc-button-like', '.playControls [aria-label="Like"]', 'button.playControls__like'],
    play: ['.playControls__play'],
    shuffle: ['.playControls__shuffle button', 'button.shuffleControl', 'button[title="Shuffle"]'],
    repeat: ['.playControls__repeat button', 'button.repeatControl', 'button[title="Repeat"]']
  };
  let cfg = Object.assign({}, DEFAULTS);
  let cfgReady = !(chrome && chrome.storage && chrome.storage.sync);
  if (chrome && chrome.storage && chrome.storage.sync) {
    chrome.storage.sync.get(null, (v) => {
      cfg = Object.assign({}, DEFAULTS, v);
      cfg.keyOff = Object.assign({}, DEFAULTS.keyOff, v.keyOff);

      const stale = [];
      if (v.soundKeys === undefined && v.soundOn === false) { cfg.soundKeys = false; stale.push('soundOn'); }
      if (v.toastIcon === undefined && v.toastText === undefined && v.toastOn === false) {
        cfg.toastIcon = false;
        cfg.toastText = false;
        stale.push('toastOn');
      }
      if (stale.length) chrome.storage.sync.remove(stale);
      cfgReady = true;
    });
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'sync') return;
      for (const k in changes) {
        if (k in cfg) cfg[k] = changes[k].newValue;
      }
    });
  }
  function isTyping(el) {
    if (!el) return false;
    const t = el.tagName;
    return t === 'INPUT' || t === 'TEXTAREA' || t === 'SELECT' || !!el.isContentEditable;
  }
  function findBySel(selectors) {
    for (const s of selectors) {
      const b = document.querySelector(s);
      if (b) return b;
    }
    return null;
  }
  function clickBtn(selectors) {
    const b = findBySel(selectors);
    if (b) { b.click(); return true; }
    return false;
  }
  function parseTime(str) {
    const m = String(str || '').match(/-?\d+:\d+(?::\d+)?/g);
    if (!m) return NaN;
    const tok = m[m.length - 1];
    const neg = tok.startsWith('-');
    const parts = tok.replace(/^-/, '').split(':').map(Number);
    if (parts.some(isNaN)) return NaN;
    const v = parts.reduce((acc, n) => acc * 60 + n, 0);
    return neg ? -v : v;
  }
  function clampSecs(n, fb) {
    n = Math.round(Number(n));
    return Number.isFinite(n) && n > 0 ? n : fb;
  }

  let ariaScale = 0;
  function calibrateAria(rawCur, rawDur, txtCur, txtDur) {
    if (ariaScale) return;
    const raw = Number.isFinite(rawCur) ? rawCur : rawDur;

    let ref = NaN;
    if (Number.isFinite(txtCur) && txtCur >= 1) ref = txtCur;
    else if (Number.isFinite(txtDur) && txtDur >= 1) ref = txtDur;
    if (Number.isFinite(raw) && raw > 0 && Number.isFinite(ref)) {
      ariaScale = (raw / ref > 100) ? 1000 : 1;
    }
  }
  function toSec(raw) {
    if (!Number.isFinite(raw)) return NaN;
    return ariaScale ? raw / ariaScale : raw;
  }

  function firstText(a, b) {
    const ea = document.querySelector(a);
    if (ea && String(ea.textContent || '').trim()) return ea;
    return document.querySelector(b);
  }
  function getTimes() {
    const scrubber = document.querySelector('.playbackTimeline__progressWrapper');
    const passed = document.querySelector('.playbackTimeline__timePassed');
    const total = firstText('.playbackTimeline__duration', '.playbackTimeline__timeTotal');
    const txtCur = parseTime(passed && passed.textContent);
    const txtDur = parseTime(total && total.textContent);
    const rawCur = parseInt(scrubber && scrubber.getAttribute('aria-valuenow'), 10);
    const rawDur = parseInt(scrubber && scrubber.getAttribute('aria-valuemax'), 10);
    calibrateAria(rawCur, rawDur, txtCur, txtDur);
    let cur = Number.isFinite(rawCur) ? toSec(rawCur) : txtCur;
    let dur = Number.isFinite(rawDur) ? toSec(rawDur) : txtDur;
    if (Number.isFinite(dur) && dur < 0 && Number.isFinite(cur)) dur = cur - dur;
    if (!Number.isFinite(cur) || !Number.isFinite(dur) || dur <= 0) return null;
    return { cur, dur };
  }
  function clickAtFraction(el, fraction) {
    const rect = el.getBoundingClientRect();
    const x = rect.left + rect.width * Math.min(1, Math.max(0, fraction));
    pressAt(el, x, rect.top + rect.height / 2);
  }
  function seekBy(delta) {
    const scrubber =
      document.querySelector('.playbackTimeline__progressWrapper') ||
      document.querySelector('.playbackTimeline__progressBackground') ||
      document.querySelector('.playbackTimeline');
    const times = getTimes();
    if (!scrubber || !times) {
      const steps = Math.max(1, Math.round(Math.abs(delta) / 10));
      const key = delta > 0 ? 'ArrowRight' : 'ArrowLeft';
      for (let i = 0; i < steps; i++) {

        document.dispatchEvent(new KeyboardEvent('keydown', { key, keyCode: key === 'ArrowRight' ? 39 : 37, which: key === 'ArrowRight' ? 39 : 37, bubbles: true }));
      }
      return;
    }
    const target = Math.min(times.dur, Math.max(0, times.cur + delta));
    clickAtFraction(scrubber, Math.max(0.001, target / times.dur));
  }
  function getState() {
    const pb = document.querySelector('.playControls__play');
    const times = getTimes();
    const volp = findVolume();
    const volRaw = volp ? parseFloat(volp.sw.getAttribute('aria-valuenow')) : NaN;

    const muted = !!(volp && (volp.wrap.classList.contains('muted') ||
                  (Number.isFinite(volRaw) && volRaw <= 0)));
    const tEl = document.querySelector('.playbackSoundBadge__titleLink');
    const title = (tEl && (tEl.getAttribute('title') || tEl.textContent) || '').trim();
    const aEl = document.querySelector('.playbackSoundBadge__lightLink');
    const artist = ((aEl && aEl.textContent || '').trim() || (aEl && aEl.getAttribute('title') || '').trim());
    const av = document.querySelector('.playbackSoundBadge__avatar span');
    let art = null;
    if (av) {
      const bg = av.style.backgroundImage || getComputedStyle(av).backgroundImage || '';
      const m = bg.match(/url\(["']?(.*?)["']?\)/);
      if (m && m[1]) art = m[1].replace(/-t\d+x\d+/, '-t500x500');
    }
    const shufBtn = findBySel(SEL.shuffle);
    const repBtn = findBySel(SEL.repeat);
    const likeBtn = findBySel(SEL.like);
    return {
      ok: true,
      playing: !!(pb && pb.classList.contains('playing')),

      buffering: !!(pb && pb.classList.contains('buffering')),
      title, artist, art,
      cur: times ? times.cur : 0,
      dur: times ? times.dur : 0,
      vol: isNaN(volRaw) ? null : Math.round(volRaw * 100),
      muted: !!muted,
      liked: !!(likeBtn && likeBtn.classList.contains('sc-button-selected')),
      shuffle: !!(shufBtn && shufBtn.classList.contains('m-shuffling')),
      repeat: !repBtn ? 'off' : repBtn.classList.contains('m-one') ? 'one' : repBtn.classList.contains('m-all') ? 'all' : 'off'
    };
  }
  function applyCmd(msg) {
    const a = msg.cmd;
    // 返回本次执行的操作名(供全局键反馈使用);无对应动作返回 null
    if (a === 'next') {
      clickBtn(SEL.next);
      return 'next';
    } else if (a === 'prev') {
      clickBtn(SEL.prev);
      return 'prev';
    } else if (a === 'toggle') {
      const pb = document.querySelector('.playControls__play');
      const wasPlaying = !!(pb && pb.classList.contains('playing'));
      clickBtn(SEL.play);
      return wasPlaying ? 'pause' : 'play';
    } else if (a === 'like') {
      clickBtn(SEL.like);
      return 'like';
    } else if (a === 'mute') {
      const b = findVolumeButton();
      if (b) b.click();
      return 'mute';
    } else if (a === 'shuffle') {
      clickBtn(SEL.shuffle);
      return 'shuffle';
    } else if (a === 'repeat') {
      clickBtn(SEL.repeat);
      return 'repeat';
    } else if (a === 'seek' && typeof msg.fraction === 'number') {
      const sw = document.querySelector('.playbackTimeline__progressWrapper');
      if (sw) clickAtFraction(sw, msg.fraction);
    } else if (a === 'seekBy' && typeof msg.delta === 'number') {
      seekBy(msg.delta);
    } else if (a === 'volume' && typeof msg.value === 'number') {
      setVolume(Math.min(1, Math.max(0, msg.value)));
    }
    return null;
  }

  // 全局快捷键触发时,在 SoundCloud 页面内给出与页面内按键一致的音效+气泡反馈
  function globalFeedback(kind) {
    playSound(kind);
    if (cfg.toastKey || cfg.toastIcon || cfg.toastText) {
      let txt = '';
      if (window.SCKIT_t) txt = window.SCKIT_t(cfg.lang, 't_toast_' + kind, {});
      if (!txt) txt = kind;
      toast(txt, '', TOAST_ICONS[kind] || '', true);
    }
  }

  function pressAt(el, x, y) {
    const base = {
      bubbles: true, cancelable: true,
      clientX: x, clientY: y, pointerId: 1, pointerType: 'mouse', button: 0, buttons: 1
    };
    el.dispatchEvent(new PointerEvent('pointerdown', base));
    el.dispatchEvent(new PointerEvent('pointermove', base));
    el.dispatchEvent(new PointerEvent('pointerup', base));
    el.dispatchEvent(new MouseEvent('mousedown', base));
    el.dispatchEvent(new MouseEvent('mouseup', base));
  }

  let volSeq = 0;
  function volumeContainers() {
    const all = Array.from(document.querySelectorAll('.volume'));
    const inBar = all.filter((wrap) => wrap.closest('.playControls'));
    return inBar.length ? inBar : all;
  }
  function findVolumeHost() {
    const list = volumeContainers();
    for (let i = list.length - 1; i >= 0; i--) {
      const wrap = list[i];
      const vb = wrap.querySelector('.volume__button');
      if (!vb || !wrap.isConnected) continue;
      const vr = vb.getBoundingClientRect();
      if (vr.width > 0 && vr.height > 0) return { wrap, vb };
    }
    return null;
  }
  function findVolume() {
    const host = findVolumeHost();
    if (!host) return null;
    const sw = host.wrap.querySelector('.volume__sliderWrapper[role="slider"], .volume__sliderWrapper');
    if (!sw) return null;
    const value = parseFloat(sw.getAttribute('aria-valuenow'));
    return Number.isFinite(value) ? { wrap: host.wrap, vb: host.vb, sw, value } : null;
  }
  function findVolumeButton() {
    const host = findVolumeHost();
    return host && host.vb;
  }
  function setVolume(target) {
    const seq = ++volSeq;
    const deadline = Date.now() + 5000;
    let previousSlider = null;
    let previousValue = NaN;
    let unchanged = 0;

    (function step() {
      if (seq !== volSeq) return;
      const p = findVolume();
      if (!p) {
        if (Date.now() < deadline) setTimeout(step, 100);
        return;
      }
      if (p.sw !== previousSlider) {
        previousSlider = p.sw;
        previousValue = NaN;
        unchanged = 0;
      }
      const diff = target - p.value;

      if (Math.abs(diff) <= 0.051) return;
      if (Number.isFinite(previousValue) && p.value === previousValue) {
        unchanged++;
        if (unchanged >= 4) {

          if (Date.now() < deadline) setTimeout(step, 180);
          return;
        }
      } else {
        unchanged = 0;
      }
      previousValue = p.value;
      const up = diff > 0;
      const init = {
        key: up ? 'ArrowUp' : 'ArrowDown',
        code: up ? 'ArrowUp' : 'ArrowDown',
        keyCode: up ? 38 : 40,
        which: up ? 38 : 40,
        shiftKey: true,
        bubbles: true,
        cancelable: true
      };
      p.sw.dispatchEvent(new KeyboardEvent('keydown', init));
      p.sw.dispatchEvent(new KeyboardEvent('keyup', init));
      if (Date.now() < deadline) setTimeout(step, 100);
    })();
  }
  const rt = (typeof chrome !== 'undefined') && chrome.runtime;
  if (rt && rt.onMessage) {
    rt.onMessage.addListener((msg, _sender, sendResponse) => {
      try {
        if (!msg || msg.type !== 'sckit') return;
        if (msg.action === 'getState') sendResponse(getState());
        else if (msg.action === 'cmd') {
          const done = applyCmd(msg);
          // 全局快捷键(background 中继而来)触发时,页面内给音效+气泡反馈
          if (msg.global === true && done) globalFeedback(done);
          sendResponse(getState());
        }
      } catch (e) {  }
    });
  }
  function playSound(kind) {
    if (!cfg.soundKeys) return;
    window.SCKIT_SOUND.play(kind, {
      volume: cfg.soundVolume,
      scheme: cfg.soundScheme,
      custom: cfg.customSounds
    });
  }
  // 气泡统一走 toast.js(manifest 已在 content_scripts 注入,自带 --sckit-s 大小缩放),
  // 与 background 注入非 SC 页用的是同一实现,气泡大小设置全局一致生效。
  const TOAST_ICONS = (window.SCKIT_TOAST && window.SCKIT_TOAST.ICONS) ||
    { next: '⏭', prev: '⏮', ff: '⏩', rw: '⏪', like: '❤️', unlike: '💔', unlike_arm: '⚠️', play: '▶️', pause: '⏸️' };

  function toast(msg, key, icon, forceText) {
    if (!window.SCKIT_TOAST) return;
    window.SCKIT_TOAST.show({
      text: msg, key: key, icon: icon, forceText: !!forceText,
      keyOn: !!cfg.toastKey, iconOn: !!cfg.toastIcon, textOn: !!cfg.toastText,
      pos: cfg.toastPos || 'center', size: cfg.toastSize
    });
  }
  let unlikeArmed = false;
  let unlikeTimer = 0;

  function normKey(e, cfgKey) {
    const k = (e.key || '').toLowerCase();
    if (k === cfgKey) return k;
    const m = /^Key([A-Z])$/.exec(e.code || '');
    return (m && m[1].toLowerCase() === cfgKey) ? cfgKey : null;
  }
  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.repeat) return;
    if (isTyping(document.activeElement)) return;
    if (!cfgReady) return;
    const kOff = (a) => !!(cfg.keyOff && cfg.keyOff[a]);
    let snd = '';
    let secs = 0;
    const kn = normKey(e, cfg.nextKey), kp = normKey(e, cfg.prevKey), kff = normKey(e, cfg.ffKey),
          krw = normKey(e, cfg.rwKey), klk = normKey(e, cfg.likeKey);
    if (kn && !kOff('next')) {
      clickBtn(SEL.next);
      snd = 'next';
    } else if (kp && !kOff('prev')) {
      clickBtn(SEL.prev);
      snd = 'prev';
    } else if (kff && !kOff('ff')) {
      secs = clampSecs(cfg.ffSeconds, 10);
      seekBy(secs);
      snd = 'ff';
    } else if (krw && !kOff('rw')) {
      secs = clampSecs(cfg.rwSeconds, 10);
      seekBy(-secs);
      snd = 'rw';
    } else if (klk && !kOff('like')) {

      const likeBtn = findBySel(SEL.like);
      const wasLiked = !!(likeBtn && likeBtn.classList.contains('sc-button-selected'));
      if (wasLiked && cfg.likeConfirm && !unlikeArmed) {
        unlikeArmed = true;
        clearTimeout(unlikeTimer);
        unlikeTimer = setTimeout(() => { unlikeArmed = false; }, 3000);
        e.preventDefault();
        e.stopImmediatePropagation();

        toast(window.SCKIT_t(cfg.lang, 't_toast_unlike_arm'), klk.toUpperCase(), TOAST_ICONS.unlike_arm, true);
        playSound('like');
        return;
      }
      unlikeArmed = false;
      clickBtn(SEL.like);
      snd = wasLiked ? 'unlike' : 'like';
    }
    if (snd) {

      unlikeArmed = false;
      e.preventDefault();
      e.stopImmediatePropagation();
      if (cfg.toastKey || cfg.toastIcon || cfg.toastText) toast(window.SCKIT_t(cfg.lang, 't_toast_' + snd, { s: secs }), (kn || kp || kff || krw || klk).toUpperCase(), TOAST_ICONS[snd]);
      playSound(snd);
    }
  }, true);
})();