import { useCallback, useEffect, useRef } from "react";
import { GodotCommand, GodotEvent } from "@/lib/godot-messages";

export const useGodotBridge = (onEvent?: (event: GodotEvent) => void) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const sendCommand = useCallback((command: GodotCommand) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(command, "*");
    }
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // In production, we should validate the origin
      const data = event.data as GodotEvent;
      if (data && data.type && onEvent) {
        onEvent(data);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onEvent]);

  return { iframeRef, sendCommand };
};
