import React from "react";
import SampleSplitter from "./SampleSplitter";
import { useResizable } from "react-resizable-layout";
import { cn } from "../utils/cn";

interface ResizableLayoutProps {
  input: React.ReactNode;
  output: React.ReactNode;
  form: React.ReactNode;
}

const ResizableLayout = ({
  input,
  output,
  form,
}: ResizableLayoutProps): JSX.Element => {
  const {
    isDragging: isFormDragging,
    position: FormW,
    splitterProps: FormDragBarProps,
  } = useResizable({
    axis: "x",
    initial: 1000,
    min: 200,
  });
  const {
    isDragging: isCodeDragging,
    position: CodeH,
    splitterProps: CodeDragBarProps,
  } = useResizable({
    axis: "y",
    initial: 400,
    min: 200,
    reverse: true,
  });
  return (
    <div className="flex flex-row h-screen bg-dark font-mono color-white overflow-hidden">
      <div className="flex flex-column" style={{ width: FormW }}>
        <div className={cn("flex grow", isCodeDragging && "no-select")}>
          {input}
        </div>
        <SampleSplitter
          dir="horizontal"
          isDragging={isCodeDragging}
          {...CodeDragBarProps}
        />
        <div
          className={cn(
            "flex shrink-0",
            isCodeDragging && "dragging",
            isCodeDragging && "no-select"
          )}
          style={{ height: CodeH }}
        >
          {output}
        </div>
      </div>
      <SampleSplitter isDragging={isFormDragging} {...FormDragBarProps} />
      <div
        className={cn(
          "flex grow",
          isFormDragging && "dragging",
          isFormDragging && "no-select"
        )}
      >
        {form}
      </div>
    </div>
  );
};

export default ResizableLayout;
