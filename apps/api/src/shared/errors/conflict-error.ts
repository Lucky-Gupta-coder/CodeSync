import { AppError } from "./app-error.js";

export class ConflictError extends AppError {
  constructor(message: string = "Conflict occurred") {
    super(message, 409);
  }
}
