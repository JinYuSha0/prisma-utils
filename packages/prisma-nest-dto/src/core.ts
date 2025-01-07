import type { ClassProperty, Decorator, Statement, TSType } from "@babel/types";
import type { Block, Enum, Field, Model, Property } from "@mrleebo/prisma-ast";
import type { Context, ProcessedAttribute } from "./type.d.ts";
import { types } from "@babel/core";
import {
  annotation,
  annotationEach,
  defaultToAST,
  isBaseType,
  isFunc,
  isKeyValue,
  isRelationArray,
  optional,
} from "./helper";

function importDeclaration(path: string, ...specifiers: string[]) {
  return types.importDeclaration(
    specifiers.map((specifier) =>
      types.importSpecifier(
        types.identifier(specifier),
        types.identifier(specifier)
      )
    ),
    types.stringLiteral(path)
  );
}

export function exportDeclaration(path: string, ...specifiers: string[]) {
  return types.exportNamedDeclaration(
    null,
    specifiers.map((specifier) =>
      types.exportSpecifier(
        types.identifier(specifier),
        types.identifier(specifier)
      )
    ),
    types.stringLiteral(path)
  );
}

export function importStatement() {
  return [
    importDeclaration("@nestjs/swagger", "ApiProperty"),
    importDeclaration("class-transformer", "Expose", "Type"),
    importDeclaration(
      "class-validator",
      "IsOptional",
      "IsString",
      "IsNumber",
      "IsBoolean",
      "IsDate",
      "IsEnum",
      "IsArray",
      "ValidateNested"
    ),
  ];
}

export function importSplitChunk(ctx: Context, dependencies: string[]) {
  if (!dependencies.length) return [];
  return dependencies.map((dependency) =>
    importDeclaration(
      `./${dependency}.${ctx.blocksType[dependency]}.${ctx.fileSuffix}`,
      dependency
    )
  );
}

export function exportSplitChunk(ctx: Context, dependencies: string[]) {
  if (!dependencies.length) return [];
  return dependencies.map((dependency) =>
    exportDeclaration(
      `./${dependency}.${ctx.blocksType[dependency]}.${ctx.fileSuffix}`,
      dependency
    )
  );
}

export function exportDependencies(ctx: Context, dependencies: string[]) {
  return dependencies.map((dependency) =>
    types.exportNamedDeclaration(
      null,
      [
        types.exportSpecifier(
          types.identifier(dependency),
          types.identifier(dependency)
        ),
      ],
      types.stringLiteral(
        `./${dependency}.${ctx.blocksType[dependency]}.${ctx.fileSuffix}`
      )
    )
  );
}

function preProcessPropertyAttr(
  blocksType: Record<string, "enum" | "model">,
  properties: Model["properties"]
): Record<string, Partial<ProcessedAttribute>> {
  const result: Record<string, Partial<ProcessedAttribute>> = {};
  properties.forEach((property) => {
    if (property.type === "field") {
      const attr: Partial<ProcessedAttribute> = result[property.name] ?? {};
      if (property.optional) {
        attr.optional = true;
      }
      if (property.array) {
        attr.array = true;
      }
      if (typeof property.fieldType === "string") {
        attr.fieldType = property.fieldType;
      }
      (property.attributes ?? []).forEach((attribute) => {
        switch (attribute.name) {
          case "id":
            attr.id = true;
            break;
          case "default":
            const { value } = attribute.args[0];
            if (isBaseType(value)) {
              attr.default = value;
              attr.defaultAST = defaultToAST(
                value,
                property.fieldType,
                blocksType
              );
            } else if (isRelationArray(value)) {
              attr.default = value.args;
              attr.defaultAST = defaultToAST(
                value.args,
                property.fieldType,
                blocksType
              );
            } else if (isFunc(value)) {
              attr.optional = true;
            }
            break;
          case "relation":
            attr.optional = true;
            attribute.args.map((arg) => {
              if (isKeyValue(arg.value)) {
                const { key, value } = arg.value;
                if (isRelationArray(value)) {
                  switch (key) {
                    case "fields":
                      value.args.forEach((field) => {
                        if (result[field]) {
                          result[field].optional = true;
                        } else {
                          result[field] = { optional: true };
                        }
                      });
                      break;
                    case "references":
                      break;
                  }
                }
              }
            });
            break;
          case "updatedAt":
            attr.optional = true;
            break;
        }
      });
      result[property.name] = attr;
    }
  });
  return result;
}

export function preProcessBlocks(blocks: Block[]) {
  const blocksType: Record<string, "enum" | "model"> = {};
  const modelProperties: Record<
    string,
    Record<string, Partial<ProcessedAttribute>>
  > = {};
  blocks.forEach((block) => {
    switch (block.type) {
      case "enum":
        blocksType[block.name] = "enum";
        break;
      case "model":
        blocksType[block.name] = "model";
        break;
    }
  });
  blocks.forEach((block) => {
    if (block.type === "model") {
      modelProperties[block.name] = preProcessPropertyAttr(
        blocksType,
        block.properties
      );
    }
  });
  return { blocksType, modelProperties };
}

export function processBlock(block: Block, ctx: Context): Statement | null {
  const { type } = block;
  switch (type) {
    case "enum":
      return processEnum(block, ctx);
    case "model":
      return processModel(block, ctx);
    default:
      return null;
  }
}

function processEnum(block: Enum, ctx: Context) {
  return types.exportNamedDeclaration(
    types.tsEnumDeclaration(
      types.identifier(block.name),
      block.enumerators
        .filter((item) => item.type === "enumerator")
        .map((enumerator) => {
          return types.tsEnumMember(
            types.identifier(enumerator.name),
            types.stringLiteral(enumerator.name)
          );
        })
    )
  );
}

function processModel(block: Model, ctx: Context) {
  return types.exportNamedDeclaration(
    types.classDeclaration(
      types.identifier(block.name),
      null,
      types.classBody(
        block.properties
          .map(processBlockProperty.bind(null, ctx, block.name))
          .filter((statement): statement is ClassProperty => statement != null)
      )
    )
  );
}

function processFieldType(ctx: Context, modelName: string, property: Field) {
  const { fieldType, array } = property;
  function arrayType(type: TSType) {
    if (array) return types.tsArrayType(type);
    return type;
  }
  switch (fieldType) {
    case "String":
    case "Bytes":
      return arrayType(types.tSStringKeyword());
    case "Int":
    case "BigInt":
    case "Float":
    case "Decimal":
      return arrayType(types.tSNumberKeyword());
    case "Boolean":
      return arrayType(types.tsBooleanKeyword());
    case "DateTime":
      return arrayType(types.tsTypeReference(types.identifier("Date")));
    default:
      if (typeof fieldType === "string") {
        if (!ctx.modelDependencies[modelName]) {
          ctx.modelDependencies[modelName] = new Set();
        }
        ctx.modelDependencies[modelName].add(fieldType);
        return arrayType(types.tsTypeReference(types.identifier(fieldType)));
      }
      return arrayType(types.tsAnyKeyword());
  }
}

function processSwaggerAnnotation(
  attr: Partial<ProcessedAttribute>,
  isModel: boolean,
  isEnum: boolean
) {
  const objectProperties = [
    ...(!attr.optional
      ? [
          types.objectProperty(
            types.identifier("required"),
            types.booleanLiteral(true)
          ),
        ]
      : []),
    ...(attr.array
      ? [
          types.objectProperty(
            types.identifier("isArray"),
            types.booleanLiteral(true)
          ),
        ]
      : []),
    ...(attr.defaultAST
      ? [types.objectProperty(types.identifier("default"), attr.defaultAST)]
      : []),
    ...(isModel
      ? [
          types.objectProperty(
            types.identifier("type"),
            types.arrowFunctionExpression(
              [],
              attr.array
                ? types.arrayExpression([types.identifier(attr.fieldType)])
                : types.identifier(attr.fieldType)
            )
          ),
        ]
      : []),
    ...(isEnum
      ? [
          types.objectProperty(
            types.identifier("enum"),
            types.arrowFunctionExpression(
              [],
              attr.array
                ? types.arrayExpression([types.identifier(attr.fieldType)])
                : types.identifier(attr.fieldType)
            )
          ),
        ]
      : []),
  ];
  if (!objectProperties.length) return null;
  return annotation("ApiProperty", [types.objectExpression(objectProperties)]);
}

function processAnnotations(
  ctx: Context,
  modelName: string,
  property: Field
): Array<Decorator> | null {
  const attr = ctx.modelProperties[modelName][property.name];
  const isEnum = ctx.blocksType[attr.fieldType] === "enum";
  const isModel = ctx.blocksType[attr.fieldType] === "model";
  const classValidatorAnnotations = [annotation("Expose")];

  // swagger @ApiProperty
  const swaggerAnnotation = processSwaggerAnnotation(attr, isModel, isEnum);
  if (swaggerAnnotation) {
    classValidatorAnnotations.push(swaggerAnnotation);
  }

  if (attr.optional) {
    classValidatorAnnotations.push(annotation("IsOptional"));
  }
  if (attr.array) {
    classValidatorAnnotations.push(annotation("IsArray"));
    if (isModel) {
      classValidatorAnnotations.push(
        annotation("ValidateNested", annotationEach(true))
      );
    }
  }
  switch (attr.fieldType) {
    case "String":
    case "Bytes":
      classValidatorAnnotations.push(
        annotation("IsString", annotationEach(attr.array))
      );
      break;
    case "Int":
    case "BigInt":
    case "Float":
    case "Decimal":
      classValidatorAnnotations.push(
        annotation(
          "IsNumber",
          !attr.array
            ? []
            : [types.objectExpression([]), ...annotationEach(true)]
        )
      );
      break;
    case "Boolean":
      classValidatorAnnotations.push(
        annotation("IsBoolean", annotationEach(attr.array)),
        annotation("Type", [
          types.arrowFunctionExpression([], types.identifier("Boolean")),
        ])
      );
      break;
    case "DateTime":
      classValidatorAnnotations.push(
        annotation("IsDate", annotationEach(attr.array)),
        annotation("Type", [
          types.arrowFunctionExpression([], types.identifier("Date")),
        ])
      );
      break;
    default:
      if (isEnum) {
        classValidatorAnnotations.push(
          annotation("IsEnum", [
            types.identifier(attr.fieldType),
            ...annotationEach(attr.array),
          ])
        );
      } else if (isModel) {
        classValidatorAnnotations.push(
          annotation("Type", [
            types.arrowFunctionExpression([], types.identifier(attr.fieldType)),
          ])
        );
      }
      break;
  }
  return classValidatorAnnotations;
}

function processBlockProperty(
  ctx: Context,
  modelName: string,
  property: Property
) {
  if (property.type === "field") {
    const attr = ctx.modelProperties[modelName][property.name];
    const classProperty = types.classProperty(
      types.identifier(property.name),
      attr.defaultAST,
      types.tsTypeAnnotation(processFieldType(ctx, modelName, property)),
      processAnnotations(ctx, modelName, property),
      false
    );
    return optional(attr?.optional, classProperty);
  }
  return null;
}
