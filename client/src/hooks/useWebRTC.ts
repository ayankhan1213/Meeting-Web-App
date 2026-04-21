import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export const useWebRTC = (roomId: string) => {
  const [remoteStreams, setRemoteStreams] = useState<{ [key: string]: MediaStream }>({});
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [messages, setMessages] = useState<{sender: string, text: string}[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const [joinRequests, setJoinRequests] = useState<{ userId: string; userName: string }[]>([]);
  const [emojis, setEmojis] = useState<{ id: number; emoji: string; userId: string }[]>([]);
  
  const peers = useRef<{ [key: string]: RTCPeerConnection }>({});
  const localStreamRef = useRef<MediaStream | null>(null);
  const socket = useRef<Socket | null>(null);

  const sendMessage = (text: string, senderName: string = 'Anonymous') => {
    if (socket.current) {
      socket.current.emit('send-message', { roomId, sender: senderName, text });
    }
  };

  const sendEmoji = (emoji: string) => {
    if (socket.current) {
      socket.current.emit('send-emoji', { roomId, emoji });
    }
  };

  const approveUser = (targetUserId: string) => {
    if (socket.current) {
      socket.current.emit('approve-user', { roomId, targetUserId });
      setJoinRequests(prev => prev.filter(req => req.userId !== targetUserId));
    }
  };

  const denyUser = (targetUserId: string) => {
    if (socket.current) {
      socket.current.emit('deny-user', { roomId, targetUserId });
      setJoinRequests(prev => prev.filter(req => req.userId !== targetUserId));
    }
  };

  const toggleRemoteMute = (isMuted: boolean) => {
    if (socket.current) socket.current.emit('toggle-mute', { roomId, isMuted });
  };

  const toggleRemoteVideo = (isVideoOff: boolean) => {
    if (socket.current) socket.current.emit('toggle-video', { roomId, isVideoOff });
  };

  const [participantStatus, setParticipantStatus] = useState<{
    [userId: string]: { isMuted: boolean; isVideoOff: boolean };
  }>({});

  useEffect(() => {
    socket.current = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000');

    const handleUserDisconnect = (userId: string) => {
      if (peers.current[userId]) {
        peers.current[userId].close();
        delete peers.current[userId];
        setRemoteStreams(prev => {
          const next = { ...prev };
          delete next[userId];
          return next;
        });
        setParticipantStatus(prev => {
          const next = { ...prev };
          delete next[userId];
          return next;
        });
      }
    };

    const createPeerConnection = (userId: string) => {
      if (peers.current[userId]) return peers.current[userId];

      const pc = new RTCPeerConnection(ICE_SERVERS);
      
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          pc.addTrack(track, localStreamRef.current!);
        });
      }

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.current?.emit('ice-candidate', { target: userId, candidate: event.candidate });
        }
      };

      pc.ontrack = (event) => {
        setRemoteStreams(prev => ({
          ...prev,
          [userId]: event.streams[0]
        }));
        
        setParticipantStatus(prev => ({
          ...prev,
          [userId]: prev[userId] || { isMuted: false, isVideoOff: false }
        }));
      };

      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
          handleUserDisconnect(userId);
        }
      };

      peers.current[userId] = pc;
      return pc;
    };

    const initMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: { ideal: 1280 }, height: { ideal: 720 } }, 
          audio: true 
        });
        localStreamRef.current = stream;
        setLocalStream(stream);
        
        // After media is ready, try to join room
        if (socket.current?.connected) {
          socket.current.emit('join-room', roomId, `User-${socket.current.id.substring(0,4)}`);
        } else {
          socket.current?.once('connect', () => {
             socket.current?.emit('join-room', roomId, `User-${socket.current?.id?.substring(0,4)}`);
          });
        }
      } catch (error) {
        console.error('Error accessing media devices', error);
      }
    };

    // Socket Event Listeners
    socket.current.on('joined-as-host', () => setIsHost(true));
    socket.current.on('waiting-for-approval', () => setIsWaiting(true));
    socket.current.on('join-approved', () => setIsWaiting(false));
    socket.current.on('join-denied', () => {
      alert("Host denied your join request.");
      window.location.href = '/dashboard';
    });
    
    socket.current.on('became-host', () => {
      setIsHost(true);
      alert("You are now the host of this meeting.");
    });

    socket.current.on('join-request', (payload: { userId: string; userName: string }) => {
      setJoinRequests(prev => [...prev, payload]);
    });

    socket.current.on('user-connected', async (userId: string) => {
      const pc = createPeerConnection(userId);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.current?.emit('offer', { target: userId, sdp: offer });
    });

    socket.current.on('offer', async (payload: { from: string; sdp: any }) => {
      const pc = createPeerConnection(payload.from);
      await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.current?.emit('answer', { target: payload.from, sdp: answer });
    });

    socket.current.on('answer', async (payload: { from: string; sdp: any }) => {
      const pc = peers.current[payload.from];
      if (pc) await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
    });

    socket.current.on('ice-candidate', async (payload: { from: string; candidate: any }) => {
      const pc = peers.current[payload.from];
      if (pc && payload.candidate) await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
    });

    socket.current.on('receive-message', (payload: any) => {
      setMessages(prev => [...prev, payload]);
    });

    socket.current.on('receive-emoji', (payload: { userId: string, emoji: string }) => {
      setEmojis(prev => [...prev, { id: Date.now(), ...payload }]);
    });

    socket.current.on('participant-muted', ({ userId, isMuted }: any) => {
      setParticipantStatus(prev => ({ ...prev, [userId]: { ...prev[userId], isMuted } }));
    });

    socket.current.on('participant-video-off', ({ userId, isVideoOff }: any) => {
      setParticipantStatus(prev => ({ ...prev, [userId]: { ...prev[userId], isVideoOff } }));
    });

    socket.current.on('user-disconnected', (userId: string) => handleUserDisconnect(userId));

    initMedia();

    return () => {
      socket.current?.disconnect();
      localStreamRef.current?.getTracks().forEach(track => track.stop());
      Object.values(peers.current).forEach(pc => pc.close());
      peers.current = {};
    };
  }, [roomId]); 

  return { 
    localStream, 
    remoteStreams, 
    messages, 
    sendMessage, 
    participantStatus,
    toggleRemoteMute,
    toggleRemoteVideo,
    isHost,
    isWaiting,
    joinRequests,
    approveUser,
    denyUser,
    emojis,
    sendEmoji
  };
};


