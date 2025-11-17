import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useWorkout } from '../state/WorkoutContext';

const IconHome = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M3 9l9-7 9 7" />
    <path d="M9 22V12h6v10" />
  </svg>
);
const IconChart = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M3 3v18h18" />
    <path d="M7 13v5" />
    <path d="M12 8v10" />
    <path d="M17 11v7" />
  </svg>
);
const IconHistory = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M3 12a9 9 0 1 0 3-6.7" />
    <path d="M3 3v6h6" />
    <path d="M12 7v5l3 3" />
  </svg>
);
const IconSettings = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0-.33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0A1.65 1.65 0 0 0 9 3.09V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

// PlayIcon removed - START button always shows "START" text

const ClockIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isWorkoutActive } = useWorkout();
  
  const iconClass = "w-6 h-6";
  const isActive = (path) => location.pathname === path;
  const isSummaryPage = location.pathname === '/summary';
  const isWorkoutDetailsPage = location.pathname === '/workout-details';
  const isCustomizeProgramPage = location.pathname === '/customize-program';
  const shouldDimNav = isSummaryPage || isWorkoutDetailsPage || isCustomizeProgramPage;
  
  // Shade/disable navigation when on summary or workout details page
  const navOpacity = shouldDimNav ? 0.3 : 1;
  const navPointerEvents = shouldDimNav ? 'none' : 'auto';

  const handleWorkoutClick = (e) => {
    e.preventDefault();
    if (shouldDimNav) return; // Don't navigate if nav is dimmed
    if (isWorkoutActive) {
      navigate('/focus');
    } else {
      navigate('/workout');
    }
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-20 flex items-end justify-center pb-4" style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' }}>
      {/* Background with blur and border - Floating */}
      <div style={{ 
        background: 'rgba(0, 0, 0, 0.95)', 
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        borderRadius: '18px',
        width: 'calc(100% - 32px)',
        maxWidth: 'calc(375px - 32px)',
        opacity: navOpacity,
        pointerEvents: navPointerEvents,
      }}>
        <div className="mx-auto px-2 py-3">
          <div className="flex items-center justify-between relative" style={{ height: '56px' }}>
          {/* Home */}
          <button
            onClick={() => navigate('/')}
            className="flex flex-col items-center justify-center gap-1 tap-target transition-all hover:scale-110 active:scale-95"
            style={{ 
              minWidth: '44px', 
              minHeight: '44px',
              padding: '8px',
              marginLeft: '8px'
            }}
          >
            <IconHome 
              className={iconClass} 
              style={{ 
                color: isActive('/') ? '#00D9FF' : '#666666',
                filter: isActive('/') ? 'drop-shadow(0 0 8px rgba(0, 217, 255, 0.5))' : 'none'
              }}
            />
            {isActive('/') && (
              <span className="text-cyan-400 text-xs font-medium" style={{ fontSize: '11px' }}>Home</span>
            )}
          </button>
          
          {/* History - Further out from center */}
          <button
            onClick={() => navigate('/history')}
            className="flex flex-col items-center justify-center gap-1 tap-target transition-all hover:scale-110 active:scale-95"
            style={{ 
              minWidth: '44px', 
              minHeight: '44px',
              padding: '8px',
              marginRight: '32px'
            }}
          >
            <IconChart 
              className={iconClass}
              style={{ 
                color: isActive('/history') ? '#00D9FF' : '#666666',
                filter: isActive('/history') ? 'drop-shadow(0 0 8px rgba(0, 217, 255, 0.5))' : 'none'
              }}
            />
            {isActive('/history') && (
              <span className="text-cyan-400 text-xs font-medium" style={{ fontSize: '11px' }}>History</span>
            )}
          </button>
          
          {/* Center START Button - Bigger and moved into bar */}
          <button
            onClick={handleWorkoutClick}
            className="absolute left-1/2 -translate-x-1/2 -top-3 flex items-center justify-center rounded-full font-bold text-white shadow-xl transition-all hover:scale-110 active:scale-95"
            disabled={shouldDimNav}
            style={{
              width: '64px',
              height: '64px',
              background: 'linear-gradient(135deg, #FF9500 0%, #FF6B00 100%)',
              boxShadow: '0 6px 24px rgba(255, 149, 0, 0.4), 0 0 0 2px rgba(255, 255, 255, 0.1)',
              border: '2px solid rgba(255, 255, 255, 0.2)',
              opacity: shouldDimNav ? 0.3 : 1,
              cursor: shouldDimNav ? 'not-allowed' : 'pointer'
            }}
          >
            <span style={{ fontSize: '14px', fontWeight: 700 }}>START</span>
          </button>
          
          {/* Timer/Recent - Further out from center */}
          <button
            onClick={() => navigate('/progress')}
            className="flex flex-col items-center justify-center gap-1 tap-target transition-all hover:scale-110 active:scale-95"
            style={{ 
              minWidth: '44px', 
              minHeight: '44px',
              padding: '8px',
              marginLeft: '32px'
            }}
          >
            <ClockIcon 
              className={iconClass}
              style={{ 
                color: isActive('/progress') ? '#00D9FF' : '#666666',
                filter: isActive('/progress') ? 'drop-shadow(0 0 8px rgba(0, 217, 255, 0.5))' : 'none'
              }}
            />
            {isActive('/progress') && (
              <span className="text-cyan-400 text-xs font-medium" style={{ fontSize: '11px' }}>Progress</span>
            )}
          </button>
          
          {/* Settings */}
          <button
            onClick={() => navigate('/settings')}
            className="flex flex-col items-center justify-center gap-1 tap-target transition-all hover:scale-110 active:scale-95"
            style={{ 
              minWidth: '44px', 
              minHeight: '44px',
              padding: '8px',
              marginRight: '8px'
            }}
          >
            <IconSettings 
              className={iconClass}
              style={{ 
                color: isActive('/settings') ? '#00D9FF' : '#666666',
                filter: isActive('/settings') ? 'drop-shadow(0 0 8px rgba(0, 217, 255, 0.5))' : 'none'
              }}
            />
            {isActive('/settings') && (
              <span className="text-cyan-400 text-xs font-medium" style={{ fontSize: '11px' }}>Settings</span>
            )}
          </button>
          </div>
        </div>
      </div>
    </div>
  );
}


