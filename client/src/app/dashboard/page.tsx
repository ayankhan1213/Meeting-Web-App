"use client";

import { motion } from "framer-motion";
import { Plus, Link as LinkIcon, Calendar, Clock, Video } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const [meetingCode, setMeetingCode] = useState("");
  const [currentTime, setCurrentTime] = useState("");
  const router = useRouter();

  useEffect(() => {
    setCurrentTime(new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}));
  }, []);

  const handleCreateMeeting = () => {
    // Basic meeting generation for demo
    const code = Math.random().toString(36).substring(2, 9);
    router.push(`/room/${code}`);
  };

  const handleJoinMeeting = () => {
    if(meetingCode) {
      const extractedCode = meetingCode.includes('/') ? meetingCode.split('/').pop() : meetingCode;
      if (extractedCode) router.push(`/room/${extractedCode}`);
    }
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none"></div>

      <nav className="h-16 glass-panel border-x-0 border-t-0 rounded-none px-6 flex items-center justify-between z-10 shrink-0 relative">
         <div className="flex items-center gap-2">
          <Link href="/">
            <div className="flex flex-row items-center gap-2 cursor-pointer">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Video size={18} className="text-white" />
              </div>
              <span className="font-bold text-xl tracking-tight hidden sm:block">Meet<span className="text-primary">Edu</span></span>
            </div>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-full bg-white/10 uppercase font-bold text-sm flex items-center justify-center">U</div>
        </div>
      </nav>

      <main className="flex-1 p-6 lg:p-12 max-w-6xl w-full mx-auto relative z-10">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
            <p className="text-gray-400">Ready for your next session?</p>
          </div>
          <p className="text-xl font-medium hidden sm:block">{currentTime}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Create Meeting */}
          <motion.div 
             whileHover={{ scale: 1.02 }}
             className="glass-panel p-8 flex flex-col justify-between h-48 cursor-pointer relative overflow-hidden group"
             onClick={handleCreateMeeting}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-[50px] transform translate-x-10 -translate-y-10 group-hover:scale-150 transition-transform duration-700"></div>
            <div className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center mb-4">
               <Plus size={24} />
            </div>
            <div>
              <h2 className="text-xl font-semibold">New Meeting</h2>
              <p className="text-gray-400 text-sm">Start an instant meeting</p>
            </div>
          </motion.div>

          {/* Join Meeting */}
          <motion.div 
             className="glass-panel p-8 flex flex-col justify-between h-48 relative overflow-hidden"
          >
            <div className="w-12 h-12 rounded-xl bg-white/10 text-white flex items-center justify-center mb-4 border border-white/5">
               <LinkIcon size={24} />
            </div>
            <div className="flex items-end gap-4 w-full">
              <div className="flex-1">
                <h2 className="text-xl font-semibold mb-2">Join Meeting</h2>
                <div className="flex items-center bg-black/40 rounded-lg px-3 py-2 border border-white/10 focus-within:border-primary/50 transition-colors">
                  <input 
                    type="text" 
                    placeholder="Enter code or link"
                    className="bg-transparent border-none outline-none w-full text-sm block"
                    value={meetingCode}
                    onChange={(e) => setMeetingCode(e.target.value)}
                  />
                </div>
              </div>
              <button 
                disabled={!meetingCode}
                onClick={handleJoinMeeting}
                className="px-4 py-2 bg-white text-black font-semibold rounded-lg text-sm hover:bg-gray-200 transition disabled:opacity-50 disabled:bg-white/10 disabled:text-white/50"
              >
                Join
              </button>
            </div>
          </motion.div>
        </div>

        {/* Schedule */}
        <h2 className="text-xl font-semibold mb-4">Upcoming Schedule</h2>
        <div className="glass-panel p-2 flex flex-col gap-2">
           <div className="p-4 rounded-xl flex items-center justify-between hover:bg-white/5 transition cursor-pointer">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-lg bg-secondary/20 text-secondary flex items-center justify-center">
                    <Calendar />
                 </div>
                 <div>
                   <h3 className="font-semibold text-lg">Advanced System Design</h3>
                   <p className="text-sm text-gray-400 flex items-center gap-2"><Clock size={14}/> 14:00 PM - 15:30 PM</p>
                 </div>
              </div>
              <button className="px-4 py-2 border border-white/10 rounded-lg text-sm font-medium hover:bg-white/5 transition hidden sm:block">Details</button>
           </div>
        </div>

      </main>
    </div>
  );
}
