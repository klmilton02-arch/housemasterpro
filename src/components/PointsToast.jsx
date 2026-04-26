import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef } from "react";
import { TrendingUp, Award } from "lucide-react";

export default function PointsToast({ reward, onDismiss }) {
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;

  useEffect(() => {
    if (!reward) return;
    const timer = setTimeout(() => dismissRef.current(), 2000);
    return () => clearTimeout(timer);
  }, [reward]);

  return (
    <AnimatePresence>
      {reward && (
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.85 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{ type: "spring", damping: 18, stiffness: 200 }}
          onClick={onDismiss}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[300] cursor-pointer select-none"
        >
          <div className="bg-card border border-border rounded-2xl shadow-2xl px-6 py-4 text-center min-w-[200px]">
            <div className="text-4xl font-heading font-bold text-primary">+{reward.totalPoints}</div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mt-0.5">XP Earned</div>
            {reward.blastBonus && (
              <div className="mt-1.5 text-xs font-medium text-yellow-500">
                ⚡ Blast Mode 2×
              </div>
            )}
            {reward.leveledUp && (
              <div className="mt-2 flex items-center justify-center gap-1.5 text-sm font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/30 rounded-lg px-3 py-1.5">
                <TrendingUp className="w-4 h-4" /> Level Up! {reward.newLevel}
              </div>
            )}
            {reward.newBadges?.length > 0 && (
              <div className="mt-2 space-y-1">
                {reward.newBadges.map(b => (
                  <div key={b} className="flex items-center justify-center gap-1 text-xs font-medium text-purple-600 bg-purple-50 dark:bg-purple-950/30 rounded-lg px-3 py-1">
                    <Award className="w-3 h-3" /> {b} unlocked!
                  </div>
                ))}
              </div>
            )}
            <p className="text-[10px] text-muted-foreground mt-2">Tap to dismiss</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}