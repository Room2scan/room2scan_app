import React, { createContext, useContext, useState, useCallback } from 'react';
import { SnackbarItem } from '../types';

type SnackbarContextType = {
  snacks: SnackbarItem[];
  addSnack: (message: string, icon?: string) => void;
};

const SnackbarContext = createContext<SnackbarContextType>({
  snacks: [],
  addSnack: () => {},
});

export const useSnack = () => useContext(SnackbarContext);

export const SnackbarProvider = ({ children }: { children: React.ReactNode }) => {
  const [snacks, setSnacks] = useState<SnackbarItem[]>([]);

  const addSnack = useCallback((message: string, icon?: string) => {
    const id = `snack_${Date.now()}_${Math.random()}`;
    setSnacks(prev => [...prev.slice(-2), { id, message, icon }]);
    setTimeout(() => setSnacks(prev => prev.filter(s => s.id !== id)), 2800);
  }, []);

  return (
    <SnackbarContext.Provider value={{ snacks, addSnack }}>
      {children}
    </SnackbarContext.Provider>
  );
};
