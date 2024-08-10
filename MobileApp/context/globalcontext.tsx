import React, { createContext, Dispatch, useContext, useState } from 'react';

// Define the shape of your global state
interface GlobalState {
  selectedDate: Date;
  setSelectedDate: React.Dispatch<React.SetStateAction<Date>>;
  taskDetails: any[]; // Replace 'any' with the specific type of taskDetails if known
  setTaskDetails:React.Dispatch<React.SetStateAction<never[]>>;
  clustervalue: any; // Replace 'any' with the specific type of taskDetails if known
  setClusterValue:React.Dispatch<React.SetStateAction<never>>;
  countfinish: number;
  setCountfinish:React.Dispatch<React.SetStateAction<number>>;
}

// Create the context with initial state and actions
const GlobalContext = createContext<GlobalState | undefined>(undefined);

// Custom hook to use the global state
export const useGlobalState = () => {
  const context = useContext(GlobalContext);
  if (!context) {
    throw new Error('useGlobal State must be used within a GlobalProvider');
  }
  return context;
};

const GlobalProvider = ({children}) => {
    //datetime component
  const [selectedDate, setSelectedDate] = useState(new Date());
    //listtask component
  const [taskDetails, setTaskDetails] = useState([]);
    //cluster dropdown component
  const [clustervalue, setClusterValue] = useState({});
  const [countfinish, setCountfinish] = useState(0);
   const state: GlobalState = {
    selectedDate,
    setSelectedDate,
    taskDetails,
    setTaskDetails,
    clustervalue,
    setClusterValue,
    countfinish,
    setCountfinish
    
  };

  return (
    <GlobalContext.Provider value={state}>
      {children}
    </GlobalContext.Provider>
  );
};

export default GlobalProvider;
