export function setDemoImageUrl(fn: (kind: string, id: number | string) => string): void;
export function demoRequest(pathname: string, query: Record<string, unknown>, region?: string): { status: number; body: unknown };
export function demoImage(kind: string, id: number | string): string;
