export type Params = Record<string, string | number | boolean | null | undefined>;

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}
