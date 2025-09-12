import React, { createContext, useContext, useState, useEffect } from 'react';

interface DevContextType {
  isDevelopmentMode: boolean;
  toggleDevelopmentMode: () => void;
  allowDirectAdminAccess: boolean;
  setAllowDirectAdminAccess: (allow: boolean) => void;
}

const DevContext = createContext<DevContextType | undefined>(undefined);

export const useDev = () => {
  const context = useContext(DevContext);
  if (context === undefined) {
    throw new Error('useDev must be used within a DevProvider');
  }
  return context;
};

interface DevProviderProps {
  children: React.ReactNode;
}

export const DevProvider: React.FC<DevProviderProps> = ({ children }) => {
  const [isDevelopmentMode, setIsDevelopmentMode] = useState(false);
  const [allowDirectAdminAccess, setAllowDirectAdminAccess] = useState(true); // Default to true for development

  // Check if we're in development mode
  useEffect(() => {
    const isDevMode = import.meta.env.DEV || import.meta.env.MODE === 'development';
    setIsDevelopmentMode(isDevMode);
    
    // Load settings from localStorage
    const savedDirectAccess = localStorage.getItem('gdg-dev-direct-admin-access');
    if (savedDirectAccess !== null) {
      setAllowDirectAdminAccess(JSON.parse(savedDirectAccess));
    }
  }, []);

  const toggleDevelopmentMode = () => {
    setIsDevelopmentMode(!isDevelopmentMode);
  };

  const handleSetAllowDirectAdminAccess = (allow: boolean) => {
    setAllowDirectAdminAccess(allow);
    localStorage.setItem('gdg-dev-direct-admin-access', JSON.stringify(allow));
  };

  const value = {
    isDevelopmentMode,
    toggleDevelopmentMode,
    allowDirectAdminAccess,
    setAllowDirectAdminAccess: handleSetAllowDirectAdminAccess
  };

  return (
    <DevContext.Provider value={value}>
      {children}
    </DevContext.Provider>
  );
};