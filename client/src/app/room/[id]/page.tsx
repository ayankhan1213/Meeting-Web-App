"use client";

import { use } from "react";
import { useWebRTC } from "@/hooks/useWebRTC";
import { Mic, MicOff, Video, VideoOff, PhoneOff, MonitorUp, Hand, MessageSquare, Smile, Copy, Check, Send, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";


export default function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const roomId = resolvedParams.id;
  const { 
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
  } = useWebRTC(roomId);
  const router = useRouter();
  
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [activeTab, setActiveTab] = useState<"none" | "chat" | "users">("none");
  const [copied, setCopied] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  
  const localVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  const toggleMute = () => {
    if (localStream) {
      const newState = !isMuted;
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !newState;
      });
      setIsMuted(newState);
      toggleRemoteMute(newState);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const newState = !isVideoOff;
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !newState;
      });
      setIsVideoOff(newState);
      toggleRemoteVideo(newState);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendMessage = (e: any) => {
    e.preventDefault();
    if(chatMessage.trim()) {
      sendMessage(chatMessage, "You");
      setChatMessage("");
    }
  };

  return (
    <div className="h-screen w-full bg-background flex flex-col overflow-hidden relative">
      <div className="absolute inset-0 bg-primary/5 pointer-events-none"></div>
      
      {/* Top Bar */}
      <header className="h-16 glass-panel border-x-0 border-t-0 rounded-none px-4 sm:px-6 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-2 sm:gap-4 flex-1">
          <h1 className="font-semibold text-base sm:text-lg tracking-wide hidden xs:block truncate max-w-[120px] sm:max-w-none">
            Meeting: <span className="text-secondary">{roomId}</span>
          </h1>
          <button 
            onClick={handleCopyLink}
            className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded bg-primary/20 hover:bg-primary/30 text-primary text-[10px] sm:text-xs font-medium border border-primary/20 transition-colors shrink-0"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            <span className="hidden xs:inline">{copied ? "Link Copied!" : "Copy Link"}</span>
            {!copied && <span className="xs:hidden">Copy</span>}
          </button>
          <div className="px-2 py-1 rounded bg-red-500/10 text-red-500 text-[10px] sm:text-xs font-medium border border-red-500/20 flex items-center gap-1 sm:gap-2 shrink-0">
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-red-500 animate-pulse"></span>
            REC
          </div>
        </div>
        
        <div className="flex gap-1.5 sm:gap-2 z-50">
           <button onClick={() => setActiveTab(activeTab === 'users' ? 'none' : 'users')} className={`glass-panel p-2 transition ${activeTab === 'users' ? 'bg-white/20 text-white' : 'hover:bg-white/10 text-gray-300'}`}>
              <UsersIcon />
           </button>
           <button onClick={() => setActiveTab(activeTab === 'chat' ? 'none' : 'chat')} className={`glass-panel p-2 transition ${activeTab === 'chat' ? 'bg-primary/20 text-primary border-primary/50' : 'hover:bg-white/10 text-primary'}`}>
              <MessageSquare size={20} />
           </button>
        </div>
      </header>

      {/* Main Content: Video Grid */}
      <main className="flex-1 p-2 sm:p-4 md:p-6 overflow-hidden flex gap-0 sm:gap-6 relative z-10">
        
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-4 auto-rows-fr h-full overflow-y-auto pr-1 sm:pr-2 pb-24 sm:pb-20 custom-scrollbar">
          
          {/* Local Video */}
          <motion.div 
            layout 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className="rounded-xl xs:rounded-2xl overflow-hidden glass-panel border-primary/30 relative group aspect-video min-h-0"
          >
            <video 
              ref={localVideoRef} 
              autoPlay 
              muted 
              playsInline 
              className={`w-full h-full object-cover transition-opacity duration-300 ${isVideoOff ? 'opacity-0' : 'opacity-100'}`}
            />
            {isVideoOff && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xl sm:text-2xl font-bold tracking-widest">
                  YOU
                </div>
              </div>
            )}
            <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 px-2 py-1 rounded-lg glass-panel bg-black/60 text-[10px] sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2">
               You {isMuted && <MicOff size={12} className="text-red-400" />}
            </div>
          </motion.div>

          {/* Remote Videos */}
          {Object.entries(remoteStreams).map(([userId, stream]) => (
            <motion.div 
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              key={userId} 
              className="rounded-xl xs:rounded-2xl overflow-hidden glass-panel relative group aspect-video min-h-0"
            >
              <VideoRenderer stream={stream} />
              {participantStatus[userId]?.isVideoOff && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gray-500/20 text-gray-300 flex items-center justify-center text-xl sm:text-2xl font-bold tracking-widest">
                    U
                  </div>
                </div>
              )}
              <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 px-2 py-1 rounded-lg glass-panel bg-black/60 text-[10px] sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2">
                Participant {participantStatus[userId]?.isMuted && <MicOff size={12} className="text-red-400" />}
              </div>
            </motion.div>
          ))}
          
        </div>

        {/* Sidebar for Chat or Participants */}
        <AnimatePresence>
           {activeTab !== "none" && (
              <motion.div 
                 initial={{ x: "100%", opacity: 0 }}
                 animate={{ x: 0, opacity: 1 }}
                 exit={{ x: "100%", opacity: 0 }}
                 transition={{ type: "spring", damping: 25, stiffness: 200 }}
                 className="fixed inset-0 z-[100] md:relative md:inset-auto md:h-full md:w-80 glass-panel md:rounded-2xl rounded-none flex flex-col overflow-hidden shrink-0 border-y-0 border-r-0 md:border-y md:border-r bg-background/95 md:bg-surface/60 backdrop-blur-xl"
              >
                  <div className="p-4 border-b border-white/10 font-medium flex justify-between items-center">
                     {activeTab === 'chat' ? 'Meeting Chat' : 'Participants'}
                     <button onClick={() => setActiveTab('none')} className="p-1 hover:bg-white/10 rounded-md text-gray-400 hover:text-white transition-colors">
                        <X size={16} />
                     </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar">
                     {activeTab === 'chat' && (
                        messages.map((msg, idx) => (
                           <div key={idx} className={`flex flex-col ${msg.sender === 'You' ? 'items-end' : 'items-start'}`}>
                              <span className="text-xs text-gray-400 mb-1">{msg.sender}</span>
                              <div className={`px-3 py-2 rounded-lg text-sm max-w-[85%] break-words ${msg.sender === 'You' ? 'bg-primary text-white rounded-br-none' : 'bg-white/10 rounded-bl-none'}`}>
                                 {msg.text}
                              </div>
                           </div>
                        ))
                     )}
                     
                     {activeTab === 'users' && (
                        <div className="flex flex-col gap-2">
                           <div className="flex items-center justify-between p-2 rounded hover:bg-white/5">
                              <div className="flex items-center gap-2">
                                 <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs">You</div>
                                 <span className="text-sm">You</span>
                              </div>
                              <Mic size={14} className={isMuted ? "text-red-500" : "text-green-500"}/>
                           </div>
                           {Object.keys(remoteStreams).map((userId) => (
                              <div key={userId} className="flex items-center justify-between p-2 rounded hover:bg-white/5">
                                 <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-gray-500/20 text-gray-300 flex items-center justify-center text-xs">U</div>
                                    <span className="text-sm">Participant</span>
                                 </div>
                                 <Mic size={14} className={participantStatus[userId]?.isMuted ? "text-red-500" : "text-green-500"}/>
                              </div>
                           ))}
                        </div>
                     )}
                  </div>

                  {activeTab === 'chat' && (
                     <form onSubmit={handleSendMessage} className="p-3 border-t border-white/10 flex gap-2">
                        <input 
                           type="text" 
                           value={chatMessage} 
                           onChange={e => setChatMessage(e.target.value)}
                           placeholder="Type a message..."
                           className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/50"
                        />
                        <button type="submit" className="p-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors">
                           <Send size={16} />
                        </button>
                     </form>
                  )}
              </motion.div>
           )}
        </AnimatePresence>

      </main>

      {/* Floating Emojis */}
      <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
        <AnimatePresence>
          {emojis.map((emoji) => (
            <FloatingEmoji key={emoji.id} emoji={emoji.emoji} />
          ))}
        </AnimatePresence>
      </div>

      {/* Join Request Notification (Host Only) */}
      <div className="fixed top-20 right-6 z-[110] flex flex-col gap-3">
        <AnimatePresence>
          {isHost && joinRequests.map((req) => (
            <motion.div
              key={req.userId}
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              className="glass-panel p-4 w-72 shadow-2xl border-primary/50 bg-background/90 backdrop-blur-xl"
            >
              <p className="text-sm font-medium mb-3">
                <span className="text-primary">{req.userName}</span> wants to join the meeting
              </p>
              <div className="flex gap-2">
                <button 
                  onClick={() => approveUser(req.userId)}
                  className="flex-1 py-2 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary/80 transition-colors"
                >
                  Allow
                </button>
                <button 
                  onClick={() => denyUser(req.userId)}
                  className="flex-1 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-bold hover:bg-white/10 transition-colors"
                >
                  Deny
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Waiting Lobby Overlay */}
      <AnimatePresence>
        {isWaiting && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-background/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6 text-center"
          >
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-6 relative">
               <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
               <Video className="text-primary w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Waiting for Host...</h2>
            <p className="text-gray-400 max-w-sm mb-8">
              The meeting host has been notified. You'll join as soon as they let you in.
            </p>
            <button 
              onClick={() => router.push('/dashboard')}
              className="px-6 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-sm"
            >
              Cancel & Leave
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Control Bar */}
      <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 glass-panel shadow-2xl px-3 sm:px-6 py-2 sm:py-3 rounded-full flex items-center gap-2 sm:gap-4 z-50 max-w-[95vw] sm:max-w-none overflow-x-auto no-scrollbar">
        
        <ControlBtn active={isMuted} danger={isMuted} onClick={toggleMute} icon={isMuted ? <MicOff size={20} /> : <Mic size={20} />} label="Mic" />
        <ControlBtn active={isVideoOff} danger={isVideoOff} onClick={toggleVideo} icon={isVideoOff ? <VideoOff size={20} /> : <Video size={20} />} label="Video" />
        
        <div className="w-px h-6 sm:h-8 bg-white/10 mx-1 sm:mx-2 shrink-0"></div>
        
        <ControlBtn icon={<MonitorUp size={20} />} label="Share" onClick={() => {}} />
        <EmojiPicker onSelect={sendEmoji} />
        <ControlBtn icon={<Hand size={20} />} label="Raise" onClick={() => {}} className="hidden xs:flex" />

        <div className="w-px h-6 sm:h-8 bg-white/10 mx-1 sm:mx-2 shrink-0"></div>

        <button 
          onClick={() => router.push('/')}
          className="bg-red-500 hover:bg-red-600 text-white rounded-full p-3 sm:p-4 shadow-[0_0_15px_rgba(239,68,68,0.5)] transition hover:scale-105 shrink-0"
        >
          <PhoneOff className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>
    </div>
  );
}

const EmojiPicker = ({ onSelect }: { onSelect: (emoji: string) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const emojis = ["👍", "❤️", "😂", "👏", "🔥", "😮"];

  return (
    <div className="relative">
      <ControlBtn 
        icon={<Smile size={20} />} 
        label="React" 
        onClick={() => setIsOpen(!isOpen)} 
        active={isOpen}
      />
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ y: 20, opacity: 0, scale: 0.8 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.8 }}
            className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 glass-panel p-2 flex gap-2 shadow-2xl"
          >
            {emojis.map(e => (
              <button 
                key={e} 
                onClick={() => { onSelect(e); setIsOpen(false); }}
                className="text-2xl hover:scale-125 transition-transform p-1"
              >
                {e}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const FloatingEmoji = ({ emoji }: { emoji: string }) => {
  const randomX = useState(Math.random() * 80 + 10)[0];
  
  return (
    <motion.div
      initial={{ y: "100vh", x: `${randomX}vw`, opacity: 0, scale: 0.5 }}
      animate={{ 
        y: "-10vh", 
        opacity: [0, 1, 1, 0],
        scale: [0.5, 1.2, 1.2, 0.8],
        rotate: [0, -10, 10, 0]
      }}
      transition={{ duration: 4, ease: "easeOut" }}
      className="absolute text-5xl"
    >
      {emoji}
    </motion.div>
  );
};

const ControlBtn = ({ icon, label, onClick, active, danger, className }: any) => (
  <button 
    onClick={onClick}
    className={`p-2.5 sm:p-4 rounded-full transition-all group relative border shrink-0 ${danger ? 'bg-red-500/20 text-red-500 border-red-500/50 hover:bg-red-500/30' : active ? 'bg-primary/20 text-primary border-primary/50' : 'bg-white/5 border-white/5 hover:bg-white/10 text-gray-300 hover:text-white'} ${className}`}
  >
    <div className="flex items-center justify-center">{icon}</div>
  </button>
)

const VideoRenderer = ({ stream }: { stream: MediaStream }) => {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream;
  }, [stream]);
  return <video ref={ref} autoPlay playsInline className="w-full h-full object-cover" />;
};

const UsersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
)
