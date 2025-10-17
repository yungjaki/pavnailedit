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

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });

  try {
    const { id } = req.body;

    if (!id) return res.status(400).json({ error: "Липсва ID" });

    const docRef = bookingsCollection.doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists)
      return res.status(404).json({ error: "Не е намерена резервация" });

    const booking = docSnap.data();

    // Изтриване на събитието в Google Calendar, ако има eventId
    if (booking.eventId) {
      try {
        await calendar.events.delete({
          calendarId: process.env.TECH_CALENDAR_ID,
          eventId: booking.eventId,
        });
      } catch (err) {
        console.warn("Неуспешно изтриване на събитие от календара:", err.message);
      }
    }

    // Изтриване на резервацията от Firestore
    await docRef.delete();

    // Изпращане на потвърдителен имейл до клиента
    if (booking.clientEmail) {
      await sgMail.send({
        to: booking.clientEmail,
        from: process.env.SENDGRID_FROM_EMAIL,
        subject: `Отказване на резервация: ${booking.date} ${booking.time}`,
        html: `<div style="font-family:Roboto,sans-serif;background:#fff0f4;padding:25px;border-radius:20px;">
                <h2 style="color:#ff6ec4;text-align:center;">⛔ Вашият час е отменен</h2>
                <p>Здравейте, ${booking.name}!</p>
                <p>Вашия час за дата <strong>${booking.date}</strong> и час <strong>${booking.time}</strong> беше отменен.</p>
                <p>Надяваме се скоро да Ви видим отново! 💅🏻</p>
              </div>`,
      });
    }

    // Имейл до техника
    await sgMail.send({
      to: process.env.TECH_EMAIL,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: `Отказана резервация: ${booking.name} — ${booking.date} ${booking.time}`,
      html: `<div style="font-family:Roboto,sans-serif;background:#fff0f4;padding:25px;border-radius:20px;">
              <h2 style="color:#ff6ec4;">⛔ Час отменен</h2>
              <p><strong>Име:</strong> ${booking.name}</p>
              <p><strong>Дата:</strong> ${booking.date}</p>
              <p><strong>Час:</strong> ${booking.time}</p>
            </div>`,
    });

    return res.status(200).json({ message: "Час е отменен" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Грешка при отказване" });
  }
}
