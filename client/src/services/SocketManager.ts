import { io, Socket } from 'socket.io-client';
import { useMeetingStore } from '../store/useMeetingStore';

// ── ICE / STUN config ─────────────────────────────────────────────────────────
const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

// ── Socket server URL (override with NEXT_PUBLIC_SOCKET_URL env var) ──────────
const SOCKET_URL =
  (typeof process !== 'undefined' && (process.env as Record<string,string>)?.NEXT_PUBLIC_SOCKET_URL) ||
  'http://localhost:5000';

// ── Singleton ─────────────────────────────────────────────────────────────────
class SocketManagerService {
  public  socket: Socket | null = null;
  private peers: Record<string, RTCPeerConnection> = {};
  private roomId:      string | null = null;
  private userName     = 'Anonymous';
  private initialized  = false;

  // ── PUBLIC: initialize ──────────────────────────────────────────────────────
  public initialize(roomId: string, userName: string, action: string = 'join') {
    // Guard: same room + same name + already connected → do nothing
    if (
      this.initialized &&
      this.roomId    === roomId &&
      this.userName  === userName &&
      this.socket?.connected
    ) return;

    this.roomId   = roomId;
    this.userName = (userName || 'Anonymous').trim().substring(0, 50);
    this.initialized = true;

    // Tear down any existing socket cleanly before creating a new one
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.setupSocketListeners();
    this.initMediaThenJoin(roomId, action);
  }

  // ── PRIVATE: media then emit join ───────────────────────────────────────────
  private async initMediaThenJoin(attemptRoomId: string, action: string) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: true,
      });

      // Guard: room changed or disconnected while awaiting camera permission
      if (!this.initialized || this.roomId !== attemptRoomId) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      useMeetingStore.getState().setLocalStream(stream);
    } catch (err) {
      console.warn('[SocketManager] Media access denied — joining without stream:', err);
    }

    // Emit join once socket is connected
    const emitJoin = () => {
      console.log(`[Socket] emitting join-room: ${this.roomId} as "${this.userName}" with action "${action}"`);
      this.socket?.emit('join-room', this.roomId, this.userName, action);
    };

    if (this.socket?.connected) {
      emitJoin();
    } else {
      this.socket?.once('connect', emitJoin);
    }
  }

  // ── PRIVATE: register all socket listeners ──────────────────────────────────
  private setupSocketListeners() {
    if (!this.socket) return;
    const store = () => useMeetingStore.getState();

    // ── Connection lifecycle ─────────────────────────────────────────────────
    this.socket.on('connect', () => {
      store().setIsConnected(true);
      console.log('[Socket] connected:', this.socket?.id);
    });

    this.socket.on('disconnect', () => {
      store().setIsConnected(false);
      console.log('[Socket] disconnected');
    });

    // ── Room: host ───────────────────────────────────────────────────────────
    this.socket.on(
      'joined-as-host',
      ({ userId, participantNames }: {
        roomId: string;
        userId: string;
        userName: string;
        participantNames: Record<string, string>;
      }) => {
        const s = store();
        s.setIsHost(true);
        s.setIsConnected(true);
        // Register self in participantNames map
        s.setParticipants([], {
          ...participantNames,
          [userId]: this.userName,
        });
        console.log('[Socket] joined as HOST, id:', userId);
      }
    );

    // ── Room: waiting ────────────────────────────────────────────────────────
    this.socket.on('waiting-for-approval', () => {
      store().setIsWaiting(true);
      console.log('[Socket] waiting for host approval…');
    });

    // ── Room: approved ───────────────────────────────────────────────────────
    this.socket.on(
      'join-approved',
      async ({ participants, participantNames }: {
        roomId: string;
        participants: string[];
        participantNames: Record<string, string>;
      }) => {
        const s = store();
        s.setIsWaiting(false);
        s.setIsConnected(true);
        // Merge self into names map
        const selfId = this.socket?.id ?? '';
        s.setParticipants(participants, {
          ...participantNames,
          [selfId]: this.userName,
        });
        console.log('[Socket] join APPROVED — existing peers:', participants);

        // Initiate WebRTC with every already-present participant
        for (const peerId of participants) {
          if (peerId !== this.socket?.id) {
            const pc = this.createPeerConnection(peerId);
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            this.socket?.emit('offer', { target: peerId, sdp: offer });
          }
        }
      }
    );

    // ── Room: denied ─────────────────────────────────────────────────────────
    this.socket.on('join-denied', () => {
      store().setIsWaiting(false);
      window.dispatchEvent(new CustomEvent('meetspace:join-denied'));
    });

    // ── Room: not found ──────────────────────────────────────────────────────
    this.socket.on('room-not-found', () => {
      store().setIsWaiting(false);
      window.dispatchEvent(new CustomEvent('meetspace:room-not-found'));
    });

    // ── Room: host transfer ──────────────────────────────────────────────────
    this.socket.on('became-host', () => {
      store().setIsHost(true);
      console.log('[Socket] promoted to HOST');
    });

    // ── Room: join request (host receives this) ──────────────────────────────
    this.socket.on('join-request', (payload: { userId: string; userName: string }) => {
      store().addJoinRequest(payload);
      console.log('[Socket] join-request from:', payload.userName, payload.userId);
    });

    // ── Room: new user connected (already-in-room participants receive this) ──
    this.socket.on('user-connected', ({ userId, userName }: { userId: string; userName: string }) => {
      store().addParticipant(userId, userName);
      console.log('[Socket] user-connected:', userName, '(', userId, ')');
      // NOTE: Do NOT create peer here — the newcomer sends the offer
    });

    // ── Room: user left ──────────────────────────────────────────────────────
    this.socket.on('user-disconnected', ({ userId, userName }: { userId: string; userName: string }) => {
      console.log('[Socket] user-disconnected:', userName, userId);
      this.handleUserDisconnect(userId);
    });

    // ── WebRTC: offer ────────────────────────────────────────────────────────
    this.socket.on('offer', async ({ from, sdp }: { from: string; sdp: RTCSessionDescriptionInit }) => {
      console.log('[WebRTC] offer from:', from);
      const pc = this.createPeerConnection(from);
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      this.socket?.emit('answer', { target: from, sdp: answer });
    });

    // ── WebRTC: answer ───────────────────────────────────────────────────────
    this.socket.on('answer', async ({ from, sdp }: { from: string; sdp: RTCSessionDescriptionInit }) => {
      console.log('[WebRTC] answer from:', from);
      const pc = this.peers[from];
      if (pc && pc.signalingState !== 'stable') {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      }
    });

    // ── WebRTC: ICE candidate ────────────────────────────────────────────────
    this.socket.on('ice-candidate', async ({ from, candidate }: { from: string; candidate: RTCIceCandidateInit }) => {
      const pc = this.peers[from];
      if (pc && candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.warn('[WebRTC] addIceCandidate failed:', e);
        }
      }
    });

    // ── Chat ─────────────────────────────────────────────────────────────────
    this.socket.on('receive-message', (payload: { sender: string; text: string; timestamp: number }) => {
      store().addMessage({
        id: crypto.randomUUID(),
        sender: payload.sender,
        text: payload.text,
        timestamp: payload.timestamp ?? Date.now(),
      });
    });

    // ── Emoji reactions ──────────────────────────────────────────────────────
    this.socket.on('receive-emoji', ({ userId, emoji }: { userId: string; emoji: string }) => {
      const id = crypto.randomUUID();
      store().addEmoji({ id, userId, emoji });
      setTimeout(() => store().removeEmoji(id), 4500);
    });

    // ── Hand raise ───────────────────────────────────────────────────────────
    this.socket.on('participant-raised-hand', ({ userId, isRaised }: { userId: string; isRaised: boolean }) => {
      store().setRaisedHand(userId, isRaised);
    });

    // ── Status: mute / video ─────────────────────────────────────────────────
    this.socket.on('participant-muted', ({ userId, isMuted }: { userId: string; isMuted: boolean }) => {
      store().updateParticipantStatus(userId, { isMuted });
    });

    this.socket.on('participant-video-off', ({ userId, isVideoOff }: { userId: string; isVideoOff: boolean }) => {
      store().updateParticipantStatus(userId, { isVideoOff });
    });
  }

  // ── PRIVATE: create RTCPeerConnection ────────────────────────────────────────
  private createPeerConnection(peerId: string): RTCPeerConnection {
    if (this.peers[peerId]) return this.peers[peerId];

    const pc = new RTCPeerConnection(ICE_SERVERS);
    const localStream = useMeetingStore.getState().localStream;

    if (localStream) {
      localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
    }

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        this.socket?.emit('ice-candidate', { target: peerId, candidate });
      }
    };

    pc.ontrack = ({ streams }) => {
      if (streams?.[0]) {
        useMeetingStore.getState().addRemoteStream(peerId, streams[0]);
        console.log('[WebRTC] remote stream received from:', peerId);
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (
        pc.iceConnectionState === 'disconnected' ||
        pc.iceConnectionState === 'failed'
      ) {
        this.handleUserDisconnect(peerId);
      }
    };

    this.peers[peerId] = pc;
    return pc;
  }

  // ── PRIVATE: handle a peer disconnecting ────────────────────────────────────
  private handleUserDisconnect(userId: string) {
    if (this.peers[userId]) {
      this.peers[userId].close();
      delete this.peers[userId];
    }
    useMeetingStore.getState().removeParticipant(userId);
  }

  // ── PUBLIC ACTIONS ──────────────────────────────────────────────────────────

  /** Send a chat message to the room. Uses the stored userName as sender. */
  public sendMessage(text: string) {
    if (this.socket && this.roomId) {
      this.socket.emit('send-message', {
        roomId: this.roomId,
        sender: this.userName,
        text,
        timestamp: Date.now(),
      });
    }
  }

  public sendEmoji(emoji: string) {
    if (this.socket && this.roomId) {
      this.socket.emit('send-emoji', { roomId: this.roomId, emoji });
    }
  }

  public toggleRaiseHand(isRaised: boolean) {
    if (this.socket && this.roomId) {
      this.socket.emit('raise-hand', { roomId: this.roomId, isRaised });
      useMeetingStore.getState().setRaisedHand('self', isRaised);
    }
  }

  public approveUser(targetUserId: string) {
    if (this.socket && this.roomId) {
      this.socket.emit('approve-user', { roomId: this.roomId, targetUserId });
      useMeetingStore.getState().removeJoinRequest(targetUserId);
    }
  }

  public denyUser(targetUserId: string) {
    if (this.socket && this.roomId) {
      this.socket.emit('deny-user', { roomId: this.roomId, targetUserId });
      useMeetingStore.getState().removeJoinRequest(targetUserId);
    }
  }

  public toggleRemoteMute(isMuted: boolean) {
    if (this.socket && this.roomId) {
      this.socket.emit('toggle-mute', { roomId: this.roomId, isMuted });
    }
  }

  public toggleRemoteVideo(isVideoOff: boolean) {
    if (this.socket && this.roomId) {
      this.socket.emit('toggle-video', { roomId: this.roomId, isVideoOff });
    }
  }

  /** Full teardown: close socket, stop media, close all peer connections. */
  public disconnect() {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    useMeetingStore.getState().localStream?.getTracks().forEach((t) => t.stop());
    Object.values(this.peers).forEach((pc) => pc.close());
    this.peers       = {};
    this.initialized = false;
    this.roomId      = null;
    this.userName    = 'Anonymous';
    useMeetingStore.getState().reset();
  }
}

export const SocketManager = new SocketManagerService();
