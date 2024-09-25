import { ZodType, z } from 'zod';
import type { Resolver } from './types';
export declare function zodResolver<T extends ZodType>(schema: T, schemaOptions?: Partial<z.ParseParams>, resolverOptions?: Parameters<Resolver<T>>[2]): ReturnType<Resolver<T>>;
