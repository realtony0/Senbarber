// ===== Year =====
document.getElementById('year').textContent = new Date().getFullYear();

// ===== Nav scroll state =====
const nav = document.getElementById('nav');
const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 40);
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

// ===== Mobile menu =====
const burger = document.getElementById('burger');
const navLinks = document.getElementById('navLinks');
burger.addEventListener('click', () => {
  burger.classList.toggle('open');
  navLinks.classList.toggle('open');
});
navLinks.querySelectorAll('a').forEach(a =>
  a.addEventListener('click', () => {
    burger.classList.remove('open');
    navLinks.classList.remove('open');
  })
);

// ===== Reveal on scroll =====
const revealTargets = document.querySelectorAll(
  '.section-head, .service-card, .barber, .g-item, .about-media, .about-text, .contact-left, .contact-right'
);
revealTargets.forEach((el, i) => {
  el.classList.add('reveal');
  el.style.transitionDelay = (i % 6) * 60 + 'ms';
});
const io = new IntersectionObserver(
  entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }),
  { threshold: 0.12 }
);
revealTargets.forEach(el => io.observe(el));

// ===== Price tabs =====
const tabs = document.querySelectorAll('.tab');
const panels = document.querySelectorAll('.price-panel');
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    panels.forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.querySelector(`.price-panel[data-panel="${tab.dataset.tab}"]`).classList.add('active');
  });
});

// ===== Booking form -> WhatsApp =====
const WA_NUMBER = '221777489393';
const form = document.getElementById('bookForm');
form.addEventListener('submit', e => {
  e.preventDefault();
  const name = document.getElementById('f-name').value.trim() || 'Client';
  const barber = document.getElementById('f-barber').value;
  const service = document.getElementById('f-service').value;
  const date = document.getElementById('f-date').value;
  const time = document.getElementById('f-time').value;

  let msg = `Bonjour 221 SEN BARBER ! 🪒\n\n`;
  msg += `Je souhaite réserver une coupe.\n`;
  msg += `• Nom : ${name}\n`;
  msg += `• Coiffeur : ${barber}\n`;
  msg += `• Prestation : ${service}\n`;
  if (date) msg += `• Jour : ${date}\n`;
  if (time) msg += `• Heure : ${time}\n`;
  msg += `\nMerci de me confirmer la disponibilité.`;

  window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
});

// ===== Default date = today =====
const dateInput = document.getElementById('f-date');
if (dateInput) {
  const t = new Date();
  dateInput.min = t.toISOString().split('T')[0];
}
