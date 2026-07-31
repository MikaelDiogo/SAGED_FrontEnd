import { createContext, useState, type ReactNode } from 'react';

interface SelectedUnit {
  id: string;
  name: string;
}

interface UnitContextType {
  selectedUnit: SelectedUnit | null;
  setSelectedUnit: (unit: SelectedUnit | null) => void;
}

export const UnitContext = createContext<UnitContextType>({
  selectedUnit: null,
  setSelectedUnit: () => {},
});

export function UnitProvider({ children }: { children: ReactNode }) {
  const [selectedUnit, setSelectedUnit] = useState<SelectedUnit | null>(null);
  return (
    <UnitContext.Provider value={{ selectedUnit, setSelectedUnit }}>
      {children}
    </UnitContext.Provider>
  );
}
