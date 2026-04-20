import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';

export const initSocket = (server: HttpServer) => {
  const io = new Server(server, { 
    cors: { 
      origin: '*', // For demo, we allow all origins
      methods: ["GET", "POST"]
    } 
  });

  io.on('connection', (socket: Socket) => {
    console.log(`User connected: ${socket.id}`);

    // User joins a meeting room
    socket.on('join-room', (roomId: string, userId: string) => {
      socket.join(roomId);
      console.log(`User ${userId} (socket: ${socket.id}) joined room ${roomId}`);
      
      // Notify others in the room
      socket.to(roomId).emit('user-connected', userId);

      // WebRTC Signaling
      socket.on('offer', (payload: { target: string, caller: string, sdp: RTCSessionDescriptionInit }) => {
        io.to(payload.target).emit('offer', payload);
      });

      socket.on('answer', (payload: { target: string, caller: string, sdp: RTCSessionDescriptionInit }) => {
        io.to(payload.target).emit('answer', payload);
      });

      socket.on('ice-candidate', (incoming: { target: string, candidate: RTCIceCandidateInit }) => {
        io.to(incoming.target).emit('ice-candidate', incoming.candidate);
      });

      // Chat and UI events
      socket.on('send-message', (messagePayload: { roomId: string, sender: string, text: string }) => {
        io.to(messagePayload.roomId).emit('receive-message', messagePayload);
      });

      socket.on('toggle-mute', (isMuted: boolean) => {
        socket.to(roomId).emit('participant-muted', { userId, isMuted });
      });

      socket.on('toggle-video', (isVideoOff: boolean) => {
        socket.to(roomId).emit('participant-video-off', { userId, isVideoOff });
      });

      socket.on('disconnect', () => {
        console.log(`User ${userId} disconnected`);
        socket.to(roomId).emit('user-disconnected', userId);
      });
    });
  });

  return io;
};
