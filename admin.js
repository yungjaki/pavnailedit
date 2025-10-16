const dayOffInput = document.getElementById("dayOffInput");
const addDayOffBtn = document.getElementById("addDayOff");
const dayOffList = document.getElementById("dayOffList");
const appointmentList = document.getElementById("appointmentList");

// ======= Дни почивка =======
async function fetchDaysOff() {
    const res = await fetch('http://localhost:3000/api/dayoff');
    const days = await res.json();
    dayOffList.innerHTML = '';
    days.forEach(day => {
        const li = document.createElement('li');
        li.textContent = day;
        const removeBtn = document.createElement('button');
        removeBtn.textContent = '❌';
        removeBtn.onclick = async () => {
            await removeDayOff(day);
        }
        li.appendChild(removeBtn);
        dayOffList.appendChild(li);
    });
}

async function addDayOff() {
    const date = dayOffInput.value;
    if (!date) return;
    await fetch('http://localhost:3000/api/dayoff', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ date })
    });
    dayOffInput.value = '';
    fetchDaysOff();
}

async function removeDayOff(date) {
    // временно само премахва от списъка
    dayOffList.querySelectorAll('li').forEach(li => {
        if (li.textContent.includes(date)) li.remove();
    });
}

// ======= Резервации =======
async function fetchAppointments() {
    const res = await fetch('http://localhost:3000/api/appointments');
    const appointments = await res.json();
    appointmentList.innerHTML = '';
    appointments.forEach(a => {
        const li = document.createElement('li');
        li.innerHTML = `
            ${a.client} - ${a.date} ${a.time} [${a.status}]
            <button onclick="cancel(${a.id})">Откажи</button>
            <button onclick="reschedule(${a.id})">Премести</button>
        `;
        appointmentList.appendChild(li);
    });
}

async function cancel(id) {
    await fetch('http://localhost:3000/api/cancel', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({id})
    });
    fetchAppointments();
}

async function reschedule(id) {
    const newDate = prompt("Нова дата (YYYY-MM-DD):");
    const newTime = prompt("Нов час (HH:MM):");
    if (!newDate || !newTime) return;
    await fetch('http://localhost:3000/api/reschedule', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({id, newDate, newTime})
    });
    fetchAppointments();
}

// ======= Събития =======
addDayOffBtn.addEventListener('click', addDayOff);

fetchDaysOff();
fetchAppointments();
