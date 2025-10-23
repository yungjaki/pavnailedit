import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import crypto from "crypto";
const serviceAccount = require("../bookingthing.json");

if (!getApps().length) initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();
const giftCards = db.collection("giftcards");

function generateCode() {
  return crypto.randomBytes(3).toString("base64").replace(/[^a-zA-Z0-9]/g, "").substring(0, 6).toUpperCase();
}

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const { amount } = req.body;
      if (!amount || isNaN(amount)) return res.status(400).json({ error: "Невалидна сума" });

      const code = generateCode();
      await giftCards.doc(code).set({
        code,
        amount: parseFloat(amount),
        used: false,
        createdAt: new Date().toISOString(),
      });

      return res.status(200).json({ message: "Подаръчната карта е създадена!", code });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Server error" });
    }
  }

  if (req.method === "GET") {
    const snapshot = await giftCards.get();
    const cards = snapshot.docs.map(d => d.data());
    return res.status(200).json({ cards });
  }

  if (req.method === "PUT") {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: "Липсва код" });

    const doc = await giftCards.doc(code).get();
    if (!doc.exists) return res.status(404).json({ error: "Невалиден код" });
    if (doc.data().used) return res.status(400).json({ error: "Картата вече е използвана" });

    await giftCards.doc(code).update({ used: true });
    return res.status(200).json({ message: "Картата е отбелязана като използвана" });
  }

  res.setHeader("Allow", ["GET", "POST", "PUT"]);
  res.status(405).end();
}
