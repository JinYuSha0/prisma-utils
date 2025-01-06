import "./styles/App.css";
import "./styles/ResizableLayout.css";
import "./styles/SampleSplitter.css";
import type { RJSFSchema } from "@rjsf/utils";
import { useEffect, useMemo, useState } from "react";
import Editor from "@monaco-editor/react";
import Form from "@rjsf/mui";
import validator from "@rjsf/validator-ajv8";
import ResizableLayout from "./components/ResizableLayout";
import ErrorBoundary from "./components/ErrorBoundary";
import GithubSvg from "./assets/github-mark.svg";
import { transform } from "prisma-schema-form";
import { useStorageState, StorageTypes } from "./hooks/use-storage.hook";
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
} from "@mui/material";

function initialPrismaSchema() {
  return `// This is your Prisma schema file,
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
}

function App() {
  const [prismaCode, setPrismaCode] = useStorageState<string>(
    "prismaCode",
    StorageTypes.Local,
    initialPrismaSchema
  );
  const [jsCode, setJsCode] = useState("");
  const [models, setModels] = useState<Record<string, RJSFSchema>>({});
  const [currModel, setCurrModel] = useState<string | null>(null);
  const [key, setKey] = useState(0);
  const formSchema = useMemo(
    () => (currModel === null ? null : models[currModel]),
    [models, currModel]
  );
  const onPrismaCodeChange = async (value: string | undefined) => {
    setPrismaCode(value ?? "");
    try {
      const jsCode = await transform(value ?? "");
      setJsCode(jsCode);
    } catch (err) {
      if (err instanceof Error) {
        setJsCode(`${err.message}`);
      }
    }
  };
  const onMount = () => {
    if (prismaCode) {
      onPrismaCodeChange(prismaCode);
    }
  };
  const onJsCodeChange = () => {
    try {
      const models: Record<string, RJSFSchema> = new Function(
        jsCode.replace("export default", "return")
      )();
      setModels(models);
      const keys = Object.keys(models);
      if (keys.length) {
        if (!currModel || !keys.includes(currModel)) {
          setCurrModel(keys[0]);
        }
      } else {
        setCurrModel(null);
      }
      setKey((prev) => prev + 1);
    } catch {
      /* empty */
    }
  };
  const log = (type: string, msg: unknown) => {
    console.log(type, msg);
  };
  useEffect(() => {
    onJsCodeChange();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jsCode]);
  return (
    <ResizableLayout
      input={
        <Editor
          height="100%"
          theme="vs-dark"
          defaultLanguage="apex"
          value={prismaCode ?? ""}
          onChange={onPrismaCodeChange}
          onMount={onMount}
        />
      }
      output={
        <Editor
          height="100%"
          theme="vs-dark"
          defaultLanguage="javascript"
          value={jsCode}
          options={{
            readOnly: true,
          }}
        />
      }
      form={
        <div key={key} className="flex grow form">
          {formSchema ? (
            <div className="form-body">
              <ErrorBoundary>
                <Stack gap={4}>
                  <FormControl variant="standard" fullWidth>
                    <InputLabel id="model-select-label">Model</InputLabel>
                    <Select
                      labelId="model-select-label"
                      id="model-select-label"
                      value={currModel}
                      label="Models"
                      onChange={(evt) => {
                        setCurrModel(evt.target.value);
                      }}
                    >
                      {Object.keys(models).map((value) => (
                        <MenuItem key={value} value={value}>
                          {value}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Form
                    schema={formSchema}
                    uiSchema={{}}
                    validator={validator}
                    onSubmit={(data) => {
                      log("submit", data.formData);
                    }}
                    onChange={(data) => {
                      log("change", data.formData);
                    }}
                  />
                </Stack>
              </ErrorBoundary>

              <a
                href="https://github.com/JinYuSha0/prisma-schema-form"
                target="_blank"
              >
                <img className="github" src={GithubSvg} />
              </a>
            </div>
          ) : (
            <></>
          )}
        </div>
      }
    />
  );
}

export default App;
