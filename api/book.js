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
      await bookingsCollection.add({ name, phone, services, date, time, design, clientEmail });

      // Изпращане на имейл на техник
      await sgMail.send({
        to: process.env.TECH_EMAIL,
        from: process.env.SENDGRID_FROM_EMAIL,
        subject: `Нов запис: ${name} — ${date} ${time}`,
        text: `Име: ${name}\nТелефон: ${phone}\nУслуги: ${services.join(", ")}\nДата: ${date} ${time}`
      });

      // Изпращане на имейл на клиент
      if (clientEmail) {
        await sgMail.send({
          to: clientEmail,
          from: process.env.SENDGRID_FROM_EMAIL,
          subject: `Потвърждение на час: ${date} ${time}`,
          text: `Здравей ${name},\nВашият час е записан: ${date} ${time}\nУслуги: ${services.join(", ")}`
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
