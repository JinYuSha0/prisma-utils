import type { RJSFSchema, UiSchema } from '@rjsf/utils';
import { DataGridProps, GridColDef } from '@mui/x-data-grid';
import { DataGridWithStyle } from './common';
import { useMemo } from 'react';
import { IconButton } from '@mui/material';
import { Box } from '@mui/system';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

interface TableProps<T = any> extends Omit<DataGridProps, 'columns' | 'rows'> {
  uiSchema: UiSchema;
  schema: RJSFSchema;
  rows: T[];
  onEdit?: (params: T) => Promise<void>;
  onDelete?: (params: T) => Promise<void>;
}

export const Table: React.FC<TableProps> = (props) => {
  const {
    schema,
    uiSchema,
    initialState,
    pageSizeOptions,
    onEdit,
    onDelete,
    ...rest
  } = props;
  const columns = useMemo<GridColDef[]>(() => {
    const { properties } = schema;
    return [
      ...Object.keys(properties).map((key) => ({
        field: key,
        headerName: uiSchema[key]?.['ui:title'] ?? key,
        flex: 1,
        valueFormatter: uiSchema[key]?.['ui:valueFormatter'],
      })),
      ...(onEdit || onDelete
        ? [
            {
              field: 'action',
              headerName: '',
              renderCell: (params: Parameters<GridColDef['renderCell']>[0]) => (
                <Box>
                  {onEdit && (
                    <IconButton
                      size="small"
                      onClick={onEdit.bind(null, params.row)}
                    >
                      <EditIcon />
                    </IconButton>
                  )}
                  {onDelete && (
                    <IconButton
                      size="small"
                      onClick={onDelete.bind(null, params.row)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
                </Box>
              ),
            },
          ]
        : []),
    ];
  }, [schema, uiSchema, onEdit, onDelete]);
  const innerInitialState = useMemo(
    () => ({
      ...initialState,
      pagination: {
        ...initialState?.pagination,
        paginationModel: {
          pageSize: 10,
          ...initialState?.pagination?.paginationModel,
        },
      },
    }),
    [initialState],
  );
  return (
    <DataGridWithStyle
      disableColumnMenu
      paginationMode="server"
      columns={columns}
      initialState={innerInitialState}
      pageSizeOptions={pageSizeOptions ?? [10]}
      {...rest}
    />
  );
};
