import type { Context } from './type';
import Babel from '@babel/core';
import BabelGenerator from '@babel/generator';
import { getSchema } from '@mrleebo/prisma-ast';
import {
  exportDependencies,
  importSplitChunk,
  importStatement,
  preProcessBlocks,
  processBlock,
} from './core';

const { default: generator } = BabelGenerator as unknown as {
  default: typeof BabelGenerator;
};

export function transform(source: string, split: boolean = false) {
  const prismaSchema = getSchema(source);

  const list = prismaSchema.list.sort((a, b) => (a.type === 'enum' ? -1 : 0));

  const { blocksType, modelProperties } = preProcessBlocks(list);

  const ctx: Context = {
    fileSuffix: 'js',
    blocksType,
    modelProperties,
    modelDependencies: {},
  };

  const result: Record<
    string,
    {
      type: 'model' | 'enum' | 'index';
      name: string;
      code: string;
    }
  > = {};

  for (const item of list) {
    const statement = processBlock(item, ctx);
    if (statement) {
      if (item.type === 'model' || item.type === 'enum') {
        const dependencies = Array.from(ctx.modelDependencies[item.name] ?? []);
        const program = Babel.types.program([
          ...importStatement(),
          ...importSplitChunk(ctx, split ? dependencies : []),
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

  if (split) {
    const dependencies = Object.keys(result);
    result[''] = {
      type: 'index',
      name: '',
      code: generator(
        Babel.types.program(exportDependencies(ctx, dependencies)),
        {},
      ).code,
    };
  }

  return result;
}
