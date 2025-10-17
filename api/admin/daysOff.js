import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
const serviceAccount = require("../../../bookingthing.json");

if (!getApps().length) {
  initializeApp({ credential: cert(serviceAccount) });
}
const db = getFirestore();
const daysOffCollection = db.collection("daysOff");

export default async function handler(req, res) {
  const { method } = req;

  try {
    if (method === "GET") {
      const snapshot = await daysOffCollection.get();
      const daysOff = snapshot.docs.map(doc => ({ id: doc.id, date: doc.data().date }));
      return res.status(200).json({ daysOff });
    }

    if (method === "POST") {
      const { date } = req.body;
      if (!date) return res.status(400).json({ error: "Missing date" });

      const docRef = await daysOffCollection.add({ date });
      return res.status(200).json({ message: "Почивен ден добавен", id: docRef.id });
    }

    if (method === "DELETE") {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: "Missing id" });

      await daysOffCollection.doc(id).delete();
      return res.status(200).json({ message: "Почивен ден премахнат" });
    }

    res.setHeader("Allow", ["GET", "POST", "DELETE"]);
    return res.status(405).json({ error: `Method ${method} Not Allowed` });
  } catch (err) {
    console.error("🔥 Error in daysOff API:", err);
    return res.status(500).json({ error: "Server error", details: err.message });
  }
}
    res.setHeader("Allow", ["GET", "POST", "DELETE"]);
    return res.status(405).json({ error: `Method ${method} Not Allowed` });
  } catch (err) {
    console.error("DaysOff API error:", err);
    return res.status(500).json({ error: "Server error", details: err.message });
  }
}
