import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef } from "react";

export default function RevokePointsToast({ points, onDismiss }) {
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;

  useEffect(() => {
    if (!points) return;
    const t = setTimeout(() => dismissRef.current(), 2500);
    return () => clearTimeout(t);
  }, [points]);

  return (
    <AnimatePresence>
      {points && (
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 60, scale: 0.8 }}
          transition={{ type: "spring", stiffness: 300, damping: 22 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[300] flex flex-col items-center gap-1"
          onClick={onDismiss}
        >
          <div className="bg-white dark:bg-slate-800 border border-red-200 dark:border-red-700 rounded-2xl shadow-xl px-6 py-4 flex flex-col items-center gap-2 min-w-[160px]">
            {/* Bucket with frownie face */}
            <div className="text-5xl select-none" role="img" aria-label="sad bucket">🪣</div>
            <div className="text-2xl select-none">😞</div>
            <p className="font-heading font-bold text-red-500 text-lg">-{points} XP</p>
            <p className="text-xs text-muted-foreground">Task uncompleted</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}