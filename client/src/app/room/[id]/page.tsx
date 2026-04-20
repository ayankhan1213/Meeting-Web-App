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
  const { localStream, remoteStreams } = useWebRTC(roomId);
  const router = useRouter();
  
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [activeTab, setActiveTab] = useState<"none" | "chat" | "users">("none");
  const [copied, setCopied] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [messages, setMessages] = useState<{sender: string, text: string}[]>([{sender: "System", text: "Welcome to the meeting room!"}]);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
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
      setMessages([...messages, { sender: "You", text: chatMessage }]);
      setChatMessage("");
    }
  };

  return (
    <div className="h-screen w-full bg-background flex flex-col overflow-hidden relative">
      <div className="absolute inset-0 bg-primary/5 pointer-events-none"></div>
      
      {/* Top Bar */}
      <header className="h-16 glass-panel border-x-0 border-t-0 rounded-none px-6 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="font-semibold text-lg tracking-wide hidden sm:block">Meeting: <span className="text-secondary">{roomId}</span></h1>
          <button 
            onClick={handleCopyLink}
            className="flex items-center gap-2 px-3 py-1.5 rounded bg-primary/20 hover:bg-primary/30 text-primary text-xs font-medium border border-primary/20 transition-colors"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "Link Copied!" : "Copy Joining Link"}
          </button>
          <div className="px-2 py-1 rounded bg-red-500/10 text-red-500 text-xs font-medium border border-red-500/20 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            REC
          </div>
        </div>
        
        {/* Animated Avatar / Audio indicator */}
        <div className="flex gap-2 z-50">
           <button onClick={() => setActiveTab(activeTab === 'users' ? 'none' : 'users')} className={`glass-panel p-2 transition ${activeTab === 'users' ? 'bg-white/20 text-white' : 'hover:bg-white/10'}`}>
              <UsersIcon />
           </button>
           <button onClick={() => setActiveTab(activeTab === 'chat' ? 'none' : 'chat')} className={`glass-panel p-2 transition ${activeTab === 'chat' ? 'bg-primary/20 text-primary' : 'hover:bg-white/10 text-primary'}`}>
              <MessageSquare size={20} />
           </button>
        </div>
      </header>

      {/* Main Content: Video Grid */}
      <main className="flex-1 p-4 sm:p-6 overflow-hidden flex gap-6 relative z-10">
        
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 auto-rows-fr h-full overflow-y-auto pr-2 pb-20 custom-scrollbar">
          
          {/* Local Video */}
          <motion.div 
            layout 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className="rounded-2xl overflow-hidden glass-panel border-primary/30 relative group min-h-[250px]"
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
                <div className="w-20 h-20 rounded-full bg-primary/20 text-primary flex items-center justify-center text-2xl font-bold tracking-widest">
                  YOU
                </div>
              </div>
            )}
            <div className="absolute bottom-4 left-4 px-3 py-1 rounded-lg glass-panel bg-black/60 text-sm font-medium flex items-center gap-2">
               You {isMuted && <MicOff size={14} className="text-red-400" />}
            </div>
          </motion.div>

          {/* Remote Videos */}
          {Object.entries(remoteStreams).map(([userId, stream]) => (
            <motion.div 
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              key={userId} 
              className="rounded-2xl overflow-hidden glass-panel relative group min-h-[250px]"
            >
              <VideoRenderer stream={stream} />
              <div className="absolute bottom-4 left-4 px-3 py-1 rounded-lg glass-panel bg-black/60 text-sm font-medium">
                Participant
              </div>
            </motion.div>
          ))}
          
        </div>

        {/* Sidebar for Chat or Participants */}
        <AnimatePresence>
           {activeTab !== "none" && (
              <motion.div 
                 initial={{ width: 0, opacity: 0 }}
                 animate={{ width: 320, opacity: 1 }}
                 exit={{ width: 0, opacity: 0 }}
                 className="h-full glass-panel flex flex-col overflow-hidden shrink-0"
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

      {/* Bottom Control Bar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 glass-panel shadow-2xl px-6 py-3 rounded-full flex items-center gap-4 z-50">
        
        <ControlBtn active={isMuted} danger={isMuted} onClick={toggleMute} icon={isMuted ? <MicOff /> : <Mic />} label="Mic" />
        <ControlBtn active={isVideoOff} danger={isVideoOff} onClick={toggleVideo} icon={isVideoOff ? <VideoOff /> : <Video />} label="Video" />
        
        <div className="w-px h-8 bg-white/10 mx-2"></div>
        
        <ControlBtn icon={<MonitorUp />} label="Share" onClick={() => {}} />
        <ControlBtn icon={<Smile />} label="React" onClick={() => {}} />
        <ControlBtn icon={<Hand />} label="Raise" onClick={() => {}} />

        <div className="w-px h-8 bg-white/10 mx-2"></div>

        <button 
          onClick={() => router.push('/')}
          className="bg-red-500 hover:bg-red-600 text-white rounded-full p-4 shadow-[0_0_15px_rgba(239,68,68,0.5)] transition hover:scale-105 group-hover:block"
        >
          <PhoneOff size={24} />
        </button>

      </div>
    </div>
  );
}

const ControlBtn = ({ icon, label, onClick, active, danger }: any) => (
  <button 
    onClick={onClick}
    className={`p-3 sm:p-4 rounded-full transition-all group relative border ${danger ? 'bg-red-500/20 text-red-500 border-red-500/50 hover:bg-red-500/30' : active ? 'bg-primary/20 text-primary border-primary/50' : 'bg-white/5 border-white/5 hover:bg-white/10 text-gray-300 hover:text-white'}`}
  >
    <div className="w-5 h-5 sm:w-6 sm:h-6">{icon}</div>
    {/* Tooltip hidden, keeping it simple */}
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
