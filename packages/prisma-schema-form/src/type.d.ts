import type { Model } from "@mrleebo/prisma-ast";
import type { RJSFSchema } from "@rjsf/utils";

export type Context = {
  enums: Record<string, string[]>;
  prismaSchema: Record<string, Model>;
  fragments: Record<string, RJSFSchema>;
  rootNode?: RJSFSchema;
  node: RJSFSchema;
  foreignKeys: string[];
  language: "js" | "ts";
};
