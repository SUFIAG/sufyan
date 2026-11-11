// Runs before first paint: mark JS as available and apply a saved theme to avoid a flash.
(function () {
  var root = document.documentElement;
  root.classList.remove('no-js');
  try {
    var t = localStorage.getItem('theme');
    if (t === 'dark' || t === 'light') root.dataset.theme = t;
  } catch (e) {}
})();
