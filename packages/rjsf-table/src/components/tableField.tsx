import type { JSONSchema7 } from "json-schema";

import {
  Box,
  Dialog,
  DialogContent,
  FormControl,
  FormLabel,
  IconButton,
} from "@mui/material";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import React, { useCallback, useMemo, useRef, useState } from "react";

import {
  closestCenter,
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  restrictToVerticalAxis,
  restrictToWindowEdges,
  restrictToParentElement,
} from "@dnd-kit/modifiers";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { FormProps } from "@rjsf/core";
import { WidgetProps, RJSFValidationError } from "@rjsf/utils";
import { isNil } from "es-toolkit";

import { DraggableGridRow } from "./draggableGridRow";
import { validator, FormWithStyle, DataGridWithStyle } from "./common";

const modifiers = [
  restrictToVerticalAxis,
  restrictToWindowEdges,
  restrictToParentElement,
];

export const TableField: React.FC<WidgetProps> = (props) => {
  const {
    schema: { type, items },
    id,
    label,
    required,
    value: originalValue,
    hideError,
    rawErrors,
    uiSchema,
    onChange,
  } = props;
  const idRef = useRef(0);
  const { properties } = (items ?? {}) as JSONSchema7;
  const [open, setOpen] = useState(false);
  const [editValue, setEditValue] = useState(undefined);
  const sensors = useSensors(useSensor(PointerSensor));
  const value = useMemo(() => {
    return originalValue.filter((row) => !isNil(row.id));
  }, [originalValue]);
  const ui = useMemo(() => ({ ...uiSchema?.items, ...uiSchema }), [uiSchema]);
  const schema = useMemo(() => items as JSONSchema7, [items]);
  const showError = useMemo(() => {
    if (!hideError && rawErrors?.length) return true;
    return false;
  }, [hideError, rawErrors]);
  const sx = useMemo(
    () => ({
      border: showError ? "1px solid red" : undefined,
      "--DataGrid-overlayHeight": "0",
    }),
    [showError]
  );
  const onClose = useCallback(() => {
    setOpen(false);
    setTimeout(() => {
      setEditValue(undefined);
    }, 300);
  }, []);
  const onOpen = useCallback(() => {
    setOpen(true);
  }, []);
  const onDelete = useCallback(
    (params: GridRenderCellParams) => {
      const newValue = value.filter((item: any) => item.id !== params.id);
      onChange(newValue);
    },
    [value, onChange]
  );
  const onEdit = useCallback(
    (params: GridRenderCellParams) => {
      setEditValue(params.row);
      onOpen();
    },
    [onOpen]
  );
  const onAdd = useCallback(() => {
    const { beforeAdd } = uiSchema["ui:addButtonOptions"] ?? {};
    if (beforeAdd?.(value)) {
      return;
    }
    onOpen();
  }, [value, uiSchema["ui:addButtonOptions"]]);
  const solts = useMemo<React.ComponentProps<typeof DataGrid>["slots"]>(
    () => ({
      noRowsOverlay: () => null,
      noResultsOverlay: () => null,
      footer: () => (
        <Box
          padding={2}
          width="100%"
          display="flex"
          justifyContent="center"
          alignItems="center"
        >
          <IconButton onClick={onAdd}>
            <AddIcon />
          </IconButton>
        </Box>
      ),
      row: DraggableGridRow,
    }),
    [onOpen, onAdd]
  );
  const columns = useMemo<GridColDef[]>(() => {
    const { items } = uiSchema ?? {};
    const keys = Object.keys(properties);
    return [
      ...keys.map((key) => ({
        field: key,
        headerName: items?.[key]?.["ui:title"] ?? key,
        flex: 1,
      })),
      {
        field: "action",
        headerName: "",
        width: 150,
        renderCell: (
          params: Parameters<GridColDef["renderCell"]>[0] & {
            children?: React.ReactNode;
          }
        ) => (
          <Box>
            <IconButton size="small" onClick={onEdit.bind(null, params)}>
              <EditIcon />
            </IconButton>
            <IconButton size="small" onClick={onDelete.bind(null, params)}>
              <DeleteIcon />
            </IconButton>
            {params.children}
          </Box>
        ),
      },
    ];
  }, [onDelete, onEdit, properties, uiSchema]);
  const sortableItems = useMemo(() => value.map((row) => row.id), [value]);
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (over) {
        const oldIndex = value.findIndex((rows) => rows.id === active.id);
        const newIndex = value.findIndex((rows) => rows.id === over.id);
        onChange(arrayMove(value, oldIndex, newIndex));
      }
    },
    [value, onChange]
  );
  const transformErrors = useCallback(
    (errors: RJSFValidationError[]) =>
      errors.map((error) => {
        const { errorMessage } = (properties[error.property] ?? {}) as {
          errorMessage: Record<string, string>;
        };
        if (errorMessage?.[error.name]) {
          error.message = errorMessage[error.name];
        }
        return error;
      }),
    [properties]
  );
  const onSubmit = useCallback(
    (event: Parameters<NonNullable<FormProps["onSubmit"]>>[0]) => {
      if (editValue) {
        const newValue = [...value];
        const index = newValue.findIndex((item) => item.id === editValue.id);
        newValue.splice(index, 1, event.formData);
        onChange(newValue);
      } else {
        idRef.current = idRef.current + 1;
        onChange([...value, { id: idRef.current, ...event.formData }]);
      }
      onClose();
    },
    [editValue, value, onChange, onClose]
  );
  if (type !== "array" || !properties) {
    return null;
  }
  return (
    <>
      <FormControl id={id} component="fieldset" error={showError}>
        <FormLabel component="legend" required={required}>
          {label}
        </FormLabel>
        <Box>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            modifiers={modifiers}
            autoScroll={false}
          >
            <SortableContext
              items={sortableItems}
              strategy={verticalListSortingStrategy}
            >
              <DataGridWithStyle
                disableColumnMenu
                disableRowSelectionOnClick
                rows={value}
                columns={columns}
                sx={sx}
                slots={solts}
              />
            </SortableContext>
          </DndContext>
        </Box>
      </FormControl>

      <Dialog fullWidth open={open} onClose={onClose}>
        <DialogContent>
          <FormWithStyle
            noHtml5Validate
            formData={editValue}
            showErrorList={false}
            schema={schema}
            uiSchema={ui}
            validator={validator}
            transformErrors={transformErrors}
            onSubmit={onSubmit}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};
