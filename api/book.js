const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const serviceAccount = require("../bookingthing.json");
const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Инициализация на Firebase
initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();
const bookingsCollection = db.collection("bookings");

// MAIN HANDLER
module.exports = async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const { name, phone, services, date, time, design, clientEmail, totalPrice } = req.body;

      // Проверка за зает час
      const snapshot = await bookingsCollection
        .where("date", "==", date)
        .where("time", "==", time)
        .get();

      if (!snapshot.empty) {
        return res.status(400).json({ error: "Този час вече е зает" });
      }

      // Записване на резервацията
      await bookingsCollection.add({ name, phone, services, date, time, design, clientEmail, totalPrice });

      // Имейл до техник
      await sgMail.send({
        to: process.env.TECH_EMAIL,
        from: process.env.SENDGRID_FROM_EMAIL,
        subject: `Нов запис: ${name} — ${date} ${time}`,
        html: `
          <div style="font-family:Arial,sans-serif;background:#f8f9fa;padding:20px;border-radius:8px;">
            <h2 style="color:#2c3e50;">Нова резервация</h2>
            <p><b>Име:</b> ${name}</p>
            <p><b>Телефон:</b> ${phone}</p>
            <p><b>Дата и час:</b> ${date} ${time}</p>
            <p><b>Услуги:</b> ${services.join(", ")}</p>
            <p><b>Цена:</b> ${totalPrice} лв</p>
          </div>`
      });

      // Имейл до клиент
      if (clientEmail) {
        await sgMail.send({
          to: clientEmail,
          from: process.env.SENDGRID_FROM_EMAIL,
          subject: `Потвърждение на час: ${date} ${time}`,
          html: `
            <div style="font-family:Arial,sans-serif;background:#f8f9fa;padding:20px;border-radius:8px;">
              <h2 style="color:#27ae60;">Здравей, ${name}!</h2>
              <p>Вашият час е записан:</p>
              <ul>
                <li><b>Дата:</b> ${date}</li>
                <li><b>Час:</b> ${time}</li>
                <li><b>Услуги:</b> ${services.join(", ")}</li>
              </ul>
              <p><b>Обща цена:</b> ${totalPrice} лв</p>
              <button style="background:#27ae60;color:white;border:none;padding:10px 20px;border-radius:5px;cursor:pointer;">
                Виж подробности
              </button>
            </div>`
        });
      }

      return res.status(200).json({ message: "Часът е запазен!" });
    } catch (err) {
      console.error("Грешка при обработка на POST:", err);
      return res.status(500).json({ error: "Server error", details: err.message });
    }
  }

  if (req.method === "GET") {
    try {
      const snapshot = await bookingsCollection.get();
      const bookings = snapshot.docs.map(doc => doc.data());
      return res.status(200).json({ bookings });
    } catch (err) {
      console.error("Грешка при обработка на GET:", err);
      return res.status(500).json({ error: "Server error", details: err.message });
    }
  }

  res.status(405).json({ error: "Method not allowed" });
};
