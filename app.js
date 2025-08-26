// Import Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Firebase config (замени с твоите данни от Firebase Console)
const firebaseConfig = {
  apiKey: "AIzaSyC_XCsJ6NqpQWT5MxIJSNyFJkb1JcMVhSQ",
  authDomain: "pavnailedit.firebaseapp.com",
  projectId: "pavnailedit",
  storageBucket: "pavnailedit.appspot.com",
  messagingSenderId: "56941598648",
  appId: "1:56941598648:web:ab6694a0eef3e0cf8c214d"
};

// Init Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Selectors
const bookBtn = document.getElementById("bookBtn");
const dateInput = document.getElementById("date");
const timeButtons = document.querySelectorAll(".time-btn");

// Time slot activation
timeButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    timeButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
  });
});

// Check availability
async function checkAvailability() {
  const date = dateInput.value;
  if (!date) return;

  const q = query(collection(db, "appointments"), where("date", "==", date));
  const snapshot = await getDocs(q);

  const bookedTimes = snapshot.docs.map(doc => doc.data().time);

  timeButtons.forEach(btn => {
    btn.disabled = bookedTimes.includes(btn.dataset.time);
    if (!bookedTimes.includes(btn.dataset.time)) {
      btn.classList.remove("active");
    }
  });
}

// Listen for date changes
dateInput.addEventListener("change", checkAvailability);

// Save booking
bookBtn.addEventListener("click", async () => {
  const name = document.getElementById("name").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const service = document.getElementById("service").value;
  const addons = Array.from(document.querySelectorAll("input[type=checkbox]:checked")).map(el => el.value);
  const date = dateInput.value;
  const time = document.querySelector(".time-btn.active")?.dataset.time;

  // Basic validation
  if (!name || !phone || !date || !time) {
    alert("❌ Моля, попълнете всички полета и изберете час.");
    return;
  }

  try {
    // Add appointment to Firestore
    await addDoc(collection(db, "appointments"), {
      name,
      phone,
      service,
      addons,
      date,
      time,
      createdAt: new Date().toISOString()
    });

    alert(`✅ Успешно запазен час за ${time} на ${date}!`);

    // Reset form
    document.getElementById("name").value = "";
    document.getElementById("phone").value = "";
    document.getElementById("service").value = "";
    document.querySelectorAll("input[type=checkbox]").forEach(cb => cb.checked = false);
    timeButtons.forEach(b => b.classList.remove("active"));

    // Refresh availability
    checkAvailability();
  } catch (e) {
    console.error("Error adding document: ", e);
    alert("❌ Грешка при запис. Опитайте отново.");
  }
});
