// --- SIMPLE ADMIN LOGIN ---
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get("panel") === "access123") {
  const pass = prompt("Enter admin password:");
  if (pass === "secret123") {
    document.getElementById("admin-panel").classList.remove("hidden");
  }
}

const dayOffInput = document.getElementById("dayOffInput");
const addDayOffBtn = document.getElementById("addDayOff");
const dayOffList = document.getElementById("dayOffList");
const logoutBtn = document.getElementById("logout");

let dayOffs = JSON.parse(localStorage.getItem("dayOffs") || "[]");

function renderDayOffs() {
  dayOffList.innerHTML = "";
  dayOffs.forEach((d,i) => {
    const li = document.createElement("li");
    li.innerHTML = `${d} <button onclick="removeDayOff(${i})">❌</button>`;
    dayOffList.appendChild(li);
  });
  localStorage.setItem("dayOffs", JSON.stringify(dayOffs));
  fp.redraw(); // прерисува календара
}

addDayOffBtn.onclick = () => {
  if (dayOffInput.value) {
    const formatted = dayOffInput.value.split("-").reverse().join(".");
    if (!dayOffs.includes(formatted)) {
      dayOffs.push(formatted);
      renderDayOffs();
    }
  }
};

window.removeDayOff = (i) => {
  dayOffs.splice(i,1);
  renderDayOffs();
};

logoutBtn.onclick = () => {
  document.getElementById("admin-panel").classList.add("hidden");
};

// --- Flatpickr палмички ---
fp.set("onDayCreate", (dObj, dStr, fp, dayElem) => {
  const dateStr = dayElem.dateObj.toLocaleDateString("bg-BG");
  const formatted = dateStr.split(".").map(s=>s.padStart(2,"0")).join("."); // 01.10.2025
  if (dayOffs.includes(formatted)) {
    dayElem.innerHTML += " 🌴";
    dayElem.classList.add("day-off");
  }
});

// init
renderDayOffs();
