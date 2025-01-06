#!/usr/bin/env node

import fs from "fs";
import path from "path";
import settings from "../package.json";
import * as ts from "typescript";
import { Command, OptionValues } from "commander";
import { __dirname, __filename, defaultConfig } from "./config";
import { transform } from "./index";

function ensureDirectoryExists(filePath: string) {
  if (fs.existsSync(filePath)) {
    fs.rmSync(filePath, { recursive: true, force: true });
  }
  fs.mkdirSync(filePath, { recursive: true });
}

function compile(inputs: string[], options: OptionValues) {
  const compilerOptions: ts.CompilerOptions = {
    declaration: true,
    moduleResolution: ts.ModuleResolutionKind.Node16,
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.CommonJS,
    experimentalDecorators: true,
    emitDecoratorMetadata: true,
  };
  const tsProgram = ts.createProgram(inputs, compilerOptions);
  tsProgram.emit(undefined, (fileName, data) => {
    const filePath = path.join(options.output, path.basename(fileName));
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, data, "utf8");
  });
}

function main() {
  const program = new Command();
  program
    .name(settings.name)
    .description(settings.description)
    .version(settings.version)
    .option("-i, --input <path>", "Input file path", defaultConfig.input)
    .option("-o, --output <path>", "Output file path", defaultConfig.output);
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
  const codeMap = transform(source, true);

  ensureDirectoryExists(options.output);
  Object.keys(codeMap)
    .map((key) => codeMap[key])
    .forEach(({ name, type, code }) => {
      const outputTs = path.join(
        options.output,
        `${name}${!!name ? "." : ""}${type}.ts`
      );
      fs.writeFileSync(outputTs, code);
    });

  const files = Object.values(codeMap).map(({ name, type }) =>
    path.join(__dirname, "../generate", `${name}${!!name ? "." : ""}${type}.ts`)
  );
  compile(files, options);
  files.forEach((file) => {
    fs.unlinkSync(file);
  });
}
main();
