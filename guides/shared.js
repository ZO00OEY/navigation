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

/* ---- Theme + Firework ---- */
(function() {
  var html = document.documentElement;
  var LIGHT = 'light', DARK = 'dark';
  function getTheme() {
    var t = localStorage.getItem('theme');
    if (t) return t;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? LIGHT : DARK;
  }
  function applyTheme(t) {
    html.setAttribute('data-theme', t);
    localStorage.setItem('theme', t);
    // Sync favicon with theme
    var favicon = document.getElementById('favicon');
    if (!favicon) { favicon = document.querySelector('link[rel="icon"]'); }
    if (!favicon) {
      favicon = document.createElement('link');
      favicon.rel = 'icon';
      favicon.id = 'favicon';
      document.head.appendChild(favicon);
    }
    if (favicon) {
      var fc = t === LIGHT ? '%23d44070' : '%238fa8ff';
      favicon.href = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 32 32\'%3E%3Cellipse cx=\'11\' cy=\'19\' rx=\'9\' ry=\'7\' fill=\'none\' stroke=\'' + fc + '\' stroke-width=\'2.5\'/%3E%3Cpolygon points=\'20,12 27,6 27,24 20,20\' fill=\'none\' stroke=\'' + fc + '\' stroke-width=\'2.5\' stroke-linejoin=\'round\'/%3E%3Ccircle cx=\'7\' cy=\'18\' r=\'1.8\' fill=\'' + fc + '\'/%3E%3C/svg%3E';
    }
  }
  applyTheme(getTheme());

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
