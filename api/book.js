const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const serviceAccount = require("../bookingthing.json");
const sgMail = require("@sendgrid/mail");
const { google } = require("googleapis");
const cloudinary = require("cloudinary").v2;
const formidable = require("formidable");
const fs = require("fs");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();
const bookingsCollection = db.collection("bookings");

const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "https://developers.google.com/oauthplayground"
);
oAuth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});
const calendar = google.calendar({ version: "v3", auth: oAuth2Client });

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

function generateICS(name, services, phone, date, time, totalPrice) {
  const startDateTime = parseDateTime(date, time);
  const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);
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
SUMMARY:Нов час: ${name}
DESCRIPTION:Услуги: ${services.join(", ")}\\nТелефон: ${phone}\\nОбщо: ${totalPrice} лв
DTSTART:${formatICSDate(startDateTime)}
DTEND:${formatICSDate(endDateTime)}
END:VEVENT
END:VCALENDAR
`.trim();
}

module.exports = async function handler(req, res) {
  if (req.method === "POST") {
      const form = new formidable.IncomingForm({ multiples: false });
      form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error("Form parse error:", err);
        return res.status(400).json({ error: "Invalid form data" });
      }

      try {
        const { name, phone, services, date, time, clientEmail, totalPrice } =
          fields;

        // Проверка за зает час
        const snapshot = await bookingsCollection
          .where("date", "==", date)
          .where("time", "==", time)
          .get();

        if (!snapshot.empty) {
          return res.status(400).json({ error: "Този час вече е зает" });
        }

        // --- Качване на снимка в Cloudinary ---
        let designUrl = "";
        if (files.design) {
          const uploadResult = await cloudinary.uploader.upload(
            files.design.filepath,
            { folder: "bookings" }
          );
          designUrl = uploadResult.secure_url;
          fs.unlinkSync(files.design.filepath);
        }

        // Записване в Firestore
        const parsedServices = JSON.parse(services);
        await bookingsCollection.add({
          name,
          phone,
          services: parsedServices,
          date,
          time,
          design: designUrl,
          clientEmail,
          totalPrice,
        });

        // Създаване на календар събитие
        const startDateTime = parseDateTime(date, time);
        const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);
        await calendar.events.insert({
          calendarId: process.env.TECH_CALENDAR_ID,
          requestBody: {
            summary: `Маникюр: ${name}`,
            description: `Услуги: ${parsedServices.join(", ")}\nТелефон: ${phone}\nОбщо: ${totalPrice} лв`,
            start: formatDateForGoogleCalendar(startDateTime),
            end: formatDateForGoogleCalendar(endDateTime),
            attendees: clientEmail ? [{ email: clientEmail }] : [],
          },
        });

        // Имейл до техника
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
            <ul>${parsedServices.map((s) => `<li>💖 ${s}</li>`).join("")}</ul>
            <p style="font-size:18px; font-weight:700; color:#ff6ec4;">💰 Общо: ${totalPrice} лв</p>
            
            ${
              designUrl
                ? `<div style="margin-top:20px; text-align:center;">
                     <p>📸 Дизайнът, качен от клиента:</p>
                     <img src="${designUrl}" alt="Дизайн" style="max-width:100%; border-radius:15px; margin-top:10px;" />
                   </div>`
                : ""
            }
          </div>
          `,
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
            <ul>${parsedServices.map((s) => `<li>💖 ${s}</li>`).join("")}</ul>
            <p style="font-size:18px; font-weight:700; color:#ff6ec4; text-align:center;">💰 Общо: ${totalPrice} лв</p>
            
            ${
              designUrl
                ? `<div style="margin-top:20px; text-align:center;">
                     <p>📸 Дизайнът, който изпратихте:</p>
                     <img src="${designUrl}" alt="Дизайн" style="max-width:100%; border-radius:15px; margin-top:10px;" />
                   </div>`
                : ""
            }

            <p style="margin-top:25px; text-align:center; font-weight:600; color:#ff6ec4;">Очаквам те! 💞🥰</p>
          </div>
          `,
        });

        return res.status(200).json({ message: "Часът е запазен!" });
      } catch (err) {
        console.error("Грешка при POST:", err);
        return res.status(500).json({ error: "Server error", details: err.message });
      }
    });
  }

  if (req.method === "GET") {
    try {
      const snapshot = await bookingsCollection.get();
      const bookings = snapshot.docs.map((doc) => doc.data());
      return res.status(200).json({ bookings });
    } catch (err) {
      console.error("Грешка при GET:", err);
      return res.status(500).json({ error: "Server error", details: err.message });
    }
  }

  res.status(405).json({ error: "Method not allowed" });
};
