import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { TourContext } from './TourContext';
import { WelcomeModal } from './WelcomeModal';
import { ALL_TOUR_PHASES, type TourRole } from './tourPhases';

const STORAGE_KEY = '@SAGE:tour-dismissed';

export function TourProvider({ children }: { children: React.ReactNode }) {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [isWelcomeOpen, setWelcomeOpen] = useState(false);
  const [isTourActive, setTourActive] = useState(false);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);

  const phases = useMemo(() => {
    if (!user?.role) return [];
    const role = user.role.trim().toUpperCase() as TourRole;
    return ALL_TOUR_PHASES.filter(p => p.roles.includes(role));
  }, [user?.role]);

  useEffect(() => {
    if (!user) return;
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (!dismissed) {
      const timer = setTimeout(() => setWelcomeOpen(true), 1200);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const startTour = useCallback(() => {
    setWelcomeOpen(false);
    setCurrentPhaseIndex(0);
    setTourActive(true);
    if (phases.length > 0) {
      navigate(phases[0].route);
    }
  }, [phases, navigate]);

  const skipTour = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setWelcomeOpen(false);
    setTourActive(false);
  }, []);

  const restartTour = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setTourActive(false);
    setWelcomeOpen(true);
  }, []);

  const advanceToNextPhase = useCallback(
    (completedIndex: number) => {
      const nextIndex = completedIndex + 1;
      if (nextIndex >= phases.length) {
        setTourActive(false);
        localStorage.setItem(STORAGE_KEY, 'true');
      } else {
        setCurrentPhaseIndex(nextIndex);
        navigate(phases[nextIndex].route);
      }
    },
    [phases, navigate],
  );

  return (
    <TourContext.Provider
      value={{
        isWelcomeOpen,
        isTourActive,
        currentPhaseIndex,
        phases,
        startTour,
        skipTour,
        restartTour,
        advanceToNextPhase,
      }}
    >
      <WelcomeModal opened={isWelcomeOpen} onStart={startTour} onSkip={skipTour} />
      {children}
    </TourContext.Provider>
  );
}
