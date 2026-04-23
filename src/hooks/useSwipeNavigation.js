import { useRef } from "react";
import { useNavigate } from "react-router-dom";

export function useSwipeNavigation(pages) {
  const navigate = useNavigate();
  const touchStartX = useRef(null);
  const currentPageIndex = pages.indexOf(window.location.pathname);

  function handleTouchStart(e) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e) {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    
    let nextIndex = currentPageIndex;
    if (diff < -60) {
      // Swipe right - go to previous page (circularly)
      nextIndex = (currentPageIndex - 1 + pages.length) % pages.length;
    } else if (diff > 60) {
      // Swipe left - go to next page (circularly)
      nextIndex = (currentPageIndex + 1) % pages.length;
    }
    
    if (nextIndex !== currentPageIndex) {
      navigate(pages[nextIndex]);
    }
    touchStartX.current = null;
  }

  return { handleTouchStart, handleTouchEnd };
}