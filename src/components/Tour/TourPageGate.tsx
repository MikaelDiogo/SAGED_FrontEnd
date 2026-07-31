import { useEffect, useRef } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import './tour.css';
import { useTour } from './TourContext';

interface TourPageGateProps {
  phaseId: string;
}

export function TourPageGate({ phaseId }: TourPageGateProps) {
  const { isTourActive, currentPhaseIndex, phases, advanceToNextPhase } = useTour();
  const driverRef = useRef<ReturnType<typeof driver> | null>(null);

  const phaseIndex = phases.findIndex(p => p.id === phaseId);
  const isMyPhase = isTourActive && phaseIndex !== -1 && currentPhaseIndex === phaseIndex;

  useEffect(() => {
    if (!isMyPhase) return;

    const phase = phases[phaseIndex];

    const timer = setTimeout(() => {
      const validSteps = phase.steps.filter(
        step => document.querySelector(step.element) !== null,
      );

      if (validSteps.length === 0) {
        advanceToNextPhase(phaseIndex);
        return;
      }

      const d = driver({
        showProgress: true,
        progressText: '{{current}} de {{total}}',
        nextBtnText: 'Próximo →',
        prevBtnText: '← Voltar',
        doneBtnText: '✓ Próxima etapa',
        popoverClass: 'saged-tour-popover',
        steps: validSteps.map(s => ({
          element: s.element,
          popover: {
            title: s.popover.title,
            description: s.popover.description,
            side: (s.popover.side === 'over' ? 'bottom' : (s.popover.side ?? 'bottom')) as 'top' | 'bottom' | 'left' | 'right',
            align: s.popover.align ?? 'start',
          },
        })),
        onDestroyed: () => {
          advanceToNextPhase(phaseIndex);
        },
      });

      driverRef.current = d;
      d.drive();
    }, 450);

    return () => {
      clearTimeout(timer);
      if (driverRef.current) {
        driverRef.current.destroy();
        driverRef.current = null;
      }
    };
  }, [isMyPhase]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
