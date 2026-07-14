import argon2 from "argon2";
import { userService } from "../user/user.service.js";
import { mapToUserDTO } from "../user/user.mapper.js";
import { ConflictError } from "../../shared/errors/conflict-error.js";
import { logger } from "../../config/logger.js";
import { RegisterInput } from "./auth.validation.js";
import { UserResponseDTO } from "@codesync/types";

export class AuthService {
  async register(input: RegisterInput): Promise<UserResponseDTO> {
    const { name, email, password } = input;

    // Check for duplicate email
    const existingUser = await userService.findUserByEmail(email);
    if (existingUser) {
      logger.warn(`Registration attempt failed: Email already exists - ${email}`);
      throw new ConflictError("Email already exists");
    }

    try {
      // Hash password using Argon2 secure defaults
      const passwordHash = await argon2.hash(password);

      // Create new user record via user service
      const user = await userService.createUser({
        name,
        email,
        passwordHash,
      });

      logger.info(`User registered successfully: ${email} (ID: ${user._id})`);

      // Map document directly to DTO shape
      return mapToUserDTO(user);
    } catch (error) {
      logger.error(`Unexpected failure during user registration for ${email}: ${error}`);
      throw error;
    }
  }
}

export const authService = new AuthService();
