import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const steps = [
  { key: 'name', title: "What's your name?", type: 'text' },
  { key: 'goal', title: "What's your fitness goal?", type: 'select', options: ['Strength', 'Hypertrophy', 'Endurance', 'General Fitness'] },
  { key: 'days', title: 'How many days per week do you train?', type: 'select', options: ['3', '4', '5', '6', '7'] },
  { key: 'level', title: 'Experience level?', type: 'select', options: ['Beginner', 'Intermediate', 'Advanced'] },
  { key: 'unit', title: 'Preferred weight units?', type: 'select', options: ['kg', 'lbs'] },
  { key: 'restDuration', title: 'Default rest timer?', type: 'select', options: ['60s', '90s', '120s', '180s'] },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [idx, setIdx] = useState(0);
  const [profile, setProfile] = useState({ name: '', goal: '', days: '', level: '', unit: '', restDuration: '' });
  const step = steps[idx];
  const progress = `${idx + 1}/${steps.length}`;

  function next() {
    if (idx < steps.length - 1) setIdx(idx + 1);
    else finish();
  }

  function finish(skip=false) {
    try {
      if (!skip) {
        // Save user profile
        localStorage.setItem('userProfile', JSON.stringify(profile));
        // Save preferences (restDuration, units) if provided
        const prefs = {};
        if (profile.restDuration) {
          prefs.restDuration = parseInt(profile.restDuration.replace('s', '')) || 90;
        }
        if (profile.unit) {
          prefs.units = profile.unit;
        }
        if (Object.keys(prefs).length > 0) {
          localStorage.setItem('pulsePrefs', JSON.stringify(prefs));
        }
      }
      localStorage.setItem('hasCompletedOnboarding', 'true');
    } catch(_){}
    navigate('/');
  }

  function renderInput() {
    if (step.type === 'text') {
      return (
        <input
          value={profile.name}
          onChange={e=>setProfile({...profile, name: e.target.value})}
          placeholder="Your name"
          className="w-full mt-4 px-4 py-3 rounded-2xl bg-white/10 border border-white/15 text-white placeholder-white/60 outline-none"
        />
      );
    }
    if (step.type === 'select') {
      return (
        <div className="mt-4 grid grid-cols-2 gap-2">
          {step.options.map(opt => (
            <button
              key={opt}
              onClick={()=>{
                setProfile(p=>({ ...p, [step.key]: opt }));
                setTimeout(next, 100);
              }}
              className={`h-12 rounded-2xl border ${profile[step.key]===opt? 'bg-white text-slate-900 border-transparent':'bg-white/10 text-white border-white/15'}`}
            >{opt}</button>
          ))}
        </div>
      );
    }
    return null;
  }

  return (
    <div className="relative min-h-screen w-full flex justify-center items-start pt-safe pb-28">
      {/* Simple gradient background */}
      <div className="absolute inset-0 -z-10" style={{background:'linear-gradient(135deg, rgba(6,182,212,0.65) 0%, rgba(124,58,237,0.65) 100%)'}} />
      <div className="w-full max-w-[375px] px-4 pt-12">
        <div className="text-white/80 text-sm mb-2">{progress}</div>
        <div className="pulse-glass rounded-3xl p-6 border border-white/15 backdrop-blur-2xl shadow-2xl">
          <div className="text-white text-2xl font-bold">{step.title}</div>
          {renderInput()}
          {step.type === 'text' && (
            <button onClick={next} className="mt-5 w-full h-12 rounded-2xl bg-white text-slate-900 font-semibold">Next</button>
          )}
        </div>
        <button onClick={()=>finish(true)} className="mt-4 text-white/80 text-sm underline">Skip for now</button>
      </div>
    </div>
  );
}
