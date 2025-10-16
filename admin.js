const adminPanel = document.getElementById('admin-panel');
const dayOffInput = document.getElementById('dayOffInput');
const addDayOffBtn = document.getElementById('addDayOff');
const dayOffList = document.getElementById('dayOffList');
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
      if(!confirm(`Сигурни ли сте, че искате да откажете час на ${app.name}?`)) return;
      try {
        const res = await fetch('/api/admin/cancel', {
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({ id: app.id })
        });
        const data = await res.json();
        if(!res.ok) alert(data.error || 'Грешка при отказване.');
        await fetchAppointments();
      } catch(e){console.error(e);}
    });

    // Reschedule
    div.querySelector('.reschedule-btn').addEventListener('click', async () => {
      const newDate = prompt('Нова дата (YYYY-MM-DD):', app.date);
      const newTime = prompt('Нов час (HH:MM):', app.time);
      if(!newDate || !newTime) return;
      try {
        const res = await fetch('/api/admin/reschedule', {
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({ id: app.id, newDate, newTime })
        });
        const data = await res.json();
        if(!res.ok) alert(data.error || 'Грешка при промяна на час.');
        await fetchAppointments();
      } catch(e){console.error(e);}
    });

    appointmentsContainer.appendChild(div);
  });
}

// ----------------------
// Days Off
// ----------------------
async function fetchDaysOff() {
  try {
    const res = await fetch('/api/admin/daysOff');
    const data = await res.json();
    const days = data.days || [];
    dayOffList.innerHTML = '';
    days.forEach(d => {
      const li = document.createElement('li');
      li.textContent = d;
      const removeBtn = document.createElement('button');
      removeBtn.textContent = '❌';
      removeBtn.addEventListener('click', async () => {
        await fetch('/api/admin/daysOff', {
          method:'DELETE',
          headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ date: d })
        });
        fetchDaysOff();
      });
      li.appendChild(removeBtn);
      dayOffList.appendChild(li);
    });
  } catch(e) { console.error('Error fetching days off:', e);}
}

// Add new day off
addDayOffBtn.addEventListener('click', async () => {
  const date = dayOffInput.value;
  if(!date) return alert('Изберете дата!');
  try {
    await fetch('/api/admin/daysOff', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ date })
    });
    dayOffInput.value='';
    fetchDaysOff();
  } catch(e){console.error(e);}
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
fetchDaysOff();
