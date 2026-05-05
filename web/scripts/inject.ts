import * as fs from "fs";
import * as path from "path";

interface ClientConfig {
  branding: {
    appName: string;
    primaryColor: string;
    tagline: string;
    logoUrl: string;
  };
  features: Record<string, boolean>;
  environment: Record<string, string>;
}

function inject() {
  const configPath = path.resolve(__dirname, "../config/client.json");

  if (!fs.existsSync(configPath)) {
    console.error(
      "Error: config/client.json not found. Copy config/client.json.example to config/client.json and configure it."
    );
    process.exit(1);
  }

  const config: ClientConfig = JSON.parse(
    fs.readFileSync(configPath, "utf-8")
  );

  // Generate .env.local
  const envLines: string[] = [
    `NEXT_PUBLIC_APP_NAME="${config.branding.appName}"`,
    `NEXT_PUBLIC_PRIMARY_COLOR="${config.branding.primaryColor}"`,
    `NEXT_PUBLIC_TAGLINE="${config.branding.tagline}"`,
    `NEXT_PUBLIC_LOGO_URL="${config.branding.logoUrl}"`,
  ];

  for (const [key, value] of Object.entries(config.environment)) {
    envLines.push(`NEXT_PUBLIC_${key}="${value}"`);
  }

  const envPath = path.resolve(__dirname, "../.env.local");
  fs.writeFileSync(envPath, envLines.join("\n") + "\n");
  console.log("Generated .env.local");

  // Generate features.json in public directory
  const featuresPath = path.resolve(__dirname, "../public/features.json");
  fs.writeFileSync(featuresPath, JSON.stringify(config.features, null, 2));
  console.log("Generated public/features.json");

  console.log("Injection complete!");
}

inject();
