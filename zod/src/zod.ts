import { toNestErrors, validateFieldsNatively } from '@hookform/resolvers';
import { Parameters } from '@sinclair/typebox';
import { FieldError, FieldErrors, appendErrors } from 'react-hook-form';
import { ZodError, ZodType, z } from 'zod';
import type { Resolver } from './types';

const isZodError = (error: any): error is ZodError =>
  Array.isArray(error?.errors);

const parseErrorSchema = (
  zodErrors: z.ZodIssue[],
  validateAllFieldCriteria: boolean,
) => {
  const errors: Record<string, FieldError> = {};
  for (; zodErrors.length; ) {
    const error = zodErrors[0];
    const { code, message, path } = error;
    const _path = path.join('.');

    if (!errors[_path]) {
      if ('unionErrors' in error) {
        const unionError = error.unionErrors[0].errors[0];

        errors[_path] = {
          message: unionError.message,
          type: unionError.code,
        };
      } else {
        errors[_path] = { message, type: code };
      }
    }

    if ('unionErrors' in error) {
      error.unionErrors.forEach((unionError) =>
        unionError.errors.forEach((e) => zodErrors.push(e)),
      );
    }

    if (validateAllFieldCriteria) {
      const types = errors[_path].types;
      const messages = types && types[error.code];

      errors[_path] = appendErrors(
        _path,
        validateAllFieldCriteria,
        errors,
        code,
        messages
          ? ([] as string[]).concat(messages as string[], error.message)
          : error.message,
      ) as FieldError;
    }

    zodErrors.shift();
  }

  return errors;
};

export function zodResolver<T extends ZodType>(
  schema: T,
  schemaOptions?: Partial<z.ParseParams>,
  resolverOptions: Parameters<Resolver<T>>[2] = {},
): ReturnType<Resolver<T>> {
  return async (
    values: Parameters<ReturnType<Resolver<T>>>[0],
    _: any,
    options: Parameters<ReturnType<Resolver<T>>>[2],
  ) => {
    try {
      const data: z.infer<T> = await (async function () {
        if (resolverOptions.mode === 'sync') {
          return schema.parse(values, schemaOptions);
        } else {
          return schema.parseAsync(values, schemaOptions);
        }
      })();

      options.shouldUseNativeValidation && validateFieldsNatively({}, options);

      return {
        errors: {} as FieldErrors,
        values: resolverOptions.raw ? values : data,
      };
    } catch (error: any) {
      if (isZodError(error)) {
        return {
          values: {},
          errors: toNestErrors(
            parseErrorSchema(
              error.errors,
              !options.shouldUseNativeValidation &&
                options.criteriaMode === 'all',
            ),
            options,
          ),
        };
      }

      throw error;
    }
  };
}
