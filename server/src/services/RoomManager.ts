export interface RoomData {
  hostId: string;
  participants: Set<string>;
  waitingList: Set<string>;
  participantNames: Map<string, string>;
  createdAt: Date;
}

class RoomManager {
  private rooms: Map<string, RoomData> = new Map();

  createRoom(roomId: string, hostId: string, hostName: string): RoomData {
    const room: RoomData = {
      hostId,
      participants: new Set([hostId]),
      waitingList: new Set<string>(),
      participantNames: new Map([[hostId, hostName]]),
      createdAt: new Date(),
    };
    this.rooms.set(roomId, room);
    return room;
  }

  getRoom(roomId: string): RoomData | undefined {
    return this.rooms.get(roomId);
  }

  deleteRoom(roomId: string): void {
    this.rooms.delete(roomId);
  }

  addParticipant(roomId: string, userId: string, userName: string): RoomData | undefined {
    const room = this.rooms.get(roomId);
    if (room) {
      room.participants.add(userId);
      room.waitingList.delete(userId);
      room.participantNames.set(userId, userName);
    }
    return room;
  }

  removeParticipant(roomId: string, userId: string): RoomData | undefined {
    const room = this.rooms.get(roomId);
    if (room) {
      room.participants.delete(userId);
      room.waitingList.delete(userId);
      // Keep name in map briefly for disconnect notifications
    }
    return room;
  }

  addWaitlist(roomId: string, userId: string, userName: string): RoomData | undefined {
    const room = this.rooms.get(roomId);
    if (room) {
      room.waitingList.add(userId);
      room.participantNames.set(userId, userName);
    }
    return room;
  }

  setNewHost(roomId: string, nextHostId: string): RoomData | undefined {
    const room = this.rooms.get(roomId);
    if (room) {
      room.hostId = nextHostId;
    }
    return room;
  }

  getAllRooms(): Map<string, RoomData> {
    return this.rooms;
  }

  /** Returns a plain object of userId → name for active participants only */
  getParticipantNames(roomId: string): Record<string, string> {
    const room = this.rooms.get(roomId);
    if (!room) return {};
    const names: Record<string, string> = {};
    room.participants.forEach((id) => {
      names[id] = room.participantNames.get(id) ?? 'Anonymous';
    });
    return names;
  }
}

export const roomManager = new RoomManager();
