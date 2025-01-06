import type { Statement } from '@babel/types';

type Value = string | number | boolean | Array<Value>;

export type Context = {
  fileSuffix: string;
  blocksType: Record<string, 'enum' | 'model'>;
  modelProperties: {
    [modelName: string]: {
      [propertyName: string]: Partial<ProcessedAttribute>;
    };
  };
  modelDependencies: Record<string, Set<string>>;
};

export type ProcessedAttribute = {
  default: Value;
  defaultAST: Expression;
  id: boolean;
  optional: boolean;
  array: boolean;
  fieldType: string;
};
