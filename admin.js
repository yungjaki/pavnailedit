const adminPanel = document.getElementById('admin-panel');
const logoutBtn = document.getElementById('logout');
const appointmentsContainer = document.getElementById('appointmentsContainer');

const filterDateInput = document.getElementById('filterDate');
const sortOrderSelect = document.getElementById('sortOrder');
const applyFilterBtn = document.getElementById('applyFilter');

adminPanel.classList.remove('hidden');

let allAppointments = []; // ще държим всички

// ----------------------
// Load Appointments
// ----------------------
async function fetchAppointments() {
  try {
    const res = await fetch('/api/book');
    const data = await res.json();
    const appointments = data.bookings || [];
    allAppointments = appointments;
    renderAppointments(appointments);
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
    const div = document.createElement('div');
    div.className = 'appointment-card';

    div.innerHTML = `
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

    // Cancel
    div.querySelector('.cancel-btn').addEventListener('click', async () => {
      if (!confirm(`Сигурни ли сте, че искате да откажете час на ${app.name}?`)) return;
      try {
        const res = await fetch('/api/admin/cancel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: app.id })
        });
        const data = await res.json();
        if (!res.ok) alert(data.error || 'Грешка при отказване.');
        await fetchAppointments();
      } catch (e) { console.error(e); }
    });

    // Reschedule
    div.querySelector('.reschedule-btn').addEventListener('click', async () => {
      const newDate = prompt('Нова дата (YYYY-MM-DD):', app.date);
      const newTime = prompt('Нов час (HH:MM):', app.time);
      if (!newDate || !newTime) return;
      try {
        const res = await fetch('/api/admin/reschedule', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: app.id, newDate, newTime })
        });
        const data = await res.json();
        if (!res.ok) alert(data.error || 'Грешка при промяна на час.');
        await fetchAppointments();
      } catch (e) { console.error(e); }
    });

    appointmentsContainer.appendChild(div);
  });
}

// ----------------------
// Филтриране & Сортиране
// ----------------------
applyFilterBtn.addEventListener('click', () => {
  let filtered = [...allAppointments];

  const selectedDate = filterDateInput.value;
  if (selectedDate) {
    filtered = filtered.filter(a => a.date === selectedDate);
  }

  const order = sortOrderSelect.value;
  filtered.sort((a, b) => {
    if (a.date < b.date) return order === 'asc' ? -1 : 1;
    if (a.date > b.date) return order === 'asc' ? 1 : -1;
    // ако са еднакви дати – сортирай по час
    if (a.time < b.time) return order === 'asc' ? -1 : 1;
    if (a.time > b.time) return order === 'asc' ? 1 : -1;
    return 0;
  });

  renderAppointments(filtered);
});

// ----------------------
// Logout
// ----------------------
logoutBtn.addEventListener('click', () => {
  adminPanel.classList.add('hidden');
});

// ----------------------
// Init
// ----------------------
fetchAppointments();
