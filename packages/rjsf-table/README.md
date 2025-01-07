RJSF-TABLE

<div align="center">
<a href="https://www.npmjs.com/package/rjsf-table"><img src="https://img.shields.io/npm/v/rjsf-table.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/package/rjsf-table"><img src="https://img.shields.io/npm/l/rjsf-table.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/package/rjsf-table"><img src="https://img.shields.io/npm/dm/rjsf-table.svg" alt="NPM Downloads" /></a>
</div>

<center>A table component of react-json-schema, use dialog to add or edit content, support sorting</center>

---

# Screenshot

![rjsf-table](https://raw.githubusercontent.com/JinYuSha0/prisma-utils/main/packages/rjsf-table/screenshot/rjsf-table.gif)

# How to install

```base
npm install rjsf-table
yarn add rjsf-table
```

# How to use

```javascript
import React from "react";
import RJSFForm from "@rjsf/mui";
import { TableField } from "rjsf-table";

const App: React.FC<{}> = () => {
  return (
    <RJSFForm
      formData={yourFormData}
      schema={yourSchema}
      uiSchema={{
        "any-array-items-field": {
          "ui:widget": TableField,
        },
      }}
    />
  );
};
```
