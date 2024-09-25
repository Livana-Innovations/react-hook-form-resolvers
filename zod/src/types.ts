import { ResolverOptions, ResolverResult } from 'react-hook-form';
import { ZodType, z } from 'zod';

export type Resolver<T extends ZodType> = (
  schema: T,
  schemaOptions?: Partial<z.ParseParams>,
  factoryOptions?: {
    /**
     * @default async
     */
    mode?: 'async' | 'sync';
    /**
     * Return the raw input values rather than the parsed values.
     * @default false
     */
    raw?: boolean;
  },
) => <TFieldValues extends z.infer<T>, TContext>(
  values: z.input<T>,
  context: TContext | undefined,
  options: ResolverOptions<TFieldValues>,
) => Promise<ResolverResult<TFieldValues>>;
