import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
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

export default function BottomNav() {
  const navigate = useNavigate();
  const { isWorkoutActive } = useWorkout();
  const base = "dock-seg active:scale-[0.98] transition border border-white/10 bg-white/5";
  const active = "bg-white text-slate-900 border-transparent";
  const iconClass = "w-6 h-6";

  const handleWorkoutClick = (e) => {
    e.preventDefault();
    if (isWorkoutActive) {
      navigate('/focus');
    } else {
      navigate('/workout');
    }
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-20">
      <div className="mx-auto w-full max-w-[375px] px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-2">
        <div className="dock p-2 grid grid-cols-5 gap-2 items-center">
          <NavLink to="/" end className={({isActive})=>`${base} ${isActive? active : 'text-white/90'}`}>
            <IconHome className={iconClass} />
          </NavLink>
          <NavLink to="/progress" className={({isActive})=>`${base} ${isActive? active : 'text-white/90'}`}>
            <IconChart className={iconClass} />
          </NavLink>
          {/* Center START pill */}
          <button
            onClick={handleWorkoutClick}
            className={`h-12 flex items-center justify-center rounded-full col-span-1 font-semibold px-5 shadow-md relative ${
              isWorkoutActive 
                ? 'bg-emerald-500 text-white' 
                : 'bg-white text-slate-900'
            }`}
          >
            {isWorkoutActive ? 'RESUME' : 'START'}
            {isWorkoutActive && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full border-2 border-black/20"></span>
            )}
          </button>
          <NavLink to="/history" className={({isActive})=>`${base} ${isActive? active : 'text-white/90'}`}>
            <IconHistory className={iconClass} />
          </NavLink>
          <NavLink to="/settings" className={({isActive})=>`${base} ${isActive? active : 'text-white/90'}`}>
            <IconSettings className={iconClass} />
          </NavLink>
        </div>
      </div>
    </div>
  );
}


