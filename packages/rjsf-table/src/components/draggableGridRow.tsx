import React, { CSSProperties, useMemo } from "react";
import { GridRow, GridRowProps, GridColDef } from "@mui/x-data-grid";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { IconButton } from "@mui/material";
import DragHandleIcon from "@mui/icons-material/DragHandle";

export const DraggableGridRow: React.FC<GridRowProps> = (params) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: params.rowId });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    display: "flex",
    flexDirection: "row",
  };

  const newParams = useMemo(() => {
    const result = { ...params };
    result.visibleColumns = [...result.visibleColumns];
    const len = result.visibleColumns.length;
    const actionField = result.visibleColumns[len - 1];
    const originalRenderCell = actionField.renderCell;
    result.visibleColumns[len - 1] = {
      ...actionField,
      renderCell: (
        args: Parameters<GridColDef["renderCell"]>[0] & {
          children?: React.ReactNode;
        }
      ) => {
        args.children = (
          <IconButton
            size="small"
            disableTouchRipple
            {...attributes}
            {...listeners}
          >
            <DragHandleIcon />
          </IconButton>
        );
        return originalRenderCell(args);
      },
    };
    return result;
  }, [params]);

  return (
    <div ref={setNodeRef} style={style}>
      <GridRow {...newParams} />
    </div>
  );
};
