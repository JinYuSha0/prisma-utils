import type {
  KeyValue,
  RelationArray,
  Attribute,
  Field,
} from "@mrleebo/prisma-ast";
import type { RJSFSchema } from "@rjsf/utils";
import type { Context } from "./type";
import type { JSONSchema7TypeName } from "json-schema";

type TransfromType<T extends { type?: unknown }> = T["type"] extends undefined
  ? undefined
  : T["type"] extends string
  ? JSONSchema7TypeName
  : JSONSchema7TypeName[];

export type JSONSchemaOutput = {
  type: string;
  required: string[];
  properties: Record<string, unknown>;
  definitions: Record<string, unknown>;
} & object;

type JSONSchema<T extends JSONSchemaOutput> = Omit<
  T,
  "type" | "properties" | "definitions"
> & {
  type: TransfromType<T>;
  required: string[];
  properties: T["properties"] extends undefined
    ? undefined
    : {
        [K in keyof T["properties"]]: T["properties"][K] extends {
          type: unknown;
          items?: { type?: unknown } & object;
        }
          ? Omit<T["properties"][K], "type" | "items"> & {
              type: TransfromType<T["properties"][K]>;
              items: T["properties"][K]["items"] extends object
                ? Omit<T["properties"][K]["items"], "type"> & {
                    type: TransfromType<T["properties"][K]["items"]>;
                  }
                : undefined;
            }
          : boolean;
      };
  definitions: T["definitions"] extends object
    ? {
        [K in keyof T["definitions"]]: T["definitions"][K] extends JSONSchemaOutput
          ? JSONSchema<T["definitions"][K]>
          : boolean;
      }
    : undefined;
};

export type JSONSchemaModels<T extends Record<string, JSONSchemaOutput>> = {
  [K in keyof T]: JSONSchema<T[K]>;
};

export function cloneContext(ctx: Partial<Context>, title: string): Context {
  const node: RJSFSchema = {
    title,
    type: "object",
    required: [],
    properties: {},
    definitions: {},
  };
  return {
    ...ctx,
    fragments: {},
    node,
    rootNode: ctx.rootNode ?? node,
    foreignKeys: [],
  } as Context;
}

export function isIdField(property: Field) {
  return !!property.attributes?.find(
    (attr) => attr.type === "attribute" && attr.name === "id"
  );
}

export function isKeyValue(val: unknown): val is KeyValue {
  if (!val) return false;
  return (val as KeyValue).type === "keyValue";
}

export function isRelationArray(val: unknown): val is RelationArray {
  if (!val) return false;
  return (val as RelationArray).type === "array";
}

export function isAttribute(val: unknown): val is Attribute {
  if (!val) return false;
  return (val as Attribute).type === "attribute";
}

export function hasDefaultValue(field: Field) {
  return !!field.attributes?.find((attr) => attr.name === "default");
}

export function isSpecialField(field: Field) {
  const isUpdateAt = !!field.attributes?.find(
    (attr) => attr.name === "updatedAt"
  );
  const isCreatedAt = field.name === "createdAt" && hasDefaultValue(field);
  return isUpdateAt || isCreatedAt;
}

export function toCode(
  schemas: Record<string, RJSFSchema>,
  language: "js" | "ts"
) {
  let code = "";
  const models = Object.keys(schemas);
  const definitionsMap = {};
  if (language === "ts") {
    code += `import type { JSONSchemaModels } from 'prisma-schema-form';`;
    code += `\r\n`;
  }
  code += models
    .map((name) => {
      const originDefinitions = schemas[name].definitions ?? {};
      schemas[name].definitions = {};
      definitionsMap[name] = Object.keys(originDefinitions);
      return `const ${name} = ${JSON.stringify(schemas[name])};`;
    })
    .join("\r\n");
  code += `\r\n`;
  code += `const models = {${models
    .map(
      (model) =>
        `${model}: { ...${model}, definitions: { ${
          definitionsMap[model] ? definitionsMap[model].join(", ") : ""
        } } }`
    )
    .join(",")}};`;
  code += `\r\n`;
  code += `export default models ${
    language === "ts" ? "as JSONSchemaModels<typeof models>" : ""
  };`;
  return code;
}
