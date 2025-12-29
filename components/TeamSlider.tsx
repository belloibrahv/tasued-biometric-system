'use client';

import { motion } from 'framer-motion';
import { User, GraduationCap } from 'lucide-react';
import { useMemo } from 'react';

interface TeamMember {
  name: string;
  matricNumber: string;
  role: string;
  image?: string;
}

interface TeamSliderProps {
  members: TeamMember[];
}

// Generate consistent color based on name
function getAvatarColor(name: string): string {
  const colors = [
    'from-blue-500 to-blue-600',
    'from-green-500 to-green-600',
    'from-purple-500 to-purple-600',
    'from-pink-500 to-pink-600',
    'from-indigo-500 to-indigo-600',
    'from-teal-500 to-teal-600',
    'from-orange-500 to-orange-600',
    'from-cyan-500 to-cyan-600',
  ];
  const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  return colors[index];
}

// Get initials from name
function getInitials(name: string): string {
  const parts = name.split(' ').filter(p => p.length > 0);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0]?.substring(0, 2).toUpperCase() || 'NA';
}

// Format name to title case
function formatName(name: string): string {
  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default function TeamSlider({ members }: TeamSliderProps) {
  // Duplicate members for seamless infinite scroll
  const duplicatedMembers = useMemo(() => [...members, ...members], [members]);
  
  // Calculate duration based on number of members
  const duration = Math.max(60, members.length * 0.8);

  return (
    <div className="relative">
      {/* Stats Bar */}
      <div className="flex justify-center gap-8 mb-8">
        <div className="text-center">
          <div className="text-3xl font-bold text-brand-600">{members.length}</div>
          <div className="text-sm text-surface-500">Total Students</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-success-600">{members.filter(m => m.role === 'Student Member').length}</div>
          <div className="text-sm text-surface-500">Regular Students</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-purple-600">{members.filter(m => m.role === 'D.E Student').length}</div>
          <div className="text-sm text-surface-500">D.E Students</div>
        </div>
      </div>

      {/* Desktop Slider - Two Rows */}
      <div className="hidden md:block overflow-hidden relative">
        {/* Gradient Overlays */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-surface-50 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-surface-50 to-transparent z-10 pointer-events-none" />
        
        {/* Row 1 - Left to Right */}
        <div className="mb-4 overflow-hidden">
          <motion.div
            className="flex gap-4"
            animate={{ x: [0, -members.length * 220] }}
            transition={{
              duration: duration,
              repeat: Infinity,
              ease: "linear",
              repeatType: "loop"
            }}
          >
            {duplicatedMembers.map((member, idx) => (
              <MemberCard key={`row1-${idx}`} member={member} />
            ))}
          </motion.div>
        </div>

        {/* Row 2 - Right to Left */}
        <div className="overflow-hidden">
          <motion.div
            className="flex gap-4"
            animate={{ x: [-members.length * 220, 0] }}
            transition={{
              duration: duration,
              repeat: Infinity,
              ease: "linear",
              repeatType: "loop"
            }}
          >
            {[...duplicatedMembers].reverse().map((member, idx) => (
              <MemberCard key={`row2-${idx}`} member={member} />
            ))}
          </motion.div>
        </div>
      </div>

      {/* Mobile Grid */}
      <div className="md:hidden">
        <div className="grid grid-cols-2 gap-3 max-h-[500px] overflow-y-auto px-1 pb-4">
          {members.map((member, idx) => (
            <MemberCardMobile key={idx} member={member} index={idx} />
          ))}
        </div>
        <div className="text-center mt-4 text-sm text-surface-500">
          Scroll to see all {members.length} team members
        </div>
      </div>
    </div>
  );
}

function MemberCard({ member }: { member: TeamMember }) {
  const colorClass = getAvatarColor(member.name);
  const initials = getInitials(member.name);
  const isDE = member.role === 'D.E Student';

  return (
    <div className="flex-shrink-0 w-52">
      <div className="bg-white rounded-xl p-4 shadow-sm border border-surface-100 hover:shadow-md hover:border-brand-200 transition-all duration-300 h-full">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${colorClass} flex items-center justify-center flex-shrink-0 shadow-sm`}>
            <span className="text-white font-bold text-sm">{initials}</span>
          </div>
          
          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-surface-900 text-sm leading-tight truncate" title={formatName(member.name)}>
              {formatName(member.name)}
            </h3>
            <p className="text-xs text-surface-500 font-mono mt-0.5">{member.matricNumber}</p>
            {isDE && (
              <span className="inline-flex items-center gap-1 text-xs text-purple-600 font-medium mt-1">
                <GraduationCap size={10} /> D.E
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MemberCardMobile({ member, index }: { member: TeamMember; index: number }) {
  const colorClass = getAvatarColor(member.name);
  const initials = getInitials(member.name);
  const isDE = member.role === 'D.E Student';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.02, 0.5) }}
      className="bg-white rounded-xl p-3 shadow-sm border border-surface-100"
    >
      <div className="flex flex-col items-center text-center">
        <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${colorClass} flex items-center justify-center mb-2 shadow-sm`}>
          <span className="text-white font-bold">{initials}</span>
        </div>
        <h3 className="font-semibold text-surface-900 text-xs leading-tight line-clamp-2">
          {formatName(member.name)}
        </h3>
        <p className="text-xs text-surface-400 font-mono mt-1">{member.matricNumber}</p>
        {isDE && (
          <span className="inline-flex items-center gap-1 text-xs text-purple-600 font-medium mt-1 bg-purple-50 px-2 py-0.5 rounded-full">
            <GraduationCap size={10} /> D.E Student
          </span>
        )}
      </div>
    </motion.div>
  );
}
