"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roomManager = void 0;
class RoomManager {
    constructor() {
        this.rooms = new Map();
    }
    createRoom(roomId, hostId) {
        const room = {
            hostId,
            participants: new Set([hostId]),
            waitingList: new Set()
        };
        this.rooms.set(roomId, room);
        return room;
    }
    getRoom(roomId) {
        return this.rooms.get(roomId);
    }
    deleteRoom(roomId) {
        this.rooms.delete(roomId);
    }
    addParticipant(roomId, userId) {
        const room = this.rooms.get(roomId);
        if (room) {
            room.participants.add(userId);
            room.waitingList.delete(userId);
        }
        return room;
    }
    removeParticipant(roomId, userId) {
        const room = this.rooms.get(roomId);
        if (room) {
            room.participants.delete(userId);
            room.waitingList.delete(userId);
        }
        return room;
    }
    addWaitlist(roomId, userId) {
        const room = this.rooms.get(roomId);
        if (room) {
            room.waitingList.add(userId);
        }
        return room;
    }
    setNewHost(roomId, nextHostId) {
        const room = this.rooms.get(roomId);
        if (room) {
            room.hostId = nextHostId;
        }
        return room;
    }
    getAllRooms() {
        return this.rooms;
    }
}
exports.roomManager = new RoomManager();
