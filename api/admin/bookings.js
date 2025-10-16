import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
const serviceAccount = require("../../../bookingthing.json");

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();
const bookingsCollection = db.collection("bookings");

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const snapshot = await bookingsCollection.get();
      const bookings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return res.status(200).json({ bookings });
    }

    if (req.method === "DELETE") {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: "Missing booking ID" });
      await bookingsCollection.doc(id).delete();
      return res.status(200).json({ message: "Booking deleted" });
    }

    if (req.method === "PATCH") {
      const { id, updates } = req.body;
      if (!id || !updates) return res.status(400).json({ error: "Missing data" });
      await bookingsCollection.doc(id).update(updates);
      return res.status(200).json({ message: "Booking updated" });
    }

    res.setHeader("Allow", ["GET", "DELETE", "PATCH"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error", details: err.message });
  }
}
