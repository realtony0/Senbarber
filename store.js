/* ============================================================
   221 SEN BARBER — Couche de données (Supabase, partagé en ligne)
   ------------------------------------------------------------
   Les données sont stockées sur Supabase : réservations et comptes
   sont partagés entre TOUS les appareils (clients + salon).
   La clé ci-dessous est la clé "anon" PUBLIQUE (sans danger).
   Les PIN et mots de passe sont hachés côté serveur (bcrypt) et
   ne transitent jamais en clair dans la base.
   ============================================================ */

const SUPABASE_URL = 'https://dewnediinhuqyhjttzfk.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRld25lZGlpbmh1cXloanR0emZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIwOTc3NjUsImV4cCI6MjEwNzY3Mzc2NX0.28j4fBhFuzIjSFxmb-eJ847f8u91fNCkZY8RgZiVt2I';

const CK = 'sb_client';  // session client  { id, name, phone }
const SK = 'sb_staff';   // session staff   { token, name, role }

async function rpc(fn, args) {
  let res;
  try {
    res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON,
        Authorization: 'Bearer ' + SUPABASE_ANON,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(args || {}),
    });
  } catch (_) {
    throw new Error('Connexion impossible. Vérifiez votre réseau.');
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error((data && (data.message || data.hint)) || 'Une erreur est survenue.');
  return data;
}

/* ===================== CLIENT ===================== */
async function registerClient({ name, phone, pin }) {
  const c = await rpc('register_client', { p_name: name, p_phone: phone, p_pin: pin });
  localStorage.setItem(CK, JSON.stringify(c));
  return c;
}
async function loginClient({ phone, pin }) {
  const c = await rpc('login_client', { p_phone: phone, p_pin: pin });
  localStorage.setItem(CK, JSON.stringify(c));
  return c;
}
function currentClient() {
  try { return JSON.parse(localStorage.getItem(CK)) || null; } catch (_) { return null; }
}
function logoutClient() { localStorage.removeItem(CK); }

async function createBooking({ barber, service, date, time, note }) {
  const c = currentClient();
  if (!c) throw new Error('Vous devez être connecté.');
  if (!service) throw new Error('Choisissez une prestation.');
  if (!date || !time) throw new Error('Choisissez un jour et une heure.');
  return rpc('create_booking', {
    p_client_id: c.id, p_barber: barber, p_service: service,
    p_date: date, p_time: time, p_note: note || '',
  });
}
async function myBookings() {
  const c = currentClient();
  if (!c) return [];
  return (await rpc('get_client_bookings', { p_client_id: c.id })) || [];
}

/* ===================== STAFF ===================== */
function staffList() {
  return [
    { name: 'Gérant', role: 'gerant' },
    { name: 'Bocar', role: 'barber' },
    { name: 'Do', role: 'barber' },
    { name: 'Vito', role: 'barber' },
  ];
}
async function staffLogin(name, pass) {
  const s = await rpc('staff_login', { p_name: name, p_pass: pass });
  localStorage.setItem(SK, JSON.stringify(s));
  return s;
}
function currentStaff() {
  try { return JSON.parse(localStorage.getItem(SK)) || null; } catch (_) { return null; }
}
function staffLogout() { localStorage.removeItem(SK); }
const isManager = () => (currentStaff() || {}).role === 'gerant';
function _token() { const s = currentStaff(); return s ? s.token : null; }

async function staffBookings() {
  if (!_token()) return [];
  return (await rpc('staff_bookings', { p_token: _token() })) || [];
}
async function staffClients() {
  if (!_token()) return [];
  return (await rpc('staff_clients', { p_token: _token() })) || [];
}
async function setBookingStatus(id, status) {
  return rpc('set_booking_status', { p_token: _token(), p_id: id, p_status: status });
}
async function setBookingBarber(id, barber) {
  return rpc('set_booking_barber', { p_token: _token(), p_id: id, p_barber: barber });
}
async function deleteBooking(id) {
  return rpc('delete_booking', { p_token: _token(), p_id: id });
}

window.SBStore = {
  registerClient, loginClient, currentClient, logoutClient,
  createBooking, myBookings,
  staffList, staffLogin, currentStaff, staffLogout, isManager,
  staffBookings, staffClients, setBookingStatus, setBookingBarber, deleteBooking,
};
