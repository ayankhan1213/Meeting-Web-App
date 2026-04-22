import { useEffect, useRef } from 'react';
import { SocketManager } from '../services/SocketManager';
import { useMeetingStore } from '../store/useMeetingStore';

/**
 * Primary hook for joining a meeting room.
 * Reads the display name from sessionStorage and passes it to SocketManager.
 * Cleans up on unmount (page leave / route change).
 */
export const useWebRTC = (roomId: string) => {
  const store = useMeetingStore();
  // Use a ref so the cleanup closure always has the latest value
  const roomIdRef = useRef(roomId);
  roomIdRef.current = roomId;

  useEffect(() => {
    if (!roomId) return;

    // ── Grab the name that was stored by the landing/dashboard page ──────────
    const rawName =
      sessionStorage.getItem('meetspace_username') ||
      localStorage.getItem('meetspace_username') ||
      'Anonymous';
    const userName = rawName.trim() || 'Anonymous';

    // Persist in store so UI can read it immediately
    store.setRoomId(roomId);
    store.setUserName(userName);

    // ── Initialize socket + media + join ─────────────────────────────────────
    SocketManager.initialize(roomId, userName);

    // ── Cleanup: runs when navigating away or component unmounts ─────────────
    return () => {
      SocketManager.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  // ── Public API ─────────────────────────────────────────────────────────────
  return {
    ...store,
    sendMessage:       (text: string)        => SocketManager.sendMessage(text),
    sendEmoji:         (emoji: string)       => SocketManager.sendEmoji(emoji),
    toggleRaiseHand:   (isRaised: boolean)   => SocketManager.toggleRaiseHand(isRaised),
    approveUser:       (targetId: string)    => SocketManager.approveUser(targetId),
    denyUser:          (targetId: string)    => SocketManager.denyUser(targetId),
    toggleRemoteMute:  (isMuted: boolean)    => SocketManager.toggleRemoteMute(isMuted),
    toggleRemoteVideo: (isOff: boolean)      => SocketManager.toggleRemoteVideo(isOff),
  };
};
