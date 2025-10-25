import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";

export async function load(url, context, defaultLoad) {
  if (url.endsWith(".ts")) {
    const source = await fs.readFile(fileURLToPath(url), "utf8");
    return { format: "module", source, shortCircuit: true };
  }
  return defaultLoad(url, context, defaultLoad);
}
