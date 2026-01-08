// admin.js — пълен файл (замени целия си admin.js с този)

const adminPanelWrapper = document.querySelector('.dashboard-wrapper');
const logoutBtn = document.getElementById('logout');
const appointmentsContainer = document.getElementById('appointmentsContainer');

const filterDateInput = document.getElementById('filterDate'); // type="date" => yyyy-mm-dd
const sortOrderSelect = document.getElementById('sortOrder');   // asc/desc
const applyFilterBtn = document.getElementById('applyFilter');
const clearFilterBtn = document.getElementById('clearFilter');  // ако го нямаш в HTML, ще се игнорира

let allAppointments = [];

/**
 * dateStr: "dd.mm.yyyy"
 * timeStr: "HH:MM" or "HH:MM:SS"
 * => връща Date (локално време), стабилно за сортиране
 */
function toDateTimeBG(dateStr, timeStr) {
  if (!dateStr) return new Date(NaN);

  const parts = String(dateStr).trim().split('.');
  if (parts.length !== 3) return new Date(NaN);

  const dd = parseInt(parts[0], 10);
  const mm = parseInt(parts[1], 10);
  const yyyy = parseInt(parts[2], 10);

  if (!dd || !mm || !yyyy) return new Date(NaN);

  const safeTime = String(timeStr || '00:00').trim();

  // позволява "HH:MM" и "HH:MM:SS"
  const tParts = safeTime.split(':');
  const h = parseInt(tParts[0] ?? '0', 10) || 0;
  const m = parseInt(tParts[1] ?? '0', 10) || 0;

  return new Date(yyyy, mm - 1, dd, h, m, 0, 0);
}

/**
 * Сравнява dateStrBG "dd.mm.yyyy" с selectedYmd "yyyy-mm-dd"
 */
function matchesSelectedDate(dateStrBG, selectedYmd) {
  if (!selectedYmd) return true;

  const d = toDateTimeBG(dateStrBG, '00:00');
  if (isNaN(d.getTime())) return false;

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const ymd = `${y}-${m}-${day}`;

  return ymd === selectedYmd;
}

async function fetchAppointments() {
  try {
    const res = await fetch('/api/book');
    const data = await res.json();

    // очакваме { bookings: [...] }
    allAppointments = data.bookings || [];

    // рендър с филтри/сорт веднага
    applyFiltersAndRender();
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

    const bookingId = app.id ?? app._id;

    // Cancel
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

        if (!res.ok) {
          alert(resp.error || 'Грешка при отказване.');
        } else {
          alert('Часът е успешно отменен.');
          await fetchAppointments();
        }
      } catch (e) {
        console.error(e);
        alert('Грешка при отказване.');
      }
    });

    // Reschedule
    card.querySelector('.reschedule-btn').addEventListener('click', async () => {
      if (!bookingId) return alert('Липсва ID на резервацията.');

      const newDate = prompt('Нова дата (DD.MM.YYYY):', app.date || '');
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

        if (!res.ok) {
          alert(resp.error || 'Грешка при промяна на час.');
        } else {
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

  // Филтър по дата от input type="date" (yyyy-mm-dd)
  const selDate = filterDateInput?.value || '';
  if (selDate) {
    filtered = filtered.filter(a => matchesSelectedDate(a.date, selDate));
  }

  // Сортиране по дата+час
  const order = sortOrderSelect?.value || 'asc';
  filtered.sort((a, b) => {
    const da = toDateTimeBG(a.date, a.time);
    const db = toDateTimeBG(b.date, b.time);

    const aBad = isNaN(da.getTime());
    const bBad = isNaN(db.getTime());
    if (aBad && bBad) return 0;
    if (aBad) return 1;
    if (bBad) return -1;

    return order === 'asc' ? (da - db) : (db - da);
  });

  renderAppointments(filtered);
}

// Events
applyFilterBtn?.addEventListener('click', applyFiltersAndRender);
sortOrderSelect?.addEventListener('change', applyFiltersAndRender);
filterDateInput?.addEventListener('change', applyFiltersAndRender);

// Ако имаш бутон clearFilter в HTML
clearFilterBtn?.addEventListener('click', () => {
  if (filterDateInput) filterDateInput.value = '';
  if (sortOrderSelect) sortOrderSelect.value = 'asc';
  applyFiltersAndRender();
});

logoutBtn?.addEventListener('click', () => {
  if (adminPanelWrapper) adminPanelWrapper.style.display = 'none';
});

// Start
fetchAppointments();
