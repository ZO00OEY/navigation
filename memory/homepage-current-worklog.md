# 首页当前工作记忆

更新时间：2026-06-18

这份文档记录最近几轮关于首页、底部海底区、贝壳动画和当前 Git 状态的讨论与实现，方便换电脑后继续接着改。

## 当前状态

- 当前分支：`master`
- 最近提交：`3631204 Refine homepage shell animation`
- 已推送：
  - GitHub：`origin/master`
  - Gitee：`gitee/master`
- 最近验证：
  - `node tests/home-layout.test.cjs` 通过
- 当前未提交/未跟踪注意项：
  - `concepts/shell/recent-generated-index.jpg` 是未跟踪文件，之前没有提交。它看起来像临时生成记录，不属于当前正式素材。

## 首页整体方向

首页已经从复古导航页改成水彩纸质感的现代首页：

- 首屏是粉色水彩门与水面头图。
- 左侧有窄条导航，宽屏可展开侧边栏，窄屏为覆盖式/自动收起逻辑。
- 首屏标题为“在忙碌之外，留一扇门。”，响应式逻辑要避免文字被门遮挡。
- 首屏以下是“潜入水面之下。”和功能卡片区。
- 最底部是海底祈愿区，用浅粉水彩海底世界承接页面结尾。

视觉验收由用户自己做，代码侧主要检查逻辑、资源引用、响应式边界和脚本是否报错。

## 底部海底区设计

位置与用途：

- 对应 `index.html` 里的 `section.seabed-scene`。
- 背景图是 `concepts/watercolor-seabed-footer-v2.png`。
- 这一区域不是单纯插画，而是页面结尾与互动区：
  - 有吟唱文案。
  - 有可互动贝壳。
  - 有常驻/召唤的小鱼。
  - 有底部 meta 文案。

视觉方向：

- 保持顶部水彩、纸张、浅粉、克制手绘感。
- 海底元素要简洁，避免太满：
  - 少量珊瑚、贝壳、珍珠、沙子。
  - 不要写实恐怖谷。
  - 小鱼要像水彩贴图，不要线框鱼，也不要写实鱼鳞和立体眼睛。
- 背景要通过透明度和渐变融入页面，不要像一张硬贴上去的图片。

## 吟唱与互动小心思

保留旧版吟唱概念：

```text
执掌划水的摸鱼之神啊，请赐予我——
永远有年假的假象，永远不加班的自由，永远不必来的周一。
```

其中“摸鱼之神”是可点击入口。

当前交互思路：

- 点击“摸鱼之神”或贝壳里的珍珠，会召唤小鱼。
- 小鱼不是一次性扩散消失，而是在底部区域自由游动。
- 鼠标靠近时，小鱼会缓慢逃开。
- 累计到第 7 条鱼后，“摸鱼之神”开始给有趣回应。
- 目前回应文案在 `scripts/seabed.js` 里，但注意终端中显示可能有编码乱码，后续可专门清理中文编码。

## 贝壳动画最新实现

### 用户偏好的贝壳形态

用户最终选择参考图里的 C：

- C 的整体形态最满意。
- 不喜欢之前新画的版本，因为容易变成碗感，或上下两片像两个孤立圆形。
- 贝壳要偏正面，不要太斜。
- 下半壳要比较平整，但不是变小。
- 珍珠位置按 C 图来，靠中间略偏后，不要太靠根部，也不要突兀闪现。

### 当前代码实现

已经从“闭合/半开/打开三张完整 PNG 硬切换”改成“分层动画”：

HTML 位置：

```text
index.html
```

当前结构：

```html
<img class="shell-layer shell-layer-bottom" src="concepts/shell/shell-bottom.png" alt="">
<img class="shell-layer shell-layer-pearl" src="concepts/shell/shell-pearl.png" alt="">
<img class="shell-layer shell-layer-top" src="concepts/shell/shell-top.png" alt="">
<button class="pearl-button" id="pearlButton" type="button" aria-label="点击珍珠，召唤摸鱼">
  <span class="pearl-hit-glow" aria-hidden="true"></span>
</button>
```

CSS 位置：

```text
styles/home.css
```

核心逻辑：

- `.shell-layer-bottom`：底壳固定。
- `.shell-layer-top`：上壳通过 `transform` 从闭合态到半开态再到打开态。
- `.shell-layer-pearl`：珍珠独立淡入，半开时轻微出现，打开时完全出现。
- `.pearl-button`：只作为珍珠附近点击热区，不再额外显示一颗珍珠。
- `.pearl-hit-glow`：鼠标移到珍珠热区时的轻微光晕。

状态来源：

```text
scripts/seabed.js
```

通过 `shell.dataset.shellState` 设置：

- `closed`
- `half`
- `open`

### 当前贝壳资源

正式参与当前动画：

- `concepts/shell/shell-bottom.png`
- `concepts/shell/shell-top.png`
- `concepts/shell/shell-pearl.png`

仍然存在但当前主要作为回退/历史资源：

- `concepts/shell/shell-closed.png`
- `concepts/shell/shell-half.png`
- `concepts/shell/shell-open.png`

注意：最近为了保持兼容，`shell-closed.png` 和 `shell-half.png` 被生成成与 `shell-open.png` 接近的图。当前页面主要依赖分层动画，不应该再用这三张来表现真实中间态。

## 贝壳动画后续可调项

如果用户觉得开合不自然，优先只调 CSS，不要立刻重画：

```css
.shell-layer-top {
  transform: translateY(31%) scaleX(1.04) scaleY(0.42) rotate(-0.4deg);
}

.shell-button[data-shell-state="half"] .shell-layer-top {
  transform: translateY(14%) scaleX(1.015) scaleY(0.72) rotate(-0.2deg);
}

.shell-button[data-shell-state="open"] .shell-layer-top {
  transform: none;
}
```

可调方向：

- 闭合态盖得不够：增大 `translateY` 或减小 `scaleY`。
- 闭合态太扁/太假：增大 `scaleY`。
- 半开态太突兀：调 `half` 的 `translateY` 和 `scaleY`，并可延长 transition。
- 珍珠出现太早：降低 half 状态下 `.shell-layer-pearl` 的 `opacity`。
- 珍珠位置不准：优先重新生成 `shell-pearl.png` 或调整 `pearl-button` 热区，不要把珍珠写死进底壳。

## 小鱼当前逻辑

文件：

```text
scripts/seabed.js
```

资源：

```text
concepts/fish/fish-1.png
concepts/fish/fish-2.png
concepts/fish/fish-3.png
concepts/fish/fish-4.png
concepts/fish/fish-5.png
concepts/fish/fish-6.png
```

当前逻辑要点：

- 页面进入时会 seed 少量默认小鱼。
- `addFish(true)` 从贝壳附近生成鱼。
- `fish.length < 7` 时继续补鱼。
- 达到第 7 条后展示“摸鱼之神”回应。
- 鱼通过 `requestAnimationFrame` 更新位置。
- 鼠标靠近时，基于距离给鱼添加逃离速度。
- 之前用户指出过：
  - 小鱼颜色不要太灰。
  - 小鱼不要太小。
  - 游动路径要鲜活，避免原地不动或倒着游。

后续如果优化，优先处理：

- `makeFish()` 里的 size、opacity、speed。
- `moveFish()` 里的方向、速度下限、随机转向概率。
- 鱼 sprite 的 `scaleX(var(--fish-facing))` 方向判断。

## 需要特别注意的编码问题

当前部分 HTML/JS/MD 在 PowerShell 输出中出现乱码，但浏览器和 Git diff 中有些中文仍显示正常。换电脑继续开发时建议：

- 优先用编辑器以 UTF-8 打开文件。
- 不要用会自动改编码的工具批量重写旧文件。
- 如果要清理乱码，单独开一次“编码修复”任务，避免和视觉/交互修改混在一个 commit。

## 后续建议顺序

1. 用户先视觉验收当前贝壳分层动画。
2. 如果贝壳开合位置不满意，只调 `home.css` 的 `.shell-layer-top` transform。
3. 如果珍珠出现/点击不自然，调 `.shell-layer-pearl` 与 `.pearl-button`。
4. 再优化小鱼游动：
   - 更大一点。
   - 更粉一点/更贴合背景。
   - 转向更自然。
5. 最后再整理底部祈愿区的文案和“第 7 条鱼后的回应”。

## 常用验证命令

```powershell
node tests\home-layout.test.cjs
node --check scripts\home-layout.js
node --check scripts\home.js
node --check scripts\seabed.js
```

如果只改 CSS 和图片，至少跑：

```powershell
node tests\home-layout.test.cjs
```
