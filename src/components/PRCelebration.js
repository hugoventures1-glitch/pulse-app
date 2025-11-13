// Personal Record Celebration Modal
import React, { useEffect, useState } from 'react';
import { getPRSettings } from '../utils/personalRecords';

// Confetti component for PR celebration
function PRConfetti({ onComplete }) {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    // Generate confetti particles
    const colors = ['#00D9FF', '#9D4EDD', '#FF9500', '#22C55E', '#06B6D4', '#A855F7'];
    const newParticles = Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      color: colors[i % colors.length],
      x: Math.random() * 100,
      y: -10,
      rotation: Math.random() * 360,
      delay: i * 50,
    }));
    setParticles(newParticles);

    // Cleanup after animation
    const timer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-3 h-3 rounded-full"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            background: particle.color,
            boxShadow: `0 0 8px ${particle.color}`,
            animation: `prConfetti 3s ease-out forwards`,
            animationDelay: `${particle.delay}ms`,
          }}
        />
      ))}
    </div>
  );
}

export default function PRCelebration({ pr, onDismiss }) {
  const [showConfetti, setShowConfetti] = useState(true);
  const [autoDismissTimer, setAutoDismissTimer] = useState(null);
  const settings = getPRSettings();

  useEffect(() => {
    // Play sound if enabled
    if (settings.soundEnabled) {
      // Create a pleasant sound effect
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 440; // A4 note
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
      } catch (e) {
        // Audio not supported or failed
        console.log('Audio not available');
      }
    }

    // Auto-dismiss after 5 seconds
    const timer = setTimeout(() => {
      if (onDismiss) onDismiss();
    }, 5000);
    setAutoDismissTimer(timer);

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [onDismiss, settings.soundEnabled]);

  const handleDismiss = () => {
    if (autoDismissTimer) clearTimeout(autoDismissTimer);
    setShowConfetti(false);
    if (onDismiss) onDismiss();
  };

  if (!pr) return null;

  const weightDiff = pr.previousWeight !== null 
    ? `+${pr.weightDiff.toFixed(pr.weightDiff % 1 === 0 ? 0 : 1)}${pr.unit || 'kg'}`
    : null;
  const volumeDiff = pr.previousVolume > 0 
    ? `+${Math.round(pr.volumeDiff)}kg volume`
    : null;

  return (
    <>
      {showConfetti && <PRConfetti onComplete={() => setShowConfetti(false)} />}
      
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center px-4"
        onClick={handleDismiss}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
        
        {/* Modal */}
        <div 
          className="relative z-10 pulse-glass rounded-3xl p-8 max-w-sm w-full border border-white/20 shadow-2xl text-center animate-in fade-in scale-in"
          onClick={(e) => e.stopPropagation()}
          style={{
            borderRadius: '24px',
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          {/* Sparkle icon */}
          <div className="flex items-center justify-center mb-4">
            <div 
              className="w-20 h-20 rounded-full flex items-center justify-center animate-pulse"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 149, 0, 0.2), rgba(255, 107, 0, 0.1))',
                boxShadow: '0 0 40px rgba(255, 149, 0, 0.5)',
              }}
            >
              <svg 
                className="w-12 h-12 text-orange-400" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" 
                />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h2 
            className="text-white text-3xl font-bold mb-2"
            style={{ fontSize: '32px', fontWeight: 700 }}
          >
            PERSONAL RECORD!
          </h2>

          {/* Exercise Name */}
          <div 
            className="text-cyan-400 text-xl font-semibold mb-6"
            style={{ fontSize: '20px', color: '#00D9FF' }}
          >
            {pr.exercise}
          </div>

          {/* Previous → New Comparison */}
          <div className="space-y-4 mb-6">
            {pr.previousWeight !== null ? (
              <>
                {/* Previous Max */}
                <div className="pulse-glass rounded-xl p-4 border border-white/10">
                  <div className="text-white/60 text-sm mb-1" style={{ fontSize: '14px' }}>
                    Previous Max
                  </div>
                  <div className="text-white text-lg font-semibold" style={{ fontSize: '18px' }}>
                    {pr.previousWeight.toFixed(pr.previousWeight % 1 === 0 ? 0 : 1)}{pr.unit || 'kg'} × {pr.previousReps} reps
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex items-center justify-center">
                  <svg 
                    className="w-6 h-6 text-cyan-400" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M19 14l-7 7m0 0l-7-7m7 7V3" 
                    />
                  </svg>
                </div>

                {/* New Max */}
                <div 
                  className="pulse-glass rounded-xl p-4 border-2 border-orange-400/50"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255, 149, 0, 0.1), rgba(255, 107, 0, 0.05))',
                  }}
                >
                  <div className="text-orange-300 text-sm mb-1 font-medium" style={{ fontSize: '14px' }}>
                    New Max
                  </div>
                  <div className="text-white text-2xl font-bold" style={{ fontSize: '24px' }}>
                    {pr.weight.toFixed(pr.weight % 1 === 0 ? 0 : 1)}{pr.unit || 'kg'} × {pr.reps} reps
                  </div>
                </div>
              </>
            ) : (
              /* First PR - no previous */
              <div 
                className="pulse-glass rounded-xl p-4 border-2 border-orange-400/50"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 149, 0, 0.1), rgba(255, 107, 0, 0.05))',
                }}
              >
                <div className="text-orange-300 text-sm mb-1 font-medium" style={{ fontSize: '14px' }}>
                  First PR!
                </div>
                <div className="text-white text-2xl font-bold" style={{ fontSize: '24px' }}>
                  {pr.weight.toFixed(pr.weight % 1 === 0 ? 0 : 1)}{pr.unit || 'kg'} × {pr.reps} reps
                </div>
              </div>
            )}

            {/* Weight Difference Highlight */}
            {weightDiff && (
              <div 
                className="inline-flex items-center px-4 py-2 rounded-full text-white font-bold text-lg"
                style={{
                  background: 'linear-gradient(135deg, #FF9500 0%, #FF6B00 100%)',
                  boxShadow: '0 4px 16px rgba(255, 149, 0, 0.4)',
                }}
              >
                {weightDiff}
              </div>
            )}
          </div>

          {/* Tap to continue hint */}
          <button
            onClick={handleDismiss}
            className="text-white/60 text-sm hover:text-white transition-colors"
            style={{ fontSize: '14px' }}
          >
            Tap to continue
          </button>
        </div>
      </div>
    </>
  );
}

