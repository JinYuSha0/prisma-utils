import "../styles/App.css";
import "../styles/ResizableLayout.css";
import "../styles/SampleSplitter.css";
import type { RJSFSchema, UiSchema } from "@rjsf/utils";
import type { JSONSchema7 } from "json-schema";
import React, { useEffect, useMemo, useState } from "react";
import Editor from "@monaco-editor/react";
import Form from "@rjsf/mui";
import validator from "@rjsf/validator-ajv8";
import ResizableLayout from "../components/ResizableLayout";
import ErrorBoundary from "../components/ErrorBoundary";
import GithubSvg from "../assets/github-mark.svg";
import { transform as transformToJsonSchema } from "prisma-schema-form";
import { TableField } from "rjsf-table";
import { initialPrismaSchema } from "../utils/const";
import { useStorageState, StorageTypes } from "../hooks/use-storage.hook";
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
} from "@mui/material";

function RjsfTable() {
  const [prismaCode, setPrismaCode] = useStorageState<string>(
    "rjsfTable",
    StorageTypes.Local,
    () => initialPrismaSchema
  );
  const [jsCode, setJsCode] = useState("");
  const [models, setModels] = useState<Record<string, RJSFSchema>>({});
  const [currModel, setCurrModel] = useState<string | null>(null);
  const [key, setKey] = useState(0);
  const formSchema = useMemo(
    () => (currModel === null ? null : models[currModel]),
    [models, currModel]
  );
  const formUiSchema = useMemo(() => {
    if (!formSchema || !formSchema.properties) return;
    const result: Record<string, UiSchema> = {};
    Object.keys(formSchema.properties).forEach((propertyName) => {
      const property = formSchema.properties?.[propertyName] as JSONSchema7;
      if (property.type === "array" && (property.items as JSONSchema7).$ref) {
        result[propertyName] = {
          "ui:widget": TableField,
          "ui:description": "(look here, use rjsf-table)",
        };
      }
    });
    return result;
  }, [formSchema]);
  const onPrismaCodeChange = async (value: string | undefined) => {
    setPrismaCode(value ?? "");
    try {
      const jsCode = await transformToJsonSchema(value ?? "");
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
      leftTop={
        <Editor
          height="100%"
          theme="vs-dark"
          defaultLanguage="apex"
          value={prismaCode ?? ""}
          onChange={onPrismaCodeChange}
          onMount={onMount}
          options={{
            readOnly: true,
          }}
        />
      }
      leftBottom={
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
      right={
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
                    uiSchema={formUiSchema}
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
                href="https://github.com/JinYuSha0/prisma-utils/tree/main/packages/rjsf-table"
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

export default RjsfTable;
