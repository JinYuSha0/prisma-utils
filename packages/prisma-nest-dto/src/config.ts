import * as path from 'path';
import { fileURLToPath } from 'url';

export type Config = {
  input?: string;
  output?: string;
};

export const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);

export const defaultConfig: Config = {
  input: path.join(process.cwd(), './prisma/schema.prisma'),
  output: path.join(__dirname, '../generate'),
};
