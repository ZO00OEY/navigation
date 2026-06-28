(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.HomeHeroLayout = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  var SOURCE = { width: 1672, height: 941, waterY: 600 };
  var DOOR = { x: 1023, y: 236, width: 184, height: 369 };
  var DOOR_PAD = { x: 7, y: 7 };

  function calculateSceneMode(input) {
    var stackedScene =
      input.width <= 760 &&
      (input.viewportHeight || input.height || 0) / input.width >= 1.35;
    var compactBaseHeight = input.width <= 760
      ? (input.viewportHeight || input.height || 920)
      : (input.height || input.viewportHeight || 920);
    var coverScale = Math.max(
      input.width / SOURCE.width,
      compactBaseHeight / SOURCE.height
    );
    var regionSourceWidth = DOOR.width + DOOR_PAD.x * 2;
    var regionSourceX = DOOR.x - DOOR_PAD.x;
    var naturalDoorWidth = regionSourceWidth * coverScale;
    var naturalOffsetX = (input.width - SOURCE.width * coverScale) * input.positionX;
    var naturalDoorLeft = naturalOffsetX + regionSourceX * coverScale;
    var naturalDoorRight = naturalDoorLeft + naturalDoorWidth;
    var sceneConstrained =
      naturalDoorWidth > input.width / 3 ||
      naturalDoorLeft < 0 ||
      naturalDoorRight > input.width;
    var topFlowScene = sceneConstrained && input.width <= 760;
    var constrainedScale = sceneConstrained
      ? (input.width / 4) / regionSourceWidth
      : coverScale;
    var viewportFillScale = (input.viewportHeight || input.height || 920) / SOURCE.height;
    var stackedDoorTop = stackedScene
      ? Math.max(430, Math.min(580, (input.viewportHeight || input.height || 900) * 0.52))
      : null;
    var stackedBottomFillScale = stackedScene
      ? Math.max(
        0,
        ((input.viewportHeight || input.height || 900) - stackedDoorTop) /
          (SOURCE.height - (DOOR.y - DOOR_PAD.y))
      )
      : 0;
    var scale = topFlowScene
      ? (stackedScene
        ? Math.max(constrainedScale, stackedBottomFillScale)
        : Math.max(constrainedScale, viewportFillScale))
      : constrainedScale;
    var stackedOffsetY = stackedScene
      ? stackedDoorTop - (DOOR.y - DOOR_PAD.y) * scale
      : null;
    var sceneHeight = SOURCE.height * scale + (stackedOffsetY || 0);

    return {
      scale: scale,
      positionX: input.positionX,
      positionY: sceneConstrained ? (topFlowScene ? 0 : 1) : input.positionY,
      topFlowScene: topFlowScene,
      stackedScene: stackedScene,
      offsetY: stackedOffsetY,
      heroHeight: topFlowScene
        ? Math.max(Math.ceil(sceneHeight), input.viewportHeight || input.height || 0)
        : null
    };
  }

  function calculateSceneGeometry(rect, scene) {
    var scale = scene.scale;
    var regionX = DOOR.x - DOOR_PAD.x;
    var regionY = DOOR.y - DOOR_PAD.y;
    var offsetX = (rect.width - SOURCE.width * scale) * scene.positionX;
    var offsetY = scene.offsetY === null || scene.offsetY === undefined
      ? (rect.height - SOURCE.height * scale) * scene.positionY
      : scene.offsetY;
    var width = (DOOR.width + DOOR_PAD.x * 2) * scale;
    var height = (DOOR.height + DOOR_PAD.y * 2) * scale;
    if (scene.topFlowScene && width <= rect.width) {
      var edgeMargin = Math.min(20, Math.max(8, rect.width * 0.025));
      var targetDoorCenter = rect.width * (scene.stackedScene ? 0.59 : 0.72);
      var targetDoorLeft = targetDoorCenter - width / 2;
      var minimumDoorLeft = edgeMargin;
      var maximumDoorLeft = rect.width - edgeMargin - width;
      var doorLeft = Math.min(
        maximumDoorLeft,
        Math.max(minimumDoorLeft, targetDoorLeft)
      );
      offsetX = doorLeft - regionX * scale;
    }

    return {
      scale: scale,
      offsetX: offsetX,
      offsetY: offsetY,
      sceneBottom: offsetY + SOURCE.height * scale,
      door: {
        regionX: regionX,
        regionY: regionY,
        left: offsetX + regionX * scale,
        top: offsetY + regionY * scale,
        width: width,
        height: height,
        padX: DOOR_PAD.x * scale,
        padY: DOOR_PAD.y * scale
      }
    };
  }

  function fitTitleSize(input) {
    if (!input.widestLine || input.widestLine <= input.availableWidth) {
      return input.preferred;
    }

    return Math.max(
      input.minimum,
      input.preferred * input.availableWidth / input.widestLine
    );
  }

  return {
    source: SOURCE,
    door: DOOR,
    doorPad: DOOR_PAD,
    calculateSceneMode: calculateSceneMode,
    calculateSceneGeometry: calculateSceneGeometry,
    fitTitleSize: fitTitleSize
  };
});
