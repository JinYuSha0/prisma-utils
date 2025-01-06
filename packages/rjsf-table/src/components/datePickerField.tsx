import { DatePicker, DatePickerProps } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { WidgetProps } from '@rjsf/utils';
import { useCallback, useMemo } from 'react';
import dayjs from 'dayjs';

type OnChangeParamters = Parameters<DatePickerProps<dayjs.Dayjs>['onChange']>;

export const DatePickerField: React.FC<WidgetProps> = (props) => {
  const {
    id,
    label,
    required,
    value: originalValue,
    hideError,
    rawErrors,
    schema,
    onChange,
  } = props;
  const value = useMemo(
    () => (originalValue ? dayjs(originalValue) : null),
    [originalValue],
  );
  const showError = useMemo(() => {
    if (!hideError && rawErrors?.length) return true;
    return false;
  }, [hideError, rawErrors]);
  const innerProps = useMemo(
    () => ({
      format: schema?.formatTemplate ?? 'YYYY-MM-DD',
      minDate: schema?.formatMinimum ? dayjs(schema.formatMinimum) : undefined,
      maxDate: schema?.formatMaximum ? dayjs(schema.formatMaximum) : undefined,
    }),
    [schema],
  );
  const innserOnChange = useCallback(
    (value: OnChangeParamters[0], context: OnChangeParamters[1]) => {
      onChange(value.format('YYYY-MM-DD'));
    },
    [onChange],
  );
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DatePicker
        label={label}
        value={value}
        slotProps={{
          textField: {
            id,
            required,
            error: showError,
          },
        }}
        onChange={innserOnChange}
        {...innerProps}
      />
    </LocalizationProvider>
  );
};
