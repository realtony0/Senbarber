/* 221 SEN BARBER — Administration */
const S = window.SBStore;
const $ = id => document.getElementById(id);
const STATUSES = ['En attente', 'Confirmé', 'Terminé', 'Annulé'];
function statusClass(s) {
  return { 'En attente': 'attente', 'Confirmé': 'confirme', 'Terminé': 'termine', 'Annulé': 'annule' }[s] || 'attente';
}
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
  try {
    await S.adminLogin($('adm-pass').value);
    enterDash();
  } catch (err) {
    const a = $('admError'); a.textContent = err.message; a.classList.add('show');
  }
});
$('logoutBtn').onclick = () => { S.adminLogout(); location.reload(); };

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

/* ---- render bookings ---- */
function renderBookings() {
  const q = $('f-search').value.trim().toLowerCase();
  const fb = $('f-barber').value, fs = $('f-status').value, fd = $('f-date').value;
  let rows = S.allBookings();
  if (q) rows = rows.filter(b => (b.clientName + ' ' + b.clientPhone).toLowerCase().includes(q));
  if (fb) rows = rows.filter(b => b.barber === fb);
  if (fs) rows = rows.filter(b => b.status === fs);
  if (fd) rows = rows.filter(b => b.date === fd);

  const body = $('bookingsBody');
  if (!rows.length) {
    body.innerHTML = '<tr><td colspan="6"><p class="empty">Aucune réservation.</p></td></tr>';
    return;
  }
  body.innerHTML = rows.map(b => `
    <tr data-id="${b.id}">
      <td><div class="cname">${esc(b.clientName)}</div><div class="cphone"><a href="tel:${esc(b.clientPhone)}" style="color:inherit">${esc(b.clientPhone)}</a></div></td>
      <td>${esc(b.service)}${b.note ? `<div class="cphone">${esc(b.note)}</div>` : ''}</td>
      <td>${esc(b.barber)}</td>
      <td>${fmtDT(b.date, b.time)}</td>
      <td>
        <select class="st" data-id="${b.id}">
          ${STATUSES.map(s => `<option${s === b.status ? ' selected' : ''}>${s}</option>`).join('')}
        </select>
      </td>
      <td><button class="del" data-id="${b.id}" title="Supprimer">🗑</button></td>
    </tr>`).join('');

  body.querySelectorAll('select.st').forEach(sel => {
    sel.onchange = () => { S.setBookingStatus(sel.dataset.id, sel.value); renderStats(); };
  });
  body.querySelectorAll('button.del').forEach(btn => {
    btn.onclick = () => {
      if (confirm('Supprimer cette réservation ?')) { S.deleteBooking(btn.dataset.id); renderAll(); }
    };
  });
}

/* ---- render clients ---- */
function renderClients() {
  const clients = S.allClients();
  const bookings = S.allBookings();
  const body = $('clientsBody');
  if (!clients.length) {
    body.innerHTML = '<tr><td colspan="4"><p class="empty">Aucun client inscrit.</p></td></tr>';
    return;
  }
  body.innerHTML = clients.map(c => {
    const n = bookings.filter(b => b.clientId === c.id).length;
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
  const b = S.allBookings();
  const today = new Date().toISOString().split('T')[0];
  $('st-total').textContent = b.length;
  $('st-attente').textContent = b.filter(x => x.status === 'En attente').length;
  $('st-jour').textContent = b.filter(x => x.date === today).length;
  $('st-clients').textContent = S.allClients().length;
}

function renderAll() { renderStats(); renderBookings(); renderClients(); }

function enterDash() {
  $('loginView').style.display = 'none';
  $('dashView').style.display = '';
  $('logoutBtn').classList.remove('hidden');
  renderAll();
}

/* auto-enter if already logged */
if (S.adminLogged()) enterDash();
