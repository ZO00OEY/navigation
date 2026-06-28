(function () {
  var hero = document.getElementById('hero');
  var art = document.getElementById('heroArt');
  var canvas = document.getElementById('rippleCanvas');
  var ctx = canvas.getContext('2d');
  var door = document.getElementById('doorHotspot');
  var doorFace = document.getElementById('doorFace');
  var heroCopy = document.querySelector('.hero-copy');
  var heroEyebrow = document.querySelector('.hero-eyebrow');
  var titleLines = document.querySelectorAll('.hero-copy .title-line');
  var heroCopyDust = null;
  var copyDustSignature = '';
  var copyDustStarted = false;
  var copyDustTimer = 0;
  var doorLayerImages = document.querySelectorAll('.door-layer-image');
  var doorReflection = document.getElementById('doorReflection');
  var doorReflectionImage = doorReflection.querySelector('img');
  var sidebar = document.getElementById('sidebar');
  var themeIcon = document.getElementById('themeIcon');
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
  var reflectionMap = { left: 0, top: 0, width: 0, height: 0 };
  var layoutFrame = 0;
  var animationFrame = 0;
  var lastAnimationTime = 0;
  var sceneLayout = {
    heroHeight: null,
    actionLeft: null,
    actionTop: null
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
    var portalKinds = ['message-bottle', 'compass', 'anchor'];
    var portalTextStyle = '--portal-text-left: clamp(64px, 15cqw, 112px); --portal-text-right: clamp(52px, 18cqw, 128px);';
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
      var portalKind = portalKinds[index] || 'message-bottle';
      return '<a class="portal-card" href="' + escapeHtml(href) + '" data-portal-kind="' + portalKind + '" style="' + portalTextStyle + '">' +
        '<span class="portal-index">0' + (index + 1) + ' / 0' + blocks.length + '</span>' +
        '<span class="portal-deco" aria-hidden="true"></span>' +
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
    document.querySelector('meta[name="theme-color"]').setAttribute('content', dark ? '#111218' : '#f8eeef');
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    syncThemeStatus();
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
      ? Math.min(68, Math.max(48, heroRect.width * 0.09))
      : Math.min(52, Math.max(29, heroRect.width * 0.0305));
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
    var minimum = scene.stackedScene ? 30 : (compact ? 12 : 18);
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

  function positionHeroPrompts(heroRect, sceneBottom, scene, waterTop, doorBox) {
    var safeLeft = heroRect.width / 2;
    var visibleBottom = Math.min(heroRect.height, sceneBottom);
    var actionTop = waterTop * 0.52;
    if (scene.stackedScene) {
      var copyRect = heroCopy.getBoundingClientRect();
      var copyBottom = copyRect.bottom - heroRect.top;
      actionTop = Math.max(copyBottom + 20, Math.min(waterTop + 20, scene.doorTop - 66));
    }
    actionTop = Math.max(0, Math.min(actionTop, visibleBottom - 74));
    var titleDoorRect = titleLines[1] ? titleLines[1].getBoundingClientRect() : null;
    var featherEndLeft = titleDoorRect
      ? titleDoorRect.right - titleDoorRect.width * 0.16 - heroRect.left
      : safeLeft;
    var featherEndTop = titleDoorRect
      ? titleDoorRect.top + titleDoorRect.height * 0.62 - heroRect.top
      : actionTop + (waterTop - actionTop) * 0.2;
    var doorActionLeft = doorBox.left + doorBox.width / 2;
    var doorActionTop = Math.max(0, Math.min(doorBox.top + doorBox.height / 2 - 56, visibleBottom - 112));
    var featherStartX = heroRect.width * 0.25 - featherEndLeft;
    var featherStartY = -(featherEndTop + 92);

    setLayoutValue('actionLeft', featherEndLeft, function (value) {
      hero.style.setProperty('--hero-action-left', value.toFixed(2) + 'px');
    });
    setLayoutValue('actionTop', actionTop, function (value) {
      hero.style.setProperty('--hero-action-top', featherEndTop.toFixed(2) + 'px');
    });
    hero.style.setProperty('--hero-action-door-left', doorActionLeft.toFixed(2) + 'px');
    hero.style.setProperty('--hero-action-door-top', doorActionTop.toFixed(2) + 'px');
    hero.style.setProperty('--feather-x-0', featherStartX.toFixed(2) + 'px');
    hero.style.setProperty('--feather-x-1', (featherStartX * 0.88).toFixed(2) + 'px');
    hero.style.setProperty('--feather-x-2', (featherStartX * 0.52).toFixed(2) + 'px');
    hero.style.setProperty('--feather-x-3', (featherStartX * 0.18).toFixed(2) + 'px');
    hero.style.setProperty('--feather-y-0', featherStartY.toFixed(2) + 'px');
    hero.style.setProperty('--feather-y-1', (featherStartY * 0.55).toFixed(2) + 'px');
    hero.style.setProperty('--feather-y-2', (featherStartY * 0.34).toFixed(2) + 'px');
    hero.style.setProperty('--feather-y-3', (featherStartY * 0.14).toFixed(2) + 'px');
  }

  function syncHeroCopyDust(heroRect, waterTop) {
    if (reducedMotion) return;
    if (!heroCopyDust) {
      heroCopyDust = document.createElement('div');
      heroCopyDust.className = 'hero-copy-dust';
      heroCopyDust.setAttribute('aria-hidden', 'true');
      hero.appendChild(heroCopyDust);
    }

    var copyRect = heroCopy.getBoundingClientRect();
    var sinkDepth = Math.max(120, Math.min(260, heroRect.height - waterTop - 70));
    var signature = [
      Math.round(copyRect.left), Math.round(copyRect.top),
      Math.round(copyRect.width), Math.round(copyRect.height),
      Math.round(waterTop), Math.round(sinkDepth)
    ].join(':');
    if (signature === copyDustSignature) return;
    copyDustSignature = signature;

    heroCopyDust.innerHTML = '';
    var walker = document.createTreeWalker(heroCopy, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        return node.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    var range = document.createRange();
    var index = 0;
    var textNode;
    while ((textNode = walker.nextNode())) {
      var parent = textNode.parentElement;
      var parentStyle = getComputedStyle(parent);
      var isPink = parent.classList.contains('title-line-accent') ||
        parentStyle.color.indexOf('181') !== -1 ||
        parentStyle.color.indexOf('196') !== -1;
      for (var charIndex = 0; charIndex < textNode.nodeValue.length; charIndex += 1) {
        var char = textNode.nodeValue[charIndex];
        if (!char.trim()) continue;
        range.setStart(textNode, charIndex);
        range.setEnd(textNode, charIndex + 1);
        var rects = range.getClientRects();
        if (!rects.length) continue;
        var rect = rects[0];
        var screenY = rect.top - heroRect.top;
        var fall = Math.max(80, waterTop - screenY + sinkDepth + (index % 7) * 8);
        var shard = document.createElement('span');
        shard.className = 'copy-glyph-shard ' + (isPink ? 'is-pink' : 'is-ink') +
          (isPink && char === '门' ? ' is-door-char' : '');
        shard.textContent = char;
        shard.setAttribute('data-chip', char);
        shard.style.left = (rect.left - heroRect.left).toFixed(2) + 'px';
        shard.style.top = screenY.toFixed(2) + 'px';
        shard.style.width = rect.width.toFixed(2) + 'px';
        shard.style.height = rect.height.toFixed(2) + 'px';
        shard.style.setProperty('--line-height', rect.height.toFixed(2) + 'px');
        shard.style.font = [
          parentStyle.fontStyle,
          parentStyle.fontWeight,
          parentStyle.fontSize,
          parentStyle.fontFamily
        ].join(' ');
        shard.style.color = parentStyle.color;
        shard.style.setProperty('--drift', (((index * 41) % 92) - 46) + 'px');
        shard.style.setProperty('--delay', (0.05 + (index % 19) * 0.018).toFixed(3) + 's');
        shard.style.setProperty('--fall', fall.toFixed(2) + 'px');
        heroCopyDust.appendChild(shard);

        for (var piece = 0; piece < 3; piece += 1) {
          var bit = document.createElement('i');
          bit.className = isPink ? 'is-pink' : 'is-ink';
          bit.style.left = (rect.left - heroRect.left + rect.width * (0.25 + piece * 0.25)).toFixed(2) + 'px';
          bit.style.top = (screenY + rect.height * (0.2 + piece * 0.22)).toFixed(2) + 'px';
          bit.style.setProperty('--size', '2px');
          bit.style.setProperty('--trail', (10 + piece * 7) + 'px');
          bit.style.setProperty('--drift', ((((index + piece) * 37) % 84) - 42) + 'px');
          bit.style.setProperty('--delay', (0.16 + (index % 17) * 0.014 + piece * 0.05).toFixed(3) + 's');
          bit.style.setProperty('--fall', (fall + 14 + piece * 9).toFixed(2) + 'px');
          heroCopyDust.appendChild(bit);
        }
        index += 1;
      }
    }
    range.detach();
    if (!copyDustStarted) {
      window.clearTimeout(copyDustTimer);
      copyDustTimer = window.setTimeout(function () {
        if (!heroCopyDust) return;
        copyDustStarted = true;
        heroCopyDust.classList.add('is-powdering');
      }, 1000);
    }
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
    doorFace.style.left = doorBox.left + 'px';
    doorFace.style.top = doorBox.top + 'px';
    doorFace.style.width = doorBox.width + 'px';
    doorFace.style.height = doorBox.height + 'px';
    doorFace.style.setProperty('--door-pad-x', doorBox.padX + 'px');
    doorFace.style.setProperty('--door-pad-y', doorBox.padY + 'px');
    door.style.setProperty('--door-pad-x', doorBox.padX + 'px');
    door.style.setProperty('--door-pad-y', doorBox.padY + 'px');
    doorLayerImages.forEach(function (image) {
      var isCore = image.closest('.door-core');
      image.style.width = (SOURCE.width * scale) + 'px';
      image.style.height = (SOURCE.height * scale) + 'px';
      image.style.left = (-(isCore ? DOOR.x : doorBox.regionX) * scale) + 'px';
      image.style.top = (-(isCore ? DOOR.y : doorBox.regionY) * scale) + 'px';
    });
    doorReflection.style.left = doorBox.left + 'px';
    doorReflection.style.top = (geometry.offsetY + SOURCE.waterY * scale - doorBox.padY * 0.4) + 'px';
    doorReflection.style.width = doorBox.width + 'px';
    doorReflection.style.height = (doorBox.height * 0.84) + 'px';
    reflectionMap.left = doorBox.left;
    reflectionMap.top = geometry.offsetY + SOURCE.waterY * scale - doorBox.padY * 0.4;
    reflectionMap.width = doorBox.width;
    reflectionMap.height = doorBox.height * 0.84 * 0.86;
    scene.doorTop = doorBox.top;
    fitHeroTypography(rect, doorBox.left, doorBox.top, scene);
    var waterTop = geometry.offsetY + SOURCE.waterY * scale;
    positionHeroPrompts(rect, geometry.sceneBottom, scene, waterTop, doorBox);
    syncHeroCopyDust(rect, waterTop);
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
      drawReflectionDistortionStrip(screenX, screenY, localY, stripHeight, dark);
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

  function drawReflectionDistortionStrip(screenX, screenY, localY, stripHeight, dark) {
    if (!doorReflectionImage.complete || !doorReflectionImage.naturalWidth) return;
    var left = reflectionMap.left;
    var top = reflectionMap.top;
    var width = reflectionMap.width;
    var height = reflectionMap.height;
    if (!width || !height) return;
    if (screenX > left + width || screenX + distortionBuffer.width < left) return;
    if (screenY > top + height || screenY + stripHeight < top) return;

    var overlapLeft = Math.max(screenX, left);
    var overlapRight = Math.min(screenX + distortionBuffer.width, left + width);
    var overlapTop = Math.max(screenY, top);
    var overlapBottom = Math.min(screenY + stripHeight, top + height);
    var overlapWidth = overlapRight - overlapLeft;
    var overlapHeight = overlapBottom - overlapTop;
    if (overlapWidth <= 0 || overlapHeight <= 0) return;

    var sourceX = (overlapLeft - left) / width * doorReflectionImage.naturalWidth;
    var sourceY = (1 - (overlapBottom - top) / height) * doorReflectionImage.naturalHeight;
    var sourceWidth = overlapWidth / width * doorReflectionImage.naturalWidth;
    var sourceHeight = overlapHeight / height * doorReflectionImage.naturalHeight;
    var maskY = (overlapTop - top) / height;
    var fade = Math.max(0, 1 - maskY);
    var alpha = (dark ? 0.18 : 0.34) * Math.min(1, fade * 1.35);

    distortionCtx.save();
    distortionCtx.globalAlpha = alpha;
    if (dark) {
      distortionCtx.filter = 'brightness(0.7) saturate(0.7) hue-rotate(175deg) blur(0.35px)';
    } else {
      distortionCtx.filter = 'saturate(0.82) blur(0.35px)';
    }
    distortionCtx.drawImage(
      doorReflectionImage,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      overlapLeft - screenX,
      localY + overlapTop - screenY,
      overlapWidth,
      overlapHeight + 0.5
    );
    distortionCtx.restore();
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
    doorFace.style.setProperty('--door-x', (doorMotion.x + floatX).toFixed(3) + 'px');
    doorFace.style.setProperty('--door-y', (doorMotion.y + floatY).toFixed(3) + 'px');
    doorFace.style.setProperty('--door-rx', (doorMotion.rx + floatR).toFixed(3) + 'deg');
    doorFace.style.setProperty('--door-ry', (doorMotion.ry - floatR).toFixed(3) + 'deg');
    doorReflection.style.setProperty('--reflection-drift-x', ((doorMotion.x + floatX) * 0.22).toFixed(3) + 'px');
    doorReflection.style.setProperty('--reflection-drift-y', ((doorMotion.y + floatY) * 0.12).toFixed(3) + 'px');
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
    doorFace.style.setProperty('--door-x', '0px');
    doorFace.style.setProperty('--door-y', '0px');
    doorFace.style.setProperty('--door-rx', '0deg');
    doorFace.style.setProperty('--door-ry', '0deg');
    doorReflection.style.setProperty('--reflection-drift-x', '0px');
    doorReflection.style.setProperty('--reflection-drift-y', '0px');
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

  function shakeDoor() {
    resetDoorMotion(true);
    doorFace.classList.remove('door-pressed');
    void doorFace.offsetWidth;
    doorFace.classList.add('door-pressed');
    window.setTimeout(function () {
      doorFace.classList.remove('door-pressed');
      resetDoorMotion(true);
    }, reducedMotion ? 0 : 460);
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
  document.getElementById('sidebarClose').addEventListener('click', closeSidebar);
  door.addEventListener('click', shakeDoor);
  heroCopy.addEventListener('click', function () {
    if (reducedMotion) return;
    if (heroCopyDust) heroCopyDust.classList.remove('is-powdering');
    void heroCopy.offsetWidth;
    copyDustStarted = true;
    window.clearTimeout(copyDustTimer);
    window.requestAnimationFrame(function () {
      heroCopyDust.classList.add('is-powdering');
    });
  });
  var discoverButton = document.getElementById('discoverButton');
  var featherReadyTimer = null;
  var featherAutoTimer = null;
  function enterDoorWithFeather() {
    if (discoverButton.classList.contains('is-entering')) return;
    window.clearTimeout(featherReadyTimer);
    discoverButton.classList.add('is-ready', 'is-entering');
    shakeDoor();
    window.setTimeout(function () {
      document.getElementById('content').scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
    }, reducedMotion ? 0 : 760);
  }

  function driftFeatherToDoor() {
    if (discoverButton.classList.contains('is-drifting')) return;
    window.clearTimeout(featherAutoTimer);
    discoverButton.classList.add('is-drifting');
    featherReadyTimer = window.setTimeout(function () {
      enterDoorWithFeather();
    }, 2600);
  }

  featherAutoTimer = window.setTimeout(driftFeatherToDoor, reducedMotion ? 0 : 2120);

  discoverButton.addEventListener('mouseenter', function () {
    if (discoverButton.classList.contains('is-entering')) return;
    if (!discoverButton.classList.contains('is-drifting')) {
      driftFeatherToDoor();
      return;
    }
    enterDoorWithFeather();
  });

  discoverButton.addEventListener('click', function () {
    if (reducedMotion) {
      enterDoorWithFeather();
      return;
    }
    if (discoverButton.classList.contains('is-entering')) return;
    if (!discoverButton.classList.contains('is-ready')) {
      driftFeatherToDoor();
      return;
    }
    enterDoorWithFeather();
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
