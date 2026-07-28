import { User, IUser } from "./user.model.js";

export class UserService {
  async createUser(data: { name: string; email: string; password: string }): Promise<IUser> {
    return await User.create(data);
  }

  async findUserByEmail(email: string): Promise<IUser | null> {
    return await User.findOne({ email });
  }

  async findUserByEmailWithPassword(email: string): Promise<IUser | null> {
    // Explicitly select password since it is configured with select: false in the schema
    return await User.findOne({ email }).select("+password");
  }

  async findUserById(id: string): Promise<IUser | null> {
    return await User.findById(id);
  }

  async updateLastLogin(userId: string): Promise<void> {
    await User.findByIdAndUpdate(userId, { lastLogin: new Date() });
  }
}

export const userService = new UserService();
