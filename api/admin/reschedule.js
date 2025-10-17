import { getFirestore } from "firebase-admin/firestore";
import { initializeApp, cert } from "firebase-admin/app";
import sgMail from "@sendgrid/mail";
import { google } from "googleapis";
const serviceAccount = require("../../bookingthing.json");

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();
const bookingsCollection = db.collection("bookings");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "https://developers.google.com/oauthplayground"
);
oAuth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
const calendar = google.calendar({ version: "v3", auth: oAuth2Client });

// Помощна функция parseDateTime от твоя код, ако я нямаш импортирана – добави я

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

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });

  try {
    const { id, newDate, newTime } = req.body;

    if (!id || !newDate || !newTime)
      return res.status(400).json({ error: "Липсват данни" });

    const docRef = bookingsCollection.doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists)
      return res.status(404).json({ error: "Не е намерена резервация" });

    const booking = docSnap.data();

    // Проверка за зает нов час
    const snapshot = await bookingsCollection
      .where("date", "==", newDate)
      .where("time", "==", newTime)
      .get();

    if (!snapshot.empty && !snapshot.docs.some(doc => doc.id === id)) {
      return res.status(400).json({ error: "Новият час вече е зает" });
    }

    // Обновяване Firestore
    await docRef.update({ date: newDate, time: newTime });

    // Обновяване на Google Calendar
    if (booking.eventId) {
      const startDateTime = parseDateTime(newDate, newTime);
      const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);

      await calendar.events.update({
        calendarId: process.env.TECH_CALENDAR_ID,
        eventId: booking.eventId,
        requestBody: {
          summary: `Маникюр: ${booking.name}`,
          description: `Услуги: ${booking.services.join(", ")}\nТелефон: ${booking.phone}\nОбщо: ${booking.totalPrice} лв`,
          start: formatDateForGoogleCalendar(startDateTime),
          end: formatDateForGoogleCalendar(endDateTime),
          attendees: booking.clientEmail ? [{ email: booking.clientEmail }] : [],
        },
      });
    }

    // Изпращане на имейл до клиента
    if (booking.clientEmail) {
      await sgMail.send({
        to: booking.clientEmail,
        from: process.env.SENDGRID_FROM_EMAIL,
        subject: `Промяна на резервация: ${newDate} ${newTime}`,
        html: `<div style="font-family:Roboto,sans-serif;background:#fff0f4;padding:25px;border-radius:20px;">
                <h2 style="color:#ff6ec4;text-align:center;">🕒 Вашият час е променен</h2>
                <p>Здравейте, ${booking.name}!</p>
                <p>Вашата резервация беше успешно преместена на дата <strong>${newDate}</strong> и час <strong>${newTime}</strong>.</p>
                <p>Очакваме Ви! 💅🏻</p>
              </div>`,
      });
    }

    // Имейл до техника
    await sgMail.send({
      to: process.env.TECH_EMAIL,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: `Променена резервация: ${booking.name} — ${newDate} ${newTime}`,
      html: `<div style="font-family:Roboto,sans-serif;background:#fff0f4;padding:25px;border-radius:20px;">
              <h2 style="color:#ff6ec4;">🕒 Резервация променена</h2>
              <p><strong>Име:</strong> ${booking.name}</p>
              <p><strong>Нова дата:</strong> ${newDate}</p>
              <p><strong>Нов час:</strong> ${newTime}</p>
            </div>`,
    });

    return res.status(200).json({ message: "Резервацията е променена" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Грешка при промяна на час" });
  }
}
