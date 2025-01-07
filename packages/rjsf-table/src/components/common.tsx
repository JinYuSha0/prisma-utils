import { styled } from "@mui/material";
import { customizeValidator } from "@rjsf/validator-ajv8";
import ajvErrors from "ajv-errors";
import Form from "@rjsf/mui";
import { DataGrid } from "@mui/x-data-grid";

export const validator = customizeValidator();
ajvErrors(validator.ajv);

export const FormWithStyle = styled(Form)({
  "& .MuiGrid-root": {
    width: "100% !important",
    marginLeft: "0 !important",
  },
  "& .MuiGrid-item": {
    paddingLeft: "0 !important",
  },
  "& .MuiList-root": {
    padding: "0 !important",
  },
  "& .MuiBox-root:last-child": {
    textAlign: "right",
  },
});

export const DataGridWithStyle = styled(DataGrid)({
  "& .MuiDataGrid-columnHeader:focus, .MuiDataGrid-columnHeader:focus-within, .MuiDataGrid-cell:focus, .MuiDataGrid-cell:focus-within":
    {
      outline: 0,
      border: 0,
    },
  "& .MuiDataGrid-cell": {
    border: "0 !important",
  },
});
