import { useEffect, useRef } from "react";

export default function usePullToRefresh(onRefresh, containerRef) {
  const startYRef = useRef(null);
  const refreshingRef = useRef(false);

  useEffect(() => {
    const el = containerRef?.current || window;

    function getScrollTop() {
      return containerRef?.current ? containerRef.current.scrollTop : window.scrollY;
    }

    function onTouchStart(e) {
      if (getScrollTop() === 0) {
        startYRef.current = e.touches[0].clientY;
      }
    }

    function onTouchEnd(e) {
      if (startYRef.current === null || refreshingRef.current) return;
      const delta = e.changedTouches[0].clientY - startYRef.current;
      if (delta > 80) {
        refreshingRef.current = true;
        Promise.resolve(onRefresh()).finally(() => {
          refreshingRef.current = false;
        });
      }
      startYRef.current = null;
    }

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [onRefresh, containerRef]);
}