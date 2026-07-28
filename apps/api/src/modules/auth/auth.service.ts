import bcrypt from "bcryptjs";
import { userService } from "../user/user.service.js";
import { User } from "../user/user.model.js";
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
      // Hash password using bcrypt
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create new user record via user service
      const user = await userService.createUser({
        name,
        email,
        password: hashedPassword,
      });

      // Log: inserted user id, email, and collection name
      const collectionName = User.collection.name;
      logger.info(
        `User successfully inserted into MongoDB. ` +
          `ID: ${user._id}, Email: ${user.email}, Collection: ${collectionName}`
      );

      // Map document directly to DTO shape
      return mapToUserDTO(user);
    } catch (error) {
      const err = error as Error;
      logger.error(
        `Validation or Database error during user registration for ${email}: ${err.message || err}`
      );
      throw error;
    }
  }

  async login(input: LoginInput): Promise<{ accessToken: string; user: UserResponseDTO }> {
    const { email, password } = input;

    // Query database for user with password field
    const user = await userService.findUserByEmailWithPassword(email);

    const userFound = !!user;
    const passwordExists = !!(user && user.password);

    // Audit logs for login query
    logger.info(
      `Login query executed. Email searched: ${email}, ` +
        `User found: ${userFound}, ` +
        `Password field exists: ${passwordExists}`
    );

    if (!user) {
      logger.warn(`Login attempt failed: Email not found - ${email}`);
      throw new UnauthorizedError("Invalid email or password");
    }

    // Verify using bcrypt.compare
    const isValid = await bcrypt.compare(password, user.password);
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
