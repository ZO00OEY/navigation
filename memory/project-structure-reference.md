# 导航项目结构参考

更新时间：2026-06-25

这份文档是给之后接手修改首页或工具页时先读的入口。目标是先了解目录分工、首页当前资源、交互边界和疑似闲置文件，减少每次都从全仓库重新读起。

## 先读顺序

1. `AGENTS.md`：项目通用约定、页面类型、数据入口和路径规则。
2. `memory/project-structure-reference.md`：当前这份结构索引。
3. `memory/homepage-current-worklog.md`：首页视觉和贝壳/小鱼的历史决策。
4. `memory/footer-seabed-design.md`：底部海底区最初设计约束。
5. 只在需要确认首页代码时再读 `index.html`、`styles/home.css`、`scripts/home.js`、`scripts/seabed.js`。

## 根目录职责

- `index.html`：当前首页结构。首屏门与水面、潜入水面之下、三张撕拉纸功能卡片、海底贝壳区都在这里挂载。
- `detail.html`：分类详情页。`data.js` 里的 `page` 字段会跳到这里，不需要为“查看更多”另建页面。
- `data.js`：导航内容唯一数据源。首页三张功能卡、侧栏、详情页列表都从这里读。
- `guides/`：教程页和通用页面框架。`shared.css`、`shared.js` 是全站公共样式和基础交互。
- `tools/`：独立工具页，尤其 `tools/JD/` 是京东相关工具集合。
- `templates/`：新教程页、单页工具、多标签工具的模板。
- `styles/home.css`：首页全部视觉样式。首页改版优先查这里。
- `scripts/home-layout.js`：首页首屏门和标题布局的纯计算逻辑。
- `scripts/home.js`：首页数据渲染、侧栏、搜索、首屏门/水面交互。
- `scripts/seabed.js`：海底区、贝壳、珍珠、小鱼的独立交互逻辑。
- `concepts/`：首页和海底区主要视觉素材，包括水彩门、纸片、海底、贝壳、小鱼。
- `img/`：教程截图，按教程目录分组。
- `memory/`：项目记忆和设计决策，不参与页面运行。
- `docs/`：偏工程结构的说明，当前有 `docs/homepage-architecture.md`。
- `tests/`：轻量测试，当前首页布局测试在 `tests/home-layout.test.cjs`。

## 当前首页主链路

加载顺序在 `index.html` 末尾：

```html
<script src="data.js"></script>
<script src="scripts/home-layout.js"></script>
<script src="scripts/home.js"></script>
<script src="scripts/seabed.js"></script>
```

首页视觉资源主要由这些文件组成：

- 首屏门和水面：`concepts/watercolor-door-hero-v1.png`
- 水下重复底纹：`concepts/water-underlay-repeat-v1.png`
- 撕拉纸卡片底：`concepts/torn-paper-card-v3.png`
- 卡片右下贴片：
  - `concepts/portal-deco-message-bottle.png`
  - `concepts/portal-deco-compass.png`
  - `concepts/portal-deco-anchor.png`
- 海底底图：`concepts/watercolor-seabed-footer-shell-pocket.png`
- 贝壳动画帧：`concepts/shell/web-frames/shell-web-frame-0.png` 到 `shell-web-frame-4.png`
- 小鱼：`concepts/fish/fish-1.png` 到 `fish-6.png`

## 首页当前设计约束

- 首屏和“潜入水面之下”之间不要再出现独立过渡空白块，也不要恢复“水面以下，还有一些东西”那行提示。
- 三张功能卡片使用手绘撕拉纸样式；文字、编号、按钮必须由代码生成，不能烘焙进图片。
- 卡片文字定位要绑定纸片内部坐标。不要让标题或说明文字随着换行挤出纸片下沿。
- 卡片右下贴片只做浅淡装饰，不抢正文：教程与资源是漂流瓶，妙妙小工具是罗盘，好用站点是锚。
- 海底区不是整屏大图，底部沙地要紧接功能卡片后形成收尾。
- 贝壳默认位置按海底底图中浅色沙坑中心计算。只有用户手动拖过贝壳，才保存手动位置。
- 珍珠点击会召唤小鱼，小鱼上限是 7 条。鱼头方向要跟游动方向一致，鱼图原始朝向在 `scripts/seabed.js` 的 `fishSources` 中标记。

## 贝壳和小鱼当前实现

文件：`scripts/seabed.js`

- `fishConfig.maxCount` 控制小鱼上限，目前是 7。
- `fishConfig.ambientSize` 控制初始常驻鱼尺寸范围。
- `fishConfig.pearlSize` 控制珍珠召唤鱼尺寸范围。
- `fishSources` 记录每张鱼图路径和原始鱼头朝向。当前 6 张鱼均是 `head: 'right'`。
- `shellHomeAnchorSource` 是海底底图坐标系中的贝壳默认锚点，当前用于对准浅色沙坑中心。
- `shellPositionStorageKey` 版本变化会让未手动拖动的旧默认位置重新计算。
- 右键贝壳会回到默认锚点；静态闭合状态下会每 10 到 15 秒轻微抖动一次。

## 常用检查

```powershell
node --check scripts\home.js
node --check scripts\seabed.js
node tests\home-layout.test.cjs
```

如果只改素材图，至少检查一次首页布局测试；如果改脚本，必须跑对应 `node --check`。

## 疑似不再被当前页面引用的文件

以下只是标记，暂时不要删除。判断依据是：当前代码和页面加载链路没有直接引用，或只在旧记忆/历史说明中提到。

### 首页概念图和旧过渡素材

- `concepts/pink-glitch-city-homepage-v1.png`
- `concepts/torn-paper-card-v1.png`
- `concepts/torn-paper-card-v2.png`
- `concepts/water-surface-transition-v1.png`
- `concepts/watercolor-seabed-footer-shell-pocket-preview.png`
- `concepts/watercolor-seabed-footer-v1.png`
- `concepts/watercolor-seabed-footer-v2.png`
- `outputs-underwater-join-check.png`

### 贝壳旧素材或生成记录

- `concepts/shell/recent-generated-index.jpg`
- `concepts/shell/shell-bottom.png`
- `concepts/shell/shell-top.png`
- `concepts/shell/shell-pearl.png`
- `concepts/shell/shell-closed.png`
- `concepts/shell/shell-half.png`
- `concepts/shell/shell-open.png`
- `concepts/shell/frames/`
- `concepts/shell/web-frames/shell-web-frames-contact.png`
- `concepts/shell/backup-20260619-frame-test/`

说明：当前实际贝壳动画使用 `concepts/shell/web-frames/shell-web-frame-0.png` 到 `shell-web-frame-4.png`。

### 教程截图候选

- `img/android-setup/image27.png` 到 `image50.png`

说明：当前 `guides/android-setup.html` 只直接引用到 `image26.png`。这些后续可能是预留或历史截图，先不删。

## 提交记录

本轮更新重点：

- 删除首屏到内容区之间的多余过渡空白。
- 重做首页中段和海底区衔接。
- 将三张功能卡片改为撕拉纸样式，并加入右下水彩贴片。
- 优化贝壳默认锚点、回家动画、静态抖动和小鱼朝向。
- 调整鱼 2、鱼 6 素材朝向，让游动更自然。
