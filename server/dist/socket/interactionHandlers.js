"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleInteractionEvents = void 0;
const handleInteractionEvents = (io, socket) => {
    socket.on('send-message', (messagePayload) => {
        io.to(messagePayload.roomId).emit('receive-message', messagePayload);
    });
    socket.on('send-emoji', ({ roomId, emoji }) => {
        io.to(roomId).emit('receive-emoji', { userId: socket.id, emoji });
    });
    socket.on('raise-hand', ({ roomId, isRaised }) => {
        io.to(roomId).emit('participant-raised-hand', { userId: socket.id, isRaised });
    });
    socket.on('toggle-mute', ({ roomId, isMuted }) => {
        socket.to(roomId).emit('participant-muted', { userId: socket.id, isMuted });
    });
    socket.on('toggle-video', ({ roomId, isVideoOff }) => {
        socket.to(roomId).emit('participant-video-off', { userId: socket.id, isVideoOff });
    });
};
exports.handleInteractionEvents = handleInteractionEvents;
