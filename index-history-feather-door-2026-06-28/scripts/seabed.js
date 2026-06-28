(function () {
  var scene = document.getElementById('seabedScene');
  var shell = document.getElementById('shellButton');
  var shellFrame = document.getElementById('shellFrame');
  var pearl = document.getElementById('pearlButton');
  var fishGod = document.getElementById('fishGod');
  var message = document.getElementById('seabedMessage');
  var fishLayer = document.getElementById('seabedFishLayer');
  if (!scene || !shell || !shellFrame || !pearl || !fishGod || !message || !fishLayer) return;

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hoverCapable = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var fishConfig = {
    maxCount: 7,
    ambientSize: [46, 66],
    pearlSize: [50, 74]
  };
  var fishSources = [
    { src: 'concepts/fish/fish-1.png', head: 'right' },
    { src: 'concepts/fish/fish-2.png', head: 'right' },
    { src: 'concepts/fish/fish-3.png', head: 'right' },
    { src: 'concepts/fish/fish-4.png', head: 'right' },
    { src: 'concepts/fish/fish-5.png', head: 'right' },
    { src: 'concepts/fish/fish-6.png', head: 'right' }
  ];
  var shellFrames = [
    'concepts/shell/web-frames/shell-web-frame-0.png?v=20260620-shell-trim',
    'concepts/shell/web-frames/shell-web-frame-1.png?v=20260620-shell-trim',
    'concepts/shell/web-frames/shell-web-frame-2.png?v=20260620-shell-trim',
    'concepts/shell/web-frames/shell-web-frame-3.png?v=20260620-shell-trim',
    'concepts/shell/web-frames/shell-web-frame-4.png?v=20260620-shell-trim'
  ];
  var oracleResponses = [
    '摸鱼之神翻了个身：今日宜慢一点。',
    '神说：这条小鱼替你先去打卡。',
    '珍珠记下了你的愿望：周一可以晚点来。',
    '海水已批准：先喝水，再处理大事。',
    '摸鱼之神点点头：你已经很努力地浮着了。'
  ];
  var sequenceToken = 0;
  var fishCount = 0;
  var oracleIndex = 0;
  var messageTimer = 0;
  var touchCloseTimer = 0;
  var shellIdleTimer = 0;
  var animationFrame = 0;
  var lastTime = 0;
  var bounds = { width: 0, height: 0, upper: 0, lower: 0 };
  var pointer = { x: -9999, y: -9999, active: false };
  var seabedSource = { width: 1672, height: 941 };
  var shellHomeAnchorSource = { x: 500, y: 788 };
  var shellAnchorRatio = { x: 0.5, y: 0.56 };
  var shellPositionStorageKey = 'seabedShellPositionAnchoredV2';
  var hasCustomShellPosition = false;
  var shellDrag = null;
  var shellHomeAnimation = 0;
  var fish = [];
  var shellFrameIndex = 0;

  shellFrames.forEach(function (src) {
    var image = new Image();
    image.src = src;
  });

  function setShellFrame(index) {
    shellFrameIndex = Math.max(0, Math.min(shellFrames.length - 1, index));
    shellFrame.src = shellFrames[shellFrameIndex];
  }

  function setShellState(state) {
    shell.dataset.shellState = state;
    var open = state === 'open';
    shell.setAttribute('aria-expanded', String(open));
    shell.setAttribute('aria-label', open ? '祈愿贝壳已打开，可以点击珍珠' : '打开祈愿贝壳');
    if (reducedMotion) setShellFrame(open ? shellFrames.length - 1 : 0);
  }

  function readShellPosition() {
    try {
      var saved = window.localStorage.getItem(shellPositionStorageKey);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      return null;
    }
  }

  function saveShellPosition(position) {
    try {
      window.localStorage.setItem(shellPositionStorageKey, JSON.stringify(position));
    } catch (error) {}
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function parsePercent(value, fallback) {
    var match = String(value || '').match(/-?[\d.]+%/);
    if (!match) return fallback;
    return clamp(parseFloat(match[0]) / 100, 0, 1);
  }

  function calculateShellHome(sceneRect, shellRect) {
    sceneRect = sceneRect || scene.getBoundingClientRect();
    shellRect = shellRect || shell.getBoundingClientRect();
    var scale = Math.max(
      sceneRect.width / seabedSource.width,
      sceneRect.height / seabedSource.height
    );
    var renderedWidth = seabedSource.width * scale;
    var renderedHeight = seabedSource.height * scale;
    var objectPosition = getComputedStyle(shellFrame).objectPosition;
    var art = document.querySelector('.seabed-art');
    if (art) objectPosition = getComputedStyle(art).objectPosition;
    var parts = objectPosition.split(/\s+/);
    var xRatio = parsePercent(parts[0], 0.5);
    var yRatio = parts[1] === 'bottom' ? 1 : parsePercent(parts[1], 1);
    var offsetX = (sceneRect.width - renderedWidth) * xRatio;
    var offsetY = (sceneRect.height - renderedHeight) * yRatio;
    var anchorX = offsetX + shellHomeAnchorSource.x * scale;
    var anchorY = offsetY + shellHomeAnchorSource.y * scale;
    var bottomPx = sceneRect.height - anchorY - shellRect.height * (1 - shellAnchorRatio.y);
    return normalizeShellPosition({
      leftPct: anchorX / sceneRect.width * 100,
      bottomPct: bottomPx / sceneRect.height * 100
    }, sceneRect, shellRect);
  }

  function getShellDragLimits(sceneRect, shellRect) {
    var width = sceneRect ? sceneRect.width : scene.getBoundingClientRect().width;
    var height = sceneRect ? sceneRect.height : scene.getBoundingClientRect().height;
    var shellWidth = shellRect ? shellRect.width : shell.getBoundingClientRect().width;
    var shellHeight = shellRect ? shellRect.height : shell.getBoundingClientRect().height;
    return {
      minLeft: shellWidth * 0.5,
      maxLeft: Math.max(shellWidth * 0.5, width - shellWidth * 0.5),
      minBottom: 0,
      maxBottom: Math.max(0, Math.min(height - shellHeight, height * 0.34))
    };
  }

  function normalizeShellPosition(position, sceneRect, shellRect) {
    if (!position || typeof position.leftPct !== 'number') return null;
    sceneRect = sceneRect || scene.getBoundingClientRect();
    shellRect = shellRect || shell.getBoundingClientRect();
    var limits = getShellDragLimits(sceneRect, shellRect);
    var nextLeft = clamp(position.leftPct / 100 * sceneRect.width, limits.minLeft, limits.maxLeft);
    var rawBottom = typeof position.bottomPct === 'number'
      ? position.bottomPct / 100 * sceneRect.height
      : (typeof position.bottomPx === 'number' ? position.bottomPx : sceneRect.height * 0.098);
    var nextBottom = clamp(rawBottom, limits.minBottom, limits.maxBottom);
    return {
      leftPct: nextLeft / sceneRect.width * 100,
      bottomPct: nextBottom / sceneRect.height * 100
    };
  }

  function applyShellPosition(position) {
    position = normalizeShellPosition(position);
    if (!position) return;
    shell.style.setProperty('--shell-left', position.leftPct.toFixed(3) + '%');
    shell.style.setProperty('--shell-bottom', position.bottomPct.toFixed(3) + '%');
  }

  function syncShellHome() {
    if (hasCustomShellPosition || shellDrag || shellHomeAnimation) return;
    applyShellPosition(calculateShellHome());
  }

  function clearShellPosition() {
    try {
      window.localStorage.removeItem(shellPositionStorageKey);
    } catch (error) {}
    hasCustomShellPosition = false;
    shell.style.removeProperty('--shell-left');
    shell.style.removeProperty('--shell-bottom');
    applyShellPosition(calculateShellHome());
  }

  function readCurrentShellPosition(sceneRect, shellRect) {
    sceneRect = sceneRect || scene.getBoundingClientRect();
    shellRect = shellRect || shell.getBoundingClientRect();
    return normalizeShellPosition({
      leftPct: (shellRect.left - sceneRect.left + shellRect.width * 0.5) / sceneRect.width * 100,
      bottomPct: (sceneRect.bottom - shellRect.bottom) / sceneRect.height * 100
    }, sceneRect, shellRect);
  }

  function easeInOutSine(progress) {
    return -(Math.cos(Math.PI * progress) - 1) / 2;
  }

  function animateShellHome() {
    window.cancelAnimationFrame(shellHomeAnimation);
    var sceneRect = scene.getBoundingClientRect();
    var shellRect = shell.getBoundingClientRect();
    var start = readCurrentShellPosition(sceneRect, shellRect);
    var target = calculateShellHome(sceneRect, shellRect);
    var distance = Math.hypot(
      (target.leftPct - start.leftPct) / 100 * sceneRect.width,
      (target.bottomPct - start.bottomPct) / 100 * sceneRect.height
    );
    var duration = reducedMotion ? 0 : clamp(760 + distance * 1.2, 920, 1320);
    var wiggleLeft = clamp(distance / sceneRect.width * 4.2, 0.45, 2.6);
    var wiggleBottom = clamp(distance / sceneRect.height * 2.8, 0.3, 1.9);
    var phase = start.leftPct < target.leftPct ? 1 : -1;
    var jitterSeed = Math.random() * Math.PI * 2;
    var startTime = performance.now();
    hasCustomShellPosition = false;
    try {
      window.localStorage.removeItem(shellPositionStorageKey);
    } catch (error) {}

    function step(now) {
      var progress = duration ? clamp((now - startTime) / duration, 0, 1) : 1;
      var eased = easeInOutSine(progress);
      var envelope = Math.sin(progress * Math.PI);
      var wander =
        Math.sin(progress * Math.PI * 1.35 + jitterSeed) * 0.62 +
        Math.sin(progress * Math.PI * 3.7 + jitterSeed * 0.43) * 0.26 +
        Math.sin(progress * Math.PI * 6.1 + jitterSeed * 1.7) * 0.12;
      var bob =
        Math.sin(progress * Math.PI * 1.8 + jitterSeed * 0.7) * 0.5 +
        Math.sin(progress * Math.PI * 4.6 + jitterSeed) * 0.22;
      applyShellPosition({
        leftPct: start.leftPct + (target.leftPct - start.leftPct) * eased + wander * envelope * wiggleLeft * phase,
        bottomPct: start.bottomPct + (target.bottomPct - start.bottomPct) * eased + bob * envelope * wiggleBottom
      });
      if (progress < 1) {
        shellHomeAnimation = window.requestAnimationFrame(step);
        return;
      }
      shellHomeAnimation = 0;
      shell.classList.remove('is-returning-home');
      shell.classList.remove('is-resetting', 'is-idle-wiggle');
      void shell.offsetWidth;
      shell.classList.add('is-resetting');
    }

    shell.classList.add('is-returning-home');
    shellHomeAnimation = window.requestAnimationFrame(step);
  }

  function resetShellHome() {
    if (shellDrag) return;
    scheduleShellIdleWiggle();
    sequenceToken++;
    window.clearTimeout(touchCloseTimer);
    setShellState('closed');
    setShellFrame(0);
    animateShellHome();
  }

  function wiggleShellIdle() {
    if (
      reducedMotion ||
      document.hidden ||
      shellDrag ||
      shellHomeAnimation ||
      shell.dataset.shellState !== 'closed' ||
      shell.classList.contains('is-resetting') ||
      shell.matches(':hover')
    ) {
      scheduleShellIdleWiggle();
      return;
    }
    shell.classList.remove('is-resetting', 'is-idle-wiggle');
    void shell.offsetWidth;
    shell.classList.add('is-idle-wiggle');
  }

  function scheduleShellIdleWiggle() {
    window.clearTimeout(shellIdleTimer);
    if (reducedMotion) return;
    shellIdleTimer = window.setTimeout(wiggleShellIdle, randomBetween(10000, 15000));
  }

  var savedShellPosition = readShellPosition();
  hasCustomShellPosition = !!savedShellPosition;
  applyShellPosition(savedShellPosition || calculateShellHome());

  function wait(ms, token) {
    return new Promise(function (resolve) {
      window.setTimeout(function () {
        resolve(token === sequenceToken);
      }, reducedMotion ? 0 : ms);
    });
  }

  async function openShell() {
    window.clearTimeout(touchCloseTimer);
    if (shell.dataset.shellState === 'open') return;
    var token = ++sequenceToken;
    setShellState(reducedMotion ? 'open' : 'half');
    if (!reducedMotion) {
      for (var i = shellFrameIndex + 1; i < shellFrames.length - 1; i++) {
        setShellFrame(i);
        if (!await wait(72, token)) return;
      }
    }
    setShellState('open');
    setShellFrame(shellFrames.length - 1);
  }

  async function closeShell() {
    window.clearTimeout(touchCloseTimer);
    if (shell.dataset.shellState === 'closed') return;
    var token = ++sequenceToken;
    setShellState(reducedMotion ? 'closed' : 'half');
    if (!reducedMotion) {
      for (var i = shellFrameIndex - 1; i > 0; i--) {
        setShellFrame(i);
        if (!await wait(62, token)) return;
      }
    }
    setShellState('closed');
    setShellFrame(0);
  }

  function showMessage(text) {
    window.clearTimeout(messageTimer);
    message.textContent = text;
    message.classList.add('is-visible');
    messageTimer = window.setTimeout(function () {
      message.classList.remove('is-visible');
    }, 3200);
  }

  function updateBounds() {
    var rect = scene.getBoundingClientRect();
    bounds.width = Math.max(1, rect.width);
    bounds.height = Math.max(1, rect.height);
    bounds.upper = bounds.height * 0.43;
    bounds.lower = bounds.height - 34;
  }

  function randomBetween(min, max) {
    return min + Math.random() * (max - min);
  }

  function getShellOrigin() {
    var sceneRect = scene.getBoundingClientRect();
    var shellRect = shell.getBoundingClientRect();
    return {
      x: shellRect.left - sceneRect.left + shellRect.width * 0.5,
      y: shellRect.top - sceneRect.top + shellRect.height * 0.56
    };
  }

  function makeFish(options) {
    var fromShell = options && options.fromShell;
    var origin = fromShell ? getShellOrigin() : null;
    var direction = Math.random() < 0.5 ? -1 : 1;
    var source = fishSources[Math.floor(Math.random() * fishSources.length)];
    var sizeRange = fromShell ? fishConfig.pearlSize : fishConfig.ambientSize;
    var node = document.createElement('span');
    var sprite = document.createElement('img');
    var size = randomBetween(sizeRange[0], sizeRange[1]);
    var y = origin ? origin.y + randomBetween(-10, 10) : randomBetween(bounds.upper, bounds.lower - 34);
    var x = origin ? origin.x + randomBetween(-16, 16) : randomBetween(40, bounds.width - 80);
    var cruiseSpeed = randomBetween(28, 48);

    node.className = 'seabed-fish-path' + (fromShell ? ' is-new' : '');
    node.style.setProperty('--fish-size', size + 'px');
    node.style.setProperty('--fish-opacity', randomBetween(0.7, 0.88).toFixed(2));

    sprite.className = 'seabed-fish-sprite';
    sprite.src = source.src;
    sprite.alt = '';
    sprite.decoding = 'async';
    node.appendChild(sprite);
    fishLayer.appendChild(node);

    return {
      node: node,
      sprite: sprite,
      x: x,
      y: y,
      vx: direction * cruiseSpeed,
      vy: randomBetween(-4, 4),
      dir: direction,
      face: direction,
      headBias: source.head === 'left' ? -1 : 1,
      cruiseSpeed: cruiseSpeed,
      size: size,
      phase: Math.random() * Math.PI * 2
    };
  }

  function addFish(fromShell) {
    if (reducedMotion || fish.length >= fishConfig.maxCount) return;
    fish.push(makeFish({ fromShell: fromShell }));
    fishCount = Math.max(fishCount, fish.length);
    ensureAnimation();
  }

  function seedFish() {
    updateBounds();
    while (!reducedMotion && fish.length < 2) addFish(false);
  }

  function moveFish(item, delta, now) {
    var dx = item.x - pointer.x;
    var dy = item.y - pointer.y;
    var distance = Math.sqrt(dx * dx + dy * dy);

    if (pointer.active && distance > 0 && distance < 128) {
      var force = (128 - distance) / 128 * 55;
      item.vx += dx / distance * force * delta;
      item.vy += dy / distance * force * delta;
    }

    var targetVx = item.dir * item.cruiseSpeed;
    item.vx += (targetVx - item.vx) * Math.min(1, 1.6 * delta);
    item.vy += (Math.sin(now * 0.0013 + item.phase) * 8 - item.vy) * Math.min(1, 0.85 * delta);
    item.vx += (Math.random() - 0.5) * 1.8 * delta;
    item.vy += (Math.random() - 0.5) * 1.4 * delta;
    item.x += item.vx * delta;
    item.y += item.vy * delta;
    item.vx *= 0.998;
    item.vy *= 0.992;

    if (Math.random() < 0.0014) item.dir *= -1;
    if (item.x < -80) {
      item.x = bounds.width + 60;
      item.dir = -1;
      item.vx = item.dir * item.cruiseSpeed;
    }
    if (item.x > bounds.width + 80) {
      item.x = -60;
      item.dir = 1;
      item.vx = item.dir * item.cruiseSpeed;
    }
    if (item.y < bounds.upper) {
      item.y = bounds.upper;
      item.vy = Math.abs(item.vy) * 0.72;
    }
    if (item.y > bounds.lower) {
      item.y = bounds.lower;
      item.vy = -Math.abs(item.vy) * 0.72;
    }

    if (Math.abs(item.vx) < item.cruiseSpeed * 0.28) {
      item.vx = item.dir * item.cruiseSpeed * 0.28;
    }
    if (Math.abs(item.vx) > 4) {
      item.face = item.vx >= 0 ? 1 : -1;
      item.dir = item.face;
    }
    var facing = item.face * item.headBias;
    var bob = Math.sin(now * 0.0022 + item.phase) * 5;
    var swimAngle = Math.atan2(item.vy, Math.max(18, Math.abs(item.vx))) * 180 / Math.PI;
    item.sprite.style.setProperty('--fish-facing', String(facing));
    item.node.style.setProperty('--fish-x', item.x + 'px');
    item.node.style.setProperty('--fish-y', (item.y + bob) + 'px');
    item.node.style.setProperty('--fish-rotate', Math.max(-12, Math.min(12, swimAngle)) + 'deg');
  }

  function animate(now) {
    animationFrame = 0;
    var delta = Math.min(0.05, (now - lastTime) / 1000 || 0.016);
    lastTime = now;
    fish.forEach(function (item) {
      moveFish(item, delta, now);
    });
    if (fish.length) animationFrame = window.requestAnimationFrame(animate);
  }

  function ensureAnimation() {
    if (animationFrame || reducedMotion) return;
    lastTime = performance.now();
    animationFrame = window.requestAnimationFrame(animate);
  }

  function scheduleTouchClose() {
    if (hoverCapable) return;
    window.clearTimeout(touchCloseTimer);
    touchCloseTimer = window.setTimeout(closeShell, 1500);
  }

  async function summonFish() {
    await openShell();
    if (fish.length < fishConfig.maxCount) {
      addFish(true);
      if (fish.length === fishConfig.maxCount) {
        showMessage('第七条小鱼游过，摸鱼之神开始回应你了。');
      }
    } else {
      showMessage(oracleResponses[oracleIndex % oracleResponses.length]);
      oracleIndex += 1;
    }
    scheduleTouchClose();
  }

  function closeAfterFocusLeaves(event) {
    if (shell.contains(event.relatedTarget)) return;
    if (!shell.matches(':hover')) closeShell();
  }

  scene.addEventListener('pointermove', function (event) {
    var rect = scene.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
    pointer.active = true;
  });
  scene.addEventListener('pointerleave', function () {
    pointer.active = false;
    pointer.x = -9999;
    pointer.y = -9999;
  });
  shell.addEventListener('pointerenter', function () {
    if (hoverCapable) openShell();
  });
  shell.addEventListener('pointerleave', function () {
    if (hoverCapable && !shellDrag) closeShell();
  });
  shell.addEventListener('pointerdown', function (event) {
    if (event.button !== 0 || pearl.contains(event.target)) return;
    scheduleShellIdleWiggle();
    window.cancelAnimationFrame(shellHomeAnimation);
    shellHomeAnimation = 0;
    shell.classList.remove('is-returning-home');
    var sceneRect = scene.getBoundingClientRect();
    var shellRect = shell.getBoundingClientRect();
    shellDrag = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startLeft: shellRect.left - sceneRect.left + shellRect.width * 0.5,
      startBottom: sceneRect.bottom - shellRect.bottom,
      moved: false
    };
    shell.classList.add('is-dragging');
    shell.setPointerCapture(event.pointerId);
  });
  shell.addEventListener('pointermove', function (event) {
    if (!shellDrag || event.pointerId !== shellDrag.pointerId) return;
    var sceneRect = scene.getBoundingClientRect();
    var shellRect = shell.getBoundingClientRect();
    var limits = getShellDragLimits(sceneRect, shellRect);
    var dx = event.clientX - shellDrag.startX;
    var dy = event.clientY - shellDrag.startY;
    var nextLeft = clamp(shellDrag.startLeft + dx, limits.minLeft, limits.maxLeft);
    var nextBottom = clamp(shellDrag.startBottom - dy, limits.minBottom, limits.maxBottom);
    shellDrag.moved = shellDrag.moved || Math.abs(dx) > 3 || Math.abs(dy) > 3;
    applyShellPosition({
      leftPct: nextLeft / sceneRect.width * 100,
      bottomPct: nextBottom / sceneRect.height * 100
    });
  });
  shell.addEventListener('pointerup', function (event) {
    if (!shellDrag || event.pointerId !== shellDrag.pointerId) return;
    var sceneRect = scene.getBoundingClientRect();
    var shellRect = shell.getBoundingClientRect();
    saveShellPosition(normalizeShellPosition({
      leftPct: (shellRect.left - sceneRect.left + shellRect.width * 0.5) / sceneRect.width * 100,
      bottomPct: (sceneRect.bottom - shellRect.bottom) / sceneRect.height * 100
    }, sceneRect, shellRect));
    hasCustomShellPosition = true;
    shell.dataset.dragged = shellDrag.moved ? 'true' : 'false';
    shellDrag = null;
    shell.classList.remove('is-dragging');
  });
  shell.addEventListener('pointercancel', function (event) {
    if (!shellDrag || event.pointerId !== shellDrag.pointerId) return;
    shellDrag = null;
    shell.classList.remove('is-dragging');
  });
  shell.addEventListener('focusin', openShell);
  shell.addEventListener('focusout', closeAfterFocusLeaves);
  shell.addEventListener('click', function (event) {
    if (shell.dataset.dragged === 'true') {
      event.preventDefault();
      shell.dataset.dragged = 'false';
      return;
    }
    openShell();
    scheduleTouchClose();
  });
  shell.addEventListener('contextmenu', function (event) {
    event.preventDefault();
    resetShellHome();
  });
  shell.addEventListener('animationend', function (event) {
    if (event.animationName === 'shellWiggleHome' || event.animationName === 'shellIdleWiggle') {
      shell.classList.remove('is-resetting', 'is-idle-wiggle');
      scheduleShellIdleWiggle();
    }
  });
  shell.addEventListener('keydown', function (event) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    openShell();
  });
  pearl.addEventListener('click', function (event) {
    event.stopPropagation();
    summonFish();
  });
  fishGod.addEventListener('click', summonFish);
  window.addEventListener('blur', closeShell);
  document.addEventListener('visibilitychange', scheduleShellIdleWiggle);
  window.addEventListener('resize', function () {
    updateBounds();
    syncShellHome();
  });
  if ('ResizeObserver' in window) {
    new ResizeObserver(function () {
      updateBounds();
      syncShellHome();
    }).observe(scene);
  }

  seedFish();
  scheduleShellIdleWiggle();
})();
