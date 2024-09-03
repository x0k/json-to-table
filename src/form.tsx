import { FormHelperText } from "@chakra-ui/react";
import {
  DescriptionFieldProps,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
} from "@rjsf/utils";
import { generateTheme } from "@rjsf/chakra-ui";
import { withTheme } from "@rjsf/core";

function DescriptionFieldTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>({ id, description }: DescriptionFieldProps<T, S, F>) {
  if (!description) {
    return null;
  }
  if (typeof description === "string") {
    return <FormHelperText id={id} mb={2}>{description}</FormHelperText>;
  }
}

const theme = generateTheme();

export const Form = withTheme({
  ...theme,
  templates: {
    ...theme.templates,
    DescriptionFieldTemplate,
  }
});
