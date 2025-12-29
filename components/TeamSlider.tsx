'use client';

import { motion } from 'framer-motion';
import { User, Users } from 'lucide-react';
import { useMemo, useState } from 'react';

interface TeamMember {
  name: string;
  matricNumber: string;
}

interface TeamSliderProps {
  members: TeamMember[];
}

// Generate consistent gradient based on name
function getAvatarGradient(name: string): string {
  const gradients = [
    'from-blue-500 via-blue-600 to-indigo-600',
    'from-emerald-500 via-green-600 to-teal-600',
    'from-purple-500 via-violet-600 to-indigo-600',
    'from-rose-500 via-pink-600 to-fuchsia-600',
    'from-amber-500 via-orange-600 to-red-600',
    'from-cyan-500 via-teal-600 to-emerald-600',
    'from-indigo-500 via-purple-600 to-pink-600',
    'from-teal-500 via-cyan-600 to-blue-600',
  ];
  const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % gradients.length;
  return gradients[index];
}

// Get initials from name (first and last name initials)
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
  // Triple the members for seamless infinite scroll
  const tripleMembers = useMemo(() => [...members, ...members, ...members], [members]);
  
  // Very slow duration for professional feel (240 seconds for full cycle)
  const duration = 240;
  
  // State to control animation on hover
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="relative">
      {/* Header Stats */}
      <div className="flex justify-center mb-12">
        <div className="inline-flex items-center gap-4 bg-gradient-to-r from-brand-500 to-brand-600 px-8 py-4 rounded-full shadow-xl border border-brand-200">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
            <Users className="text-white" size={24} />
          </div>
          <div className="text-center">
            <span className="text-3xl font-bold text-white">{members.length}</span>
            <div className="text-brand-100 text-sm font-medium">Student Contributors</div>
          </div>
        </div>
      </div>

      {/* Desktop Marquee Slider */}
      <div className="hidden md:block overflow-hidden relative rounded-3xl p-8 bg-gradient-to-b from-surface-50/50 to-white border border-surface-200 shadow-lg">
        {/* Gradient Overlays for smooth fade effect */}
        <div className="absolute left-0 top-0 bottom-0 w-40 bg-gradient-to-r from-white via-white/80 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-40 bg-gradient-to-l from-white via-white/80 to-transparent z-10 pointer-events-none" />
        
        {/* Row 1 - Slow Left to Right */}
        <div className="mb-8">
          <motion.div
            className="flex gap-8"
            animate={{ x: [0, -members.length * 280] }}
            transition={{
              duration: isHovered ? Infinity : duration, // Pause when hovered
              repeat: Infinity,
              ease: "linear",
              repeatType: "loop"
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {tripleMembers.map((member, idx) => (
              <ContributorCard key={`row1-${idx}`} member={member} />
            ))}
          </motion.div>
        </div>

        {/* Row 2 - Slow Right to Left (reversed) */}
        <div>
          <motion.div
            className="flex gap-8"
            animate={{ x: [-members.length * 280, 0] }}
            transition={{
              duration: isHovered ? Infinity : duration, // Pause when hovered
              repeat: Infinity,
              ease: "linear",
              repeatType: "loop"
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {[...tripleMembers].reverse().map((member, idx) => (
              <ContributorCard key={`row2-${idx}`} member={member} />
            ))}
          </motion.div>
        </div>
      </div>

      {/* Mobile Scrollable Grid */}
      <div className="md:hidden">
        <div className="grid grid-cols-2 gap-4 max-h-[600px] overflow-y-auto px-2 pb-4 scrollbar-thin">
          {members.map((member, idx) => (
            <MobileContributorCard key={idx} member={member} index={idx} />
          ))}
        </div>
        <p className="text-center text-sm text-surface-400 mt-4">
          Scroll to view all {members.length} contributors
        </p>
      </div>
    </div>
  );
}

function ContributorCard({ member }: { member: TeamMember }) {
  const gradient = getAvatarGradient(member.name);
  const initials = getInitials(member.name);

  return (
    <div className="flex-shrink-0 w-72">
      <div className="bg-white rounded-2xl p-7 shadow-lg border border-surface-200 hover:shadow-2xl hover:border-brand-300 hover:-translate-y-1.5 transition-all duration-500 group shadow-brand/10 hover:shadow-brand/20">
        {/* Large Avatar */}
        <div className="relative mb-6">
          <div className={`w-24 h-24 mx-auto rounded-full bg-gradient-to-br ${gradient} p-1 shadow-lg group-hover:scale-105 transition-transform duration-500`}>
            <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
              <span className={`text-2xl font-bold bg-gradient-to-br ${gradient} bg-clip-text text-transparent`}>
                {initials}
              </span>
            </div>
          </div>
          {/* Contributor Badge */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
            <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-brand-500 to-brand-600 text-white text-xs font-semibold px-4 py-1.5 rounded-full shadow-md">
              <User size={12} />
              Contributor
            </span>
          </div>
        </div>

        {/* Name & Matric */}
        <div className="text-center pt-3">
          <h3 className="font-bold text-surface-900 text-lg leading-tight group-hover:text-brand-600 transition-colors line-clamp-2 min-h-[2.5rem]">
            {formatName(member.name)}
          </h3>
          <div className="mt-3 inline-flex items-center gap-2 bg-surface-100 px-4 py-2 rounded-xl">
            <span className="text-xs text-surface-500 font-medium">Matric:</span>
            <span className="text-sm font-mono font-semibold text-surface-700 tracking-wide">{member.matricNumber}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function MobileContributorCard({ member, index }: { member: TeamMember; index: number }) {
  const gradient = getAvatarGradient(member.name);
  const initials = getInitials(member.name);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.6) }}
      className="bg-white rounded-xl p-4 shadow-sm border border-surface-100"
    >
      {/* Avatar */}
      <div className={`w-16 h-16 mx-auto rounded-full bg-gradient-to-br ${gradient} p-0.5 shadow-md mb-3`}>
        <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
          <span className={`text-lg font-bold bg-gradient-to-br ${gradient} bg-clip-text text-transparent`}>
            {initials}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="text-center">
        <h3 className="font-semibold text-surface-900 text-sm leading-tight line-clamp-2 min-h-[2.25rem]">
          {formatName(member.name)}
        </h3>
        <p className="text-xs font-mono text-surface-500 mt-1.5 bg-surface-50 px-2 py-1 rounded inline-block">
          {member.matricNumber}
        </p>
      </div>
    </motion.div>
  );
}