import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { handleRoomEvents } from './roomHandlers';
import { handleWebRTCEvents } from './webrtcHandlers';
import { handleInteractionEvents } from './interactionHandlers';

export const initSocket = (server: HttpServer) => {
  const io = new Server(server, { 
    cors: { 
      origin: '*', 
      methods: ["GET", "POST"]
    } 
  });

  io.on('connection', (socket: Socket) => {
    console.log(`User connected: ${socket.id}`);

    // Register handlers
    handleRoomEvents(io, socket);
    handleWebRTCEvents(io, socket);
    handleInteractionEvents(io, socket);

  });

  return io;
};

