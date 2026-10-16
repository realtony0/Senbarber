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
  STAFF: 'sb_staff_session',
};

/* Comptes du personnel. Chaque espace a son mot de passe (haché SHA-256,
   jamais stocké en clair). Mots de passe par défaut — à changer :
   Gérant = gerant221 · Bocar = bocar221 · Do = do221 · Vito = vito221
   Pour changer : remplacer le hash (générer sur un outil SHA-256 en ligne). */
const STAFF = [
  { name: 'Gérant', role: 'gerant', passHash: 'e374559317f11e637decec7eefe303159261ab4f95dfbeac105a34cf8fd7a82d' },
  { name: 'Bocar',  role: 'barber', passHash: 'cddf46ba0b886bab1948e183574c0f70408cc695e46d74b84b1e490aa90e1554' },
  { name: 'Do',     role: 'barber', passHash: '85e37afef3c96615083587ffc659ed31acfb8e79b0611bac9025bec19b711d55' },
  { name: 'Vito',   role: 'barber', passHash: 'c390415e5278df333f820c132882537ec525a6a73c8be4d80dff4be6266d2bfe' },
];

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

/* ===================== STAFF (gérant + coiffeurs) ===================== */
function staffList() { return STAFF.map(s => ({ name: s.name, role: s.role })); }

async function staffLogin(name, pass) {
  const s = STAFF.find(x => x.name === name);
  if (!s) throw new Error('Compte introuvable.');
  if ((await sha256(pass || '')) !== s.passHash)
    throw new Error('Mot de passe incorrect.');
  localStorage.setItem(SB.STAFF, JSON.stringify({ name: s.name, role: s.role }));
  return { name: s.name, role: s.role };
}
function currentStaff() {
  try { return JSON.parse(localStorage.getItem(SB.STAFF)) || null; }
  catch (_) { return null; }
}
function staffLogout() { localStorage.removeItem(SB.STAFF); }
const isManager = () => (currentStaff() || {}).role === 'gerant';

/* Réservations visibles selon le rôle :
   - gérant : toutes
   - coiffeur : seulement les siennes (barber === son nom) */
function staffBookings() {
  const me = currentStaff();
  let rows = _read(SB.BOOKINGS).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (me && me.role === 'barber') rows = rows.filter(b => b.barber === me.name);
  return rows;
}
/* Clients visibles : gérant = tous ; coiffeur = ceux qui ont réservé chez lui */
function staffClients() {
  const me = currentStaff();
  const clients = _read(SB.CLIENTS).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (me && me.role === 'barber') {
    const ids = new Set(_read(SB.BOOKINGS).filter(b => b.barber === me.name).map(b => b.clientId));
    return clients.filter(c => ids.has(c.id));
  }
  return clients;
}
function setBookingStatus(id, status) {
  const bookings = _read(SB.BOOKINGS);
  const b = bookings.find(x => x.id === id);
  if (b) { b.status = status; _write(SB.BOOKINGS, bookings); }
}
function setBookingBarber(id, barber) {
  if (!isManager()) return; // seul le gérant peut réassigner
  const bookings = _read(SB.BOOKINGS);
  const b = bookings.find(x => x.id === id);
  if (b) { b.barber = barber; _write(SB.BOOKINGS, bookings); }
}
function deleteBooking(id) {
  _write(SB.BOOKINGS, _read(SB.BOOKINGS).filter(x => x.id !== id));
}

window.SBStore = {
  registerClient, loginClient, currentClient, logoutClient,
  createBooking, myBookings,
  staffList, staffLogin, currentStaff, staffLogout, isManager,
  staffBookings, staffClients, setBookingStatus, setBookingBarber, deleteBooking,
};
