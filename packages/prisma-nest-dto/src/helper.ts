import type {
  AttributeArgument,
  Field,
  Func,
  KeyValue,
  RelationArray,
} from "@mrleebo/prisma-ast";
import type { ClassProperty, Expression } from "@babel/types";
import { types } from "@babel/core";

export function isBaseType(value: any) {
  return (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  );
}

export function isRelationArray(
  value: AttributeArgument["value"]
): value is RelationArray {
  if (typeof value === "object") {
    return (value as RelationArray).type === "array";
  }
  return false;
}

export function isFunc(
  value: AttributeArgument["value"]
): value is RelationArray {
  if (typeof value === "object") {
    return (value as Func).type === "function";
  }
  return false;
}

export function isKeyValue(
  value: AttributeArgument["value"]
): value is KeyValue {
  if (typeof value === "object") {
    return (value as KeyValue).type === "keyValue";
  }
  return false;
}

export function optional<T extends ClassProperty>(
  condition: boolean,
  statement: T
): T {
  if (condition) {
    statement.optional = true;
  }
  return statement;
}

export function annotation(identifier: string, args: Array<Expression> = []) {
  return types.decorator(
    types.callExpression(types.identifier(identifier), args)
  );
}

export function annotationEach(isArray: boolean) {
  return isArray
    ? [
        types.objectExpression([
          types.objectProperty(
            types.identifier("each"),
            types.booleanLiteral(true)
          ),
        ]),
      ]
    : [];
}

export function defaultToAST(
  value: any,
  fieldType: Field["fieldType"],
  blocksType: Record<string, "enum" | "model">
): Expression | null {
  const isArray = Array.isArray(value);
  if (
    isArray &&
    typeof fieldType === "string" &&
    blocksType[fieldType] === "enum"
  ) {
    return types.arrayExpression(
      value.map((item) => defaultToAST(item, fieldType, blocksType))
    );
  }
  switch (fieldType) {
    case "String":
    case "Bytes":
      return types.stringLiteral(value);
    case "Int":
    case "BigInt":
    case "Float":
    case "Decimal":
      return types.numericLiteral(+value);
    case "Boolean":
      return types.booleanLiteral(value === "true");
    default:
      if (typeof fieldType === "string" && blocksType[fieldType] === "enum") {
        return types.memberExpression(
          types.identifier(fieldType),
          types.identifier(value)
        );
      }
      return null;
  }
}
