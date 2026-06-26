# 芝士的摸鱼站 — AGENTS 项目指南

这是一个纯静态站点仓库，当前同时承载：

- 导航门户首页与分类详情页
- 多篇教程 / 指南页
- 京东运营相关工具页
- 若干首页视觉素材、设计记录与项目记忆

项目不依赖构建工具、框架或包管理器。页面直接由原生 HTML、CSS、JavaScript 和 `data.js` 驱动，浏览器可直接打开。

本文档面向 Codex / 代码代理协作，记录当前仓库的真实结构、运行链路和修改约定。`CLAUDE.md` 现在只是兼容入口，长期项目约定以 `AGENTS.md` 为准。

## 1. 先读什么

按下面顺序建立上下文，通常最省时间：

1. `AGENTS.md`
2. `memory/project-structure-reference.md`
3. `docs/homepage-architecture.md`
4. 需要改首页时，再读：
   `index.html`、`styles/home.css`、`scripts/home-layout.js`、`scripts/home.js`、`scripts/seabed.js`
5. 需要改教程或工具时，再读对应页面和 `templates/`

## 2. 当前项目结构

```text
navigation/
├── index.html                      # 当前首页：门 / 水面 / 侧栏 / 搜索 / 功能卡 / 海底贝壳区
├── detail.html                     # 分类详情页，由 ?page=xxx 从 data.js 渲染
├── data.js                         # 全站导航唯一数据源 SITE_DATA
├── avatar.jpg
├── styles/
│   └── home.css                    # 首页专用样式
├── scripts/
│   ├── home-layout.js              # 首页首屏几何计算（可被 Node 测试直接 require）
│   ├── home.js                     # 首页 DOM 渲染、侧栏、搜索、门和水面交互
│   └── seabed.js                   # 海底贝壳 / 珍珠 / 小鱼交互
├── guides/
│   ├── shared.css                  # 通用主题、光标、浮动栏、lightbox、烟花等
│   ├── shared.js                   # 通用交互逻辑
│   ├── tutorial.css                # 教程页专用样式
│   └── *.html                      # 已落地教程 / 指南页
├── tools/
│   ├── JD/
│   │   ├── main-image.html         # 商品主图更换 / 图片重命名
│   │   ├── data-analysis.html      # 数据分析工具
│   │   └── supply-chain/
│   │       ├── supply.html         # 供应链工具主壳
│   │       ├── purchase-order.html # 子工具页
│   │       ├── export.html         # 子工具页
│   │       ├── links.html          # 子工具页
│   │       └── vendor/xlsx.full.min.js
│   └── dev/
│       └── mouse-debug.html        # 光标热点校准页
├── templates/
│   ├── tutorial.html               # 教程页骨架
│   ├── tool-multi.html             # 多标签工具骨架
│   └── tool-single.html            # 单页工具骨架
├── tests/
│   └── home-layout.test.cjs        # 首页布局回归测试
├── docs/
│   └── homepage-architecture.md    # 首页工程结构说明
├── memory/                         # 项目记忆 / 设计决策，不参与运行
├── backup/                         # 已退出运行链路的历史备份 / 校验快照 / 旧概念资产
├── concepts/                       # 首页和海底区主要视觉素材
├── img/                            # 教程截图，按页面分目录
└── .gitignore
```

## 3. 页面体系

### 3.1 首页

`index.html` 已不是旧版 bento-grid 首页，当前是新版沉浸式首页：

- 左侧窄导航轨 `nav-rail`
- 可展开侧栏 `sidebar`
- 搜索弹层 `search-overlay`
- 首屏 `hero`
  - 水彩门背景图
  - 标题文案
  - 可点击开门区域
  - 水面涟漪画布
- 内容区 `portal-grid`
  - 从 `SITE_DATA.blocks` 生成 3 张功能入口卡片
- 海底区 `seabed-scene`
  - 贝壳、珍珠、小鱼、祈愿文案

首页脚本加载顺序固定：

```html
<script src="data.js"></script>
<script src="scripts/home-layout.js"></script>
<script src="scripts/home.js"></script>
<script src="scripts/seabed.js"></script>
```

不要随意调换顺序。`home.js` 依赖 `SITE_DATA` 和 `HomeHeroLayout`，`seabed.js` 依赖海底区 DOM 已存在。

### 3.2 分类详情页

“查看更多”类页面不单独建 HTML，而是使用：

- `detail.html?page=jiaocheng`
- `detail.html?page=tools`
- `detail.html?page=haoyong`

渲染逻辑来自 `data.js` 中 block 或 subcategory 的 `page` 字段。

### 3.3 教程 / 指南页

教程页采用：

- `guides/shared.css`
- `guides/tutorial.css`
- `guides/shared.js`

实际页面如：

- `guides/pc-setup.html`
- `guides/android-setup.html`
- `guides/vps-setup.html`
- `guides/jiuguan-guide.html`
- `guides/jiuguan-usage.html`

典型结构包括：

- 左侧桌面 TOC
- 移动端 TOC popup
- 浮动工具栏
- `section.step`
- `.step-img` 图片
- 代码复制按钮 `copyCode(this)`

### 3.4 工具页

当前工具页主要有三类：

- 单页工具：如 `tools/dev/mouse-debug.html`
- 多标签工具：如 `tools/JD/main-image.html`
- 更复杂的工具壳：如 `tools/JD/supply-chain/supply.html`

其中 `supply.html` 虽然也属于工具壳，但已经明显重度定制，不要机械按模板理解。

## 4. 数据模型

全站导航内容统一定义在 `data.js` 的单例对象 `SITE_DATA`：

```text
SITE_DATA.blocks[] -> {
  type,
  name,
  icon?,
  page?,
  avatar?,
  username?,
  bio?,
  subcategories?,
  links?
}

subcategory -> { name, links[], page? }
link -> { title, url, desc, target? }
```

当前 `SITE_DATA` 实际承担这些职责：

- 首页标题与副标题
- 个人资料块信息
- 首页三张入口卡片的数据来源
- 首页侧栏导航内容
- 首页搜索内容
- 详情页分类与链接列表

约束：

- `data.js` 是唯一导航数据源，不要再造第二份站点导航配置
- 新增教程 / 工具入口后，必须同步写入对应 `links`
- “查看更多”逻辑优先通过 `page` 字段接到 `detail.html`

## 5. 首页核心机制

### 5.1 首屏几何计算

`scripts/home-layout.js` 只做纯计算，不操作 DOM，主要导出：

- `calculateSceneMode()`
- `calculateSceneGeometry()`
- `fitTitleSize()`

关键常量：

- `SOURCE`：首屏背景原图尺寸与水面位置
- `DOOR`：门在原图中的坐标
- `DOOR_PAD`：门四周额外裁切边距

如果更换首页门图，优先修改这里，不要把偏移硬编码散落进 `home.js` 或 CSS。

### 5.2 首页渲染和交互

`scripts/home.js` 负责：

- 从 `SITE_DATA` 生成首页功能卡片
- 从 `SITE_DATA` 生成侧栏导航
- 构建搜索索引和搜索结果
- 主题切换与图标同步
- 侧栏开合
- 首屏门的 hover / click 动画
- 水面 ripple 效果
- 标题尺寸与按钮位置联动

### 5.3 海底区

`scripts/seabed.js` 负责：

- 贝壳开合帧动画
- 珍珠点击召唤小鱼
- 小鱼群游动
- 贝壳拖拽和位置记忆
- 贝壳回家动画
- 祈愿文案随机回复

当前实现细节：

- 小鱼上限：`fishConfig.maxCount = 7`
- 贝壳默认位置锚定到海底底图中的浅色沙坑
- 只有用户手动拖动后，位置才持久化到 `localStorage`
- 右键贝壳可回到默认位置

## 6. 视觉素材与设计资产

`concepts/` 保存当前首页相关主素材。高频文件包括：

- `concepts/watercolor-door-hero-v1.png`
- `concepts/water-underlay-repeat-v1.png`
- `concepts/portal-deco-message-bottle.png`
- `concepts/portal-deco-compass.png`
- `concepts/portal-deco-anchor.png`
- `concepts/watercolor-seabed-footer-shell-pocket.png`
- `concepts/shell/web-frames/shell-web-frame-0.png` ~ `shell-web-frame-4.png`
- `concepts/fish/fish-1.png` ~ `fish-6.png`

注意：

- `concepts/` 中有一部分是历史概念图、备份图、生成记录
- 已确认退出当前运行链路、但仍需保留的旧素材，统一放到 `backup/资产设计仓/`
- 是否仍在使用，可先参考 `memory/project-structure-reference.md`

## 7. 全局系统

### 7.1 主题

- 主题通过 `<html data-theme="dark|light">` 控制
- 状态持久化到 `localStorage.theme`
- 首页自己的主题逻辑在 `scripts/home.js`
- 教程 / 工具 / 详情页的主题逻辑主要在 `guides/shared.js`

### 7.2 favicon

- 教程 / 工具体系下，`guides/shared.js` 会自动创建或更新 favicon
- 首页没有依赖 `shared.js`，它自己维护 `meta[name="theme-color"]`

### 7.3 浮动工具栏

以下页面体系默认依赖 `#floatWrapper`：

- 教程页
- 多数工具页

如果页面使用 `shared.js` 中的浮动栏逻辑，就不要删除这些固定 ID：

- `floatWrapper`
- `floatStack`
- `floatHandle`
- `themeToggle`
- `backToTop`

### 7.4 Lightbox / TOC / 烟花

`guides/shared.js` 提供：

- `.step-img` 点击放大 lightbox
- 桌面 TOC 克隆为移动端 popup
- 回到顶部按钮显隐
- 点击烟花粒子

## 8. 模板使用规则

只在“需要新建页面”时读取 `templates/`，平时无需把模板整份带入上下文。

选择建议：

- 新教程 / 指南：`templates/tutorial.html`
- 新多标签工具：`templates/tool-multi.html`
- 新单页工具：`templates/tool-single.html`
- “查看更多”页：不要新建 HTML，优先改 `data.js` 的 `page`

但要注意：

- 模板只是起点，不代表当前真实页面一定与模板完全一致
- `tools/JD/supply-chain/supply.html` 这类页面已有明显定制，改动前先读现有实现

## 9. 路径规则

常见引用规律：

- 根目录页面：
  - `guides/shared.css`
  - `styles/home.css`
  - `scripts/...`
- `guides/*.html`：
  - `shared.css`
  - `tutorial.css`
  - `shared.js`
- `tools/` 下两级页面通常用：
  - `../../guides/shared.css`
  - `../../guides/shared.js`
- `tools/` 下三级页面通常用：
  - `../../../guides/shared.css`
  - `../../../guides/shared.js`

修改相对路径后，一定手动检查资源是否 404。

## 10. 编码与内容约定

- 中文内容和文件统一使用 UTF-8
- 保持纯前端实现，不引入构建步骤
- 尽量复用现有全局样式和脚本，不重复造全局组件
- 所有主题相关颜色优先走 CSS 变量
- 不要把首页主文案、门户卡片文案、详情页导航再拆成第二套静态配置

## 11. 截图与教程内容约定

教程截图放在：

```text
img/<page-name>/image1.png
img/<page-name>/image2.png
...
```

约定：

- 文件名从 `image1.png` 顺序编号
- 页面内优先使用 `.step-img`
- 多图并排时可复用现有 `.img-row`

## 12. 第三方依赖现状

项目整体不使用构建依赖，但个别工具页会直接引 CDN / vendor 文件：

- `tools/JD/main-image.html`
  - `JSZip`
  - `SheetJS`
- `tools/JD/supply-chain/supply.html`
  - 优先加载本地 `vendor/xlsx.full.min.js`
  - 失败时再尝试多个 CDN 回退

因此：

- 不要默认把所有页面都改成“完全离线”
- 改动工具页时，先确认原页面对第三方库的加载策略

## 13. 验证方式

项目没有完整自动化测试，但首页已有轻量检查。

脚本级验证至少可运行：

```powershell
node --check scripts\home-layout.js
node --check scripts\home.js
node --check scripts\seabed.js
node tests\home-layout.test.cjs
```

完成改动后，至少手动验证：

1. 页面能直接在浏览器打开
2. 暗色 / 亮色主题
3. 桌面 / 窄屏布局
4. 控制台无明显报错
5. 新增入口是否已写入 `data.js`
6. 相对路径与图片资源是否正确

如果改的是首页，还应额外检查：

- 门的位置是否仍与背景对齐
- 标题是否仍保持预期排版
- 侧栏展开后首屏是否被挤坏
- 海底贝壳默认位置与拖拽回家是否正常

## 14. 仓库与部署

- 部署仓库：`https://github.com/ZO00OEY/navigation.git`
- 当前仓库可直接作为静态站点部署

## 15. 对代理最重要的提醒

- 当前首页已经是新版沉浸式结构，不要按旧版 bento-grid 思路修改
- 首页是“数据驱动 + 几何计算 + 动画交互”的组合，改动前先区分样式、布局计算、DOM 逻辑分别在哪
- `data.js` 是导航唯一数据源
- `templates/` 只用于新建页面起步，不代表现有页面都该被模板化回滚
- `memory/` 和 `docs/` 很有用，但不参与运行；删改仓库文件时不要把它们误当死代码
