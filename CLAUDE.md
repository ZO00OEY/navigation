# 芝士的摸鱼站 — Navigation

纯静态导航门户站 + 京东运营工具集。无需构建工具，数据驱动渲染。

## 项目结构

```
navigation/
├── index.html              # 主页：bento-grid 导航卡片
├── detail.html             # 分类详情页（所有"查看更多"的目标页）
├── data.js                 # 唯一数据源 SITE_DATA
├── avatar.jpg
├── guides/
│   ├── shared.css          # 全局样式（主题、光标、烟花、浮动工具栏、布局变量）
│   ├── shared.js           # 全局 JS（主题/favicon 同步、烟花、TOC popup、lightbox、浮动栏）
│   ├── tutorial.css        # 教程页专用样式（步骤卡片、TOC、图注、代码块）
│   └── *.html              # 教程/指南页
├── tools/
│   ├── JD/                 # 京东自营店铺小工具
│   │   ├── main-image.html         # 主图批量更换 / 图片重命名（多标签）
│   │   ├── data-analysis.html      # 数据分析
│   │   └── supply-chain/           # 供应链工具集（sidebar+iframe 壳 + 子页面）
│   └── dev/                # 通用开发/调试工具
│       └── mouse-debug.html        # 光标热点校准
├── templates/              # 页面骨架（新建页面时按需读取）
│   ├── tutorial.html       #   版式 C：教程页骨架
│   ├── tool-multi.html     #   版式 D：多标签工具骨架
│   └── tool-single.html    #   版式 E：单页工具骨架
├── img/                    # 教程截图（按教程分目录，image1.png ~ imageN.png）
└── .gitignore
```

## 页面版式速查

骨架文件在 `templates/` 目录，**新建页面时按需读取对应骨架，平时不占用上下文**。

### 版式选择

```
新增页面
├─ "查看更多"目标页 → 不需要新建 HTML，data.js 设 page 字段即可（走 detail.html）
├─ 教程/指南文章   → 版式 C，读 templates/tutorial.html
├─ 妙妙小工具
│   ├─ 多子功能切换 → 版式 D，读 templates/tool-multi.html
│   └─ 单一功能     → 版式 E，读 templates/tool-single.html
└─ 特殊情况         → 参考最近已有页面，必要时补充新骨架到 templates/
```

### 各版式速览

| 版式 | 骨架文件 | CSS | 适用场景 |
|------|----------|-----|---------|
| A 导航首页 | `index.html`（唯一，不复制） | `shared.css` | 主页 |
| B 详情页 | 无需新建 | `shared.css` | "查看更多"链接列表 |
| C 教程页 | `templates/tutorial.html` | `shared.css` + `tutorial.css` | 图文教程，带桌面+移动端目录 |
| D 多标签工具 | `templates/tool-multi.html` | `shared.css` | 多子功能页内切换 |
| E 单页工具 | `templates/tool-single.html` | `shared.css` | 单一功能，自由设计 |

### 截图规范
- 放 `img/<page-name>/image1.png` ~ `imageN.png`
- 用 `.step-img` 包裹，lightbox 自动生效

## 架构模式

### 数据驱动（SITE_DATA）
所有导航内容在 `data.js` 的单例对象 `SITE_DATA` 中定义：

```
SITE_DATA.blocks[] → { type, name, icon, cols, rows, layout, page?, subcategories[], cardFooter? }
  每个 subcategory → { name, links[], page? }
    每个 link → { title, url, desc, target? }
```

- `page` 字段用于关联 detail.html：block 级 `page` = 整块链接到一个详情页；subcategory 级 `page` = 子分类独立详情页

### 主题系统
- `<html data-theme="dark|light">` 切换，状态持久化到 localStorage
- CSS 变量定义在 shared.css 的 `:root`（暗色）和 `[data-theme="light"]`（亮色）
- shared.js `applyTheme()` 同步更新 favicon 颜色

### favicon
- shared.js 自动查找或创建 `<link rel="icon">`，新页面无需手动声明
- 内联 SVG 小鱼图标，暗色 `#8fa8ff`，亮色 `#d44070`

### 全局组件（shared.js 自动提供）
- **浮动工具栏**：主题切换 + 返回导航 + 回到顶部（需页面有 `#floatWrapper`）
- **烟花粒子**：click 时爆发
- **TOC popup**：教程页桌面目录自动克隆到移动端弹出层
- **Lightbox**：`.step-img` 点击放大

## 开发约定

- **纯前端**：无构建工具，浏览器直接打开
- **路径规则**：根目录页面引用 `guides/shared.css`，`tools/` 下引用 `../../guides/shared.css`（两级）或 `../../../guides/shared.css`（三级）
- **主题适配**：所有颜色/背景必须用 CSS 变量（`var(--xxx)`），禁止硬编码
- **新工具注册**：创建 HTML 后在 `data.js` 对应 subcategory 的 links 中添加条目
- **截图**：放 `img/<page-name>/`，编号 `image1.png` 起始，用 `.step-img` 包裹
- **GitHub Pages 部署**：repo `ZO00OEY/navigation.git`
