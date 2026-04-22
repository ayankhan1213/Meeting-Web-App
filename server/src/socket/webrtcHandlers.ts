import { Server, Socket } from 'socket.io';

export const handleWebRTCEvents = (io: Server, socket: Socket) => {
  socket.on('offer', (payload: { target: string, sdp: any }) => {
    io.to(payload.target).emit('offer', { sdp: payload.sdp, from: socket.id });
  });

  socket.on('answer', (payload: { target: string, sdp: any }) => {
    io.to(payload.target).emit('answer', { sdp: payload.sdp, from: socket.id });
  });

  socket.on('ice-candidate', (payload: { target: string, candidate: any }) => {
    io.to(payload.target).emit('ice-candidate', { candidate: payload.candidate, from: socket.id });
  });
};
