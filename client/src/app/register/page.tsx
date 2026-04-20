"use client";

import { motion } from "framer-motion";
import { Video, UserPlus } from "lucide-react";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-background">
      {/* Background Elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-secondary/5 rounded-full blur-[150px] z-0 pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.1, rotateX: -90, rotateZ: 10 }}
        animate={{ opacity: 1, scale: 1, rotateX: 0, rotateZ: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 15, bounce: 0.6 }}
        className="w-full max-w-md z-10"
      >
        <Link href="/" className="flex items-center gap-2 mb-12 justify-center cursor-pointer">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <Video size={18} className="text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight">Meet<span className="text-primary">Edu</span></span>
        </Link>
        
        <div className="glass-panel p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-2">Create an account</h1>
            <p className="text-gray-400 text-sm">Join the next-gen learning platform</p>
          </div>

          <form className="flex flex-col gap-5" onSubmit={(e) => { e.preventDefault(); import('next/navigation').then(m => m.useRouter().push('/dashboard')).catch(() => window.location.href = '/dashboard'); }}>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-300">Full Name</label>
              <input 
                type="text" 
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-secondary/50 transition-colors placeholder:text-gray-600"
                placeholder="John Doe"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-300">Email Address</label>
              <input 
                type="email" 
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-secondary/50 transition-colors placeholder:text-gray-600"
                placeholder="student@university.edu"
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-300">Password</label>
              <input 
                type="password"
                required 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-secondary/50 transition-colors placeholder:text-gray-600"
                placeholder="••••••••"
              />
            </div>

            <button type="submit" className="w-full bg-secondary text-black font-semibold py-3 rounded-xl hover:bg-secondary/90 hover:shadow-neon-secondary transition-all flex items-center justify-center gap-2 mt-2">
              Sign Up <UserPlus size={16} />
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-6">
            Already have an account? <Link href="/login" className="text-secondary hover:text-secondary/80 font-medium">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
