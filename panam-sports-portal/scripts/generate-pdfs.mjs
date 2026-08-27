// Generates the "Download PDF" file for one or more weekly reports by
// rendering the live report page with a headless browser and printing it.
//
// Usage:
//   npm run generate:pdfs                          -- regenerate every report
//   npm run generate:pdfs -- PS-BIZ-2026-W17 ...    -- regenerate specific ids
//
// Requires a production build to already exist (`next build`) — the
// "generate:pdfs" npm script runs that first automatically.

import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { readFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const PORT = 4300;
const BASE_URL = `http://localhost:${PORT}`;

function loadReportIds(requestedIds) {
  if (requestedIds.length > 0) return requestedIds;
  const data = JSON.parse(readFileSync(path.join(rootDir, "data/reports.json"), "utf8"));
  return data.reports.map((r) => r.id);
}

function waitForServer(url, timeoutMs = 30000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const attempt = () => {
      fetch(url)
        .then(() => resolve())
        .catch(() => {
          if (Date.now() - start > timeoutMs) {
            reject(new Error(`Server did not become ready at ${url}`));
          } else {
            setTimeout(attempt, 300);
          }
        });
    };
    attempt();
  });
}

async function main() {
  const ids = loadReportIds(process.argv.slice(2));
  mkdirSync(path.join(rootDir, "public/dashboards"), { recursive: true });

  console.log(`Starting production server on port ${PORT}...`);
  const server = spawn(`npx next start -p ${PORT}`, {
    cwd: rootDir,
    stdio: "ignore",
    shell: true,
  });

  const stopServer = () => {
    if (process.platform === "win32") {
      spawn("taskkill", ["/pid", String(server.pid), "/f", "/t"]);
    } else {
      server.kill();
    }
  };

  try {
    await waitForServer(BASE_URL);

    const browser = await chromium.launch();
    const page = await browser.newPage();

    console.log(`Generating ${ids.length} PDF${ids.length === 1 ? "" : "s"}...`);
    for (const id of ids) {
      const url = `${BASE_URL}/report/${id}`;
      const outPath = path.join(rootDir, "public/dashboards", `${id}.pdf`);
      await page.goto(url, { waitUntil: "networkidle" });
      await page.emulateMedia({ media: "print" });
      await page.pdf({
        path: outPath,
        format: "A4",
        printBackground: true,
        margin: { top: "12mm", bottom: "12mm", left: "10mm", right: "10mm" },
      });
      console.log(`  ${id}.pdf`);
    }

    await browser.close();
    console.log("Done.");
  } finally {
    stopServer();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
