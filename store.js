/* ============================================================
   221 SEN BARBER — Couche de données
   ------------------------------------------------------------
   MODE DÉMO : les données sont stockées dans le navigateur
   (localStorage). Tout fonctionne, mais les données ne sont PAS
   partagées entre appareils.

   POUR PASSER EN LIGNE (partagé entre tous les téléphones + le
   salon) : renseigner SUPABASE ci-dessous et remplacer les
   fonctions par des appels Supabase (voir README-ADMIN.md).
   ============================================================ */

const SB = {
  CLIENTS: 'sb_clients',
  BOOKINGS: 'sb_bookings',
  SESSION: 'sb_session',
  ADMIN: 'sb_admin_session',
};

/* Mot de passe admin par défaut : "senbarber221"
   (hash SHA-256 — le mot de passe en clair n'est jamais stocké). */
const ADMIN_PASS_HASH = '002ec5c5567892c20ce42230b7bea77d712ae286a89a096f7e5d2945889a77c5';

/* --- utils --- */
async function sha256(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}
const _read = k => JSON.parse(localStorage.getItem(k) || '[]');
const _write = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const _uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const normPhone = p => (p || '').replace(/\D/g, '');

/* ===================== CLIENTS ===================== */
async function registerClient({ name, phone, pin }) {
  name = (name || '').trim();
  phone = normPhone(phone);
  if (name.length < 2) throw new Error('Entrez votre nom complet.');
  if (phone.length < 7) throw new Error('Numéro de téléphone invalide.');
  if (!/^\d{6}$/.test(pin)) throw new Error('Le code PIN doit contenir 6 chiffres.');

  const clients = _read(SB.CLIENTS);
  if (clients.some(c => c.phone === phone))
    throw new Error('Un compte existe déjà avec ce numéro. Connectez-vous.');

  const client = {
    id: _uid(),
    name,
    phone,
    pinHash: await sha256(pin + '|' + phone),
    createdAt: new Date().toISOString(),
  };
  clients.push(client);
  _write(SB.CLIENTS, clients);
  localStorage.setItem(SB.SESSION, client.id);
  return client;
}

async function loginClient({ phone, pin }) {
  phone = normPhone(phone);
  const c = _read(SB.CLIENTS).find(x => x.phone === phone);
  if (!c) throw new Error('Aucun compte pour ce numéro. Créez un compte.');
  if (c.pinHash !== (await sha256(pin + '|' + phone)))
    throw new Error('Code PIN incorrect.');
  localStorage.setItem(SB.SESSION, c.id);
  return c;
}

function currentClient() {
  const id = localStorage.getItem(SB.SESSION);
  if (!id) return null;
  return _read(SB.CLIENTS).find(x => x.id === id) || null;
}
function logoutClient() { localStorage.removeItem(SB.SESSION); }

/* ===================== BOOKINGS ===================== */
function createBooking({ barber, service, date, time, note }) {
  const c = currentClient();
  if (!c) throw new Error('Vous devez être connecté.');
  if (!service) throw new Error('Choisissez une prestation.');
  if (!date || !time) throw new Error('Choisissez un jour et une heure.');

  const bookings = _read(SB.BOOKINGS);
  const b = {
    id: _uid(),
    clientId: c.id,
    clientName: c.name,
    clientPhone: c.phone,
    barber: barber || 'Peu importe',
    service,
    date,
    time,
    note: (note || '').trim(),
    status: 'En attente',
    createdAt: new Date().toISOString(),
  };
  bookings.push(b);
  _write(SB.BOOKINGS, bookings);
  return b;
}
function myBookings() {
  const c = currentClient();
  if (!c) return [];
  return _read(SB.BOOKINGS)
    .filter(b => b.clientId === c.id)
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
}

/* ===================== ADMIN ===================== */
async function adminLogin(pass) {
  if ((await sha256(pass || '')) !== ADMIN_PASS_HASH)
    throw new Error('Mot de passe administrateur incorrect.');
  localStorage.setItem(SB.ADMIN, '1');
  return true;
}
const adminLogged = () => localStorage.getItem(SB.ADMIN) === '1';
const adminLogout = () => localStorage.removeItem(SB.ADMIN);

function allBookings() {
  return _read(SB.BOOKINGS).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
function allClients() {
  return _read(SB.CLIENTS).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
function setBookingStatus(id, status) {
  const bookings = _read(SB.BOOKINGS);
  const b = bookings.find(x => x.id === id);
  if (b) { b.status = status; _write(SB.BOOKINGS, bookings); }
}
function deleteBooking(id) {
  _write(SB.BOOKINGS, _read(SB.BOOKINGS).filter(x => x.id !== id));
}

window.SBStore = {
  registerClient, loginClient, currentClient, logoutClient,
  createBooking, myBookings,
  adminLogin, adminLogged, adminLogout,
  allBookings, allClients, setBookingStatus, deleteBooking,
};
