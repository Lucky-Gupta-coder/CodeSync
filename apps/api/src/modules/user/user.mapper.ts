import { IUser } from "./user.model.js";
import { UserResponseDTO } from "@codesync/types";

export const mapToUserDTO = (user: IUser): UserResponseDTO => {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
  };
};
