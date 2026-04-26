import { useRef } from "react";
import { useNavigate } from "react-router-dom";

export function useSwipeNavigation(pages) {
  const navigate = useNavigate();
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const currentPageIndex = pages.indexOf(window.location.pathname);

  function handleTouchStart(e) {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }

  function handleTouchEnd(e) {
    if (touchStartX.current === null) return;
    const diffX = touchStartX.current - e.changedTouches[0].clientX;
    const diffY = touchStartY.current - e.changedTouches[0].clientY;

    // Ignore if vertical movement is larger than horizontal (user is scrolling)
    if (Math.abs(diffY) > Math.abs(diffX)) {
      touchStartX.current = null;
      touchStartY.current = null;
      return;
    }

    let nextIndex = currentPageIndex;
    if (diffX < -80) {
      nextIndex = (currentPageIndex - 1 + pages.length) % pages.length;
    } else if (diffX > 80) {
      nextIndex = (currentPageIndex + 1) % pages.length;
    }
    
    if (nextIndex !== currentPageIndex) {
      navigate(pages[nextIndex]);
    }
    touchStartX.current = null;
    touchStartY.current = null;
  }

  return { handleTouchStart, handleTouchEnd };
}