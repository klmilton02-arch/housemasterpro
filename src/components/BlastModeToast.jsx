import { motion, AnimatePresence } from "framer-motion";
import { Zap } from "lucide-react";

export default function BlastModeToast({ show, onDismiss }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.85 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{ type: "spring", damping: 18, stiffness: 200 }}
          onClick={onDismiss}
          className="fixed bottom-40 left-1/2 -translate-x-1/2 z-50 cursor-pointer select-none"
        >
          <div className="bg-yellow-400 border border-yellow-500 rounded-2xl shadow-2xl px-6 py-4 text-center min-w-[220px]">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Zap className="w-6 h-6 text-black" />
              <div className="text-2xl font-heading font-bold text-black">Double XP</div>
            </div>
            <div className="text-xs font-semibold text-black/70 uppercase tracking-wide">Blast Mode Active</div>
            <p className="text-[10px] text-black/60 mt-2">Tap to dismiss</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}