import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
const serviceAccount = require("../../../bookingthing.json");

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();
const daysOffCollection = db.collection("daysOff");

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const snapshot = await daysOffCollection.get();
      const daysOff = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return res.status(200).json({ daysOff });
    }

    if (req.method === "POST") {
      const { date } = req.body;
      if (!date) return res.status(400).json({ error: "Missing date" });
      await daysOffCollection.add({ date });
      return res.status(200).json({ message: "Day off added" });
    }

    if (req.method === "DELETE") {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: "Missing day off ID" });
      await daysOffCollection.doc(id).delete();
      return res.status(200).json({ message: "Day off deleted" });
    }

    res.setHeader("Allow", ["GET", "POST", "DELETE"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error", details: err.message });
  }
}
