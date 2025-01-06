import type { Model, Field } from "@mrleebo/prisma-ast";
import type { JSONSchema7TypeName } from "json-schema";
import type { Context } from "./type";
import {
  isIdField,
  isKeyValue,
  isRelationArray,
  isSpecialField,
  cloneContext,
} from "./helper";

function processFieldType(
  field: Field
): JSONSchema7TypeName | JSONSchema7TypeName[] | undefined {
  switch (field.fieldType) {
    case "String":
    case "DateTime":
    case "Bytes":
      return "string";
    case "Int":
      return "integer";
    case "BigInt":
    case "Float":
    case "Decimal":
      return "number";
    case "Boolean":
      return "boolean";
    default:
      return undefined;
  }
}

function processFieldFormat(field: Field): string | undefined {
  switch (field.fieldType) {
    case "DateTime":
      return "date-time";
    case "Bytes":
      return "data-url";
    default:
      return undefined;
  }
}

function processFieldAttribute(
  field: Field
): { default: string | string[] } | undefined {
  if (field.attributes) {
    const defaultAttr = field.attributes.find(
      (attr) => attr.name === "default"
    );
    if (!defaultAttr || !defaultAttr.args?.length) return;
    if (typeof defaultAttr.args[0].value === "string") {
      return { default: defaultAttr.args[0].value };
    } else if (isRelationArray(defaultAttr.args[0].value)) {
      return { default: defaultAttr.args[0].value.args };
    }
  }
}

function processSimpleField(ctx: Context, field: Field) {
  const format = processFieldFormat(field);
  const attribute = processFieldAttribute(field);
  if (ctx.node.properties) {
    ctx.node.properties[field.name] = {
      title: field.name,
      type: processFieldType(field),
      ...(format ? { format } : {}),
      ...(attribute ? attribute : {}),
    };
  }
}

function processComplexField(ctx: Context, field: Field) {
  if (ctx.node.properties && !ctx.foreignKeys.includes(field.name)) {
    const isTS = ctx.language === "ts";
    if (field.array) {
      const simpleType = processFieldType(field);
      if (simpleType) {
        ctx.node.properties[field.name] = {
          title: field.name,
          type: "array",
          items: {
            type: simpleType,
          },
        };
      } else {
        ctx.node.properties[field.name] = {
          title: field.name,
          type: "array",
          items: {
            $ref: `#/definitions/${field.fieldType}`,
            ...(isTS ? { [`$def_${field.fieldType}`]: 0 } : {}),
          },
        };
      }
    } else {
      ctx.node.properties[field.name] = {
        title: field.name,
        $ref: `#/definitions/${field.fieldType}`,
        ...(isTS ? { [`$def_${field.fieldType}`]: 0 } : {}),
      };
    }
  }
}

function processComplexdDefinitions(ctx: Context, field: Field) {
  if (
    typeof field.fieldType !== "string" ||
    (ctx.rootNode?.definitions ?? {})[field.fieldType] ||
    processFieldType(field)
  ) {
    return;
  }

  const attribute = processFieldAttribute(field);
  if (ctx.enums[field.fieldType]) {
    // is enums
    if (field.array) {
      (ctx.node.properties ?? {})[field.name] = {
        type: "array",
        title: field.name,
        uniqueItems: true,
        items: {
          type: "string",
          enum: ctx.enums[field.fieldType],
        },
        ...(attribute ? attribute : {}),
      };
    } else {
      (ctx.node.properties ?? {})[field.name] = {
        type: "string",
        title: field.name,
        uniqueItems: true,
        enum: ctx.enums[field.fieldType],
        default: "",
        ...(attribute ? attribute : {}),
      };
    }
  } else if (ctx.prismaSchema[field.fieldType]) {
    // is object
    const childNode = cloneContext(ctx, field.fieldType);
    Object.assign(childNode.node, attribute);
    (ctx.rootNode?.definitions ?? {})[field.fieldType] = childNode.node;
    processModel(childNode, ctx.prismaSchema[field.fieldType]);
  }
}

export function processModel(ctx: Context, model: Model) {
  if (ctx.fragments[model.name]) {
    Object.assign(ctx.node, ctx.fragments[model.name]);
    return;
  }

  for (const property of model.properties) {
    if (property.type === "field" && property.attributes) {
      const relation = property.attributes.find(
        (item) => item.name === "relation"
      );
      if (!relation || !relation.args) continue;
      const mybeAttributeArgument = relation.args.find(
        ({ value }) => isKeyValue(value) && value.key === "fields"
      );
      if (!mybeAttributeArgument) continue;
      if (
        isKeyValue(mybeAttributeArgument.value) &&
        isRelationArray(mybeAttributeArgument.value.value)
      ) {
        ctx.foreignKeys.push(
          property.name,
          ...mybeAttributeArgument.value.value.args
        );
      }
    }
  }

  for (const property of model.properties) {
    if (
      property.type === "field" &&
      !isIdField(property) &&
      !ctx.foreignKeys.includes(property.name) &&
      !isSpecialField(property)
    ) {
      if (property.optional === false) {
        ctx.node.required?.push(property.name);
      }
      switch (property.fieldType) {
        case "String":
        case "Int":
        case "BigInt":
        case "Float":
        case "Boolean":
        case "DateTime":
        case "Decimal":
        case "Bytes":
          if (!property.array) {
            processSimpleField(ctx, property);
          } else {
            processComplexField(ctx, property);
            processComplexdDefinitions(ctx, property);
          }
          break;
        default:
          processComplexField(ctx, property);
          processComplexdDefinitions(ctx, property);
          break;
      }
    }
  }

  ctx.fragments[model.name] = ctx.node;
}
