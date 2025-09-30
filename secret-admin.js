// Параметри за достъп
const PASSWORD = "mynailsecret"; // можеш да смениш на каквото искаш

const loginBtn = document.getElementById("login-btn");
const adminPanel = document.getElementById("admin-panel");
const loginMsg = document.getElementById("login-msg");

loginBtn.addEventListener("click", () => {
    const passInput = document.getElementById("admin-pass").value;
    if (passInput === PASSWORD) {
        document.getElementById("login-section").style.display = "none";
        adminPanel.classList.remove("hidden");
        initCalendar();
    } else {
        loginMsg.textContent = "Невалидна парола!";
    }
});

// Инициализация на Flatpickr с емоджи 🌴
function initCalendar() {
    flatpickr("#break-calendar", {
        inline: true,
        disable: [
            function(date) {
                // Примерно: някои дати може да се блокират
                return false;
            }
        ],
        onDayCreate: function(dObj, dStr, fp, dayElem) {
            // Добавя палмичка за почивни дни
            // Пример: всички недели
            if (dayElem.dateObj.getDay() === 0) {
                dayElem.innerHTML += " 🌴";
            }
        }
    });
}
