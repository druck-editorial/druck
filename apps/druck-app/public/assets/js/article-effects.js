(function () {
  var heroImg = document.querySelector('.article-hero-img img, .post-simple-img img');
  if (!heroImg) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    heroImg.classList.add('is-visible');
    return;
  }

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          observer.unobserve(e.target);
        }
      });
    },
    { threshold: 0.1 }
  );

  observer.observe(heroImg);
})();