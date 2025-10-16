import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { IncomingForm } from "formidable";
import sgMail from "@sendgrid/mail";
import { google } from "googleapis";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import serviceAccount from "../bookingthing.json" assert { type: "json" };

export const config = {
  api: { bodyParser: false },
};

// ✅ Настройки
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// ✅ Firebase
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();
const bookingsCollection = db.collection("bookings");

// ✅ Google OAuth
const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "https://developers.google.com/oauthplayground"
);
oAuth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
const calendar = google.calendar({ version: "v3", auth: oAuth2Client });

// ---- helpers ----
function parseDateTime(date, time) {
  let day, month, year;
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) [year, month, day] = date.split("-");
  else if (date.includes(".") || date.includes("/")) [day, month, year] = date.split(/\.|\//);
  else throw new Error("Unsupported date format: " + date);
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
  return { dateTime: `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`, timeZone: "Europe/Sofia" };
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
SUMMARY:Маникюр: ${name}
DESCRIPTION:Услуги: ${services.join(", ")}\\nТелефон: ${phone}\\nОбщо: ${totalPrice} лв
DTSTART:${formatICSDate(startDateTime)}
DTEND:${formatICSDate(endDateTime)}
END:VEVENT
END:VCALENDAR`.trim();
}

// ---- main handler ----
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const form = new IncomingForm({ keepExtensions: true, maxFileSize: 5 * 1024 * 1024 });

  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: "Form parse error", details: err.message });

    try {
      const name = fields.name?.[0];
      const phone = fields.phone?.[0];
      const clientEmail = fields.email?.[0];
      const date = fields.date?.[0];
      const time = fields.time?.[0];
      const totalPrice = fields.totalPrice?.[0];
      const services = JSON.parse(fields.services?.[0] || "[]");

      // качване в Cloudinary ако има файл
      let designUrl = "";
      if (files.design && files.design[0]) {
        const filePath = files.design[0].filepath;
        const upload = await cloudinary.uploader.upload(filePath, { folder: "pavnailedit_bookings" });
        designUrl = upload.secure_url;
        fs.unlinkSync(filePath);
      }

      // проверка за зает час
      const snapshot = await bookingsCollection.where("date", "==", date).where("time", "==", time).get();
      if (!snapshot.empty) return res.status(400).json({ error: "Този час вече е зает" });

      // запис в Firestore
      await bookingsCollection.add({ name, phone, clientEmail, services, date, time, designUrl, totalPrice });

      // добавяне в Google Calendar
      const startDateTime = parseDateTime(date, time);
      const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);
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

      const icsContent = generateICS(name, services, phone, date, time, totalPrice);

      // имейл до техника
      await sgMail.send({
        to: process.env.TECH_EMAIL,
        from: process.env.SENDGRID_FROM_EMAIL,
        subject: `Нов запис: ${name} — ${date} ${time}`,
        html: `
        <div style="font-family:Roboto,sans-serif;background:#fff0f4;padding:25px;border-radius:20px;">
          <h2 style="color:#ff6ec4;">💅🏻 Нов запис</h2>
          <p><strong>Име:</strong> ${name}</p>
          <p><strong>Телефон:</strong> ${phone}</p>
          <p><strong>Дата:</strong> ${date}</p>
          <p><strong>Час:</strong> ${time}</p>
          <h3 style="color:#f9a1c2;">✨ Услуги:</h3>
          <ul>${services.map((s) => `<li>💖 ${s}</li>`).join("")}</ul>
          <p style="font-size:18px;font-weight:700;color:#ff6ec4;">💰 Общо: ${totalPrice} лв</p>
          ${designUrl ? `<p><strong>📸 Прикачен дизайн:</strong></p><img src="${designUrl}" style="max-width:300px;border-radius:10px;">` : ""}
        </div>`,
        attachments: [
          {
            content: Buffer.from(icsContent).toString("base64"),
            filename: "booking.ics",
            type: "text/calendar",
            disposition: "attachment",
          },
        ],
      });

      // имейл до клиента
      await sgMail.send({
        to: clientEmail,
        from: process.env.SENDGRID_FROM_EMAIL,
        subject: `Потвърждение на час: ${date} ${time}`,
        html: `
        <div style="font-family:Roboto,sans-serif;background:#fff0f4;padding:25px;border-radius:20px;">
          <h2 style="color:#ff6ec4;text-align:center;">💅🏻 Здравей, ${name}!</h2>
          <p>Вашият час е успешно запазен.</p>
          <p><strong>Дата:</strong> ${date}</p>
          <p><strong>Час:</strong> ${time}</p>
          <ul>${services.map((s) => `<li>💖 ${s}</li>`).join("")}</ul>
          <p style="font-weight:700;color:#ff6ec4;">💰 Общо: ${totalPrice} лв</p>
          <p style="margin-top:15px;">Очакваме те 💞 ул. Благовест 1</p>
        </div>`,
      });

      return res.status(200).json({ message: "Часът е запазен и снимката е изпратена!" });
    } catch (err) {
      console.error("❌ Error:", err);
      res.status(500).json({ error: "Server error", details: err.message });
    }
  });
}
