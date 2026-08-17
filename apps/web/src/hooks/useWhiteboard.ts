import { useState, useCallback } from "react";
import { WhiteboardTool, WhiteboardObject, WhiteboardState } from "@codesync/types";

export const useWhiteboard = (roomId: string | undefined) => {
  const [state, setState] = useState<WhiteboardState>({
    objects: {},
    activeTool: WhiteboardTool.PEN,
    selectedObjectId: null,
  });

  const [activeColor, setActiveColor] = useState<string>("#818cf8"); // Indigo-400
  const [activeStrokeWidth, setActiveStrokeWidth] = useState<number>(3);

  const [pastStates, setPastStates] = useState<Record<string, WhiteboardObject>[]>([]);
  const [futureStates, setFutureStates] = useState<Record<string, WhiteboardObject>[]>([]);

  const saveHistoryState = useCallback((currentObjects: Record<string, WhiteboardObject>) => {
    setPastStates((prev) => [...prev, currentObjects]);
    setFutureStates([]); // Clear future states when a new action is performed
  }, []);

  const setActiveTool = useCallback((tool: WhiteboardTool) => {
    setState((prev) => ({ ...prev, activeTool: tool, selectedObjectId: null }));
  }, []);

  const setSelectedObject = useCallback((id: string | null) => {
    setState((prev) => ({ ...prev, selectedObjectId: id }));
  }, []);

  const addObject = useCallback(
    (object: WhiteboardObject) => {
      setState((prev) => {
        saveHistoryState(prev.objects);
        return {
          ...prev,
          objects: {
            ...prev.objects,
            [object.id]: object,
          },
        };
      });
    },
    [saveHistoryState]
  );

  const removeObject = useCallback(
    (id: string) => {
      setState((prev) => {
        if (!prev.objects[id]) return prev;
        saveHistoryState(prev.objects);
        const newObjects = { ...prev.objects };
        delete newObjects[id];
        return {
          ...prev,
          objects: newObjects,
        };
      });
    },
    [saveHistoryState]
  );

  const updateObject = useCallback((id: string, updates: Partial<WhiteboardObject>) => {
    setState((prev) => {
      if (!prev.objects[id]) return prev;
      return {
        ...prev,
        objects: {
          ...prev.objects,
          [id]: { ...prev.objects[id], ...updates } as WhiteboardObject,
        },
      };
    });
  }, []);

  const clearWhiteboard = useCallback(() => {
    setState((prev) => {
      if (Object.keys(prev.objects).length === 0) return prev;
      saveHistoryState(prev.objects);
      return {
        ...prev,
        objects: {},
        selectedObjectId: null,
      };
    });
  }, [saveHistoryState]);

  const undo = useCallback(() => {
    setPastStates((prevPast) => {
      if (prevPast.length === 0) return prevPast;
      const newPast = [...prevPast];
      const previousState = newPast.pop()!;

      setState((prevState) => {
        setFutureStates((prevFuture) => [prevState.objects, ...prevFuture]);
        return {
          ...prevState,
          objects: previousState,
          selectedObjectId: null,
        };
      });

      return newPast;
    });
  }, []);

  const redo = useCallback(() => {
    setFutureStates((prevFuture) => {
      if (prevFuture.length === 0) return prevFuture;
      const newFuture = [...prevFuture];
      const nextState = newFuture.shift()!;

      setState((prevState) => {
        setPastStates((prevPast) => [...prevPast, prevState.objects]);
        return {
          ...prevState,
          objects: nextState,
          selectedObjectId: null,
        };
      });

      return newFuture;
    });
  }, []);

  return {
    state,
    activeColor,
    activeStrokeWidth,
    canUndo: pastStates.length > 0,
    canRedo: futureStates.length > 0,
    setActiveTool,
    setSelectedObject,
    setActiveColor,
    setActiveStrokeWidth,
    addObject,
    updateObject,
    removeObject,
    clearWhiteboard,
    undo,
    redo,
  };
};
