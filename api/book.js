import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const serviceAccount = require("../bookingthing.json");
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function test() {
  const snapshot = await db.collection("bookings").get();
  snapshot.forEach(doc => {
    console.log(doc.id, doc.data());
  });
}

test().catch(console.error);
