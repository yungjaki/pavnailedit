const { getFirestore } = require("firebase-admin/firestore");
const db = getFirestore();
const wallCollection = db.collection("wallOfLove");

module.exports = async function handler(req, res) {
  if (req.method === "POST") {
    const { name, message } = req.body;
    if (!name || !message) {
      return res.status(400).json({ error: "Missing fields" });
    }
    await wallCollection.add({
      name,
      message,
      createdAt: new Date(),
    });
    return res.status(200).json({ message: "Saved" });
  }

  if (req.method === "GET") {
    const snapshot = await wallCollection.orderBy("createdAt", "desc").get();
    const messages = snapshot.docs.map(doc => doc.data());
    return res.status(200).json({ messages });
  }

  res.status(405).json({ error: "Method not allowed" });
};
