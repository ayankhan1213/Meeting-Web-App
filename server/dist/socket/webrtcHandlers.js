"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleWebRTCEvents = void 0;
const handleWebRTCEvents = (io, socket) => {
    socket.on('offer', (payload) => {
        io.to(payload.target).emit('offer', { sdp: payload.sdp, from: socket.id });
    });
    socket.on('answer', (payload) => {
        io.to(payload.target).emit('answer', { sdp: payload.sdp, from: socket.id });
    });
    socket.on('ice-candidate', (payload) => {
        io.to(payload.target).emit('ice-candidate', { candidate: payload.candidate, from: socket.id });
    });
};
exports.handleWebRTCEvents = handleWebRTCEvents;
