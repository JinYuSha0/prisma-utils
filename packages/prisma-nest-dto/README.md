<h1 align="center">PRISMA-NEST-DTO</h1>

<div align="center">
<a href="https://www.npmjs.com/package/prisma-nest-dto"><img src="https://img.shields.io/npm/v/prisma-nest-dto.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/package/prisma-nest-dto"><img src="https://img.shields.io/npm/l/prisma-nest-dto.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/package/prisma-nest-dto"><img src="https://img.shields.io/npm/dm/prisma-nest-dto.svg" alt="NPM Downloads" /></a>
</div>

<div align="center">A tool to convert prisma schema to nest dto</div>

---

## Screenshot

![prisma-nest-dto](https://raw.githubusercontent.com/JinYuSha0/prisma-utils/main/packages/prisma-nest-dto/screenshot/prisma-nest-dto.png)

## Live Playground

A [live playground](https://jinyusha0.github.io/#/prisma-nest-dto) is hosted on GitHub Pages.

## How to install

```base
npm install prisma-nest-dto
yarn add prisma-nest-dto
```

## How to use

### Step1 (cli generate code)

```base
npx pnd
yarn pnd
```

### Step2 (import DTO)

```typescript
import { Controller, Get, Query, Post, Body } from "@nestjs/common";
import { YourModel as YourModelDto } from "prisma-nest-dto/dto";

@Controller("/")
export class AppController {
  constructor() {}

  @Get("foo")
  public async foo(@Query() query: YourModelDto) {
    return {};
  }

  @Post("bar")
  public async bar(@Body() body: YourModelDto) {
    return {};
  }
}
```

## Todo list

- Generate class-validator annotations using comment
