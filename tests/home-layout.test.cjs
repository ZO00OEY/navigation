const assert = require('assert');
const layout = require('../scripts/home-layout.js');

function scene(width, height, viewportHeight = height) {
  return layout.calculateSceneMode({
    width,
    height,
    viewportHeight,
    positionX: 0.5,
    positionY: 0.5
  });
}

const wide = scene(1920, 940);
assert.equal(wide.topFlowScene, false);
assert.equal(wide.heroHeight, null);

const narrow = scene(720, 1280);
const narrowGeometry = layout.calculateSceneGeometry(
  { width: 720, height: narrow.heroHeight },
  narrow
);
assert.equal(narrow.topFlowScene, true);
assert.equal(narrow.stackedScene, true);
assert.equal(narrow.positionY, 0);
assert.ok(narrowGeometry.door.width >= 720 / 4);
assert.ok(Math.abs(narrowGeometry.sceneBottom - narrow.heroHeight) <= 1);
assert.ok(narrow.heroHeight >= 1280);

const narrowRepeat = layout.calculateSceneMode({
  width: 720,
  height: narrow.heroHeight,
  viewportHeight: 1280,
  positionX: 0.5,
  positionY: 0.5
});
assert.equal(narrowRepeat.topFlowScene, true);
assert.equal(narrowRepeat.heroHeight, narrow.heroHeight);

const extreme = scene(360, 900);
const extremeGeometry = layout.calculateSceneGeometry(
  { width: 360, height: extreme.heroHeight },
  extreme
);
assert.ok(extremeGeometry.door.left >= 0);
assert.ok(extremeGeometry.door.left + extremeGeometry.door.width <= 360);
assert.ok(extremeGeometry.door.top >= 0);
assert.equal(extreme.stackedScene, true);
assert.ok(extremeGeometry.door.top >= 430);
assert.ok(
  extremeGeometry.door.left + extremeGeometry.door.width / 2 >= 360 * 0.52
);

const compactSide = scene(720, 820);
assert.equal(compactSide.stackedScene, false);

assert.equal(layout.fitTitleSize({
  preferred: 72,
  minimum: 12,
  availableWidth: 180,
  widestLine: 240
}), 54);
assert.equal(layout.fitTitleSize({
  preferred: 72,
  minimum: 12,
  availableWidth: 240,
  widestLine: 200
}), 72);

for (const width of [320, 360, 560, 720, 760, 850, 1280, 1920]) {
  for (const height of [640, 900, 1280]) {
    const first = scene(width, height);
    const layoutHeight = first.heroHeight || height;
    const geometry = layout.calculateSceneGeometry(
      { width, height: layoutHeight },
      first
    );
    const repeated = layout.calculateSceneMode({
      width,
      height: layoutHeight,
      viewportHeight: height,
      positionX: 0.5,
      positionY: 0.5
    });

    assert.equal(repeated.topFlowScene, first.topFlowScene);
    assert.equal(repeated.heroHeight, first.heroHeight);
    assert.ok(layoutHeight >= height);
    assert.ok(geometry.sceneBottom >= height - 1);
    assert.ok(geometry.door.left >= 0);
    assert.ok(geometry.door.left + geometry.door.width <= width + 0.01);
    assert.ok(geometry.door.top >= 0);
    assert.ok(geometry.door.top + geometry.door.height <= layoutHeight + 0.01);
    if (first.topFlowScene && geometry.door.width < width * 0.8) {
      const doorCenter = geometry.door.left + geometry.door.width / 2;
      assert.ok(doorCenter >= width * 0.55);
    }
  }
}

console.log('home layout tests: OK');
