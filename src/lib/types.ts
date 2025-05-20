export interface Tool {
    name: string;
    description: string;
    run: (params: any) => Promise<any>;
} 