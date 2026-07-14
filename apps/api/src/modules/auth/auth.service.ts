import argon2 from "argon2";
import { userService } from "../user/user.service.js";
import { mapToUserDTO } from "../user/user.mapper.js";
import { jwtService } from "../../shared/auth/jwt.service.js";
import { ConflictError } from "../../shared/errors/conflict-error.js";
import { UnauthorizedError } from "../../shared/errors/unauthorized-error.js";
import { logger } from "../../config/logger.js";
import { RegisterInput, LoginInput } from "./auth.validation.js";
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

  async login(input: LoginInput): Promise<{ accessToken: string; user: UserResponseDTO }> {
    const { email, password } = input;

    // Find user with password hash selected explicitly
    const user = await userService.findUserByEmailWithPassword(email);
    if (!user) {
      logger.warn(`Login attempt failed: Email not found - ${email}`);
      throw new UnauthorizedError("Invalid email or password");
    }

    // Verify using argon2.verify
    const isValid = await argon2.verify(user.passwordHash, password);
    if (!isValid) {
      logger.warn(`Login attempt failed: Incorrect password for ${email}`);
      throw new UnauthorizedError("Invalid email or password");
    }

    try {
      // Update lastLogin timestamp in database
      await userService.updateLastLogin(String(user._id));

      const mappedUser = mapToUserDTO(user);

      // Generate Access Token using our shared JWT service
      const accessToken = await jwtService.generateAccessToken(mappedUser);

      logger.info(`User logged in successfully: ${email} (ID: ${user._id})`);

      return {
        accessToken,
        user: mappedUser,
      };
    } catch (error) {
      logger.error(`Unexpected failure during user login for ${email}: ${error}`);
      throw error;
    }
  }
}

export const authService = new AuthService();
