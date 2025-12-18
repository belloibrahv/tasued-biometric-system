'use client';

import { useState, useEffect, useRef } from 'react';
import { Users } from 'lucide-react';

interface TeamMember {
  name: string;
  matricNumber: string;
  role: string;
}

interface TeamSliderProps {
  teamMembers: TeamMember[];
}

const TeamSlider = ({ teamMembers }: TeamSliderProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const [direction, setDirection] = useState<'left' | 'right'>('left');
  const sliderRef = useRef<HTMLDivElement>(null);

  // Duplicate team members to create infinite loop
  const duplicatedMembers = [...teamMembers, ...teamMembers];

  // Auto-slide functionality
  useEffect(() => {
    if (!autoPlay) return;

    const interval = setInterval(() => {
      setCurrentIndex(prevIndex => {
        if (direction === 'right') {
          return prevIndex <= 0 ? duplicatedMembers.length - 1 : prevIndex - 1;
        } else {
          return prevIndex >= duplicatedMembers.length - 1 ? 0 : prevIndex + 1;
        }
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [autoPlay, direction, duplicatedMembers.length]);

  // Handle hover to pause auto-play
  const handleMouseEnter = () => setAutoPlay(false);
  const handleMouseLeave = () => setAutoPlay(true);

  // Navigation functions
  const goToPrev = () => {
    setDirection('right');
    setCurrentIndex(prevIndex => prevIndex <= 0 ? duplicatedMembers.length - 1 : prevIndex - 1);
  };

  const goToNext = () => {
    setDirection('left');
    setCurrentIndex(prevIndex => prevIndex >= duplicatedMembers.length - 1 ? 0 : prevIndex + 1);
  };

  // Calculate the transform value
  const translateX = `-${currentIndex * 100}%`;

  return (
    <div className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Project Team Members
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
            Students from CSC 415 Net-Centric Computing
          </p>
        </div>

        <div 
          className="relative overflow-hidden"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Slider container */}
          <div className="slider-container w-full">
            <div 
              className="slider-track flex transition-transform duration-1000 ease-in-out h-full"
              style={{ 
                transform: `translateX(${translateX})`,
                transitionTimingFunction: 'linear'
              }}
              ref={sliderRef}
            >
              {duplicatedMembers.map((member, index) => (
                <div 
                  key={`${member.matricNumber}-${index}`} 
                  className="flex-shrink-0 w-64 mx-4 h-full"
                >
                  <div className="bg-white rounded-lg shadow-lg overflow-hidden transition-transform duration-300 hover:scale-105 h-full">
                    <div className="bg-gray-200 border-2 border-dashed rounded-xl w-full h-48 flex items-center justify-center">
                      <div className="text-center">
                        <div className="bg-gray-200 border-2 border-dashed rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                          <Users className="h-8 w-8 text-gray-400" />
                        </div>
                        <span className="text-gray-500 text-sm mt-2">Avatar</span>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-medium text-gray-900 truncate">{member.name}</h3>
                      <p className="text-sm text-indigo-600">{member.role}</p>
                      <p className="text-sm text-gray-500 mt-1">{member.matricNumber}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation buttons */}
          <button
            onClick={goToPrev}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-2 shadow-md hover:bg-gray-100 z-10"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={goToNext}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-2 shadow-md hover:bg-gray-100 z-10"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Indicators */}
          <div className="flex justify-center mt-6 space-x-2">
            {teamMembers.slice(0, 5).map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setCurrentIndex(idx);
                  setDirection('left');
                }}
                className={`w-3 h-3 rounded-full ${
                  currentIndex % teamMembers.length === idx ? 'bg-indigo-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamSlider;