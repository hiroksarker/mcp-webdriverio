import { z } from 'zod';

export class ResourceTemplate {
    constructor(
        public name: string,
        public description: string,
        public schema: z.ZodType<any>
    ) {}
} 