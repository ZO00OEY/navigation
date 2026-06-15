(function () {
  var hero = document.getElementById('hero');
  var art = document.getElementById('heroArt');
  var canvas = document.getElementById('rippleCanvas');
  var ctx = canvas.getContext('2d');
  var door = document.getElementById('doorHotspot');
  var heroCopy = document.querySelector('.hero-copy');
  var heroEyebrow = document.querySelector('.hero-eyebrow');
  var titleLines = document.querySelectorAll('.hero-copy .title-line');
  var doorLayerImages = document.querySelectorAll('.door-layer-image');
  var doorEraser = document.getElementById('doorEraser');
  var doorEraserCtx = doorEraser.getContext('2d');
  var aura = document.getElementById('doorAura');
  var sidebar = document.getElementById('sidebar');
  var themeIcon = document.getElementById('themeIcon');
  var railThemeIcon = document.getElementById('railThemeIcon');
  var sidebarNav = document.getElementById('sidebarNav');
  var searchOverlay = document.getElementById('searchOverlay');
  var siteSearch = document.getElementById('siteSearch');
  var searchResults = document.getElementById('searchResults');
  var railLogo = document.getElementById('sidebarOpen');
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var compactSidebarQuery = window.matchMedia('(max-width: 760px)');
  var ripples = [];
  var distortionBuffer = document.createElement('canvas');
  var distortionCtx = distortionBuffer.getContext('2d');
  var lastRipple = { x: -999, y: -999, time: 0 };
  var lastDoorRipple = { x: -999, y: -999, time: 0 };
  var pointerVelocity = { x: 0, y: 0 };
  var doorMotion = {
    hovering: false,
    targetX: 0, targetY: 0, targetRX: 0, targetRY: 0,
    x: 0, y: 0, rx: 0, ry: 0
  };
  var imageMap = { scale: 1, offsetX: 0, offsetY: 0 };
  var layoutFrame = 0;
  var animationFrame = 0;
  var lastAnimationTime = 0;
  var sceneLayout = {
    heroHeight: null,
    actionLeft: null,
    actionTop: null,
    noteLeft: null,
    noteTop: null
  };
  var SOURCE = HomeHeroLayout.source;
  var DOOR = HomeHeroLayout.door;
  var DOOR_PAD = HomeHeroLayout.doorPad;

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, function (char) {
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char];
    });
  }

  function buildPortalCards() {
    var grid = document.getElementById('portalGrid');
    var blocks = ((typeof SITE_DATA !== 'undefined' && SITE_DATA.blocks) || []).filter(function (block) {
      return block.type !== 'profile';
    });
    grid.innerHTML = blocks.map(function (block, index) {
      var links = [];
      (block.subcategories || []).forEach(function (sub) {
        links = links.concat(sub.links || []);
      });
      links = links.concat(block.links || []);
      var href = block.page ? 'detail.html?page=' + encodeURIComponent(block.page) : (links[0] && links[0].url || '#');
      var desc = links.slice(0, 3).map(function (link) { return link.title; }).join(' · ');
      return '<a class="portal-card" href="' + escapeHtml(href) + '">' +
        '<span class="portal-index">0' + (index + 1) + ' / 0' + blocks.length + '</span>' +
        '<span class="card-arrow">↗</span>' +
        '<h3>' + escapeHtml(block.name) + '</h3>' +
        '<p>' + escapeHtml(desc || '内容正在慢慢浮出水面。') + '</p>' +
      '</a>';
    }).join('');
  }

  function getProfile() {
    return ((typeof SITE_DATA !== 'undefined' && SITE_DATA.blocks) || []).find(function (block) {
      return block.type === 'profile';
    }) || {};
  }

  function buildSidebar() {
    var blocks = ((typeof SITE_DATA !== 'undefined' && SITE_DATA.blocks) || []).filter(function (block) {
      return block.type !== 'profile';
    });
    sidebarNav.innerHTML = blocks.map(function (block) {
      var links = [];
      (block.subcategories || []).forEach(function (sub) {
        links = links.concat(sub.links || []);
      });
      links = links.concat(block.links || []);
      return '<section class="sidebar-group">' +
        '<div class="sidebar-group-title">' + escapeHtml(block.name) + '</div>' +
        links.map(function (link) {
          return '<a class="sidebar-link" href="' + escapeHtml(link.url) + '" data-sidebar-search="' +
            escapeHtml((link.title || '') + ' ' + (link.desc || '') + ' ' + block.name) + '"' +
            (link.target ? ' target="' + escapeHtml(link.target) + '" rel="noopener"' : '') + '>' +
            '<span>' + escapeHtml(link.title) + '</span><span class="sidebar-link-arrow">›</span></a>';
        }).join('') +
      '</section>';
    }).join('');

    var profile = getProfile();
    var avatar = profile.avatar
      ? '<img class="profile-avatar" src="' + escapeHtml(profile.avatar) + '" alt="">'
      : '<span class="profile-avatar"></span>';
    document.getElementById('profileRow').innerHTML =
      avatar +
      '<span class="profile-copy"><span class="profile-name">' +
      escapeHtml(profile.username || profile.name || '个人资料') +
      '</span><span class="profile-bio">' +
      escapeHtml(profile.bio || '个人介绍稍后补充') +
      '</span></span><span class="sidebar-link-arrow">›</span>';
  }

  function getSearchItems() {
    var items = [];
    ((typeof SITE_DATA !== 'undefined' && SITE_DATA.blocks) || []).forEach(function (block) {
      if (block.type === 'profile') return;
      var links = [];
      (block.subcategories || []).forEach(function (sub) {
        links = links.concat(sub.links || []);
      });
      links = links.concat(block.links || []);
      links.forEach(function (link) {
        items.push({
          title: link.title || '',
          desc: link.desc || block.name || '',
          group: block.name || '',
          url: link.url || '#',
          target: link.target || ''
        });
      });
    });
    return items;
  }

  function renderSearchResults() {
    var query = siteSearch.value.trim().toLowerCase();
    var items = getSearchItems().filter(function (item) {
      return !query || (item.title + ' ' + item.desc + ' ' + item.group).toLowerCase().indexOf(query) !== -1;
    }).slice(0, 14);
    if (!items.length) {
      searchResults.innerHTML = '<div class="search-empty">没有找到对应入口</div>';
      return;
    }
    searchResults.innerHTML = items.map(function (item) {
      return '<a class="search-result" href="' + escapeHtml(item.url) + '"' +
        (item.target ? ' target="' + escapeHtml(item.target) + '" rel="noopener"' : '') + '>' +
        '<span class="search-result-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg></span>' +
        '<span><strong>' + escapeHtml(item.title) + '</strong><small>' +
        escapeHtml(item.group + (item.desc ? ' · ' + item.desc : '')) +
        '</small></span></a>';
    }).join('');
  }

  function syncThemeStatus() {
    var dark = document.documentElement.getAttribute('data-theme') === 'dark';
    var icon = dark
      ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20.7 15.1A8.5 8.5 0 018.9 3.3 8.5 8.5 0 1020.7 15.1z"/></svg>'
      : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42"/></svg>';
    themeIcon.innerHTML = icon;
    railThemeIcon.innerHTML = icon;
    document.querySelector('meta[name="theme-color"]').setAttribute('content', dark ? '#111218' : '#f8eeef');
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    syncThemeStatus();
  }

  function createClickBurst(event) {
    if (reducedMotion) return;
    if (event.target.closest && event.target.closest('.rail-logo')) return;
    var dark = document.documentElement.getAttribute('data-theme') === 'dark';
    var hues = dark
      ? [220, 235, 250, 260, 270, 280, 240, 255]
      : [340, 350, 355, 0, 10, 20, 330, 345];
    for (var i = 0; i < 24; i++) {
      var particle = document.createElement('div');
      var angle = Math.PI * 2 * i / 24 + (Math.random() - 0.5) * 0.5;
      var distance = 30 + Math.random() * 85;
      var hue = hues[Math.floor(Math.random() * hues.length)];
      particle.className = 'firework-particle' + (Math.random() < 0.2 ? ' star' : '');
      particle.style.cssText =
        '--tx:' + Math.cos(angle) * distance + 'px;' +
        '--ty:' + Math.sin(angle) * distance + 'px;' +
        'background:hsl(' + hue + ',85%,' + (60 + Math.random() * 20) + '%);' +
        'left:' + event.clientX + 'px;top:' + event.clientY + 'px;';
      document.body.appendChild(particle);
      window.setTimeout(function (node) { node.remove(); }, 900, particle);
    }
  }

  function openSidebar() {
    document.body.classList.add('sidebar-open');
    sidebar.setAttribute('aria-hidden', 'false');
    scheduleLayout();
  }

  function closeSidebar() {
    document.body.classList.remove('sidebar-open');
    sidebar.setAttribute('aria-hidden', 'true');
    scheduleLayout();
  }

  function handleViewportChange() {
    if (compactSidebarQuery.matches) closeSidebar();
    scheduleLayout();
  }

  function openSearch() {
    searchOverlay.classList.add('open');
    searchOverlay.setAttribute('aria-hidden', 'false');
    renderSearchResults();
    window.setTimeout(function () { siteSearch.focus(); }, 40);
  }

  function closeSearch() {
    searchOverlay.classList.remove('open');
    searchOverlay.setAttribute('aria-hidden', 'true');
  }

  function dissolveLogoAndOpen() {
    if (reducedMotion) {
      openSidebar();
      return;
    }
    var rect = railLogo.getBoundingClientRect();
    var dark = document.documentElement.getAttribute('data-theme') === 'dark';
    var color = dark ? '#91a8ef' : '#d96f98';
    railLogo.classList.add('is-dissolving');
    for (var i = 0; i < 22; i++) {
      var particle = document.createElement('i');
      var angle = Math.random() * Math.PI * 2;
      var distance = 18 + Math.random() * 30;
      particle.className = 'logo-particle';
      particle.style.left = (rect.left + rect.width * (0.35 + Math.random() * 0.3)) + 'px';
      particle.style.top = (rect.top + rect.height * (0.35 + Math.random() * 0.3)) + 'px';
      particle.style.background = color;
      particle.style.setProperty('--px', Math.cos(angle) * distance + 'px');
      particle.style.setProperty('--py', Math.sin(angle) * distance + 'px');
      document.body.appendChild(particle);
      window.setTimeout(function (node) { node.remove(); }, 500, particle);
    }
    window.setTimeout(function () {
      openSidebar();
      railLogo.classList.remove('is-dissolving');
    }, 180);
  }

  function readCssPixels(name, fallback) {
    var value = parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name));
    return Number.isFinite(value) ? value : fallback;
  }

  function fitHeroTypography(heroRect, visualDoorLeft, visualDoorTop, scene) {
    var compact = heroRect.width <= 850;
    var preferred = compact
      ? Math.min(72, Math.max(50, heroRect.width * 0.095))
      : Math.min(112, Math.max(60, heroRect.width * 0.066));
    var navigationWidth = readCssPixels('--layout-nav-width', 62);
    var heroGutter = readCssPixels('--hero-gutter', 30);
    var railSafeLeft = heroRect.left + navigationWidth + heroGutter;
    var doorScreenLeft = heroRect.left + visualDoorLeft;
    var doorScreenTop = heroRect.top + visualDoorTop;
    var safetyGap = Math.max(18, heroRect.width * 0.022);
    var availableWidth = scene.stackedScene
      ? Math.max(180, heroRect.right - railSafeLeft - 22)
      : Math.max(48, doorScreenLeft - railSafeLeft - safetyGap);

    heroCopy.style.left = (railSafeLeft - heroRect.left) + 'px';
    heroCopy.style.right = 'auto';
    heroCopy.style.width = availableWidth + 'px';
    heroCopy.style.top = scene.stackedScene ? '104px' : '';
    hero.dataset.layout = scene.stackedScene ? 'stacked' : 'side';
    if (scene.stackedScene) {
      preferred = Math.min(52, Math.max(38, heroRect.width * 0.12));
    }
    heroCopy.style.setProperty('--hero-title-size', preferred + 'px');
    var minimum = scene.stackedScene ? 30 : (compact ? 12 : 36);
    var widestLine = 0;
    titleLines.forEach(function (line) {
      widestLine = Math.max(widestLine, line.getBoundingClientRect().width);
    });
    var fitted = HomeHeroLayout.fitTitleSize({
      preferred: preferred,
      minimum: minimum,
      availableWidth: availableWidth,
      widestLine: widestLine
    });
    heroCopy.style.setProperty('--hero-title-size', fitted.toFixed(2) + 'px');
    heroCopy.style.setProperty('--hero-copy-ratio', Math.max(0.72, fitted / preferred).toFixed(3));

    heroCopy.style.setProperty('--eyebrow-lift', '0px');
    var eyebrowRect = heroEyebrow.getBoundingClientRect();
    var doorOverlapX = !scene.stackedScene && eyebrowRect.right + safetyGap > doorScreenLeft;
    var doorOverlapY = !scene.stackedScene && eyebrowRect.bottom + safetyGap > doorScreenTop;
    if (doorOverlapX && doorOverlapY) {
      var lift = Math.min(42, eyebrowRect.bottom + safetyGap - doorScreenTop);
      heroCopy.style.setProperty('--eyebrow-lift', (-lift) + 'px');
    }
  }

  function setLayoutValue(key, value, apply) {
    if (sceneLayout[key] !== null && Math.abs(sceneLayout[key] - value) < 0.75) return;
    sceneLayout[key] = value;
    apply(value);
  }

  function positionHeroPrompts(heroRect, sceneBottom, scene) {
    var safeLeft = heroCopy.offsetLeft;
    var visibleBottom = Math.min(heroRect.height, sceneBottom);
    var noteTop = Math.max(0, visibleBottom - 50);
    var copyRect = heroCopy.getBoundingClientRect();
    var copyBottom = copyRect.bottom - heroRect.top;
    var actionTop = scene.topFlowScene
      ? Math.max(copyBottom + 22, noteTop - 76)
      : copyBottom + 24;
    if (scene.stackedScene) {
      actionTop = Math.max(0, Math.min(copyBottom + 20, scene.doorTop - 66));
    }
    actionTop = Math.max(0, Math.min(actionTop, noteTop - 58));

    setLayoutValue('actionLeft', safeLeft, function (value) {
      hero.style.setProperty('--hero-action-left', value.toFixed(2) + 'px');
    });
    setLayoutValue('actionTop', actionTop, function (value) {
      hero.style.setProperty('--hero-action-top', value.toFixed(2) + 'px');
    });
    setLayoutValue('noteLeft', safeLeft, function (value) {
      hero.style.setProperty('--scroll-note-left', value.toFixed(2) + 'px');
    });
    setLayoutValue('noteTop', noteTop, function (value) {
      hero.style.setProperty('--scroll-note-top', value.toFixed(2) + 'px');
    });
  }

  function getObjectPosition() {
    var objectPosition = getComputedStyle(art).objectPosition.split(/\s+/);
    return {
      x: objectPosition[0] && objectPosition[0].endsWith('%')
        ? parseFloat(objectPosition[0]) / 100
        : 0.5,
      y: objectPosition[1] && objectPosition[1].endsWith('%')
        ? parseFloat(objectPosition[1]) / 100
        : 0.5
    };
  }

  function calculateSceneMode(rect) {
    var objectPosition = getObjectPosition();
    return HomeHeroLayout.calculateSceneMode({
      width: rect.width,
      height: rect.height,
      viewportHeight: window.innerHeight,
      positionX: objectPosition.x,
      positionY: objectPosition.y
    });
  }

  function syncHeroHeight(targetHeight) {
    if (targetHeight === null) {
      if (sceneLayout.heroHeight === null) return;
      sceneLayout.heroHeight = null;
      hero.style.height = '';
      return;
    }

    setLayoutValue('heroHeight', targetHeight, function (value) {
      hero.style.height = value + 'px';
    });
  }

  function calculateSceneGeometry(rect, scene) {
    return HomeHeroLayout.calculateSceneGeometry(rect, scene);
  }

  function applySceneGeometry(rect, scene, geometry) {
    var scale = geometry.scale;
    var doorBox = geometry.door;

    imageMap.scale = scale;
    imageMap.offsetX = geometry.offsetX;
    imageMap.offsetY = geometry.offsetY;
    art.style.width = (SOURCE.width * scale) + 'px';
    art.style.height = (SOURCE.height * scale) + 'px';
    art.style.left = geometry.offsetX + 'px';
    art.style.top = geometry.offsetY + 'px';

    door.style.left = doorBox.left + 'px';
    door.style.top = doorBox.top + 'px';
    door.style.width = doorBox.width + 'px';
    door.style.height = doorBox.height + 'px';
    door.style.setProperty('--door-pad-x', doorBox.padX + 'px');
    door.style.setProperty('--door-pad-y', doorBox.padY + 'px');
    doorLayerImages.forEach(function (image) {
      var isCore = image.closest('.door-core');
      image.style.width = (SOURCE.width * scale) + 'px';
      image.style.height = (SOURCE.height * scale) + 'px';
      image.style.left = (-(isCore ? DOOR.x : doorBox.regionX) * scale) + 'px';
      image.style.top = (-(isCore ? DOOR.y : doorBox.regionY) * scale) + 'px';
    });
    doorEraser.style.left = doorBox.left + 'px';
    doorEraser.style.top = doorBox.top + 'px';
    doorEraser.style.width = doorBox.width + 'px';
    doorEraser.style.height = doorBox.height + 'px';
    aura.style.left = (doorBox.left - doorBox.width * 0.36) + 'px';
    aura.style.top = (doorBox.top - doorBox.height * 0.12) + 'px';
    aura.style.width = (doorBox.width * 1.72) + 'px';
    aura.style.height = (doorBox.height * 1.24) + 'px';

    scene.doorTop = doorBox.top;
    fitHeroTypography(rect, doorBox.left, doorBox.top, scene);
    positionHeroPrompts(rect, geometry.sceneBottom, scene);
  }

  function updateSceneLayout() {
    var rect = hero.getBoundingClientRect();
    var scene = calculateSceneMode(rect);
    syncHeroHeight(scene.heroHeight);
    rect = hero.getBoundingClientRect();

    if (!scene.topFlowScene) {
      scene = calculateSceneMode(rect);
    }

    var geometry = calculateSceneGeometry(rect, scene);
    applySceneGeometry(rect, scene, geometry);
  }

  function paintDoorEraser() {
    if (!art.complete || !art.naturalWidth) return;
    var width = DOOR.width + DOOR_PAD.x * 2;
    var height = DOOR.height + DOOR_PAD.y * 2;
    var sampleWidth = 40;
    var sampleGap = 20;
    doorEraser.width = width;
    doorEraser.height = height;
    doorEraserCtx.clearRect(0, 0, width, height);
    doorEraserCtx.save();
    doorEraserCtx.filter = 'blur(10px)';
    doorEraserCtx.globalAlpha = 0.78;
    doorEraserCtx.drawImage(
      art,
      DOOR.x - sampleGap - sampleWidth,
      DOOR.y - DOOR_PAD.y,
      sampleWidth,
      height,
      -10,
      -4,
      width * 0.66,
      height + 8
    );
    doorEraserCtx.globalAlpha = 0.72;
    doorEraserCtx.drawImage(
      art,
      DOOR.x + DOOR.width + sampleGap,
      DOOR.y - DOOR_PAD.y,
      sampleWidth,
      height,
      width * 0.34,
      -4,
      width * 0.72,
      height + 8
    );
    doorEraserCtx.filter = 'blur(4px)';
    var wash = doorEraserCtx.createRadialGradient(
      width * 0.5, height * 0.48, width * 0.08,
      width * 0.5, height * 0.5, width * 0.72
    );
    wash.addColorStop(0, 'rgba(244, 214, 222, 0.16)');
    wash.addColorStop(0.58, 'rgba(237, 195, 208, 0.12)');
    wash.addColorStop(1, 'rgba(224, 164, 185, 0.025)');
    doorEraserCtx.globalAlpha = 1;
    doorEraserCtx.fillStyle = wash;
    doorEraserCtx.fillRect(0, 0, width, height);
    doorEraserCtx.restore();
  }

  function performLayout() {
    layoutFrame = 0;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    updateSceneLayout();
    var rect = hero.getBoundingClientRect();
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    paintDoorEraser();
  }

  function scheduleLayout() {
    if (layoutFrame) return;
    layoutFrame = requestAnimationFrame(performLayout);
  }

  function sourcePoint(clientX, clientY) {
    var rect = hero.getBoundingClientRect();
    return {
      x: (clientX - rect.left - imageMap.offsetX) / imageMap.scale,
      y: (clientY - rect.top - imageMap.offsetY) / imageMap.scale,
      screenX: clientX - rect.left,
      screenY: clientY - rect.top
    };
  }

  function addRipple(x, y, strength, velocity) {
    var velocityX = velocity && velocity.x || 0;
    var velocityY = velocity && velocity.y || 0;
    var velocityLength = Math.hypot(velocityX, velocityY);
    if (velocityLength > 26) {
      velocityX = velocityX / velocityLength * 26;
      velocityY = velocityY / velocityLength * 26;
    }
    ripples.push({
      x: x,
      y: y,
      age: 0,
      life: 1050 + Math.random() * 350,
      strength: strength || 1,
      wobble: Math.random() * Math.PI * 2,
      vx: velocityX,
      vy: velocityY
    });
    if (ripples.length > 14) ripples.shift();
    ensureAnimationRunning();
  }

  function addDoorReflectionRipple(event, force) {
    if (reducedMotion) return;
    var point = sourcePoint(event.clientX, event.clientY);
    var now = performance.now();
    var distanceFromDoorBottom = Math.max(0, DOOR.y + DOOR.height - point.y);
    var reflectedSourceY = SOURCE.waterY + 18 + Math.min(190, distanceFromDoorBottom * 0.46);
    var reflectedX = imageMap.offsetX + point.x * imageMap.scale;
    var reflectedY = imageMap.offsetY + reflectedSourceY * imageMap.scale;
    var distance = Math.hypot(reflectedX - lastDoorRipple.x, reflectedY - lastDoorRipple.y);
    if (!force && (distance < 11 || now - lastDoorRipple.time < 48)) return;
    var velocity = {
      x: lastDoorRipple.time ? reflectedX - lastDoorRipple.x : 0,
      y: lastDoorRipple.time ? reflectedY - lastDoorRipple.y : 0
    };
    addRipple(reflectedX, reflectedY, force ? 0.86 : 0.58, velocity);
    lastDoorRipple = { x: reflectedX, y: reflectedY, time: now };
  }

  function drawWaterDistortion(ripple, progress, dark) {
    var ease = 1 - Math.pow(1 - progress, 3);
    var fade = Math.sin(Math.PI * progress) * ripple.strength;
    var radiusX = Math.round(38 + ease * 92);
    var radiusY = Math.round(14 + ease * 30);
    var width = radiusX * 2;
    var height = radiusY * 2;
    if (distortionBuffer.width !== width || distortionBuffer.height !== height) {
      distortionBuffer.width = width;
      distortionBuffer.height = height;
    } else {
      distortionCtx.clearRect(0, 0, width, height);
    }

    distortionCtx.save();
    distortionCtx.filter = dark
      ? 'brightness(0.3) saturate(0.72) hue-rotate(18deg) contrast(1.08)'
      : 'none';
    var stripHeight = 2;
    for (var localY = 0; localY < height; localY += stripHeight) {
      var normalizedY = (localY - radiusY) / radiusY;
      var envelope = Math.max(0, 1 - normalizedY * normalizedY);
      var phase = normalizedY * 8.5 + ripple.wobble + progress * 8;
      var shiftX = Math.sin(phase) * (3 + 11 * fade) * envelope;
      var shiftY = Math.cos(phase * 0.68) * (1.2 + 3.2 * fade) * envelope;
      var screenX = ripple.x - radiusX - shiftX;
      var screenY = ripple.y - radiusY + localY - shiftY;
      var sourceX = (screenX - imageMap.offsetX) / imageMap.scale;
      var sourceY = (screenY - imageMap.offsetY) / imageMap.scale;
      distortionCtx.drawImage(
        art,
        sourceX,
        sourceY,
        width / imageMap.scale,
        stripHeight / imageMap.scale,
        0,
        localY,
        width,
        stripHeight + 0.5
      );
    }
    distortionCtx.restore();

    distortionCtx.globalCompositeOperation = 'destination-in';
    distortionCtx.save();
    distortionCtx.translate(radiusX, radiusY);
    distortionCtx.scale(1, radiusY / radiusX);
    var mask = distortionCtx.createRadialGradient(0, 0, radiusX * 0.12, 0, 0, radiusX);
    mask.addColorStop(0, 'rgba(0,0,0,0.94)');
    mask.addColorStop(0.52, 'rgba(0,0,0,0.74)');
    mask.addColorStop(0.82, 'rgba(0,0,0,0.22)');
    mask.addColorStop(1, 'rgba(0,0,0,0)');
    distortionCtx.fillStyle = mask;
    distortionCtx.fillRect(-radiusX, -radiusX, radiusX * 2, radiusX * 2);
    distortionCtx.restore();
    distortionCtx.globalCompositeOperation = 'source-over';

    ctx.save();
    ctx.globalAlpha = Math.min(0.92, 0.38 + fade * 0.62);
    ctx.drawImage(distortionBuffer, ripple.x - radiusX, ripple.y - radiusY, width, height);
    ctx.globalAlpha = 0.16 * fade;
    ctx.strokeStyle = dark ? 'rgba(194,205,250,0.55)' : 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.ellipse(ripple.x, ripple.y, radiusX * 0.72, radiusY * 0.42, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function drawRipple(ripple) {
    var progress = ripple.age / ripple.life;
    var dark = document.documentElement.getAttribute('data-theme') === 'dark';
    drawWaterDistortion(ripple, progress, dark);
  }

  function updateDoorMotion(now) {
    var easing = doorMotion.hovering ? 0.14 : 0.12;
    doorMotion.x += (doorMotion.targetX - doorMotion.x) * easing;
    doorMotion.y += (doorMotion.targetY - doorMotion.y) * easing;
    doorMotion.rx += (doorMotion.targetRX - doorMotion.rx) * easing;
    doorMotion.ry += (doorMotion.targetRY - doorMotion.ry) * easing;
    var floatX = doorMotion.hovering ? Math.sin(now * 0.0021) * 0.46 : 0;
    var floatY = doorMotion.hovering ? Math.sin(now * 0.0016 + 1.3) * 0.34 : 0;
    var floatR = doorMotion.hovering ? Math.sin(now * 0.00125) * 0.14 : 0;
    door.style.setProperty('--door-x', (doorMotion.x + floatX).toFixed(3) + 'px');
    door.style.setProperty('--door-y', (doorMotion.y + floatY).toFixed(3) + 'px');
    door.style.setProperty('--door-rx', (doorMotion.rx + floatR).toFixed(3) + 'deg');
    door.style.setProperty('--door-ry', (doorMotion.ry - floatR).toFixed(3) + 'deg');
    return doorMotion.hovering ||
      Math.abs(doorMotion.targetX - doorMotion.x) > 0.01 ||
      Math.abs(doorMotion.targetY - doorMotion.y) > 0.01 ||
      Math.abs(doorMotion.targetRX - doorMotion.rx) > 0.01 ||
      Math.abs(doorMotion.targetRY - doorMotion.ry) > 0.01;
  }

  function resetDoorMotion(immediate) {
    doorMotion.hovering = false;
    doorMotion.targetX = 0;
    doorMotion.targetY = 0;
    doorMotion.targetRX = 0;
    doorMotion.targetRY = 0;
    if (!immediate) return;
    doorMotion.x = 0;
    doorMotion.y = 0;
    doorMotion.rx = 0;
    doorMotion.ry = 0;
    door.style.setProperty('--door-x', '0px');
    door.style.setProperty('--door-y', '0px');
    door.style.setProperty('--door-rx', '0deg');
    door.style.setProperty('--door-ry', '0deg');
  }

  function ensureAnimationRunning() {
    if (animationFrame || reducedMotion) return;
    lastAnimationTime = performance.now();
    animationFrame = requestAnimationFrame(animate);
  }

  function animate(now) {
    animationFrame = 0;
    var delta = Math.min(now - lastAnimationTime, 40);
    lastAnimationTime = now;
    ripples.forEach(function (ripple) {
      ripple.age += delta;
    });
    ripples = ripples.filter(function (ripple) { return ripple.age < ripple.life; });
    ctx.clearRect(0, 0, hero.clientWidth, hero.clientHeight);
    ripples.forEach(function (ripple) {
      drawRipple(ripple);
    });
    var doorIsMoving = updateDoorMotion(now);
    if (ripples.length || doorIsMoving) {
      animationFrame = requestAnimationFrame(animate);
    }
  }

  hero.addEventListener('pointermove', function (event) {
    if (reducedMotion || event.pointerType === 'touch') return;
    var point = sourcePoint(event.clientX, event.clientY);
    if (point.y < SOURCE.waterY) return;
    var now = performance.now();
    var distance = Math.hypot(point.screenX - lastRipple.x, point.screenY - lastRipple.y);
    var minDistance = 16;
    var minTime = 42;
    if (distance < minDistance || now - lastRipple.time < minTime) return;
    pointerVelocity.x = lastRipple.time ? point.screenX - lastRipple.x : 0;
    pointerVelocity.y = lastRipple.time ? point.screenY - lastRipple.y : 0;
    addRipple(point.screenX, point.screenY, 0.9, pointerVelocity);
    lastRipple = { x: point.screenX, y: point.screenY, time: now };
  });

  hero.addEventListener('pointerdown', function (event) {
    if (reducedMotion) return;
    var point = sourcePoint(event.clientX, event.clientY);
    if (point.y >= SOURCE.waterY) addRipple(point.screenX, point.screenY, 1.2, { x: 0, y: 0 });
  });

  function awakenDoor() {
    resetDoorMotion(true);
    hero.classList.remove('door-awake');
    door.classList.remove('door-pressed');
    void hero.offsetWidth;
    hero.classList.add('door-awake');
    door.classList.add('door-pressed');
    window.setTimeout(openSidebar, reducedMotion ? 0 : 210);
    window.setTimeout(function () {
      door.classList.remove('door-pressed');
      resetDoorMotion(true);
    }, reducedMotion ? 0 : 460);
    window.setTimeout(function () {
      hero.classList.remove('door-awake');
    }, reducedMotion ? 0 : 900);
  }

  door.addEventListener('pointerenter', function (event) {
    doorMotion.hovering = true;
    ensureAnimationRunning();
    addDoorReflectionRipple(event, true);
  });
  door.addEventListener('pointermove', function (event) {
    if (reducedMotion) return;
    var rect = door.getBoundingClientRect();
    var nx = (event.clientX - rect.left) / rect.width - 0.5;
    var ny = (event.clientY - rect.top) / rect.height - 0.5;
    doorMotion.targetX = nx * 4.2;
    doorMotion.targetY = ny * 2.4;
    doorMotion.targetRX = -ny * 2.8;
    doorMotion.targetRY = nx * 5.2;
    ensureAnimationRunning();
    addDoorReflectionRipple(event, false);
  });
  door.addEventListener('pointerleave', function () {
    resetDoorMotion(false);
    ensureAnimationRunning();
  });

  document.getElementById('sidebarOpen').addEventListener('click', dissolveLogoAndOpen);
  document.getElementById('railSearch').addEventListener('click', openSearch);
  document.getElementById('sidebarClose').addEventListener('click', closeSidebar);
  door.addEventListener('click', awakenDoor);
  document.getElementById('discoverButton').addEventListener('click', function () {
    document.getElementById('content').scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
  });

  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape') return;
    if (searchOverlay.classList.contains('open')) closeSearch();
    else closeSidebar();
  });
  document.addEventListener('pointerdown', function (event) {
    if (!compactSidebarQuery.matches || !document.body.classList.contains('sidebar-open')) return;
    if (sidebar.contains(event.target)) return;
    closeSidebar();
  });

  document.getElementById('sidebarSearchFocus').addEventListener('click', openSearch);
  document.getElementById('searchClose').addEventListener('click', closeSearch);
  siteSearch.addEventListener('input', renderSearchResults);
  searchOverlay.addEventListener('click', function (event) {
    if (event.target === searchOverlay) closeSearch();
  });
  searchResults.addEventListener('click', function (event) {
    if (event.target.closest('.search-result')) closeSearch();
  });
  sidebarNav.addEventListener('click', function (event) {
    if (event.target.closest('.sidebar-link')) closeSidebar();
  });
  document.getElementById('profileRow').addEventListener('click', function () {
    var content = document.getElementById('content');
    closeSidebar();
    content.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
  });

  document.getElementById('themeToggle').addEventListener('click', function () {
    var current = document.documentElement.getAttribute('data-theme');
    applyTheme(current === 'dark' ? 'light' : 'dark');
  });
  document.getElementById('railThemeToggle').addEventListener('click', function () {
    var current = document.documentElement.getAttribute('data-theme');
    applyTheme(current === 'dark' ? 'light' : 'dark');
  });
  document.addEventListener('click', createClickBurst);

  art.addEventListener('load', scheduleLayout);
  window.addEventListener('resize', handleViewportChange);
  if (compactSidebarQuery.addEventListener) {
    compactSidebarQuery.addEventListener('change', handleViewportChange);
  } else {
    compactSidebarQuery.addListener(handleViewportChange);
  }
  if ('ResizeObserver' in window) {
    var heroResizeObserver = new ResizeObserver(scheduleLayout);
    heroResizeObserver.observe(hero);
  }
  document.title = (typeof SITE_DATA !== 'undefined' && SITE_DATA.title) || '摸鱼神国';
  buildPortalCards();
  buildSidebar();
  renderSearchResults();
  syncThemeStatus();
  scheduleLayout();
})();
