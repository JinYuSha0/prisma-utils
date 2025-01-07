import type { RJSFSchema, RJSFValidationError, UiSchema } from "@rjsf/utils";
import type { FormProps } from "@rjsf/core";
import { FormWithStyle, validator } from "../components/common";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent } from "@mui/material";

export const useModel = <T extends any>(
  schema: RJSFSchema,
  uiSchema?: UiSchema
): { dialog: React.ReactNode; onOpen: (editValue?: T) => Promise<T> } => {
  const [open, setOpen] = useState(false);
  const [editValue, setEditValue] = useState(undefined);
  const resolveRef = useRef<(value: any) => void | undefined>(undefined);
  const rejectRef = useRef<(reason: any) => void | undefined>(undefined);
  const onClose = useCallback(() => {
    rejectRef.current?.(new Error("cancel"));
    setOpen(false);
    setTimeout(() => {
      setEditValue(undefined);
    }, 300);
    resolveRef.current = undefined;
    rejectRef.current = undefined;
  }, []);
  const onOpen = useCallback((editValue?: T) => {
    const promise = new Promise<T>((_resolve, _reject) => {
      resolveRef.current = _resolve;
      rejectRef.current = _reject;
    });
    if (editValue) setEditValue(editValue);
    setOpen(true);
    return promise;
  }, []);
  const onSubmit = useCallback(
    (event: Parameters<NonNullable<FormProps["onSubmit"]>>[0]) => {
      resolveRef.current?.(event.formData);
      rejectRef.current = undefined;
      onClose();
    },
    []
  );
  const transformErrors = useCallback(
    (errors: RJSFValidationError[]) =>
      errors.map((error) => {
        const { errorMessage } = (schema.properties?.[error.property] ??
          {}) as {
          errorMessage: Record<string, string>;
        };
        if (errorMessage?.[error.name]) {
          error.message = errorMessage[error.name];
        }
        return error;
      }),
    [schema]
  );
  const dialog = useMemo(
    () => (
      <Dialog fullWidth open={open} onClose={onClose}>
        <DialogContent>
          <FormWithStyle
            noHtml5Validate
            formData={editValue}
            showErrorList={false}
            schema={schema}
            uiSchema={uiSchema}
            validator={validator}
            transformErrors={transformErrors}
            onSubmit={onSubmit}
          />
        </DialogContent>
      </Dialog>
    ),
    [open, editValue, schema, uiSchema, transformErrors]
  );
  return { dialog, onOpen };
};
