import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
const serviceAccount = require("../../../bookingthing.json");

// Firebase
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();
const bookingsCollection = db.collection("bookings");

export default async function handler(req, res) {
  try {
    const { method } = req;

    if (method === "GET") {
      const snapshot = await bookingsCollection.get();
      const bookings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return res.status(200).json({ bookings });
    }

    if (method === "PATCH") {
      const { id, newDate, newTime } = req.body;
      if (!id || !newDate || !newTime) return res.status(400).json({ error: "Missing fields" });

      await bookingsCollection.doc(id).update({ date: newDate, time: newTime });
      return res.status(200).json({ message: "Часът е променен" });
    }

    if (method === "DELETE") {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: "Missing id" });

      await bookingsCollection.doc(id).delete();
      return res.status(200).json({ message: "Часът е отменен" });
    }

    res.setHeader("Allow", ["GET", "PATCH", "DELETE"]);
    return res.status(405).json({ error: `Method ${method} Not Allowed` });
  } catch (err) {
    console.error("Booking API error:", err);
    return res.status(500).json({ error: "Server error", details: err.message });
  }
}
