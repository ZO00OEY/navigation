# 导航项目结构参考

更新时间：2026-06-26

这份文档给后续接手的人快速对齐真实结构，重点是当前运行链路、常改入口，以及哪些旧资产已经从工作树移除。

## 先读顺序

1. `AGENTS.md`
2. `memory/project-structure-reference.md`
3. `docs/homepage-architecture.md`
4. 只在需要改首页时再读 `index.html`、`styles/home.css`、`scripts/home-layout.js`、`scripts/home.js`、`scripts/seabed.js`

## 当前运行链路

- 首页：`index.html`
- 详情页：`detail.html`
- 站点导航数据源：`data.js`
- 首页脚本加载顺序固定：

```html
<script src="data.js"></script>
<script src="scripts/home-layout.js"></script>
<script src="scripts/home.js"></script>
<script src="scripts/seabed.js"></script>
```

## 当前首页正在使用的主要素材

- `concepts/watercolor-door-hero-v1.png`
- `concepts/water-underlay-repeat-v1.png`
- `concepts/portal-deco-message-bottle.png`
- `concepts/portal-deco-compass.png`
- `concepts/portal-deco-anchor.png`
- `concepts/watercolor-seabed-footer-shell-pocket.png`
- `concepts/shell/web-frames/shell-web-frame-0.png` 到 `shell-web-frame-4.png`
- `concepts/fish/fish-1.png` 到 `fish-6.png`

## 现在的 data.js 约定

`data.js` 只保留当前运行时真实会读到的字段：

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

说明：

- `cols` / `rows` / `layout` / `socials` / `cardFooter` 已从运行数据里移除
- `data.js` 仍然是唯一导航数据源

## 旧资产说明

以下内容已经从当前工作树移除，不再参与运行：

- 历史页面备份
- 校验快照
- 旧首页概念图
- 旧贝壳拆件、旧帧图、生成记录

如果以后需要回看，请直接查 Git 历史。

## 常用检查

```powershell
node --check scripts\home-layout.js
node --check scripts\home.js
node --check scripts\seabed.js
node tests\home-layout.test.cjs
```
