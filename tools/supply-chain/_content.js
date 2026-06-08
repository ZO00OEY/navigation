/* Shared by supply-chain sub-pages: theme sync from parent */
(function() {
  var html = document.documentElement;

  // Apply theme
  function setTheme(t) {
    html.setAttribute('data-theme', t);
    localStorage.setItem('theme', t);
  }

  // Listen for theme sync from parent shell
  window.addEventListener('message', function(e) {
    if (e.data && e.data.type === 'set-theme') {
      setTheme(e.data.theme);
    }
  });

  // Copy code helper
  window.copyCode = function(btn) {
    var code = btn.parentElement.querySelector('.code-block').textContent;
    navigator.clipboard.writeText(code).then(function() {
      btn.textContent = '✓'; btn.classList.add('copied');
      setTimeout(function() { btn.textContent = '📋'; btn.classList.remove('copied'); }, 1500);
    });
  };
})();
