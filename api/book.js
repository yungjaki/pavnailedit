const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const serviceAccount = require("../bookingthing.json");
const sgMail = require("@sendgrid/mail");
const { google } = require("googleapis");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Инициализация на Firebase
initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();
const bookingsCollection = db.collection("bookings");

// Google OAuth2 клиент
const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "https://developers.google.com/oauthplayground"
);
oAuth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});
const calendar = google.calendar({ version: "v3", auth: oAuth2Client });

// ---- Функция за конвертиране на string в Date ----
function parseDateTime(date, time) {
  let day, month, year;
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    [year, month, day] = date.split("-");
  } else if (date.includes(".") || date.includes("/")) {
    [day, month, year] = date.split(/\.|\//);
  } else throw new Error("Unsupported date format: " + date);

  const [hours, minutes] = time.split(":").map(Number);
  return new Date(year, month - 1, day, hours, minutes, 0);
}

// ---- Форматиране за Google Calendar с локална часова зона ----
function formatDateForGoogleCalendar(date) {
  const pad = (n) => n.toString().padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  return {
    dateTime: `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`,
    timeZone: "Europe/Sofia",
  };
}

// ---- Генериране на ICS файл за iCloud / iPhone ----
function generateICS(name, services, phone, date, time, totalPrice) {
  const startDateTime = parseDateTime(date, time);
  const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // 1 час
  const pad = (n) => n.toString().padStart(2, "0");
  const formatICSDate = (d) =>
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(
      d.getUTCHours()
    )}${pad(d.getUTCMinutes())}00Z`;

  return `
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//PavNailedIt//Booking//BG
BEGIN:VEVENT
UID:${Date.now()}@pavnailedit.com
SUMMARY:Маникюр: ${name}
DESCRIPTION:Услуги: ${services.join(", ")}\\nТелефон: ${phone}\\nОбщо: ${totalPrice} лв
DTSTART:${formatICSDate(startDateTime)}
DTEND:${formatICSDate(endDateTime)}
END:VEVENT
END:VCALENDAR
`.trim();
}

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

      // Записване на резервацията в Firestore
      await bookingsCollection.add({ name, phone, services, date, time, design, clientEmail, totalPrice });

      // Създаване на Date обекти за Google Calendar
      const startDateTime = parseDateTime(date, time);
      const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // +1 час

      // Събитие в Google Calendar на маникюристката
      await calendar.events.insert({
        calendarId: process.env.TECH_CALENDAR_ID,
        requestBody: {
          summary: `Маникюр: ${name}`,
          description: `Услуги: ${services.join(", ")}\nТелефон: ${phone}\nОбщо: ${totalPrice} лв`,
          start: formatDateForGoogleCalendar(startDateTime),
          end: formatDateForGoogleCalendar(endDateTime),
          attendees: clientEmail ? [{ email: clientEmail }] : [],
        },
      });

      // Линк за добавяне в Google Calendar (за клиента)
      const calendarLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=Маникюр:+${encodeURIComponent(
        services.join(", ")
      )}&dates=${startDateTime.toISOString().replace(/[-:]/g, "").split(".")[0]}Z/${endDateTime
        .toISOString()
        .replace(/[-:]/g, "")
        .split(".")[0]}Z&details=${encodeURIComponent(
        "Nails by Pav.Nailed.It 💅🏻"
      )}&location=${encodeURIComponent("Студио Pav.Nailed.It")}&sf=true&output=xml`;

      // ICS съдържание за техниката
      const icsContent = generateICS(name, services, phone, date, time, totalPrice);

      // Имейл до техника с ICS и бутон
      await sgMail.send({
        to: process.env.TECH_EMAIL,
        from: process.env.SENDGRID_FROM_EMAIL,
        subject: `Нов запис: ${name} — ${date} ${time}`,
        html: `
        <div style="font-family: 'Roboto', sans-serif; background:#fff0f4; padding:25px; border-radius:20px; color:#2c2c2c; max-width:600px; margin:auto;">
          <h2 style="color:#ff6ec4; text-align:center;">💅🏻 Нов запис на час</h2>
          <p><strong>👤 Име:</strong> ${name}</p>
          <p><strong>📞 Телефон:</strong> ${phone}</p>
          <p><strong>📅 Дата:</strong> ${date}</p>
          <p><strong>⏰ Час:</strong> ${time}</p>
          <h3 style="color:#f9a1c2;">✨ Услуги:</h3>
          <ul>${services.map((s) => `<li>💖 ${s}</li>`).join("")}</ul>
          <p style="font-size:18px; font-weight:700; color:#ff6ec4;">💰 Общо: ${totalPrice} лв</p>
          <div style="margin-top:20px; text-align:center;">
            <p>📅 Можете да добавите часa директно във вашия календар (iCloud / iPhone / Mac):</p>
            <a href="data:text/calendar;charset=utf8,${encodeURIComponent(icsContent)}" 
               style="background:linear-gradient(90deg,#f8b7d1,#f9a1c2); padding:12px 25px; border-radius:50px; color:#fff; font-weight:600; text-decoration:none;">
               📅 Добави в календара
            </a>
          </div>
        </div>
        `,
        attachments: [
          {
            content: Buffer.from(icsContent).toString("base64"),
            filename: "booking.ics",
            type: "text/calendar",
            disposition: "attachment",
          },
        ],
      });

      // Имейл до клиента
      await sgMail.send({
        to: clientEmail,
        from: process.env.SENDGRID_FROM_EMAIL,
        subject: `Потвърждение на час: ${date} ${time}`,
        html: `
        <div style="font-family: 'Roboto', sans-serif; background:#fff0f4; padding:25px; border-radius:20px; color:#2c2c2c; max-width:600px; margin:auto;">
          <h2 style="color:#ff6ec4; text-align:center;">💅🏻 Здравей, ${name}!</h2>
          <p style="text-align:center;">Вашият час е успешно запазен.</p>
          <p><strong>📅 Дата:</strong> ${date}</p>
          <p><strong>⏰ Час:</strong> ${time}</p>
          <h3 style="color:#f9a1c2;">✨ Избрани услуги:</h3>
          <ul>${services.map((s) => `<li>💖 ${s}</li>`).join("")}</ul>
          <p style="font-size:18px; font-weight:700; color:#ff6ec4; text-align:center;">💰 Общо: ${totalPrice} лв</p>
          <div style="margin-top:20px; text-align:center;">
            <a href="${calendarLink}" style="background:linear-gradient(90deg,#f8b7d1,#f9a1c2); padding:12px 25px; border-radius:50px; color:#fff; font-weight:600; text-decoration:none;">
              📅 Добави в календара
            </a>
          </div>
          <p style="margin-top:25px; text-align:center; font-weight:600; color:#ff6ec4;">Очаквам те! 💞🥰</p>
        </div>
        `,
      });

      return res.status(200).json({ message: "Часът е запазен!" });
    } catch (err) {
      console.error("Грешка при обработка на POST:", err);
      return res.status(500).json({ error: "Server error", details: err.message });
    }
  }

  if (req.method === "GET") {
    try {
      const snapshot = await bookingsCollection.get();
      const bookings = snapshot.docs.map((doc) => doc.data());
      return res.status(200).json({ bookings });
    } catch (err) {
      console.error("Грешка при обработка на GET:", err);
      return res.status(500).json({ error: "Server error", details: err.message });
    }
  }

  res.status(405).json({ error: "Method not allowed" });
};
