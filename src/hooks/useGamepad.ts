import { useEffect, useRef, useState } from "react";

export type GamepadFrame = {
  ts: number;
  axes: number[];
  buttons: { pressed: boolean; value: number }[];
};

/**
 * Polls connected gamepad at ~60Hz. On each frame, calls `onFrame` (intended
 * to be a WebRTC DataChannel.send wrapper). Returns connection state for UI.
 */
export function useGamepad(onFrame?: (frame: GamepadFrame) => void) {
  const [connected, setConnected] = useState(false);
  const [name, setName] = useState<string | null>(null);
  const rafRef = useRef<number | null>(null);
  const cbRef = useRef(onFrame);
  cbRef.current = onFrame;

  useEffect(() => {
    const handleConnect = (e: GamepadEvent) => {
      setConnected(true);
      setName(e.gamepad.id);
    };
    const handleDisconnect = () => {
      setConnected(false);
      setName(null);
    };
    window.addEventListener("gamepadconnected", handleConnect);
    window.addEventListener("gamepaddisconnected", handleDisconnect);

    const poll = () => {
      const pads = navigator.getGamepads?.() ?? [];
      const pad = pads.find((p) => p && p.connected);
      if (pad) {
        if (!connected) {
          setConnected(true);
          setName(pad.id);
        }
        cbRef.current?.({
          ts: performance.now(),
          axes: Array.from(pad.axes),
          buttons: pad.buttons.map((b) => ({ pressed: b.pressed, value: b.value })),
        });
      }
      rafRef.current = requestAnimationFrame(poll);
    };
    rafRef.current = requestAnimationFrame(poll);

    return () => {
      window.removeEventListener("gamepadconnected", handleConnect);
      window.removeEventListener("gamepaddisconnected", handleDisconnect);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { connected, name };
}
