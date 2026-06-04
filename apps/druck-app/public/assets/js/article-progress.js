(function () {
  var rail = document.querySelector('.reading-progress');
  if (!rail) return;

  function update() {
    var h = document.documentElement.scrollHeight - window.innerHeight;
    var pct = h > 0 ? (window.scrollY / h) * 100 : 0;
    rail.style.width = Math.min(100, pct) + '%';
  }

  window.addEventListener('scroll', update, { passive: true });
  update();
})();