# 芝士的摸鱼站 — Codex 项目指南

这是一个纯静态导航门户站和京东运营工具集。无需构建工具，页面由原生 HTML、CSS、JavaScript 和 `data.js` 中的数据驱动。

本文件是 Codex 的仓库级项目说明。`CLAUDE.md` 为 Claude Code 兼容文件；调整项目约定时应同步更新两份文件。

## 项目结构

```text
navigation/
├── index.html              # 主页：bento-grid 导航卡片
├── detail.html             # 分类详情页（所有“查看更多”的目标页）
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
│   │   └── supply-chain/           # 供应链工具集（sidebar + iframe 壳和子页面）
│   └── dev/
│       └── mouse-debug.html        # 光标热点校准
├── templates/              # 新建页面时按需读取的页面骨架
│   ├── tutorial.html       # 版式 C：教程页
│   ├── tool-multi.html     # 版式 D：多标签工具
│   └── tool-single.html    # 版式 E：单页工具
├── img/                    # 教程截图，按教程分目录
└── .gitignore
```

## 页面版式

新建页面时只读取对应的 `templates/` 骨架：

| 版式 | 骨架文件 | 样式 | 场景 |
| --- | --- | --- | --- |
| A 导航首页 | `index.html`（唯一，不复制） | `guides/shared.css` | 主页 |
| B 详情页 | 无需新建 HTML | `guides/shared.css` | “查看更多”链接列表 |
| C 教程页 | `templates/tutorial.html` | `shared.css` + `tutorial.css` | 图文教程、桌面和移动端目录 |
| D 多标签工具 | `templates/tool-multi.html` | `shared.css` | 多子功能页内切换 |
| E 单页工具 | `templates/tool-single.html` | `shared.css` | 单一功能 |

选择规则：

- “查看更多”目标页：不要新建 HTML，在 `data.js` 设置 `page` 字段，由 `detail.html` 渲染。
- 教程或指南：使用版式 C。
- 含多个子功能的工具：使用版式 D。
- 单一功能工具：使用版式 E。
- 特殊页面：优先参考最近的同类页面，确有复用价值时再补充模板。

## 数据模型

所有导航内容都定义在 `data.js` 的单例对象 `SITE_DATA` 中：

```text
SITE_DATA.blocks[] -> { type, name, icon, cols, rows, layout, page?, subcategories[], cardFooter? }
  subcategory -> { name, links[], page? }
    link -> { title, url, desc, target? }
```

- block 级 `page` 表示整块链接到一个详情页。
- subcategory 级 `page` 表示子分类拥有独立详情页。
- 新建工具 HTML 后，必须在对应 subcategory 的 `links` 中注册入口。

## 全局系统

- 主题通过 `<html data-theme="dark|light">` 切换，并持久化到 `localStorage`。
- CSS 变量定义在 `guides/shared.css` 的 `:root` 和 `[data-theme="light"]`。
- `guides/shared.js` 的 `applyTheme()` 会同步 favicon 颜色。
- favicon 由 `shared.js` 自动查找或创建，新页面无需手动声明。
- 浮动工具栏依赖页面中的 `#floatWrapper`。
- `.step-img` 自动启用点击放大的 lightbox。
- 教程页的桌面 TOC 会自动生成移动端 popup。

## 开发约定

- 保持纯前端实现，不引入构建步骤、框架或包管理器，除非用户明确要求。
- 根目录页面引用 `guides/shared.css` 和 `guides/shared.js`。
- `tools/` 下两级页面通常使用 `../../guides/...`，三级页面使用 `../../../guides/...`；修改后核对实际相对路径。
- 所有主题相关颜色和背景必须使用现有或新增的 CSS 变量，禁止直接硬编码主题颜色。
- 教程截图放在 `img/<page-name>/image1.png` 到 `imageN.png`，并使用 `.step-img` 包裹。
- 尽量复用 `guides/shared.css`、`guides/shared.js` 和现有模板，不在单页重复实现全局组件。
- 修改 `SITE_DATA` 时保持现有字段结构和格式，不创建第二份导航数据源。
- 中文内容和文件统一使用 UTF-8。

## 验证

项目没有自动化构建或测试。完成改动后至少：

1. 检查修改页面在浏览器中能直接打开。
2. 验证暗色和亮色主题。
3. 验证桌面和窄屏布局。
4. 检查控制台错误、资源相对路径和新增导航入口。

部署仓库：`https://github.com/ZO00OEY/navigation.git`。
