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

// ---- Empreintes de pas animées dans le sable (canvas léger, sans dépendance) ----
function initFootprints(canvas, opts){
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  let w, h;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const color = (opts && opts.color) || '#3B2A20';
  const container = canvas.closest('.spark-layer') ? canvas.closest('.spark-layer').parentElement : canvas.parentElement;

  const STEP_SPACING = 42;      // distance parcourue entre deux empreintes
  const LATERAL_OFFSET = 8;     // écart gauche/droite façon démarche naturelle
  const STEP_INTERVAL = 480;    // ms entre l'apparition de deux empreintes
  const FADE_IN = 400, HOLD = 3000, FADE_OUT = 2200;
  const LIFE = FADE_IN + HOLD + FADE_OUT;

  let path = [], cumLen = [], totalLen = 0, positions = [];
  let steps = [], nextIndex = 0, lastStepAt = 0;

  function resize(){
    w = container.offsetWidth;
    h = container.offsetHeight;
    if(w === 0 || h === 0) return;
    canvas.width = w * devicePixelRatio;
    canvas.height = h * devicePixelRatio;
    ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);
    buildPath();
  }

  // Chemin sinueux façon trace qui serpente entre les dunes, de gauche à droite
  function buildPath(){
    path = [];
    const segments = 500;
    const baseY = h - 46;   // ancré tout en bas du hero, loin du texte
    const amp = 10;         // légère ondulation, reste dans une bande étroite en bas
    for(let i=0; i<=segments; i++){
      const t = i/segments;
      const x = t * w;
      const y = baseY + Math.sin(t*Math.PI*2.4) * amp * Math.sin(t*Math.PI*0.9 + 0.3);
      path.push({x, y});
    }
    cumLen = [0];
    totalLen = 0;
    for(let i=1; i<path.length; i++){
      const dx = path[i].x - path[i-1].x, dy = path[i].y - path[i-1].y;
      totalLen += Math.sqrt(dx*dx + dy*dy);
      cumLen.push(totalLen);
    }
    positions = [];
    let side = -1;
    for(let d = 20; d < totalLen - 20; d += STEP_SPACING){
      let idx = 0;
      while(idx < cumLen.length - 1 && cumLen[idx] < d) idx++;
      const a = path[Math.max(0, idx-1)], b = path[idx];
      const angle = Math.atan2(b.y - a.y, b.x - a.x);
      const nx = -Math.sin(angle), ny = Math.cos(angle);
      positions.push({
        x: b.x + nx * LATERAL_OFFSET * side,
        y: b.y + ny * LATERAL_OFFSET * side,
        angle
      });
      side *= -1;
    }
    steps = [];
    nextIndex = 0;
  }

  function drawFootprint(p, alpha){
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    // sole
    ctx.beginPath();
    ctx.ellipse(0, 0, 4.6, 8.2, 0, 0, Math.PI*2);
    ctx.fill();
    // heel accent (légèrement plus étroit, pour casser la symétrie)
    ctx.beginPath();
    ctx.ellipse(-6.4, 0, 3, 4.4, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
  }

  function frame(time){
    if(w && h){
      ctx.clearRect(0, 0, w, h);

      if(time - lastStepAt > STEP_INTERVAL && positions.length){
        steps.push(Object.assign({born: time}, positions[nextIndex]));
        nextIndex = (nextIndex + 1) % positions.length;
        if(nextIndex === 0){
          // petite pause avant qu'une nouvelle traversée ne recommence
          lastStepAt = time + 1600;
        } else {
          lastStepAt = time;
        }
      }

      steps = steps.filter(s => time - s.born < LIFE);
      steps.forEach(s => {
        const age = time - s.born;
        let alpha;
        if(age < FADE_IN) alpha = (age / FADE_IN);
        else if(age < FADE_IN + HOLD) alpha = 1;
        else alpha = 1 - ((age - FADE_IN - HOLD) / FADE_OUT);
        drawFootprint(s, Math.max(0, alpha) * 0.32);
      });
      ctx.globalAlpha = 1;
    }
    if(!reduceMotion) requestAnimationFrame(frame);
  }

  window.addEventListener('resize', resize);
  resize();
  if(!reduceMotion){
    requestAnimationFrame(frame);
  } else {
    // Version statique et accessible : quelques empreintes fixes, sans animation
    positions.slice(0, 10).forEach(p => drawFootprint(p, 0.28));
  }
}
document.querySelectorAll('[data-footprints]').forEach(canvas => {
  initFootprints(canvas, {color: canvas.dataset.footprints || '#3B2A20'});
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

// ---- Formulaire de contact via AJAX Formspree (reste sur la page) ----
(function(){
  const form = document.getElementById('contactForm');
  if(!form) return;
  const status = document.getElementById('formStatus');
  const submitBtn = form.querySelector('button[type="submit"]');
  const originalBtnText = submitBtn ? submitBtn.textContent : '';

  form.addEventListener('submit', async function(e){
    e.preventDefault();

    if(!form.checkValidity()){
      form.reportValidity();
      return;
    }

    if(status){
      status.textContent = "Envoi en cours…";
      status.style.color = "#B0552A";
    }
    if(submitBtn){
      submitBtn.disabled = true;
      submitBtn.textContent = "Envoi en cours…";
    }

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' }
      });

      if(response.ok){
        if(status){
          status.textContent = "Merci ! 🌟 Votre message est bien arrivé, Carole vous répond très vite.";
          status.style.color = "#B0552A";
        }
        form.reset();
      } else {
        const data = await response.json().catch(() => ({}));
        const msg = (data.errors && data.errors.map(err => err.message).join(', '))
          || "Oups, une erreur est survenue. Réessayez ou écrivez à lecrinier.carole@gmail.com.";
        if(status){
          status.textContent = msg;
          status.style.color = "#c0392b";
        }
      }
    } catch(err){
      if(status){
        status.textContent = "Connexion impossible. Vérifiez votre réseau ou écrivez à lecrinier.carole@gmail.com.";
        status.style.color = "#c0392b";
      }
    } finally {
      if(submitBtn){
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
      }
    }
  });
})();
