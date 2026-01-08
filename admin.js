const adminPanelWrapper = document.querySelector('.dashboard-wrapper');
const logoutBtn = document.getElementById('logout');
const appointmentsContainer = document.getElementById('appointmentsContainer');

const filterDateInput = document.getElementById('filterDate');
const sortOrderSelect = document.getElementById('sortOrder');
const applyFilterBtn = document.getElementById('applyFilter');
const clearFilterBtn = document.getElementById('clearFilter');

let allAppointments = [];

// Парсва "YYYY-MM-DD" + "HH:MM" до Date обект (локално време)
function toDateTime(dateStr, timeStr) {
  // защитно: ако timeStr е "9:00" -> "09:00"
  const safeTime = (timeStr || '00:00').padStart(5, '0');
  return new Date(`${dateStr}T${safeTime}:00`);
}

// Нормализира дата до "YYYY-MM-DD" (ако бекендът праща ISO или друго)
function normalizeDateOnly(dateStr) {
  if (!dateStr) return '';
  // ако вече е YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;

  // ако е ISO (пример: 2026-01-08T00:00:00.000Z)
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  // fallback: връщаме както е
  return dateStr;
}

async function fetchAppointments() {
  try {
    const res = await fetch('/api/book');
    const data = await res.json();
    allAppointments = (data.bookings || []).map(a => ({
      ...a,
      date: normalizeDateOnly(a.date),
    }));

    applyFiltersAndRender(); // render с текущите филтри/сорт
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
        <strong>${app.name || 'Без име'}</strong>
        <span>${app.clientEmail || ''}</span>
        <span>📅 ${app.date || ''} ⏰ ${app.time || ''}</span>
      </div>
      <div class="appointment-actions">
        <button class="cancel-btn">Откажи</button>
        <button class="reschedule-btn">Промени</button>
      </div>
    `;

    const bookingId = app.id ?? app._id; // поддръжка за Mongo/различни бекенд-и

    card.querySelector('.cancel-btn').addEventListener('click', async () => {
      if (!bookingId) return alert('Липсва ID на резервацията.');
      if (!confirm(`Сигурни ли сте, че искате да откажете час на ${app.name}?`)) return;

      try {
        const res = await fetch('/api/admin/cancel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: bookingId })
        });
        const resp = await res.json();

        if (!res.ok) alert(resp.error || 'Грешка при отказване.');
        else {
          alert('Часът е успешно отменен.');
          await fetchAppointments();
        }
      } catch (e) {
        console.error(e);
        alert('Грешка при отказване.');
      }
    });

    card.querySelector('.reschedule-btn').addEventListener('click', async () => {
      if (!bookingId) return alert('Липсва ID на резервацията.');

      const newDate = prompt('Нова дата (YYYY-MM-DD):', app.date || '');
      if (!newDate) return;

      const newTime = prompt('Нов час (HH:MM):', app.time || '');
      if (!newTime) return;

      try {
        const res = await fetch('/api/admin/reschedule', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: bookingId, newDate, newTime })
        });
        const resp = await res.json();

        if (!res.ok) alert(resp.error || 'Грешка при промяна на час.');
        else {
          alert('Часът е успешно променен.');
          await fetchAppointments();
        }
      } catch (e) {
        console.error(e);
        alert('Грешка при промяна на час.');
      }
    });

    appointmentsContainer.appendChild(card);
  });
}

function applyFiltersAndRender() {
  let filtered = [...allAppointments];

  const selDate = filterDateInput.value; // "YYYY-MM-DD" от input type=date
  if (selDate) {
    filtered = filtered.filter(a => normalizeDateOnly(a.date) === selDate);
  }

  const order = sortOrderSelect.value; // asc/desc
  filtered.sort((a, b) => {
    const da = toDateTime(a.date, a.time);
    const db = toDateTime(b.date, b.time);
    return order === 'asc' ? da - db : db - da;
  });

  renderAppointments(filtered);
}

// Events
applyFilterBtn.addEventListener('click', applyFiltersAndRender);

sortOrderSelect.addEventListener('change', applyFiltersAndRender);

// по желание: да филтрира веднага при смяна на дата
filterDateInput.addEventListener('change', applyFiltersAndRender);

clearFilterBtn.addEventListener('click', () => {
  filterDateInput.value = '';
  sortOrderSelect.value = 'asc';
  applyFiltersAndRender();
});

logoutBtn.addEventListener('click', () => {
  adminPanelWrapper.style.display = 'none';
});

// Start
fetchAppointments();
