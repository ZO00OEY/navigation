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
  var fishSources = [
    'concepts/fish/fish-1.png',
    'concepts/fish/fish-2.png',
    'concepts/fish/fish-3.png',
    'concepts/fish/fish-4.png',
    'concepts/fish/fish-5.png',
    'concepts/fish/fish-6.png'
  ];
  var shellFrames = [
    'concepts/shell/web-frames/shell-web-frame-0.png',
    'concepts/shell/web-frames/shell-web-frame-1.png',
    'concepts/shell/web-frames/shell-web-frame-2.png',
    'concepts/shell/web-frames/shell-web-frame-3.png',
    'concepts/shell/web-frames/shell-web-frame-4.png'
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
  var animationFrame = 0;
  var lastTime = 0;
  var bounds = { width: 0, height: 0, upper: 0, lower: 0 };
  var pointer = { x: -9999, y: -9999, active: false };
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
    var node = document.createElement('span');
    var sprite = document.createElement('img');
    var size = fromShell ? randomBetween(50, 70) : randomBetween(46, 66);
    var y = origin ? origin.y + randomBetween(-10, 10) : randomBetween(bounds.upper, bounds.lower - 34);
    var x = origin ? origin.x + randomBetween(-16, 16) : randomBetween(40, bounds.width - 80);
    var cruiseSpeed = randomBetween(28, 48);

    node.className = 'seabed-fish-path' + (fromShell ? ' is-new' : '');
    node.style.setProperty('--fish-size', size + 'px');
    node.style.setProperty('--fish-opacity', randomBetween(0.7, 0.88).toFixed(2));

    sprite.className = 'seabed-fish-sprite';
    sprite.src = fishSources[Math.floor(Math.random() * fishSources.length)];
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
      cruiseSpeed: cruiseSpeed,
      size: size,
      phase: Math.random() * Math.PI * 2
    };
  }

  function addFish(fromShell) {
    if (reducedMotion || fish.length >= 7) return;
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

    if (Math.random() < 0.0018) item.dir *= -1;
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
    var facing = item.dir > 0 ? -1 : 1;
    var bob = Math.sin(now * 0.0022 + item.phase) * 5;
    item.sprite.style.setProperty('--fish-facing', String(facing));
    item.node.style.setProperty('--fish-x', item.x + 'px');
    item.node.style.setProperty('--fish-y', (item.y + bob) + 'px');
    item.node.style.setProperty('--fish-rotate', Math.max(-10, Math.min(10, item.vy * 0.55)) + 'deg');
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
    if (fish.length < 7) {
      addFish(true);
      if (fish.length === 7) {
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
    if (hoverCapable) closeShell();
  });
  shell.addEventListener('focusin', openShell);
  shell.addEventListener('focusout', closeAfterFocusLeaves);
  shell.addEventListener('click', function () {
    openShell();
    scheduleTouchClose();
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
  window.addEventListener('resize', updateBounds);
  if ('ResizeObserver' in window) new ResizeObserver(updateBounds).observe(scene);

  seedFish();
})();
