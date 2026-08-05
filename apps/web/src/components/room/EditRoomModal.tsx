import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RoomUpdateSchema, RoomUpdateInput } from "@codesync/validators";
import { RoomDTO, RoomLanguage } from "@codesync/types";
import { Modal } from "../common/Modal.js";
import { Input } from "../common/Input.js";
import { Button } from "../common/Button.js";

interface EditRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: RoomDTO | null;
  onSubmit: (data: RoomUpdateInput) => void;
  isLoading?: boolean;
}

export const EditRoomModal: React.FC<EditRoomModalProps> = ({
  isOpen,
  onClose,
  room,
  onSubmit,
  isLoading = false,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RoomUpdateInput>({
    resolver: zodResolver(RoomUpdateSchema),
  });

  useEffect(() => {
    if (room) {
      reset({
        name: room.name,
        description: room.description || "",
        language: room.language,
      });
    }
  }, [room, reset]);

  if (!room) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Room Details">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input
          label="Room Name"
          placeholder="e.g. main-sandbox"
          error={errors.name?.message}
          {...register("name")}
        />

        <Input
          label="Description"
          placeholder="Detailed room description..."
          error={errors.description?.message}
          {...register("description")}
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-400 tracking-wide uppercase">
            Programming Language
          </label>
          <select
            aria-label="Programming Language"
            className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-950 transition-all cursor-pointer"
            {...register("language")}
          >
            {Object.values(RoomLanguage).map((lang) => (
              <option key={lang} value={lang}>
                {lang.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <Button variant="outline" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" type="submit" loading={isLoading}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};
