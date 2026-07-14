export class AppError extends Error {
  constructor(
    public override message: string,
    public statusCode: number = 500
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
