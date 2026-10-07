import {
  Input,
  InputProps,
  Select,
  SelectProps,
  Textarea,
  TextareaProps,
} from "../Input";
import { Button, ButtonProps } from "../Button";
import { DatePicker, DatePickerProps } from "../DatePicker";

export interface FormInputProps extends Omit<
  InputProps,
  "value" | "onChange" | "onBlur" | "error"
> {
  field: any;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function FormInput({ field, onChange, ...props }: FormInputProps) {
  const isTouched = field.state.meta.isTouched;
  const errors = field.state.meta.errors;
  const errorMessage =
    isTouched && errors && errors.length > 0
      ? errors
          .map((err: any) =>
            typeof err === "object" && err !== null && "message" in err
              ? err.message
              : String(err),
          )
          .join(", ")
      : undefined;

  return (
    <Input
      name={field.name}
      value={field.state.value ?? ""}
      onChange={(e) => {
        field.handleChange(e.target.value);
        if (onChange) onChange(e);
      }}
      onBlur={field.handleBlur}
      error={errorMessage}
      {...props}
    />
  );
}

export interface FormSelectProps extends Omit<
  SelectProps,
  "value" | "onChange" | "onBlur" | "error"
> {
  field: any;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

export function FormSelect({
  field,
  children,
  options,
  onChange,
  ...props
}: FormSelectProps) {
  const isTouched = field.state.meta.isTouched;
  const errors = field.state.meta.errors;
  const errorMessage =
    isTouched && errors && errors.length > 0
      ? errors
          .map((err: any) =>
            typeof err === "object" && err !== null && "message" in err
              ? err.message
              : String(err),
          )
          .join(", ")
      : undefined;

  return (
    <Select
      name={field.name}
      value={field.state.value ?? ""}
      onChange={(e) => {
        field.handleChange(e.target.value);
        if (onChange) onChange(e);
      }}
      onBlur={field.handleBlur}
      error={errorMessage}
      options={options}
      {...props}
    >
      {children}
    </Select>
  );
}

export interface FormTextareaProps extends Omit<
  TextareaProps,
  "value" | "onChange" | "onBlur" | "error"
> {
  field: any;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

export function FormTextarea({ field, onChange, ...props }: FormTextareaProps) {
  const isTouched = field.state.meta.isTouched;
  const errors = field.state.meta.errors;
  const errorMessage =
    isTouched && errors && errors.length > 0
      ? errors
          .map((err: any) =>
            typeof err === "object" && err !== null && "message" in err
              ? err.message
              : String(err),
          )
          .join(", ")
      : undefined;

  return (
    <Textarea
      name={field.name}
      value={field.state.value ?? ""}
      onChange={(e) => {
        field.handleChange(e.target.value);
        if (onChange) onChange(e);
      }}
      onBlur={field.handleBlur}
      error={errorMessage}
      {...props}
    />
  );
}

export interface FormSubmitProps extends Omit<ButtonProps, "type" | "form"> {
  form: any;
  children: React.ReactNode;
}

export function FormSubmit({
  form,
  children,
  disabled,
  loading,
  ...props
}: FormSubmitProps) {
  return (
    <form.Subscribe
      selector={(state: any) => [state.canSubmit, state.isSubmitting]}
    >
      {([canSubmit, isSubmitting]: [boolean, boolean]) => (
        <Button
          type="submit"
          disabled={disabled || !canSubmit}
          loading={loading || isSubmitting}
          {...props}
        >
          {children}
        </Button>
      )}
    </form.Subscribe>
  );
}

export interface FormDatePickerProps extends Omit<
  DatePickerProps,
  "value" | "onChange"
> {
  field: any;
  onChange?: (val: string) => void;
}

export function FormDatePicker({
  field,
  onChange,
  ...props
}: FormDatePickerProps) {
  const isTouched = field.state.meta.isTouched;
  const errors = field.state.meta.errors;
  const errorMessage =
    isTouched && errors && errors.length > 0
      ? errors
          .map((err: any) =>
            typeof err === "object" && err !== null && "message" in err
              ? err.message
              : String(err),
          )
          .join(", ")
      : undefined;

  return (
    <DatePicker
      value={field.state.value ?? ""}
      onChange={(val) => {
        field.handleChange(val);
        if (onChange) onChange(val);
      }}
      error={errorMessage}
      {...props}
    />
  );
}
