import React, { useState } from "react";
import { cn } from "../utils/cn";

interface SampleSplitterProps
  extends Partial<React.HTMLAttributes<HTMLDivElement>> {
  id?: string;
  dir?: string;
  isDragging: boolean;
}

const SampleSplitter = ({
  id = "drag-bar",
  dir,
  isDragging,
  ...props
}: SampleSplitterProps) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div
      id={id}
      data-testid={id}
      tabIndex={0}
      className={cn(
        "sample-drag-bar",
        dir === "horizontal" && "sample-drag-bar--horizontal",
        (isDragging || isFocused) && "sample-drag-bar--dragging"
      )}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      {...props}
    />
  );
};

export default SampleSplitter;
