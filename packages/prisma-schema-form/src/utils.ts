import type { JSONSchemaOutput } from './helper';
import type { JSONSchema7 } from 'json-schema';
import { cloneDeep, omit, without, merge } from 'es-toolkit';

type ExtractDefinitionName<T> = T extends JSONSchema7
  ? {
      [K in keyof T['items']]: K;
    }[keyof T['items']]
  : never;

type ExtractName<T> = T extends `$def_${infer Name}` ? Name : never;

type Paths<T, P extends readonly any[] = []> = T extends JSONSchemaOutput
  ? {
      [K in keyof T['properties']]: T['properties'][K] extends JSONSchema7
        ? T['properties'][K]['items'] extends undefined
          ? [...P, K]
          : T['properties'][K]['items'] extends { $ref: string }
            ? Partial<
                Paths<
                  T['definitions'][ExtractName<
                    ExtractDefinitionName<T['properties'][K]>
                  >],
                  [...P, K]
                >
              >
            : [...P, K]
        : [...P, K];
    }[keyof T['properties']]
  : [...P];

type JSONSchemaValue = Omit<JSONSchema7, 'properties'> & {
  properties?:
    | {
        [key: string]: JSONSchema7 & {
          errorMessage?: Record<string, string>;
          [x: string]: any;
        };
      }
    | undefined;
};

class SchemaBuilder<T extends JSONSchemaOutput> {
  private model: T;

  constructor(model: T) {
    this.model = cloneDeep(model);
  }

  omit<C extends boolean, K extends keyof T['properties']>(
    condition: C,
    ...keys: K[]
  ): C extends true
    ? SchemaBuilder<
        Omit<T, 'properties'> & {
          properties: Omit<T['properties'], (typeof keys)[number]>;
        }
      >
    : SchemaBuilder<T> {
    if (!condition) return this as any;
    this.model = {
      ...this.model,
      properties: omit(this.model.properties ?? {}, keys as string[]),
      required: without(this.model.required, ...(keys as string[])),
    };
    return this as any;
  }

  omitDeep<C extends boolean, P extends Paths<T>>(
    condition: C,
    paths: P,
  ): SchemaBuilder<T> {
    const _paths = paths as string[];
    if (!condition || !_paths?.length) return this as any;
    let root = this.model;
    const prevPaths = _paths.slice(0, -1);
    const property = _paths.slice(-1)[0];
    for (const path of prevPaths) {
      if (root.properties[path]) {
        const $ref = root.properties[path]['items']['$ref'];
        const def = $ref.replace('#/definitions/', '');
        if (root.definitions[def]) {
          root = root.definitions[def] as any;
        }
      }
    }
    delete root.properties[property];
    root.required = without(root.required, property);
    return this as any;
  }

  assign<C extends boolean>(
    condition: C,
    value: Partial<JSONSchemaValue> | ((model: T) => Partial<JSONSchemaValue>),
  ): SchemaBuilder<T> {
    if (!condition) return this as any;
    this.model =
      typeof value === 'function'
        ? (value(this.model) as T)
        : merge(this.model, value);
    return this as any;
  }

  assignDeep<C extends boolean>(
    condition: C,
    key: keyof T['properties'],
    value:
      | Partial<JSONSchemaValue>
      | ((model: JSONSchemaValue) => Partial<JSONSchemaValue>),
  ): SchemaBuilder<T> {
    if (!condition) return this as any;
    let root = this.model;
    let def: string | undefined;
    if (root.properties[key as string]) {
      const $ref = root.properties[key as string]!['items']['$ref'];
      def = $ref.replace('#/definitions/', '');
    }
    if (def) {
      this.model.definitions[def] =
        typeof value === 'function'
          ? value(this.model.definitions[def as string] as JSONSchemaValue)
          : merge(this.model.definitions[def] as JSONSchemaValue, value);
    }
    return this as any;
  }

  appendBefore<C extends boolean, R extends Record<string, JSONSchemaValue>>(
    condition: C,
    key: keyof T['properties'],
    fields: R,
  ): C extends true
    ? SchemaBuilder<
        T & {
          properties: { [K in keyof R]: JSONSchemaValue };
        }
      >
    : SchemaBuilder<T> {
    if (!condition) return this as any;
    const entries = Object.entries(this.model.properties);
    const targetIndex = entries.findIndex(([currKey]) => currKey === key);
    const appendEntries = Object.entries(fields);
    const newEntries = [
      ...entries.slice(0, targetIndex),
      ...appendEntries,
      ...entries.slice(targetIndex),
    ];
    for (const appendEntry of appendEntries) {
      if (appendEntry[1].required) {
        this.model.required = [
          ...new Set([...this.model.required, ...appendEntry[1].required]),
        ];
      }
      if (appendEntry[1].definitions) {
        Object.assign(this.model.definitions, appendEntry[1].definitions);
      }
    }
    this.model.properties = Object.fromEntries(newEntries);
    return this as any;
  }

  appendAfter<C extends boolean, R extends Record<string, JSONSchemaValue>>(
    condition: C,
    key: keyof T['properties'],
    fields: R,
  ): C extends true
    ? SchemaBuilder<
        T & {
          properties: { [K in keyof R]: JSONSchemaValue };
        }
      >
    : SchemaBuilder<T> {
    if (!condition) return this as any;
    const entries = Object.entries(this.model.properties);
    const targetIndex = entries.findIndex(([currKey]) => currKey === key) + 1;
    const appendEntries = Object.entries(fields);
    const newEntries = [
      ...entries.slice(0, targetIndex),
      ...appendEntries,
      ...entries.slice(targetIndex),
    ];
    for (const appendEntry of appendEntries) {
      if (appendEntry[1].required) {
        this.model.required = [
          ...new Set([...this.model.required, ...appendEntry[1].required]),
        ];
      }
      if (appendEntry[1].definitions) {
        Object.assign(this.model.definitions, appendEntry[1].definitions);
      }
    }
    this.model.properties = Object.fromEntries(newEntries);
    return this as any;
  }

  build() {
    return this.model;
  }
}

export function schemaBuilder<T extends JSONSchemaOutput>(model: T) {
  return new SchemaBuilder(model);
}
