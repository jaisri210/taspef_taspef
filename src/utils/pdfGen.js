// server/src/utils/pdfGen.js
import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";
import { mirrorFileToStore } from "./uploadStore.js";

const uploadsDir = path.join(
  process.cwd(),
  process.env.UPLOAD_PATH || "uploads"
);
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

/**
 * Renders an HTML string to PDF and saves to uploads/<filename>.
 * Returns relative path like 'uploads/agm-...pdf'
 */
export async function htmlToPdfFile(
  htmlString,
  filename = `agm-${Date.now()}.pdf`
) {
  const outPath = path.join(uploadsDir, filename);

  // Launch Puppeteer
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    headless: true,
  });

  try {
    const page = await browser.newPage();

    // Set a basic viewport - useful for A4-ish render
    await page.setViewport({ width: 1200, height: 800 });

    // Set content and wait for stable rendering
    await page.setContent(htmlString, { waitUntil: "networkidle0" });

    // Create PDF (A4 portrait)
    await page.pdf({
      path: outPath,
      format: "A4",
      printBackground: true,
      margin: { top: "20mm", bottom: "20mm", left: "15mm", right: "15mm" },
    });

    await mirrorFileToStore(outPath, filename, "application/pdf");

    return `uploads/${filename}`;
  } finally {
    await browser.close();
  }
}
