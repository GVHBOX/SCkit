(function () {
  'use strict';

  const SC_MATCH = ['https://soundcloud.com/*', 'https://*.soundcloud.com/*'];
  const CMD_MAP = { 'sc-toggle': 'toggle', 'sc-next': 'next', 'sc-prev': 'prev' };

  function isSoundCloud(url) {
    if (!url) return false;
    return /^https:\/\/([a-z0-9-]+\.)*soundcloud\.com(\/|$)/i.test(url);
  }

  function getCfg(cb) {
    chrome.storage.sync.get({
      toastKey: false, toastIcon: false, toastText: true, toastSize: 1.5,
      lang: 'zh', cmdOff: {}
    }, (v) => {
      void chrome.runtime.lastError;
      cb(v || {});
    });
  }

  function pickTab(cb) {
    chrome.tabs.query({ url: SC_MATCH }, (tabs) => {
      void chrome.runtime.lastError;
      if (!tabs || !tabs.length) { cb(null); return; }
      const audible = tabs.find((t) => t.audible);
      const active = tabs.find((t) => t.active);
      cb(audible || active || tabs[0] || null);
    });
  }

  let shortcutCache = null;
  function loadShortcuts(cb) {
    if (shortcutCache) { cb(shortcutCache); return; }
    if (!chrome.commands || !chrome.commands.getAll) { cb({}); return; }
    chrome.commands.getAll((list) => {
      void chrome.runtime.lastError;
      const map = {};
      (list || []).forEach((c) => { if (c && c.name) map[c.name] = c.shortcut || ''; });
      shortcutCache = map;
      cb(map);
    });
  }

  function fmtKey(s) {
    if (!s) return '';
    return s.split('+').map((p) => {
      p = p.trim();
      return p.length <= 1 ? p.toUpperCase() : p.charAt(0).toUpperCase() + p.slice(1).toLowerCase();
    }).join(' + ');
  }

  function showToastOnActiveTab(cfg, kind, command, scTabId) {
    if (!cfg.toastKey && !cfg.toastIcon && !cfg.toastText) return;
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      void chrome.runtime.lastError;
      if (!tabs || !tabs.length) return;
      const tab = tabs[0];
      if (!tab || tab.id == null) return;
      if (tab.id === scTabId) return;
      if (isSoundCloud(tab.url)) return;
      loadShortcuts((map) => {
        const keyText = fmtKey(map[command] || '');
        const opts = {
          key: keyText,
          keyOn: !!cfg.toastKey,
          iconOn: !!cfg.toastIcon,
          textOn: !!cfg.toastText,
          size: cfg.toastSize,
          lang: cfg.lang || 'zh'
        };
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['toast.js', 'i18n.js'],
          injectImmediately: true
        }, () => {
          if (chrome.runtime.lastError) return;
          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: (k, c) => {
              const t = window.SCKIT_TOAST;
              if (!t) return;
              t.show({
                text: window.SCKIT_t(c.lang, 't_toast_' + k, {}),
                icon: t.ICONS[k] || '',
                key: c.key, keyOn: c.keyOn, iconOn: c.iconOn, textOn: c.textOn,
                pos: 'center', size: c.size
              });
            },
            args: [kind, opts]
          }, () => { void chrome.runtime.lastError; });
        });
      });
    });
  }

  function dispatchCmd(cmdName, command) {
    getCfg((cfg) => {
      const off = (cfg.cmdOff && typeof cfg.cmdOff === 'object') ? cfg.cmdOff : {};
      if (off[command] === true) return;
      pickTab((tab) => {
        if (!tab || tab.id == null) return;
        chrome.tabs.sendMessage(tab.id, { type: 'sckit', action: 'cmd', cmd: cmdName, global: true }, (res) => {
          void chrome.runtime.lastError;
          let kind = cmdName;
          if (cmdName === 'toggle') {
            if (res && res.ok === false) return;
            const playing = !!(res && res.playing);
            kind = playing ? 'play' : 'pause';
          }
          showToastOnActiveTab(cfg, kind, command, tab.id);
        });
      });
    });
  }

  chrome.commands.onCommand.addListener((command) => {
    const cmdName = CMD_MAP[command];
    if (!cmdName) return;
    dispatchCmd(cmdName, command);
  });
})();
