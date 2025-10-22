// api/giftcards.js
import express from "express";
import PDFDocument from "pdfkit";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { recipient, amount, message } = req.body;
    const date = new Date().toLocaleDateString("bg-BG");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=giftcard-${recipient}.pdf`);

    const doc = new PDFDocument({ size: "A5", margin: 40 });
    doc.pipe(res);

    // Background
    doc.rect(0, 0, doc.page.width, doc.page.height).fill("#fff0f6");

    // Title
    doc.fontSize(26)
      .fillColor("#f45da8")
      .text("🎁 PavNailedIt Gift Card", { align: "center" });

    doc.moveDown(2);
    doc.fontSize(16).fillColor("#333").text(`За: ${recipient}`, { align: "center" });
    doc.text(`Сума: ${amount} лв`, { align: "center" });
    doc.moveDown(1);

    if (message) {
      doc.fontSize(12).fillColor("#555").text(`„${message}“`, {
        align: "center",
        italic: true,
      });
    }

    doc.moveDown(2);
    doc.fontSize(10)
      .fillColor("#777")
      .text(`Издадено на: ${date}`, { align: "center" });
    doc.text("💅 PavNailedIt – because self-care is love 💖", { align: "center" });

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "PDF generation failed" });
  }
});

export default router;
