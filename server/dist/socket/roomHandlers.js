"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleRoomEvents = void 0;
const RoomManager_1 = require("../services/RoomManager");
const handleRoomEvents = (io, socket) => {
    socket.on('join-room', (roomId, userName) => {
        let room = RoomManager_1.roomManager.getRoom(roomId);
        if (!room) {
            room = RoomManager_1.roomManager.createRoom(roomId, socket.id);
            socket.join(roomId);
            socket.emit('joined-as-host', { roomId, userId: socket.id });
            console.log(`User ${userName} (${socket.id}) created and joined room ${roomId} as HOST`);
        }
        else {
            RoomManager_1.roomManager.addWaitlist(roomId, socket.id);
            io.to(room.hostId).emit('join-request', {
                userId: socket.id,
                userName
            });
            socket.emit('waiting-for-approval', { roomId });
            console.log(`User ${userName} (${socket.id}) is waiting for approval in room ${roomId}`);
        }
    });
    socket.on('approve-user', ({ roomId, targetUserId }) => {
        const room = RoomManager_1.roomManager.getRoom(roomId);
        if (room && room.hostId === socket.id) {
            const targetSocket = io.sockets.sockets.get(targetUserId);
            if (targetSocket) {
                RoomManager_1.roomManager.addParticipant(roomId, targetUserId);
                targetSocket.join(roomId);
                // Notify newcomer about existing participants
                targetSocket.emit('join-approved', {
                    roomId,
                    participants: Array.from(room.participants)
                });
                // Notify others in the room
                targetSocket.to(roomId).emit('user-connected', targetUserId);
            }
        }
    });
    socket.on('deny-user', ({ roomId, targetUserId }) => {
        const room = RoomManager_1.roomManager.getRoom(roomId);
        if (room && room.hostId === socket.id) {
            RoomManager_1.roomManager.removeParticipant(roomId, targetUserId);
            io.to(targetUserId).emit('join-denied', { roomId });
        }
    });
    socket.on('disconnect', () => {
        const rooms = RoomManager_1.roomManager.getAllRooms();
        rooms.forEach((room, roomId) => {
            if (room.participants.has(socket.id)) {
                RoomManager_1.roomManager.removeParticipant(roomId, socket.id);
                socket.to(roomId).emit('user-disconnected', socket.id);
                if (room.hostId === socket.id) {
                    if (room.participants.size > 0) {
                        const nextHostId = Array.from(room.participants)[0];
                        RoomManager_1.roomManager.setNewHost(roomId, nextHostId);
                        io.to(nextHostId).emit('became-host', { roomId });
                    }
                    else {
                        RoomManager_1.roomManager.deleteRoom(roomId);
                    }
                }
            }
            else if (room.waitingList.has(socket.id)) {
                RoomManager_1.roomManager.removeParticipant(roomId, socket.id);
            }
        });
    });
};
exports.handleRoomEvents = handleRoomEvents;
