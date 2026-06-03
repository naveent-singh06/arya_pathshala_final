import { createContext, useContext, useState } from "react";

// Create Context
const UserContext = createContext();

// Provider Component
export const UserProvider = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(false); // Global variable

  return (
    <UserContext.Provider value={{ isAdmin, setIsAdmin }}>
      {children}
    </UserContext.Provider>
  );
};
 
// Custom Hook to use User Context
export const useUser = () => useContext(UserContext);
