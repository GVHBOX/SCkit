window.SCKIT_I18N = {
  zh: {
    title_opts: 'SCKit 设置',
    sec_keys: '快捷键', sec_switch: '开关', sec_sound: '按键音效', sec_toast: '气泡',
    sec_protect: '误触保护', like_confirm: '喜欢二次确认', theme_title: '切换浅色 / 暗色',
    sec_anim: '动画', tilt_label: '倾斜幅度', swap_anim: '切换音乐', hover_ring: '悬停白色描边', btn_fx: '按钮点击动效',
    sec_style: '外观', style_progress: '进度条样式', style_bar: '圆钮条', style_wave: 'SoundCloud 波形',
    col_white: '白色', col_orange: '橙色',
    vol_style: '音量样式', vol_slider: '圆钮条', vol_white: '粗框',
    snd_keys: '快捷键', snd_ui: 'UI 按钮', toast_key: '快捷键图标', toast_icon: 'Emoji 图标', toast_text: '文字',
    act_next: '下一首', act_prev: '上一首', act_ff: '快进', act_rw: '快退', act_like: '喜欢',
    sec_suffix: '秒',
    vol: '音量', scheme: '音效风格',
    sch_classic: '经典', sch_deep: '低沉', sch_crisp: '清脆', sch_chip: '芯片', sch_soft: '柔和', sch_custom: '自定义',
    audition_title: '试听当前音效风格', pv_title: '试听',
    pos_label: '位置', pos_left: '左', pos_center: '中', pos_right: '右', toast_size_label: '气泡大小',
    stage_tag: '预览', stage_hint: '点击播放一次气泡动画', kx_off: '关闭该快捷键', kx_on: '启用该快捷键',
    save: '保存', reset: '恢复默认',
    lang_label: '语言',
    dup_key: '快捷键 "{k}" 被分配给了多个功能，请修改后再保存',
    t_open: '打开设置', t_prev: '上一首', t_next: '下一首', t_toggle: '播放 / 暂停',
    t_shuffle: '随机播放', t_repeat: '循环播放（关 → 全部 → 单曲）', t_mute: '静音切换', t_like: '喜欢',
    sec_global: '全局按键', cmd_toggle: '播放 / 暂停（全局）', cmd_next: '下一首（全局）', cmd_prev: '上一首（全局）',
    openShortcuts_t: '打开 chrome://extensions/shortcuts 修改键位',
    reload_sc: '刷新 SoundCloud 页面并重新同步',
    lc_cancel: '取消', lc_ok: '确认',
    open_sc: '打开 SoundCloud',
    stale_tip: '连不上 SoundCloud 标签页，请刷新该标签页后重试',
    t_toast_next: '下一首', t_toast_prev: '上一首', t_toast_ff: '快进 {s}s', t_toast_rw: '快退 {s}s', t_toast_like: '喜欢', t_toast_unlike: '取消喜欢', t_toast_unlike_arm: '再按一次确认取消喜欢',
    t_toast_play: '播放', t_toast_pause: '暂停'
  },
  en: {
    title_opts: 'SCKit Settings',
    sec_keys: 'Shortcuts', sec_switch: 'Toggle', sec_sound: 'Key Sounds', sec_toast: 'Bubble',
    sec_protect: 'Mistouch Protection', like_confirm: 'Like confirmation', theme_title: 'Toggle light / dark',
    sec_anim: 'Animation', tilt_label: 'Tilt', swap_anim: 'Track switch', hover_ring: 'Hover white ring', btn_fx: 'Button click effect',
    sec_style: 'Appearance', style_progress: 'Progress bar', style_bar: 'Knob bar', style_wave: 'SoundCloud waveform',
    col_white: 'White', col_orange: 'Orange',
    vol_style: 'Volume style', vol_slider: 'Knob bar', vol_white: 'Thick frame',
    snd_keys: 'Shortcuts', snd_ui: 'UI buttons', toast_key: 'Key icon', toast_icon: 'Emoji icon', toast_text: 'Text',
    act_next: 'Next track', act_prev: 'Previous track', act_ff: 'Seek forward', act_rw: 'Seek backward', act_like: 'Like',
    sec_suffix: 'sec',
    vol: 'Volume', scheme: 'Sound scheme',
    sch_classic: 'Classic', sch_deep: 'Deep', sch_crisp: 'Crisp', sch_chip: 'Chip', sch_soft: 'Soft', sch_custom: 'Custom',
    audition_title: 'Preview current scheme', pv_title: 'Preview',
    pos_label: 'Position', pos_left: 'Left', pos_center: 'Center', pos_right: 'Right', toast_size_label: 'Bubble size',
    stage_tag: 'PREVIEW', stage_hint: 'Click to play the bubble animation', kx_off: 'Disable shortcut', kx_on: 'Enable shortcut',
    save: 'Save', reset: 'Reset defaults',
    lang_label: 'Language',
    dup_key: 'Shortcut "{k}" is assigned to multiple actions. Change it before saving.',
    t_open: 'Open settings', t_prev: 'Previous', t_next: 'Next', t_toggle: 'Play / Pause',
    t_shuffle: 'Shuffle', t_repeat: 'Repeat (off → all → one)', t_mute: 'Mute', t_like: 'Like',
    sec_global: 'Global Keys', cmd_toggle: 'Play / Pause (global)', cmd_next: 'Next track (global)', cmd_prev: 'Previous track (global)',
    openShortcuts_t: 'Open chrome://extensions/shortcuts to change keys',
    reload_sc: 'Reload SoundCloud page and re-sync',
    lc_cancel: 'Cancel', lc_ok: 'OK',
    open_sc: 'Open SoundCloud',
    stale_tip: 'Cannot reach the SoundCloud tab — reload it and try again',
    t_toast_next: 'Next', t_toast_prev: 'Previous', t_toast_ff: 'FF {s}s', t_toast_rw: 'RW {s}s', t_toast_like: 'Like', t_toast_unlike: 'Unlike', t_toast_unlike_arm: 'Press again to unlike',
    t_toast_play: 'Play', t_toast_pause: 'Pause'
  }
};
window.SCKIT_t = function (lang, key, vars) {
  const d = window.SCKIT_I18N[lang] || window.SCKIT_I18N.zh;
  let s = d[key] != null ? d[key] : window.SCKIT_I18N.zh[key];
  if (s == null) return key;

  if (vars) for (const k in vars) s = s.split('{' + k + '}').join(vars[k]);
  return s;
};
window.SCKIT_applyLang = function (lang, root) {
  const r = root || document;
  r.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = window.SCKIT_t(lang, el.getAttribute('data-i18n')); });
  r.querySelectorAll('[data-i18n-title]').forEach((el) => { el.title = window.SCKIT_t(lang, el.getAttribute('data-i18n-title')); });
};
