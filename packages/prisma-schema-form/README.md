# PRISMA-SCHEMA-FORM

<div align="center">
<a href="https://www.npmjs.com/package/prisma-schema-form"><img src="https://img.shields.io/npm/v/prisma-schema-form.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/package/prisma-schema-form"><img src="https://img.shields.io/npm/l/prisma-schema-form.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/package/prisma-schema-form"><img src="https://img.shields.io/npm/dm/prisma-schema-form.svg" alt="NPM Downloads" /></a>
</div>

<center>A tool to convert prisma schema to json schema-form</center>

---

## Screenshot

![prisma-schema-form](https://raw.githubusercontent.com/JinYuSha0/prisma-utils/main/packages/prisma-schema-form/screenshot/prisma-schema-form.png)

## Live Playground

A [live playground](https://jinyusha0.github.io/) is hosted on GitHub Pages.

## How to install

```base
npm install prisma-schema-form
yarn add prisma-schema-form
```

## How to use

### Step1 (cli generate code)

```base
npx psf
yarn psf
```

### Step2 (import schema)

```typescript
import schema from "prisma-schema-form/schema";
import RJSFForm from "@rjsf/mui";

const App: React.FC<{}> = () => {
  return <RJSFForm formData={yourFormData} schema={schema.YourModel} />;
};
```

## Advanced usage

```typescript
import React, { useMemo } from "react";
import { merge } from "es-toolkit";

const Advanced: React.FC<{}> = () => {
  const appSchema = useMemo(() => {
    const android = !!formData?.platforms?.includes("ANDROID");
    const ios = !!formData?.platforms?.includes("IOS");
    const required = [
      ...(android ? ["androidBundleId"] : []),
      ...(ios ? ["iosBundleId"] : []),
    ];
    return (
      schemaBuilder(schema.YourModel)
        .assign(true, {
          // modify a property
          properties: {
            name: {
              title: "名字",
            },
          },
        })
        .assignDeep(true, "items", (envSchema) => ({
          ...envSchema,
          // modify required property
          required: [...envSchema.required, ...required],
          // modify a deep property
          properties: merge(envSchema.properties, {
            type: {
              title: "类型",
            },
          }),
        }))
        // omit a property
        .omit(true, "icon")
        // omit a deep property
        .omitDeep(true, ["items", "type"])
        .build()
    );
  }, [formData]);
  return <RJSFForm formData={yourFormData} schema={appSchema} />;
};
```

## Advanced usage method

| method | description | params |
| --- | --- | --- |
| omit | omit a property |  condition: boolean, keys: string[] |
| omitDeep | omit a deep property | condition: boolean, paths: string[] |
| assign | modify a property | condition: boolean, value: Partial\<JSONSchemaValue\> \| (model: T) => Partial\<JSONSchemaValue\> |
| assignDeep | modify a deep property | condition: boolean, key: string, value: Partial\<JSONSchemaValue\> \| (model: T) => Partial\<JSONSchemaValue\> |
| appendBefore | append some property before specified property | condition: boolean, key: string, value: Record\<string, JSONSchemaValue\> |
| appendAfter | append some property after specified property | condition: boolean, key: string, value: Record\<string, JSONSchemaValue\> |
| build | returns the final schema | |
