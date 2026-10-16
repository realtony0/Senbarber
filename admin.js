/* 221 SEN BARBER — Espaces personnel (gérant + coiffeurs) */
const S = window.SBStore;
const $ = id => document.getElementById(id);
const BARBERS = ['Bocar', 'Do', 'Vito', 'Peu importe'];
const STATUSES = ['En attente', 'Confirmé', 'Terminé', 'Annulé'];
let DATA = { bookings: [], clients: [] };

function esc(s) { return (s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
function fmtDT(d, t) {
  const dt = new Date(d + 'T00:00');
  return dt.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) + ' · ' + t;
}
function fmtCreated(iso) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

/* ---- login ---- */
$('adminLoginForm').addEventListener('submit', async e => {
  e.preventDefault();
  const btn = e.submitter; if (btn) btn.disabled = true;
  try {
    await S.staffLogin($('adm-who').value, $('adm-pass').value);
    await enterDash();
  } catch (err) {
    const a = $('admError'); a.textContent = err.message; a.classList.add('show');
  } finally { if (btn) btn.disabled = false; }
});
$('logoutBtn').onclick = () => { S.staffLogout(); location.reload(); };

/* ---- tabs ---- */
$('tabBookings').onclick = () => toggleTab(true);
$('tabClients').onclick = () => toggleTab(false);
function toggleTab(bookings) {
  $('tabBookings').classList.toggle('active', bookings);
  $('tabClients').classList.toggle('active', !bookings);
  $('panelBookings').classList.toggle('hidden', !bookings);
  $('panelClients').classList.toggle('hidden', bookings);
}

/* ---- filters ---- */
['f-search', 'f-barber', 'f-status', 'f-date'].forEach(id => {
  $(id).addEventListener('input', renderBookings);
});

/* ---- render bookings (depuis le cache DATA) ---- */
function renderBookings() {
  const manager = S.isManager();
  const q = $('f-search').value.trim().toLowerCase();
  const fb = $('f-barber').value, fs = $('f-status').value, fd = $('f-date').value;
  let rows = DATA.bookings;
  if (q) rows = rows.filter(b => (b.clientName + ' ' + b.clientPhone).toLowerCase().includes(q));
  if (manager && fb) rows = rows.filter(b => b.barber === fb);
  if (fs) rows = rows.filter(b => b.status === fs);
  if (fd) rows = rows.filter(b => b.date === fd);

  const body = $('bookingsBody');
  if (!rows.length) {
    body.innerHTML = '<tr><td colspan="6"><p class="empty">Aucune réservation.</p></td></tr>';
    return;
  }
  body.innerHTML = rows.map(b => {
    const barberCell = manager
      ? `<select class="bb" data-id="${b.id}">${BARBERS.map(x => `<option${x === b.barber ? ' selected' : ''}>${x}</option>`).join('')}</select>`
      : esc(b.barber);
    const delCell = manager ? `<button class="del" data-id="${b.id}" title="Supprimer">🗑</button>` : '';
    return `<tr data-id="${b.id}">
      <td><div class="cname">${esc(b.clientName)}</div><div class="cphone"><a href="tel:${esc(b.clientPhone)}" style="color:inherit">${esc(b.clientPhone)}</a></div></td>
      <td>${esc(b.service)}${b.note ? `<div class="cphone">${esc(b.note)}</div>` : ''}</td>
      <td>${barberCell}</td>
      <td>${fmtDT(b.date, b.time)}</td>
      <td><select class="st" data-id="${b.id}">${STATUSES.map(s => `<option${s === b.status ? ' selected' : ''}>${s}</option>`).join('')}</select></td>
      <td>${delCell}</td>
    </tr>`;
  }).join('');

  body.querySelectorAll('select.st').forEach(sel => {
    sel.onchange = async () => { sel.disabled = true; await S.setBookingStatus(sel.dataset.id, sel.value); await renderAll(); };
  });
  body.querySelectorAll('select.bb').forEach(sel => {
    sel.onchange = async () => { sel.disabled = true; await S.setBookingBarber(sel.dataset.id, sel.value); await renderAll(); };
  });
  body.querySelectorAll('button.del').forEach(btn => {
    btn.onclick = async () => {
      if (!confirm('Supprimer cette réservation ?')) return;
      btn.disabled = true; await S.deleteBooking(btn.dataset.id); await renderAll();
    };
  });
}

/* ---- render clients ---- */
function renderClients() {
  const body = $('clientsBody');
  if (!DATA.clients.length) {
    body.innerHTML = '<tr><td colspan="4"><p class="empty">Aucun client.</p></td></tr>';
    return;
  }
  body.innerHTML = DATA.clients.map(c => {
    const n = DATA.bookings.filter(b => b.clientId === c.id).length;
    return `<tr>
      <td class="cname">${esc(c.name)}</td>
      <td><a href="tel:${esc(c.phone)}" style="color:inherit">${esc(c.phone)}</a></td>
      <td>${fmtCreated(c.createdAt)}</td>
      <td>${n}</td>
    </tr>`;
  }).join('');
}

/* ---- stats ---- */
function renderStats() {
  const today = new Date().toISOString().split('T')[0];
  $('st-total').textContent = DATA.bookings.length;
  $('st-attente').textContent = DATA.bookings.filter(x => x.status === 'En attente').length;
  $('st-jour').textContent = DATA.bookings.filter(x => x.date === today).length;
  $('st-clients').textContent = DATA.clients.length;
}

async function renderAll() {
  const [bookings, clients] = await Promise.all([S.staffBookings(), S.staffClients()]);
  DATA.bookings = bookings; DATA.clients = clients;
  renderStats(); renderBookings(); renderClients();
}

async function enterDash() {
  const me = S.currentStaff();
  if (!me) return;
  const manager = me.role === 'gerant';

  $('loginView').style.display = 'none';
  $('dashView').style.display = '';
  $('logoutBtn').classList.remove('hidden');

  if (manager) {
    $('dashEyebrow').textContent = 'Gérant · ' + me.name;
    $('dashTitle').textContent = 'Réservations du salon';
    $('lb-total').textContent = 'Total réservations';
    $('lb-clients').textContent = 'Clients inscrits';
    $('f-barber').style.display = '';
  } else {
    $('dashEyebrow').textContent = 'Coiffeur · ' + me.name;
    $('dashTitle').textContent = 'Mes rendez-vous';
    $('lb-total').textContent = 'Mes réservations';
    $('lb-clients').textContent = 'Mes clients';
    $('f-barber').style.display = 'none';
  }
  await renderAll();
}

/* auto-enter if already logged */
if (S.currentStaff()) enterDash();
