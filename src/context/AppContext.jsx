import { createContext, useContext, useState } from "react";

const AppContext = createContext();
export const useAppContext = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
    const [menuOpen, setMenuOpen] = useState(false);

  return (
    <AppContext.Provider value={{ menuOpen, setMenuOpen }}>
      {children}
    </AppContext.Provider>
  );
};
