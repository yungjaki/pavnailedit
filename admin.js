const adminPanel = document.getElementById('admin-panel');
const dayOffInput = document.getElementById('dayOffInput');
const addDayOffBtn = document.getElementById('addDayOff');
const dayOffList = document.getElementById('dayOffList');
const logoutBtn = document.getElementById('logout');

const appointmentsContainer = document.createElement('div');
appointmentsContainer.id = 'appointmentsContainer';
appointmentsContainer.style.marginTop = '20px';
appointmentsContainer.style.maxHeight = '400px';
appointmentsContainer.style.overflowY = 'auto';
adminPanel.querySelector('.panel-box').appendChild(appointmentsContainer);

// ---------- ЗАРЕЖДАНЕ НА РЕЗЕРВАЦИИ ----------
async function fetchAppointments() {
    try {
        const res = await fetch('/api/admin/bookings');
        const data = await res.json();
        const appointments = data.bookings || [];
        renderAppointments(appointments);
    } catch (err) {
        console.error('Error fetching appointments:', err);
    }
}

// ---------- РЕНДЕР НА РЕЗЕРВАЦИИ ----------
function renderAppointments(appointments) {
    appointmentsContainer.innerHTML = '<h3>💅 Резервации</h3>';
    if (!appointments.length) {
        appointmentsContainer.innerHTML += '<p>Няма резервации.</p>';
        return;
    }

    appointments.forEach(app => {
        const div = document.createElement('div');
        div.className = 'appointment-card';
        div.style.background = '#fff0f5';
        div.style.margin = '10px 0';
        div.style.padding = '12px';
        div.style.borderRadius = '12px';
        div.style.boxShadow = '0 4px 12px rgba(249,161,194,0.2)';
        div.innerHTML = `
            <strong>${app.name}</strong> - ${app.clientEmail || ''}<br>
            📅 ${app.date} ⏰ ${app.time}<br>
            <button class="cancel-btn" style="margin-right: 8px;">Откажи</button>
            <button class="reschedule-btn">Промени час</button>
        `;

        // ---------- Отказване ----------
        div.querySelector('.cancel-btn').addEventListener('click', async () => {
            if (!confirm(`Сигурни ли сте, че искате да откажете час на ${app.name}?`)) return;
            await fetch('/api/admin/bookings', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: app.id })
            });
            fetchAppointments();
        });

        // ---------- Промяна на дата/час ----------
        div.querySelector('.reschedule-btn').addEventListener('click', async () => {
            const newDate = prompt('Нова дата (YYYY-MM-DD):', app.date);
            const newTime = prompt('Нов час (HH:MM):', app.time);
            if (!newDate || !newTime) return;
            await fetch('/api/admin/bookings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: app.id, updates: { date: newDate, time: newTime } })
            });
            fetchAppointments();
        });

        appointmentsContainer.appendChild(div);
    });
}

// ---------- ЗАРЕЖДАНЕ НА ПОЧИВНИ ДНИ ----------
async function fetchDaysOff() {
    try {
        const res = await fetch('/api/admin/daysOff');
        const data = await res.json();
        dayOffList.innerHTML = '';
        (data.daysOff || []).forEach(day => {
            const li = document.createElement('li');
            li.textContent = day.date;
            const removeBtn = document.createElement('button');
            removeBtn.textContent = '❌';
            removeBtn.addEventListener('click', async () => {
                await fetch('/api/admin/daysOff', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: day.id })
                });
                fetchDaysOff();
            });
            li.appendChild(removeBtn);
            dayOffList.appendChild(li);
        });
    } catch (err) {
        console.error('Error fetching days off:', err);
    }
}

// ---------- ДОБАВЯНЕ НА ПОЧИВЕН ДЕН ----------
addDayOffBtn.addEventListener('click', async () => {
    const date = dayOffInput.value;
    if (!date) return alert('Изберете дата!');
    await fetch('/api/admin/daysOff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date })
    });
    fetchDaysOff();
    dayOffInput.value = '';
});

// ---------- LOGOUT ----------
logoutBtn.addEventListener('click', () => {
    adminPanel.classList.add('hidden');
});

// ---------- ИНИЦИАЛИЗАЦИЯ ----------
adminPanel.classList.remove('hidden');
fetchAppointments();
fetchDaysOff();
