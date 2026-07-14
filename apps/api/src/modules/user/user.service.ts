import { User, IUser } from "./user.model.js";

export class UserService {
  async createUser(data: { name: string; email: string; passwordHash: string }): Promise<IUser> {
    return await User.create(data);
  }

  async findUserByEmail(email: string): Promise<IUser | null> {
    return await User.findOne({ email });
  }

  async findUserById(id: string): Promise<IUser | null> {
    return await User.findById(id);
  }
}

export const userService = new UserService();
