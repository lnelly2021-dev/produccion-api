/**
 * Configuración base para generación de PDFs con Puppeteer.
 * Si tu API no genera PDFs, puedes eliminar este archivo.
 */
interface BrowserConfig {
  headless: boolean | "shell";
  args: string[];
  timeout: number;
}

interface PdfConfig {
  format: string;
  margin: { top: string; right: string; bottom: string; left: string };
  printBackground: boolean;
  preferCSSPageSize: boolean;
}

interface ServiceLimits {
  maxContentLength: number;
  maxGenerationTime: number;
}

interface AppConfig {
  puppeteer: BrowserConfig;
  pdf: PdfConfig;
  limits: ServiceLimits;
}

export const config: AppConfig = {
  puppeteer: {
    headless: "shell",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--disable-web-security",
    ],
    timeout: 30000,
  },
  pdf: {
    format: "A4",
    margin: { top: "5mm", right: "5mm", bottom: "5mm", left: "5mm" },
    printBackground: true,
    preferCSSPageSize: true,
  },
  limits: {
    maxContentLength: 1024 * 1024 * 5, // 5MB
    maxGenerationTime: 30000,
  },
};
