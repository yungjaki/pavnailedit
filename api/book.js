import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import serviceAccount from "../bookingthing.json"; // коригирай пътя според структурата на проекта
import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Инициализация на Firebase
initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();
const bookingsCollection = db.collection("bookings");

// --- ДЕБЪГ ФУНКЦИЯ ---
async function debugFirestore() {
  try {
    const snapshot = await bookingsCollection.limit(5).get();
    if (snapshot.empty) {
      console.log("Колекцията 'bookings' е празна или не съществува.");
    } else {
      console.log("Намерени документи в 'bookings':");
      snapshot.docs.forEach(doc => {
        console.log(doc.id, doc.data());
      });
    }
  } catch (err) {
    console.error("Грешка при достъп до Firestore:", err);
  }
}

// Стартираме дебъга веднъж при зареждане
debugFirestore();

// --- MAIN HANDLER ---
export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const { name, phone, services, date, time, design, clientEmail } = req.body;

      // Проверка за зает час
      const snapshot = await bookingsCollection
        .where("date", "==", date)
        .where("time", "==", time)
        .get();

      if (!snapshot.empty) {
        return res.status(400).json({ error: "Този час вече е зает" });
      }

      // Запазване на резервацията
      await bookingsCollection.add({ name, phone, services, date, time, design, clientEmail, totalPrice });

// Имейл до техника
await sgMail.send({
  to: process.env.TECH_EMAIL,
  from: process.env.SENDGRID_FROM_EMAIL,
  subject: `Нов запис: ${name} — ${date} ${time}`,
  html: `
  <div style="font-family: 'Roboto', sans-serif; background:#fff0f4; padding:25px; border-radius:20px; color:#2c2c2c; max-width:600px; margin:auto;">
    <h2 style="color:#ff6ec4; text-align:center;">💅🏻 Нов запис на час</h2>
    <div style="margin-top:15px;">
      <p><strong>👤 Име:</strong> ${name}</p>
      <p><strong>📞 Телефон:</strong> ${phone}</p>
      <p><strong>📅 Дата:</strong> ${date}</p>
      <p><strong>⏰ Час:</strong> ${time}</p>
    </div>
    <h3 style="color:#f9a1c2; margin-top:20px;">✨ Услуги:</h3>
    <ul style="padding-left:20px; margin-top:10px; color:#2c2c2c;">
      ${services.map(s => `<li style="margin:5px 0;">💖 ${s}</li>`).join("")}
    </ul>
    <p style="margin-top:20px; font-size:18px; font-weight:700; color:#ff6ec4;">💰 Общо: ${totalPrice} лв</p>
  </div>
  `
});

// Имейл до клиент
await sgMail.send({
  to: clientEmail,
  from: process.env.SENDGRID_FROM_EMAIL,
  subject: `Потвърждение на час: ${date} ${time}`,
  html: `
  <div style="font-family: 'Roboto', sans-serif; background:#fff0f4; padding:25px; border-radius:20px; color:#2c2c2c; max-width:600px; margin:auto;">
    <h2 style="color:#ff6ec4; text-align:center;">💅🏻 Здравей, ${name}!</h2>
    <p style="text-align:center; font-size:16px;">Вашият час е успешно запазен.</p>
    <div style="margin-top:15px; padding:15px; background:#f9d0d8; border-radius:15px;">
      <p><strong>📅 Дата:</strong> ${date}</p>
      <p><strong>⏰ Час:</strong> ${time}</p>
    </div>
    <h3 style="color:#f9a1c2; margin-top:20px;">✨ Избрани услуги:</h3>
    <ul style="padding-left:20px; margin-top:10px; color:#2c2c2c;">
      ${services.map(s => `<li style="margin:5px 0;">💖 ${s}</li>`).join("")}
    </ul>
    <p style="margin-top:20px; font-size:18px; font-weight:700; color:#ff6ec4; text-align:center;">💰 Общо: ${totalPrice} лв</p>
    <p style="margin-top:25px; text-align:center; font-weight:600; color:#ff6ec4;">Очакваме Ви! 🥰</p>
    <div style="margin-top:20px; text-align:center;">
      <span style="background:linear-gradient(90deg,#f8b7d1,#f9a1c2); padding:12px 25px; border-radius:50px; color:#fff; font-weight:600; display:inline-block;">
        PavNailedIt 💅🏻
      </span>
    </div>
  </div>
  `
});

}
      return res.status(200).json({ message: "Часът е запазен!" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Server error", details: err.message });
    }
  }

  if (req.method === "GET") {
    try {
      const snapshot = await bookingsCollection.get();
      const bookings = snapshot.docs.map(doc => doc.data());
      return res.status(200).json({ bookings });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Server error", details: err.message });
    }
  }

  res.status(405).json({ error: "Method not allowed" });
}
