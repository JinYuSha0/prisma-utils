import * as path from "path";
import { fileURLToPath } from "url";

export type Config = {
  input?: string;
  output?: string;
  ignoreFields?: string[];
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const defaultConfig: Config = {
  input: path.join(process.cwd(), "./prisma/schema.prisma"),
  output: path.join(__dirname, "../generate/schema.js"),
  ignoreFields: ["createdAt", "updatedAt"],
};
