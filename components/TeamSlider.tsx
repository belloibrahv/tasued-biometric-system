'use client';

import { motion } from 'framer-motion';
import { User, Github, Linkedin } from 'lucide-react';

interface TeamMember {
  name: string;
  matricNumber: string;
  role: string;
  image?: string;
}

interface TeamSliderProps {
  members: TeamMember[];
}

export default function TeamSlider({ members }: TeamSliderProps) {
  // Duplicate members for infinite scroll effect
  const duplicatedMembers = [...members, ...members];

  return (
    <div className="relative overflow-hidden">
      {/* Gradient Overlays */}
      <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-surface-50 to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-surface-50 to-transparent z-10 pointer-events-none" />
      
      {/* Scrolling Container */}
      <motion.div
        className="flex gap-6 py-4"
        animate={{ x: [0, -50 * members.length * 16] }}
        transition={{
          x: {
            repeat: Infinity,
            repeatType: "loop",
            duration: 30,
            ease: "linear",
          },
        }}
      >
        {duplicatedMembers.map((member, idx) => (
          <div
            key={idx}
            className="flex-shrink-0 w-72 bg-white rounded-2xl p-6 shadow-lg border border-surface-100 hover:shadow-xl hover:border-brand-200 transition-all group"
          >
            {/* Avatar */}
            <div className="relative mb-4">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-brand-500 to-success-500 p-1">
                <div className="w-full h-full rounded-full bg-surface-100 flex items-center justify-center overflow-hidden">
                  {member.image ? (
                    <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
                  ) : (
                    <User size={36} className="text-surface-400" />
                  )}
                </div>
              </div>
              {/* Role Badge */}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-brand-500 text-white text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap">
                {member.role}
              </div>
            </div>

            {/* Info */}
            <div className="text-center mt-6">
              <h3 className="font-bold text-surface-900 text-lg">{member.name}</h3>
              <p className="text-surface-500 text-sm font-mono mt-1">{member.matricNumber}</p>
            </div>

            {/* Social Links */}
            <div className="flex justify-center gap-3 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="w-8 h-8 bg-surface-100 rounded-lg flex items-center justify-center text-surface-500 hover:bg-brand-500 hover:text-white transition">
                <Github size={16} />
              </button>
              <button className="w-8 h-8 bg-surface-100 rounded-lg flex items-center justify-center text-surface-500 hover:bg-brand-500 hover:text-white transition">
                <Linkedin size={16} />
              </button>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Static Grid for Mobile */}
      <div className="md:hidden grid grid-cols-2 gap-4 mt-8">
        {members.slice(0, 6).map((member, idx) => (
          <div
            key={idx}
            className="bg-white rounded-xl p-4 shadow-md border border-surface-100"
          >
            <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-brand-500 to-success-500 p-0.5 mb-3">
              <div className="w-full h-full rounded-full bg-surface-100 flex items-center justify-center">
                <User size={24} className="text-surface-400" />
              </div>
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-surface-900 text-sm">{member.name}</h3>
              <p className="text-xs text-brand-500 mt-1">{member.role}</p>
              <p className="text-xs text-surface-400 font-mono mt-0.5">{member.matricNumber}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
