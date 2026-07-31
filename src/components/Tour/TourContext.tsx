import { createContext, useContext } from 'react';
import type { TourPhaseConfig } from './tourPhases';

export interface TourContextValue {
  isWelcomeOpen: boolean;
  isTourActive: boolean;
  currentPhaseIndex: number;
  phases: TourPhaseConfig[];
  startTour: () => void;
  skipTour: () => void;
  restartTour: () => void;
  advanceToNextPhase: (completedIndex: number) => void;
}

export const TourContext = createContext<TourContextValue>({
  isWelcomeOpen: false,
  isTourActive: false,
  currentPhaseIndex: 0,
  phases: [],
  startTour: () => {},
  skipTour: () => {},
  restartTour: () => {},
  advanceToNextPhase: () => {},
});

export function useTour(): TourContextValue {
  return useContext(TourContext);
}
