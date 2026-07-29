/* 221 SEN BARBER — Espace client */
const S = window.SBStore;
const $ = id => document.getElementById(id);
const MONTHS = ['JAN','FÉV','MAR','AVR','MAI','JUIN','JUIL','AOÛT','SEP','OCT','NOV','DÉC'];

function showAlert(el, msg, ok) {
  el.textContent = msg;
  el.className = 'alert ' + (ok ? 'alert-ok' : 'alert-error') + ' show';
  setTimeout(() => { if (ok) el.classList.remove('show'); }, ok ? 4000 : 8000);
}
function statusClass(s) {
  return { 'En attente': 'attente', 'Confirmé': 'confirme', 'Terminé': 'termine', 'Annulé': 'annule' }[s] || 'attente';
}
function fmtDate(d) {
  const dt = new Date(d + 'T00:00');
  return { day: dt.getDate(), mon: MONTHS[dt.getMonth()] };
}

/* ---- tab switching ---- */
const loginForm = $('loginForm'), registerForm = $('registerForm');
function switchTab(tab) {
  const login = tab === 'login';
  $('tabLogin').classList.toggle('active', login);
  $('tabRegister').classList.toggle('active', !login);
  loginForm.classList.toggle('hidden', !login);
  registerForm.classList.toggle('hidden', login);
  $('authTitle').textContent = login ? 'Connexion' : 'Créer un compte';
  $('authSub').textContent = login ? 'Connectez-vous pour réserver votre coupe.' : 'Nom, téléphone et code PIN — c\'est tout.';
  $('authError').classList.remove('show');
}
$('tabLogin').onclick = () => switchTab('login');
$('tabRegister').onclick = () => switchTab('register');
$('goRegister').onclick = () => switchTab('register');
$('goLogin').onclick = () => switchTab('login');

/* keep PIN inputs numeric */
document.querySelectorAll('.pin-input').forEach(inp => {
  inp.addEventListener('input', () => { inp.value = inp.value.replace(/\D/g, '').slice(0, 6); });
});

/* ---- register ---- */
registerForm.addEventListener('submit', async e => {
  e.preventDefault();
  try {
    const pin = $('r-pin').value, pin2 = $('r-pin2').value;
    if (pin !== pin2) throw new Error('Les deux codes PIN ne correspondent pas.');
    await S.registerClient({ name: $('r-name').value, phone: $('r-phone').value, pin });
    enterApp();
  } catch (err) { showAlert($('authError'), err.message); }
});

/* ---- login ---- */
loginForm.addEventListener('submit', async e => {
  e.preventDefault();
  try {
    await S.loginClient({ phone: $('l-phone').value, pin: $('l-pin').value });
    enterApp();
  } catch (err) { showAlert($('authError'), err.message); }
});

/* ---- logout ---- */
$('logoutBtn').onclick = () => { S.logoutClient(); location.reload(); };

/* ---- booking ---- */
$('bookingForm').addEventListener('submit', e => {
  e.preventDefault();
  try {
    S.createBooking({
      barber: $('b-barber').value,
      service: $('b-service').value,
      date: $('b-date').value,
      time: $('b-time').value,
      note: $('b-note').value,
    });
    showAlert($('bookOk'), '✅ Réservation envoyée au salon ! Vous recevrez une confirmation.', true);
    $('b-note').value = '';
    renderBookings();
  } catch (err) { showAlert($('bookError'), err.message); }
});

function renderBookings() {
  const list = S.myBookings();
  const box = $('myBookings');
  if (!list.length) { box.innerHTML = '<p class="empty">Aucune réservation pour le moment.</p>'; return; }
  box.innerHTML = list.map(b => {
    const d = fmtDate(b.date);
    return `<div class="bk">
      <div class="bk-date"><b>${d.day}</b><span>${d.mon}</span></div>
      <div class="bk-main">
        <strong>${b.service}</strong>
        <small>${b.time} · Coiffeur : ${b.barber}${b.note ? ' · ' + b.note : ''}</small>
      </div>
      <span class="pill ${statusClass(b.status)}">${b.status}</span>
    </div>`;
  }).join('');
}

/* ---- enter logged-in state ---- */
function enterApp() {
  const c = S.currentClient();
  if (!c) return;
  $('authView').style.display = 'none';
  $('appView').style.display = '';
  $('logoutBtn').classList.remove('hidden');
  $('clientName').textContent = c.name.split(' ')[0];
  // default date = today
  const t = new Date();
  $('b-date').min = t.toISOString().split('T')[0];
  if (!$('b-date').value) $('b-date').value = t.toISOString().split('T')[0];
  applyPending();
  renderBookings();
}

/* apply a booking pre-selection coming from the main site */
function applyPending() {
  const pending = localStorage.getItem('sb_pending_booking');
  if (!pending) return;
  try {
    const p = JSON.parse(pending);
    if (p.barber) $('b-barber').value = p.barber;
    if (p.service) $('b-service').value = p.service;
    if (p.date) $('b-date').value = p.date;
    if (p.time) $('b-time').value = p.time;
  } catch (_) {}
  localStorage.removeItem('sb_pending_booking');
}

/* ---- init ---- */
if (S.currentClient()) enterApp();
