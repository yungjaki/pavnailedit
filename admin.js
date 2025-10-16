const adminPanel = document.getElementById('admin-panel');
const dayOffInput = document.getElementById('dayOffInput');
const addDayOffBtn = document.getElementById('addDayOff');
const dayOffList = document.getElementById('dayOffList');
const logoutBtn = document.getElementById('logout');

const appointmentsContainer = document.createElement('div');
appointmentsContainer.id = 'appointmentsContainer';
appointmentsContainer.style.marginTop = '20px';
adminPanel.querySelector('.panel-box').appendChild(appointmentsContainer);

// Зареждане на всички резервации
async function fetchAppointments() {
    try {
        const res = await fetch('/api/book.js'); // твоя API
        const data = await res.json();
        const appointments = data.bookings || [];

        renderAppointments(appointments);
    } catch (err) {
        console.error('Error fetching appointments:', err);
    }
}

// Показване на резервации в админ панела
function renderAppointments(appointments) {
    appointmentsContainer.innerHTML = '<h3>Списък с резервации</h3>';
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

        // Отказване на резервация
        div.querySelector('.cancel-btn').addEventListener('click', async () => {
            if(!confirm(`Сигурни ли сте, че искате да откажете час на ${app.name}?`)) return;
            await fetch('/api/admin/cancel', {  // ще трябва да създадеш този endpoint
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: app.id })  // app.id трябва да се взема от Firestore document id
            });
            fetchAppointments();
        });

        // Смяна на дата/час
        div.querySelector('.reschedule-btn').addEventListener('click', async () => {
            const newDate = prompt('Нова дата (YYYY-MM-DD):', app.date);
            const newTime = prompt('Нов час (HH:MM):', app.time);
            if(!newDate || !newTime) return;
            await fetch('/api/admin/reschedule', {  // ще трябва да създадеш този endpoint
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: app.id, newDate, newTime })
            });
            fetchAppointments();
        });

        appointmentsContainer.appendChild(div);
    });
}

// Добавяне на почивен ден
addDayOffBtn.addEventListener('click', () => {
    const date = dayOffInput.value;
    if (!date) return alert('Изберете дата!');
    const li = document.createElement('li');
    li.textContent = date;
    const removeBtn = document.createElement('button');
    removeBtn.textContent = '❌';
    removeBtn.addEventListener('click', () => li.remove());
    li.appendChild(removeBtn);
    dayOffList.appendChild(li);
    dayOffInput.value = '';
});

// Logout
logoutBtn.addEventListener('click', () => {
    adminPanel.classList.add('hidden');
});

// Показване на панела и зареждане
adminPanel.classList.remove('hidden');
fetchAppointments();
