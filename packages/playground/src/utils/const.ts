export const initialPrismaSchema = `  // This is your Prisma schema file,
  // learn more about it in the docs: https://pris.ly/d/prisma-schema
  
  // Looking for ways to speed up your queries, or scale easily with your serverless or edge functions?
  // Try Prisma Accelerate: https://pris.ly/cli/accelerate-init
  
  generator client {
    provider = "prisma-client-js"
  }
  
  datasource db {
    provider = "postgresql"
    url      = env("DATABASE_URL")
  }
  
  enum PostType {
    News
    Novel
  }
  
  enum Tag {
    Art
    Science
    Politics
  }
  
  model Author {
    id       String   @id @default(uuid()) @db.Uuid
    account  String
    password String
    name     String   @default(Tom)
    age      Int?
    post     Post[]   @relation("AuthorPosts")
    review   Review[] @relation("ReviewAuthor")
  }
  
  model Post {
    id          String   @id @default(uuid()) @db.Uuid
    type        PostType
    tags        Tag[]
    author      Author   @relation("AuthorPosts", fields: [authorId], references: [id], onDelete: Cascade)
    authorId    String   @db.Uuid
    description String?
    content     String
    createdAt   DateTime @default(now()) @db.Timestamp(6)
    updatedAt   DateTime @updatedAt @db.Timestamp(6)
  }
  
  model Review {
    id        String   @id @default(uuid()) @db.Uuid
    author    Author   @relation("ReviewAuthor", fields: [authorId], references: [id], onDelete: Cascade)
    authorId  String   @db.Uuid
    content   String
    createdAt DateTime @default(now()) @db.Timestamp(6)
    updatedAt DateTime @updatedAt @db.Timestamp(6)
  }
  `;
