(function() {
  function syncToolPaletteButtons() {
    var current = document.documentElement.getAttribute('data-tool-palette') || 'pink';
    document.querySelectorAll('[data-tool-palette-option]').forEach(function(btn) {
      btn.classList.toggle('active', btn.getAttribute('data-tool-palette-option') === current);
    });
  }

  document.querySelectorAll('[data-tool-palette-option]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var palette = btn.getAttribute('data-tool-palette-option') || 'pink';
      document.documentElement.setAttribute('data-tool-palette', palette);
      localStorage.setItem('jdToolPalette', palette);
      syncToolPaletteButtons();
    });
  });

  syncToolPaletteButtons();
})();
