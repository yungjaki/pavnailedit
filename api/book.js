import nodemailer from "nodemailer";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { name, phone, date, time, services } = req.body;

    // Създай имейл към маникюристката
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: "manikyristka@example.com",
      subject: `Нов час - ${date} ${time}`,
      text: `Име: ${name}\nТелефон: ${phone}\nУслуги: ${services.join(", ")}`
    };

    try {
      await transporter.sendMail(mailOptions);
      res.status(200).json({ message: "Часът е запазен и имейлът е изпратен!" });
    } catch (error) {
      res.status(500).json({ error: "Грешка при изпращане на имейл" });
    }
  } else {
    res.status(405).json({ message: "Методът не е разрешен" });
  }
}
