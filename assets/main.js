// ---- Menu mobile ----
(function(){
  const burger = document.getElementById('burger');
  const navlinks = document.getElementById('navlinks');
  if(burger && navlinks){
    burger.addEventListener('click', () => {
      const isOpen = navlinks.classList.toggle('open');
      burger.classList.toggle('open', isOpen);
      burger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
    navlinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      navlinks.classList.remove('open');
      burger.classList.remove('open');
    }));
  }
})();

// ---- Étincelles animées en fond (canvas léger, sans dépendance) ----
function initSparks(canvas, colors, opts){
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  let w, h, particles = [];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const count = opts && opts.count ? opts.count : 40;
  const container = canvas.closest('.spark-layer') ? canvas.closest('.spark-layer').parentElement : canvas.parentElement;

  function resize(){
    w = container.offsetWidth;
    h = container.offsetHeight;
    if(w === 0 || h === 0) return;
    canvas.width = w * devicePixelRatio;
    canvas.height = h * devicePixelRatio;
    ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);
  }
  function makeParticle(){
    return {
      x: Math.random()*w,
      y: h + Math.random()*40,
      r: 1.3 + Math.random()*2.4,
      speed: 0.22 + Math.random()*0.5,
      drift: (Math.random()-0.5)*0.35,
      alpha: 0.22 + Math.random()*0.5,
      twinkle: Math.random()*Math.PI*2,
      color: colors[Math.floor(Math.random()*colors.length)]
    };
  }
  function init(){
    resize();
    particles = Array.from({length: count}, () => {
      const p = makeParticle();
      p.y = Math.random()*h;
      return p;
    });
  }
  function step(){
    if(w && h){
      ctx.clearRect(0,0,w,h);
      particles.forEach(p => {
        p.y -= p.speed;
        p.x += p.drift;
        p.twinkle += 0.03;
        if(p.y < -10){ Object.assign(p, makeParticle()); p.y = h + 10; }
        const a = p.alpha * (0.6 + 0.4*Math.sin(p.twinkle));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = a;
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    }
    if(!reduceMotion) requestAnimationFrame(step);
  }
  window.addEventListener('resize', resize);
  init();
  if(!reduceMotion){ requestAnimationFrame(step); } else { step(); }
}
document.querySelectorAll('[data-sparks]').forEach(canvas => {
  const colors = (canvas.dataset.sparks || '').split(',').filter(Boolean);
  initSparks(canvas, colors.length ? colors : ['#F0714A','#F0AD3B','#C9AEDD'], {count: Number(canvas.dataset.count) || 40});
});

// ---- Léger tilt interactif sur la carte témoignage du hero ----
(function(){
  const heroCard = document.querySelector('.hero-card');
  const hero = document.querySelector('.page-hero');
  if(heroCard && hero){
    hero.addEventListener('mousemove', (e) => {
      const r = heroCard.getBoundingClientRect();
      const cx = r.left + r.width/2, cy = r.top + r.height/2;
      const dx = (e.clientX - cx)/r.width, dy = (e.clientY - cy)/r.height;
      heroCard.style.transform = `rotate(-2deg) rotateX(${(-dy*6).toFixed(2)}deg) rotateY(${(dx*6).toFixed(2)}deg)`;
    });
    hero.addEventListener('mouseleave', () => {
      heroCard.style.transform = 'rotate(-2deg)';
    });
  }
})();

// ---- Reveal au scroll ----
(function(){
  const revealEls = document.querySelectorAll('.philo-card, .svc-card, .soft-card, .step, .cert-frame');
  revealEls.forEach(el => el.classList.add('reveal'));
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
  }, {threshold:0.12});
  revealEls.forEach(el => io.observe(el));
})();

// ---- Formulaire de contact ----
(function(){
  const form = document.getElementById('contactForm');
  if(!form) return;
  const status = document.getElementById('formStatus');
  form.addEventListener('submit', function(e){
    e.preventDefault();
    status.textContent = "Merci ! 🌟 Votre message est bien arrivé, Carole vous répond très vite.";
    status.style.color = "#8C5FA8";
    form.reset();
    // TODO backend: brancher sur Supabase (table "contacts") une fois le projet connecté
  });
})();
