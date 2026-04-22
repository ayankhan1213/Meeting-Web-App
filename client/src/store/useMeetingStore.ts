import { create } from 'zustand';

export interface Message {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
}

export interface EmojiInteraction {
  id: string;
  userId: string;
  emoji: string;
}

export interface ParticipantStatus {
  isMuted: boolean;
  isVideoOff: boolean;
}

export interface JoinRequest {
  userId: string;
  userName: string;
}

interface MeetingState {
  roomId: string;
  userName: string;
  isHost: boolean;
  isWaiting: boolean;
  isConnected: boolean;
  localStream: MediaStream | null;
  remoteStreams: Record<string, MediaStream>;
  participants: string[];
  participantNames: Record<string, string>;
  participantStatus: Record<string, ParticipantStatus>;
  messages: Message[];
  emojis: EmojiInteraction[];
  raisedHands: Record<string, boolean>;
  joinRequests: JoinRequest[];

  // Actions
  setRoomId: (id: string) => void;
  setUserName: (name: string) => void;
  setIsHost: (isHost: boolean) => void;
  setIsWaiting: (isWaiting: boolean) => void;
  setIsConnected: (connected: boolean) => void;
  setLocalStream: (stream: MediaStream | null) => void;
  addRemoteStream: (userId: string, stream: MediaStream) => void;
  removeRemoteStream: (userId: string) => void;
  setParticipants: (participants: string[], names: Record<string, string>) => void;
  addParticipant: (userId: string, userName: string) => void;
  removeParticipant: (userId: string) => void;
  setParticipantName: (userId: string, name: string) => void;
  updateParticipantStatus: (userId: string, status: Partial<ParticipantStatus>) => void;
  addMessage: (msg: Message) => void;
  addEmoji: (emoji: EmojiInteraction) => void;
  removeEmoji: (id: string) => void;
  setRaisedHand: (userId: string, isRaised: boolean) => void;
  addJoinRequest: (request: JoinRequest) => void;
  removeJoinRequest: (userId: string) => void;
  reset: () => void;
}

const initialState = {
  roomId: '',
  userName: '',
  isHost: false,
  isWaiting: false,
  isConnected: false,
  localStream: null,
  remoteStreams: {},
  participants: [],
  participantNames: {},
  participantStatus: {},
  messages: [],
  emojis: [],
  raisedHands: {},
  joinRequests: [],
};

export const useMeetingStore = create<MeetingState>((set) => ({
  ...initialState,

  setRoomId: (id) => set({ roomId: id }),
  setUserName: (name) => set({ userName: name }),
  setIsHost: (isHost) => set({ isHost }),
  setIsWaiting: (isWaiting) => set({ isWaiting }),
  setIsConnected: (isConnected) => set({ isConnected }),
  setLocalStream: (stream) => set({ localStream: stream }),

  addRemoteStream: (userId, stream) =>
    set((state) => ({
      remoteStreams: { ...state.remoteStreams, [userId]: stream },
      participants: state.participants.includes(userId)
        ? state.participants
        : [...state.participants, userId],
    })),

  removeRemoteStream: (userId) =>
    set((state) => {
      const newStreams = { ...state.remoteStreams };
      delete newStreams[userId];
      return { remoteStreams: newStreams };
    }),

  setParticipants: (participants, names) =>
    set((state) => ({
      participants,
      participantNames: { ...state.participantNames, ...names },
    })),

  addParticipant: (userId, userName) =>
    set((state) => ({
      participants: state.participants.includes(userId)
        ? state.participants
        : [...state.participants, userId],
      participantNames: { ...state.participantNames, [userId]: userName },
    })),

  removeParticipant: (userId) =>
    set((state) => {
      const newStreams = { ...state.remoteStreams };
      const newStatus = { ...state.participantStatus };
      const newHands = { ...state.raisedHands };
      const newNames = { ...state.participantNames };
      delete newStreams[userId];
      delete newStatus[userId];
      delete newHands[userId];
      delete newNames[userId];
      return {
        participants: state.participants.filter((p) => p !== userId),
        remoteStreams: newStreams,
        participantStatus: newStatus,
        raisedHands: newHands,
        participantNames: newNames,
      };
    }),

  setParticipantName: (userId, name) =>
    set((state) => ({
      participantNames: { ...state.participantNames, [userId]: name },
    })),

  updateParticipantStatus: (userId, status) =>
    set((state) => ({
      participantStatus: {
        ...state.participantStatus,
        [userId]: {
          ...(state.participantStatus[userId] || { isMuted: false, isVideoOff: false }),
          ...status,
        },
      },
    })),

  addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),

  addEmoji: (emoji) => set((state) => ({ emojis: [...state.emojis, emoji] })),
  removeEmoji: (id) =>
    set((state) => ({ emojis: state.emojis.filter((e) => e.id !== id) })),

  setRaisedHand: (userId, isRaised) =>
    set((state) => ({ raisedHands: { ...state.raisedHands, [userId]: isRaised } })),

  addJoinRequest: (request) =>
    set((state) => ({
      joinRequests: [
        ...state.joinRequests.filter((r) => r.userId !== request.userId),
        request,
      ],
    })),
  removeJoinRequest: (userId) =>
    set((state) => ({
      joinRequests: state.joinRequests.filter((r) => r.userId !== userId),
    })),

  reset: () => set(initialState),
}));
