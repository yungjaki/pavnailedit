const adminPanel = document.getElementById('admin-panel');
const logoutBtn = document.getElementById('logout');
const appointmentsContainer = document.getElementById('appointmentsContainer');

adminPanel.classList.remove('hidden');

// ----------------------
// Load Appointments
// ----------------------
async function fetchAppointments() {
  try {
    const res = await fetch('/api/book');
    const data = await res.json();
    const appointments = data.bookings || [];
    renderAppointments(appointments);
  } catch (err) {
    console.error('Error fetching appointments:', err);
    appointmentsContainer.innerHTML = '<p>❌ Грешка при зареждане на резервации.</p>';
  }
}

function renderAppointments(appointments) {
  appointmentsContainer.innerHTML = '';
  if (!appointments.length) {
    appointmentsContainer.innerHTML = '<p>Няма резервации.</p>';
    return;
  }

  appointments.forEach(app => {
    const div = document.createElement('div');
    div.className = 'appointment-card';
    div.innerHTML = `
      <strong>${app.name}</strong> - ${app.clientEmail || ''}<br>
      📅 ${app.date} ⏰ ${app.time}<br>
      <button class="cancel-btn">Откажи</button>
      <button class="reschedule-btn">Промени час</button>
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
// Logout
// ----------------------
logoutBtn.addEventListener('click', () => {
  adminPanel.classList.add('hidden');
});

// ----------------------
// Init
// ----------------------
fetchAppointments();
