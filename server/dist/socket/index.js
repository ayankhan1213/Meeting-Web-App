"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSocket = void 0;
const socket_io_1 = require("socket.io");
const roomHandlers_1 = require("./roomHandlers");
const webrtcHandlers_1 = require("./webrtcHandlers");
const interactionHandlers_1 = require("./interactionHandlers");
const initSocket = (server) => {
    const io = new socket_io_1.Server(server, {
        cors: {
            origin: '*',
            methods: ["GET", "POST"]
        }
    });
    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.id}`);
        // Register handlers
        (0, roomHandlers_1.handleRoomEvents)(io, socket);
        (0, webrtcHandlers_1.handleWebRTCEvents)(io, socket);
        (0, interactionHandlers_1.handleInteractionEvents)(io, socket);
    });
    return io;
};
exports.initSocket = initSocket;
