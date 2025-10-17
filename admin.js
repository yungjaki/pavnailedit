const adminPanelWrapper = document.querySelector('.dashboard-wrapper');
const logoutBtn = document.getElementById('logout');
const appointmentsContainer = document.getElementById('appointmentsContainer');

const filterDateInput = document.getElementById('filterDate');
const sortOrderSelect = document.getElementById('sortOrder');
const applyFilterBtn = document.getElementById('applyFilter');

let allAppointments = [];

async function fetchAppointments() {
  try {
    const res = await fetch('/api/book');
    const data = await res.json();
    allAppointments = data.bookings || [];
    renderAppointments(allAppointments);
  } catch (err) {
    console.error('Error fetching appointments:', err);
    appointmentsContainer.innerHTML = '<p>❌ Грешка при зареждане на резервации.</p>';
  }
}

function renderAppointments(arr) {
  appointmentsContainer.innerHTML = '';
  if (!arr.length) {
    appointmentsContainer.innerHTML = '<p>Няма резервации.</p>';
    return;
  }
  arr.forEach(app => {
    const card = document.createElement('div');
    card.className = 'appointment-card';

    card.innerHTML = `
      <div class="appointment-info">
        <strong>${app.name}</strong>
        <span>${app.clientEmail || ''}</span>
        <span>📅 ${app.date} ⏰ ${app.time}</span>
      </div>
      <div class="appointment-actions">
        <button class="cancel-btn">Откажи</button>
        <button class="reschedule-btn">Промени</button>
      </div>
    `;

    card.querySelector('.cancel-btn').addEventListener('click', async () => {
      if (!confirm(`Сигурни ли сте, че искате да откажете час на ${app.name}?`)) return;
      try {
        const res = await fetch('/api/admin/cancel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: app.id })
        });
        const resp = await res.json();
        if (!res.ok) alert(resp.error || 'Грешка при отказване.');
        await fetchAppointments();
      } catch (e) {
        console.error(e);
      }
    });

    card.querySelector('.reschedule-btn').addEventListener('click', async () => {
      const newDate = prompt('Нова дата (YYYY-MM-DD):', app.date);
      const newTime = prompt('Нов час (HH:MM):', app.time);
      if (!newDate || !newTime) return;
      try {
        const res = await fetch('/api/admin/reschedule', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: app.id, newDate, newTime })
        });
        const resp = await res.json();
        if (!res.ok) alert(resp.error || 'Грешка при промяна на час.');
        await fetchAppointments();
      } catch (e) {
        console.error(e);
      }
    });

    appointmentsContainer.appendChild(card);
  });
}

applyFilterBtn.addEventListener('click', () => {
  let filtered = [...allAppointments];
  const selDate = filterDateInput.value;
  if (selDate) {
    filtered = filtered.filter(a => a.date === selDate);
  }
  const order = sortOrderSelect.value;
  filtered.sort((a, b) => {
    if (a.date < b.date) return order === 'asc' ? -1 : 1;
    if (a.date > b.date) return order === 'asc' ? 1 : -1;
    if (a.time < b.time) return order === 'asc' ? -1 : 1;
    if (a.time > b.time) return order === 'asc' ? 1 : -1;
    return 0;
  });
  renderAppointments(filtered);
});

logoutBtn.addEventListener('click', () => {
  adminPanelWrapper.style.display = 'none';
});

fetchAppointments();
