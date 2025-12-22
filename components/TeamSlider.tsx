'use client';

import { motion } from 'framer-motion';
import { User } from 'lucide-react';

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
  // Calculate duration based on number of members to maintain consistent speed
  const duration = Math.max(20, members.length * 3); // At least 20 seconds, scaled by member count

  return (
    <div className="relative overflow-hidden rounded-xl py-4">
      {/* Scrolling Container - Desktop */}
      <div className="hidden md:block overflow-hidden relative">
        <div className="relative">
          <motion.div
            className="flex"
            animate={{ x: [0, -members.length * 324] }} // 296px card + 28px spacing = ~324px per item
            transition={{
              duration: duration,
              repeat: Infinity,
              ease: "linear",
              repeatType: "loop"
            }}
          >
            {members.map((member, idx) => (
              <div key={idx} className="px-3.5 flex-shrink-0 w-80"> {/* 324px including margin/padding */}
                <div className="w-72 bg-white rounded-2xl p-6 shadow-lg border border-surface-100">
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
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Static Grid for Mobile */}
      <div className="md:hidden grid grid-cols-2 gap-4">
        {members.map((member, idx) => (
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
