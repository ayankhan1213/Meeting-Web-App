"use client";

import { motion, Variants } from "framer-motion";
import { Video, Zap, Shield, Users } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [meetingCode, setMeetingCode] = useState("");
  const router = useRouter();

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: "spring", stiffness: 100, damping: 10 }
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Abstract Background Elements */}
      <div className="absolute top-[-100px] left-[-100px] w-96 h-96 bg-primary/20 rounded-full blur-[100px] z-0"></div>
      <div className="absolute bottom-[-100px] right-[-100px] w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[120px] z-0"></div>
      
      {/* Navbar */}
      <nav className="w-full relative z-10 glass-panel border-x-0 border-t-0 rounded-none px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shrink-0">
            <Video size={18} className="text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight hidden xs:block">Meet<span className="text-primary">Edu</span></span>
        </div>
        <div className="flex gap-2 sm:gap-4 font-medium text-sm">
          <Link href="/login" className="px-3 sm:px-5 py-2 hover:text-primary transition-colors">
            Sign In
          </Link>
          <Link href="/register" className="px-3 sm:px-5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all">
            Sign Up
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 relative z-10 flex flex-col lg:flex-row items-center justify-center p-6 lg:p-12 w-full max-w-7xl mx-auto gap-12 lg:gap-24 mb-16">
        
        {/* Left Side: Hero Text */}
        <motion.div 
          className="flex-1 flex flex-col gap-6 w-full max-w-xl justify-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-panel border-primary/30 bg-primary/10 w-fit">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="text-xs font-medium text-primary-light">Next-Gen Virtual Classrooms</span>
          </motion.div>
          
          <motion.h1 variants={itemVariants} className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] text-white">
            Learn & Connect <br/> 
            without <span className="text-gradient">Boundaries.</span>
          </motion.h1>
          
          <motion.p variants={itemVariants} className="text-gray-400 text-base sm:text-lg leading-relaxed max-w-lg">
            Experience pristine video quality, interactive tools, and a distraction-free environment built exclusively for the modern student.
          </motion.p>
          
          <motion.div variants={itemVariants} className="flex flex-col xs:flex-row gap-4 mt-4 w-full">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/dashboard')}
              className="px-8 py-4 rounded-xl font-medium tracking-wide bg-primary text-white shadow-neon-primary hover:shadow-[0_0_25px_rgba(227,89,39,0.7)] transition-all whitespace-nowrap"
            >
              Start a Meeting
            </motion.button>
            <div className="flex items-center glass-panel px-2 py-1 flex-1 min-w-0">
              <div className="w-10 h-full flex items-center justify-center text-gray-400 shrink-0">
                <Video size={18} />
              </div>
              <input 
                type="text" 
                placeholder="Code" 
                className="bg-transparent border-none outline-none text-white w-full pr-2 placeholder:text-gray-500 text-sm min-w-0"
                value={meetingCode}
                onChange={(e) => setMeetingCode(e.target.value)}
              />
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors shrink-0"
                onClick={() => {
                  const extractedCode = meetingCode.includes('/') ? meetingCode.split('/').pop() : meetingCode;
                  if (extractedCode) router.push(`/room/${extractedCode}`);
                }}
                disabled={!meetingCode}
              >
                Join
              </motion.button>
            </div>
          </motion.div>
        </motion.div>

        {/* Right Side: Abstract App Preview / Visuals */}
        <motion.div 
          className="flex-1 w-full max-w-xl h-[500px] relative"
          initial={{ opacity: 0, scale: 0.9, rotateX: 15 }}
          animate={{ opacity: 1, scale: 1, rotateX: 0 }}
          transition={{ duration: 1, delay: 0.2, type: "spring" }}
          style={{ perspective: 1000 }}
        >
          <div className="absolute inset-0 glass-panel shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col transform transition-transform border-white/20">
            {/* Mock Window Header */}
            <div className="h-10 border-b border-white/10 flex items-center px-4 gap-2 bg-white/5">
              <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
            </div>
            {/* Mock App Content */}
            <div className="flex-1 p-4 flex flex-col gap-4">
              <div className="flex-1 flex gap-4">
                <div className="flex-1 rounded-xl bg-gray-800/50 border border-white/5 relative overflow-hidden flex items-center justify-center group">
                   <Users className="text-gray-600 w-12 h-12" />
                   <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-xs">Instructor</div>
                </div>
                <div className="w-1/3 flex flex-col gap-4">
                  <div className="flex-1 rounded-xl bg-gray-800/50 border border-white/5 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs">You</div>
                  </div>
                  <div className="flex-1 rounded-xl bg-gray-800/50 border border-white/5"></div>
                </div>
              </div>
              <div className="h-16 rounded-xl glass-panel flex items-center justify-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center"><Video size={16} /></div>
                <div className="w-10 h-10 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center"><Zap size={16} /></div>
                <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center"><Shield size={16} /></div>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
