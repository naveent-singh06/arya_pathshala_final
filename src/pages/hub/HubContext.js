import { createContext, useContext } from 'react';

export const HubContext = createContext(null);
export const useHub = () => useContext(HubContext);
