import React, { useState, useRef, useEffect } from "react";
import { Avatar } from "../common/Avatar.js";
import { Button } from "../common/Button.js";
import { Spinner } from "../common/Spinner.js";
import { useChat } from "../../socket/hooks/useChat.js";
import { Socket } from "socket.io-client";
import { useAuthStore } from "../../modules/auth/store/auth.store.js";
import { ConnectionState } from "@codesync/types";

interface ChatPanelProps {
  socket: Socket | null;
  roomId: string | undefined;
  isJoined: boolean;
  socketStatus: ConnectionState;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ socket, roomId, isJoined, socketStatus }) => {
  const { messages, isLoadingHistory, hasMore, error, sendMessage, loadMore } = useChat(
    socket,
    roomId,
    isJoined
  );

  const user = useAuthStore((state) => state.user);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current && typeof messagesEndRef.current.scrollIntoView === "function") {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = () => {
    if (inputValue.trim()) {
      sendMessage(inputValue);
      setInputValue("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isConnected = socketStatus === ConnectionState.CONNECTED;

  return (
    <div className="flex flex-col h-full bg-surface-container-low w-full min-w-0">
      {/* Header */}
      <div className="h-10 border-b border-surface-container-highest bg-surface-container flex items-center justify-between px-3 shrink-0">
        <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[16px] text-primary">chat</span>
          Room Chat
        </h3>
        {!isConnected && (
          <span className="text-[10px] text-warning font-mono font-semibold flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse" />
            OFFLINE
          </span>
        )}
      </div>

      {/* Messages List */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
        {hasMore && (
          <div className="flex justify-center mb-1">
            <Button
              size="sm"
              variant="secondary"
              disabled={isLoadingHistory}
              onClick={loadMore}
              className="text-xs h-6 px-2 font-semibold"
            >
              {isLoadingHistory ? <Spinner size="sm" /> : "Load Older Messages"}
            </Button>
          </div>
        )}

        {error && (
          <div className="p-2.5 rounded-lg bg-error/10 border border-error/30 text-error text-xs font-medium">
            {error}
          </div>
        )}

        {messages.length === 0 && !isLoadingHistory && (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-1.5 text-on-surface-variant p-4">
            <span className="material-symbols-outlined text-[36px] text-primary/70">
              chat_bubble
            </span>
            <p className="text-xs font-bold text-on-surface">No messages yet.</p>
            <p className="text-[11px] text-on-surface-variant">Be the first to say hello!</p>
          </div>
        )}

        {messages.map((msg, index) => {
          const isOwn = msg.sender.id === user?.id;
          const isConsecutive = index > 0 && messages[index - 1].sender.id === msg.sender.id;

          return (
            <div
              key={msg.id}
              className={`flex flex-col gap-1 max-w-[85%] ${isOwn ? "self-end" : "self-start"}`}
            >
              {!isConsecutive && (
                <div
                  className={`flex items-center gap-2 mb-0.5 ${isOwn ? "flex-row-reverse" : ""}`}
                >
                  <Avatar name={msg.sender.name} size="sm" />
                  <span className="text-[11px] font-bold text-on-surface">{msg.sender.name}</span>
                  <span className="text-[10px] font-medium text-on-surface-variant font-code-sm">
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              )}
              <div
                className={`px-3.5 py-2 rounded-xl text-xs break-words leading-relaxed shadow-sm font-medium ${
                  isOwn
                    ? "bg-primary text-on-primary rounded-tr-none"
                    : "bg-surface-container-bright text-on-surface rounded-tl-none border border-outline-variant"
                }`}
              >
                {msg.content}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 border-t border-surface-container-highest bg-surface-container shrink-0">
        <div className="relative flex items-center">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isConnected ? "Type a message..." : "Connecting..."}
            disabled={!isConnected || !isJoined}
            className="w-full bg-surface border border-outline rounded-lg pl-3.5 pr-10 py-2 text-xs text-on-surface font-medium placeholder:text-on-surface-variant/70 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || !isConnected || !isJoined}
            className="absolute right-1.5 p-1.5 text-primary hover:text-primary-container disabled:text-on-surface-variant/40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            title="Send Message"
            aria-label="Send Message"
          >
            <span className="material-symbols-outlined text-[18px]">send</span>
          </button>
        </div>
      </div>
    </div>
  );
};
