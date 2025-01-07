import type { Context } from "./type";
import { types } from "@babel/core";
import BabelGenerator from "@babel/generator";
import { getSchema } from "@mrleebo/prisma-ast";
import {
  exportDependencies,
  importSplitChunk,
  importStatement,
  preProcessBlocks,
  processBlock,
} from "./core";

const generator =
  typeof BabelGenerator === "function"
    ? BabelGenerator
    : (BabelGenerator as any).default;

type Config = {
  fileSuffix?: string;
};

export function transform(source: string, config?: Config) {
  const prismaSchema = getSchema(source);

  const list = prismaSchema.list;

  const { blocksType, modelProperties } = preProcessBlocks(list);

  const ctx: Context = {
    fileSuffix: config?.fileSuffix ?? "js",
    blocksType,
    modelProperties,
    modelDependencies: {},
  };

  const result: Record<
    string,
    {
      type: "model" | "enum" | "index";
      name: string;
      code: string;
    }
  > = {};

  for (const item of list) {
    const statement = processBlock(item, ctx);
    if (statement) {
      if (item.type === "model" || item.type === "enum") {
        const dependencies = Array.from(ctx.modelDependencies[item.name] ?? []);
        const program = types.program([
          ...(item.type === "model" ? importStatement() : []),
          ...importSplitChunk(ctx, dependencies),
          statement,
        ]);
        const { code } = generator(program, {});
        result[item.name] = {
          type: item.type,
          name: item.name,
          code,
        };
      }
    }
  }

  const dependencies = Object.keys(result);
  result[""] = {
    type: "index",
    name: "",
    code: generator(types.program(exportDependencies(ctx, dependencies)), {})
      .code,
  };

  return result;
}
