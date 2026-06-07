/* ---- TOC popup: clone from desktop TOC ---- */
(function() {
  var toc = document.querySelector('.toc');
  var popup = document.getElementById('tocPopup');
  if (!toc || !popup) return;
  // Clone TOC parts and items into popup (skip toc-label)
  var children = toc.querySelectorAll('.toc-part, .toc-item');
  children.forEach(function(el) {
    var clone = el.cloneNode(true);
    popup.appendChild(clone);
  });
})();

/* ---- Lightbox ---- */
(function() {
  var lb = document.getElementById('lightbox');
  var lbImg = document.getElementById('lightboxImg');
  if (!lb || !lbImg) return;
  document.addEventListener('click', function(e) {
    var img = e.target.closest('.step-img');
    if (!img) return;
    lbImg.src = img.src;
    lb.classList.add('open');
  });
  lb.addEventListener('click', function() { lb.classList.remove('open'); });
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') lb.classList.remove('open');
  });
})();

/* ---- Copy code ---- */
function copyCode(btn) {
  var code = btn.parentElement.querySelector('.code-block').textContent;
  navigator.clipboard.writeText(code).then(function() {
    btn.textContent = '✓';
    btn.classList.add('copied');
    setTimeout(function() { btn.textContent = '📋'; btn.classList.remove('copied'); }, 1500);
  });
}

/* ---- Float stack toggle ---- */
(function() {
  var handle = document.getElementById('floatHandle');
  var stack = document.getElementById('floatStack');
  if (!handle || !stack) return;
  handle.addEventListener('click', function() { stack.classList.toggle('open'); });
})();

/* ---- TOC toggle ---- */
(function() {
  var btn = document.getElementById('tocToggle');
  var popup = document.getElementById('tocPopup');
  if (!btn || !popup) return;
  btn.addEventListener('click', function(e) { e.stopPropagation(); popup.classList.toggle('open'); });
  popup.addEventListener('click', function(e) {
    if (e.target.closest('.toc-item')) popup.classList.remove('open');
  });
  document.addEventListener('click', function(e) {
    if (!popup.contains(e.target) && e.target !== btn) popup.classList.remove('open');
  });
})();

/* ---- Scroll spy ---- */
(function() {
  var steps = document.querySelectorAll('.step[id]');
  if (!steps.length) return;
  window.addEventListener('scroll', function() {
    var top = window.scrollY + 100;
    var current = steps[0].id;
    steps.forEach(function(s) { if (s.offsetTop <= top) current = s.id; });
    document.querySelectorAll('.toc-item').forEach(function(item) {
      item.classList.toggle('active', item.getAttribute('href') === '#' + current);
    });
  });
})();

/* ---- Theme + Back to top + Firework ---- */
(function() {
  var toggle = document.getElementById('themeToggle');
  var html = document.documentElement;
  var LIGHT = 'light', DARK = 'dark';
  function getTheme() {
    var t = localStorage.getItem('theme');
    if (t) return t;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? LIGHT : DARK;
  }
  function applyTheme(t) {
    html.setAttribute('data-theme', t);
    toggle.textContent = t === LIGHT ? '☀️' : '🌙';
    localStorage.setItem('theme', t);
  }
  toggle.addEventListener('click', function() {
    applyTheme(html.getAttribute('data-theme') === LIGHT ? DARK : LIGHT);
  });
  applyTheme(getTheme());

  var backToTop = document.getElementById('backToTop');
  if (backToTop) {
    backToTop.addEventListener('click', function() {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    window.addEventListener('scroll', function() {
      backToTop.classList.toggle('visible', window.scrollY > 400);
    });
  }

  var HUES_PINK = [340,350,355,0,10,20,330,345,5,15,335,25];
  var HUES_COOL = [220,235,250,260,270,280,240,255,265,275,245,260];
  document.addEventListener('click', function(e) {
    for (var i = 0; i < 24; i++) {
      var p = document.createElement('div');
      var angle = (Math.PI*2*i)/24 + (Math.random()-0.5)*0.5;
      var dist = 30 + Math.random()*85;
      var hue = (html.getAttribute('data-theme')===DARK ? HUES_COOL : HUES_PINK)[Math.floor(Math.random()*12)];
      p.className = 'firework-particle' + (Math.random()<0.2 ? ' star' : '');
      p.style.cssText = '--tx:'+Math.cos(angle)*dist+'px;--ty:'+Math.sin(angle)*dist+'px;'+
        'background:hsl('+hue+',85%,'+(60+Math.random()*20)+'%);'+
        'left:'+e.clientX+'px;top:'+e.clientY+'px;';
      document.body.appendChild(p);
      setTimeout(function() { p.remove(); }, 900);
    }
  });
})();
