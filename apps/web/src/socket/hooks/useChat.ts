import { useState, useEffect, useCallback, useRef } from "react";
import { Socket } from "socket.io-client";
import { SocketEvents, ChatMessageDTO, ChatHistoryResponse, SocketResponse } from "@codesync/types";

export const useChat = (socket: Socket | null, roomId: string | undefined, isJoined: boolean) => {
  const [messages, setMessages] = useState<ChatMessageDTO[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track earliest message for pagination
  const earliestMessageRef = useRef<string | undefined>(undefined);

  const loadHistory = useCallback(
    (before?: string) => {
      if (!socket || !roomId || !isJoined) return;

      setIsLoadingHistory(true);
      setError(null);

      socket.emit(
        SocketEvents.CHAT_GET_HISTORY,
        { roomId, limit: 50, before },
        (response: SocketResponse<ChatHistoryResponse>) => {
          setIsLoadingHistory(false);
          if (response.success && response.data) {
            const { messages: newMessages, hasMore: more } = response.data;

            setMessages((prev) => {
              if (before) {
                // Prepend older messages
                return [...newMessages, ...prev];
              } else {
                // Initial load
                return newMessages;
              }
            });

            setHasMore(more);

            if (newMessages.length > 0) {
              earliestMessageRef.current = newMessages[0].createdAt;
            }
          } else {
            setError(response.error?.message || "Failed to load chat history");
          }
        }
      );
    },
    [socket, roomId, isJoined]
  );

  const sendMessage = useCallback(
    (content: string) => {
      if (!socket || !roomId || !isJoined || !content.trim()) return;

      setError(null);
      socket.emit(
        SocketEvents.CHAT_SEND_MESSAGE,
        { roomId, content },
        (response: SocketResponse<ChatMessageDTO>) => {
          if (!response.success) {
            setError(response.error?.message || "Failed to send message");
          }
        }
      );
    },
    [socket, roomId, isJoined]
  );

  const loadMore = useCallback(() => {
    if (!hasMore || isLoadingHistory) return;
    loadHistory(earliestMessageRef.current);
  }, [hasMore, isLoadingHistory, loadHistory]);

  // Handle incoming messages
  useEffect(() => {
    if (!socket || !roomId || !isJoined) return;

    const handleMessage = (data: ChatMessageDTO) => {
      if (data.roomId === roomId) {
        setMessages((prev) => {
          // Check for duplicates (e.g. if we get the broadcast of our own message)
          if (prev.some((msg) => msg.id === data.id)) return prev;
          return [...prev, data];
        });
      }
    };

    const handleError = (err: { code: string; message: string }) => {
      if (err.code.startsWith("CHAT_")) {
        setError(err.message);
      }
    };

    socket.on(SocketEvents.CHAT_MESSAGE, handleMessage);
    socket.on(SocketEvents.CHAT_ERROR, handleError);

    return () => {
      socket.off(SocketEvents.CHAT_MESSAGE, handleMessage);
      socket.off(SocketEvents.CHAT_ERROR, handleError);
    };
  }, [socket, roomId, isJoined]);

  // Initial load when room is joined
  useEffect(() => {
    if (isJoined) {
      setMessages([]);
      earliestMessageRef.current = undefined;
      loadHistory();
    }
  }, [isJoined, loadHistory]);

  return {
    messages,
    isLoadingHistory,
    hasMore,
    error,
    sendMessage,
    loadMore,
  };
};
