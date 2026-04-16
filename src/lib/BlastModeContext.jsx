import { createContext, useContext, useState, useEffect, useRef } from "react";

const BlastModeContext = createContext(null);

export function BlastModeProvider({ children }) {
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [duration, setDuration] = useState(30);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            setIsActive(false);
            localStorage.removeItem("blast_mode_active");
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isActive]);

  function startBlast(mins) {
    const d = mins || duration;
    setDuration(d);
    setTimeLeft(d * 60);
    setIsActive(true);
    localStorage.setItem("blast_mode_active", "true");
  }

  function stopBlast() {
    setIsActive(false);
    setTimeLeft(0);
    localStorage.removeItem("blast_mode_active");
  }

  function pauseBlast() {
    setIsActive(false);
    localStorage.removeItem("blast_mode_active");
  }

  function resumeBlast() {
    if (timeLeft > 0) setIsActive(true);
  }

  return (
    <BlastModeContext.Provider value={{ isActive, timeLeft, duration, setDuration, startBlast, stopBlast, pauseBlast, resumeBlast }}>
      {children}
    </BlastModeContext.Provider>
  );
}

export function useBlastMode() {
  return useContext(BlastModeContext);
}