#!/usr/bin/env node

import fs from "fs";
import path from "path";
import os from "os";
import settings from "../package.json";
import * as ts from "typescript";
import { Command } from "commander";
import { defaultConfig } from "./config";
import { transform } from "./index";

function ensureDirectoryExists(filePath: string) {
  const dirPath = path.dirname(filePath);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function codeToJs(code: string) {
  const result = ts.transpileModule(code, {
    compilerOptions: {
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ES2015,
    },
  });
  return result.outputText;
}

function codeToTs(code: string) {
  const tmpDir = path.join(os.tmpdir(), "prisma-schema-form-tmp");
  const tsFilePath = path.join(tmpDir, "temp.ts");

  try {
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    fs.writeFileSync(tsFilePath, code, "utf-8");

    const options = {
      declaration: true,
      declarationDir: tmpDir,
      emitDeclarationOnly: true,
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
      strict: true,
      esModuleInterop: true,
    };

    const program = ts.createProgram([tsFilePath], options);

    const emitResult = program.emit();

    if (emitResult.emitSkipped) {
      throw new Error("TypeScript declaration generation failed.");
    }

    const generatedDtsPath = path.join(tmpDir, "temp.d.ts");
    return fs.readFileSync(generatedDtsPath).toString();
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

function replaceFileExtension(filePath: string, newExt: string) {
  return filePath.replace(path.extname(filePath), newExt);
}

async function main() {
  const program = new Command();
  program
    .name(settings.name)
    .description(settings.description)
    .version(settings.version)
    .option("-i, --input <path>", "Input file path", defaultConfig.input)
    .option("-o, --output <path>", "Output file path", defaultConfig.output)
    .option(
      "-f, --ignore-fields <fields...>",
      "Fields to ignore",
      defaultConfig.ignoreFields
    );
  program.parse(process.argv);
  const options = program.opts();
  if (
    options.input !== defaultConfig.input &&
    !path.isAbsolute(options.input)
  ) {
    options.input = path.join(process.cwd(), options.input);
  }
  if (
    options.output !== defaultConfig.output &&
    !path.isAbsolute(options.output)
  ) {
    options.output = path.join(process.cwd(), options.output);
  }
  const source = fs.readFileSync(options.input).toString();
  const code = await transform(source, "ts");
  const jsCode = codeToJs(code);
  const tsCode = codeToTs(code);
  ensureDirectoryExists(options.output);
  fs.writeFileSync(options.output, jsCode);
  fs.writeFileSync(replaceFileExtension(options.output, ".d.ts"), tsCode);
}
main();
