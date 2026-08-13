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
    if (messagesEndRef.current) {
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
    <div className="flex flex-col h-full bg-slate-950 border-l border-slate-850 w-full min-w-0">
      {/* Header */}
      <div className="h-14 border-b border-slate-850 bg-slate-950/80 flex items-center justify-between px-4 shrink-0">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <svg
            className="w-4 h-4 text-indigo-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
          Room Chat
        </h3>
        {!isConnected && (
          <span className="text-[10px] text-amber-500 font-mono flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            DISCONNECTED
          </span>
        )}
      </div>

      {/* Messages List */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {hasMore && (
          <div className="flex justify-center mb-2">
            <Button size="sm" variant="outline" disabled={isLoadingHistory} onClick={loadMore}>
              {isLoadingHistory ? <Spinner size="sm" /> : "Load Older Messages"}
            </Button>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
            {error}
          </div>
        )}

        {messages.length === 0 && !isLoadingHistory && (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-2 text-slate-500">
            <svg
              className="w-8 h-8 opacity-50"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <p className="text-sm">No messages yet.</p>
            <p className="text-xs">Be the first to say hello!</p>
          </div>
        )}

        {messages.map((msg, index) => {
          const isOwn = msg.sender.id === user?.id;

          // Basic check for consecutive messages to group them visually (optional enhancement)
          const isConsecutive = index > 0 && messages[index - 1].sender.id === msg.sender.id;

          return (
            <div
              key={msg.id}
              className={`flex flex-col gap-1 max-w-[85%] ${isOwn ? "self-end" : "self-start"}`}
            >
              {!isConsecutive && (
                <div className={`flex items-center gap-2 mb-1 ${isOwn ? "flex-row-reverse" : ""}`}>
                  <Avatar name={msg.sender.name} size="sm" />
                  <span className="text-[11px] font-medium text-slate-400">{msg.sender.name}</span>
                  <span className="text-[10px] text-slate-600">
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              )}
              <div
                className={`px-3 py-2 rounded-2xl text-sm break-words ${
                  isOwn
                    ? "bg-indigo-600 text-white rounded-tr-sm"
                    : "bg-slate-800 text-slate-200 rounded-tl-sm border border-slate-700"
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
      <div className="p-4 border-t border-slate-850 bg-slate-950 shrink-0">
        <div className="relative flex items-center">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isConnected ? "Type a message..." : "Connecting..."}
            disabled={!isConnected || !isJoined}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-4 pr-12 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || !isConnected || !isJoined}
            className="absolute right-2 p-1.5 text-indigo-400 hover:text-indigo-300 disabled:text-slate-600 disabled:opacity-50 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
