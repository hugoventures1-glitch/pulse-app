import React, { useCallback, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import HomeDashboard from './screens/HomeDashboard';
import FocusMode from './screens/FocusMode';
import VoiceInterface from './screens/VoiceInterface';
import ActiveWorkout from './screens/ActiveWorkout';
import WorkoutPreview from './screens/WorkoutPreview';
import BottomNav from './components/BottomNav';
import WorkoutSelection from './screens/WorkoutSelection';
import WorkoutSummary from './screens/WorkoutSummary';
import WorkoutDetails from './screens/WorkoutDetails';
import CreateCustomWorkout from './screens/CreateCustomWorkout';
import ChooseProgram from './screens/ChooseProgram';
import Progress from './screens/Progress';
import History from './screens/History';
import Onboarding from './screens/Onboarding';
import Settings from './screens/Settings';
import { WorkoutProvider } from './state/WorkoutContext';

function InnerApp() {
  const [toastMsg, setToastMsg] = useState(null);
  const showToast = useCallback(msg => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2000);
  }, []);
  useEffect(() => {
    window.__toast = showToast;
    return () => { window.__toast = undefined; };
  }, [showToast]);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const done = localStorage.getItem('hasCompletedOnboarding') === 'true';
      if (!done && location.pathname !== '/onboarding') {
        navigate('/onboarding', { replace: true });
      }
    } catch(_){}
  }, [location.pathname, navigate]);

  return (
    <div className="min-h-full w-full flex justify-center pt-safe pb-safe">
      <Routes>
        <Route path="/" element={<HomeDashboard />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/workout-preview" element={<WorkoutPreview />} />
        <Route path="/workout" element={<WorkoutSelection />} />
        <Route path="/focus" element={<FocusMode />} />
        <Route path="/voice" element={<VoiceInterface />} />
        <Route path="/active" element={<ActiveWorkout />} />
        <Route path="/summary" element={<WorkoutSummary />} />
        <Route path="/workout-details" element={<WorkoutDetails />} />
        <Route path="/create-custom" element={<CreateCustomWorkout />} />
        <Route path="/choose-program" element={<ChooseProgram />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/history" element={<History />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
      {/* Hide bottom nav in Focus Mode for distraction-free workout */}
      {location.pathname !== '/focus' && <BottomNav />}
      {toastMsg && (
        <div className="pulse-toast pointer-events-none">
          <div className="pulse-toast-inner">{toastMsg}</div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <WorkoutProvider>
      <BrowserRouter>
        <InnerApp />
      </BrowserRouter>
    </WorkoutProvider>
  );
}



