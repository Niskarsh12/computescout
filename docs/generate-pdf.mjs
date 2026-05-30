/**
 * Generate ComputeScout presentation PDF from slides.html
 * Run: node docs/generate-pdf.mjs
 */
import { pathToFileURL } from "url";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const slidesPath = path.join(__dirname, "slides.html");
const outputPath = path.join(__dirname, "ComputeScout-Presentation.pdf");

async function main() {
  let puppeteer;
  try {
    puppeteer = await import("puppeteer");
  } catch {
    console.log("Installing puppeteer...");
    const { execSync } = await import("child_process");
    execSync("npm install puppeteer --no-save", {
      stdio: "inherit",
      cwd: path.join(__dirname, ".."),
    });
    puppeteer = await import("puppeteer");
  }

  const browser = await puppeteer.default.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.goto(pathToFileURL(slidesPath).href, { waitUntil: "networkidle0" });

  await page.pdf({
    path: outputPath,
    width: "1920px",
    height: "1080px",
    printBackground: true,
    preferCSSPageSize: true,
  });

  await browser.close();

  const stats = fs.statSync(outputPath);
  console.log(`PDF saved: ${outputPath}`);
  console.log(`Size: ${(stats.size / 1024).toFixed(1)} KB`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
