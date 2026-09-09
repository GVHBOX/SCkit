# SCKit · SoundCloud 单键遥控 / 迷你播放器

该插件为习惯用按键刷歌单的用户设计:在 SoundCloud 页面用单键切歌/快进/喜欢,点工具栏图标弹出迷你遥控器,并支持 Chrome 全局快捷键(任意页面都能控制播放)。

![Chrome](https://img.shields.io/badge/Chrome-MV3-ff5500) ![Privacy](https://img.shields.io/badge/privacy-零网络请求-4a90d9)

<img src="screenshots/preview_screenshot.png" alt="SCKit 弹窗遥控器与设置页" width="640">

## 特点

- **页面内单键遥控**:切歌(`s`/`w`)、快进快退(`d`/`a`)、喜欢(`x`)、空格播放/暂停、随机/循环;按键自定义,支持开关与二次确认
- **全局快捷键**:任意页面按 `Alt+Shift+P`(播放/暂停)、`Alt+Shift+N`(下一首)、`Alt+Shift+B`(上一首)即可控制 SoundCloud;按键音效与气泡提示在页面内即时反馈
- **弹窗迷你遥控器**:播放/暂停、切歌、随机、循环、静音、音量、进度、喜欢,与页面实时同步
- **个性化反馈**:按键音效、气泡提示(大小/位置可调)、倾斜动画、悬停描边
- 暗/浅主题、进度条与音量滑块样式、中英双语

## 隐私

- 扩展本身**零网络请求**,不收集、不上传、不同步任何数据;所有配置仅存于浏览器本地(`chrome.storage.sync`)
- 仅在以下情况向页面注入脚本:① soundcloud.com 页面(核心遥控功能);② 当你按全局快捷键且当前标签页不是 SoundCloud 时,向当前页显示一个按键反馈气泡(仅显示,不读取页面内容)
- 所有控制指令只发给 soundcloud.com 标签页

## 安装

1. 下载本仓库(Code → Download ZIP)并解压
2. 打开 `chrome://extensions`,右上角开启「开发者模式」
3. 「加载已解压的扩展程序」→ 选择解压后的文件夹

## 快捷键

- 页面内单键与全局键的**开关/自定义**:扩展设置页(右键图标 → 选项)
- 全局快捷键**键位修改**:`chrome://extensions/shortcuts`

## 许可

[MIT](LICENSE)
