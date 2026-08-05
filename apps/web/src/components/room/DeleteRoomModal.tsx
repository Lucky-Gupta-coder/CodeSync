import React, { useState } from "react";
import { RoomDTO } from "@codesync/types";
import { Modal } from "../common/Modal.js";
import { Input } from "../common/Input.js";
import { Button } from "../common/Button.js";

interface DeleteRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: RoomDTO | null;
  onConfirmDelete: () => void;
  isLoading?: boolean;
}

export const DeleteRoomModal: React.FC<DeleteRoomModalProps> = ({
  isOpen,
  onClose,
  room,
  onConfirmDelete,
  isLoading = false,
}) => {
  const [confirmText, setConfirmText] = useState("");

  const handleClose = () => {
    setConfirmText("");
    onClose();
  };

  if (!room) return null;

  const isConfirmed = confirmText === room.name;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Delete Room?">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-slate-400">
          This operation is permanent and will completely remove the room from this workspace.
        </p>

        <p className="text-xs text-red-400 font-semibold bg-red-500/5 border border-red-500/10 p-3.5 rounded-lg leading-relaxed">
          Please type <span className="font-bold underline select-all">{room.name}</span> to
          confirm.
        </p>

        <Input
          placeholder="Type room name here"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
        />

        <div className="flex justify-end gap-3 mt-2">
          <Button variant="outline" size="sm" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            disabled={!isConfirmed}
            loading={isLoading}
            onClick={() => {
              onConfirmDelete();
              setConfirmText("");
            }}
          >
            Delete Room
          </Button>
        </div>
      </div>
    </Modal>
  );
};
