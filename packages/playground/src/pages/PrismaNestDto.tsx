import "../styles/App.css";
import "../styles/ResizableLayout.css";
import "../styles/SampleSplitter.css";
import { useState } from "react";
import Editor from "@monaco-editor/react";
import ResizableLayout from "../components/ResizableLayout";
import GithubSvg from "../assets/github-mark-white.svg";
import { transform as transformToNestDto } from "prisma-nest-dto";
import { initialPrismaSchema } from "../utils/const";
import { useStorageState, StorageTypes } from "../hooks/use-storage.hook";

function PrismaNestDto() {
  const [prismaCode, setPrismaCode] = useStorageState<string>(
    "prismaNestDto",
    StorageTypes.Local,
    () => initialPrismaSchema
  );
  const [dtoCode, setDtoCode] = useState("");
  const onPrismaCodeChange = async (value: string | undefined) => {
    setPrismaCode(value ?? "");
    try {
      const dtoMap = transformToNestDto(value ?? "", {
        fileSuffix: "ts",
      });
      const dtoCode = Object.values(dtoMap)
        .map(
          (map) =>
            `//${map.name}${map.name ? "." : ""}${map.type}.ts\r` + map.code
        )
        .join("\n\r");
      setDtoCode(dtoCode);
    } catch (err) {
      if (err instanceof Error) {
        setDtoCode(`${err.message}`);
      }
    }
  };
  const onMount = () => {
    if (prismaCode) {
      onPrismaCodeChange(prismaCode);
    }
  };
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
        />
      }
      right={
        <div className="grow">
          <Editor
            height="100%"
            theme="vs-dark"
            defaultLanguage="apex"
            value={dtoCode}
            options={{
              readOnly: true,
            }}
          />

          <a
            href="https://github.com/JinYuSha0/prisma-utils/tree/main/packages/prisma-nest-dto"
            target="_blank"
          >
            <img className="github" src={GithubSvg} />
          </a>
        </div>
      }
    />
  );
}

export default PrismaNestDto;
