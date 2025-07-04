import { useRef, useEffect } from 'react';

interface MonthSwipeHandlers {
  onSwipeLeft: () => void;   // Next month
  onSwipeRight: () => void;  // Previous month
}

export const useMonthSwipe = (handlers: MonthSwipeHandlers) => {
  const ref = useRef<HTMLDivElement>(null);
  const startX = useRef<number>(0);
  const startY = useRef<number>(0);
  const startTime = useRef<number>(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    let isScrolling = false;
    
    const handleTouchStart = (e: TouchEvent) => {
      startX.current = e.touches[0].clientX;
      startY.current = e.touches[0].clientY;
      startTime.current = Date.now();
      isScrolling = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!startX.current || !startY.current) return;

      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      
      const diffX = Math.abs(currentX - startX.current);
      const diffY = Math.abs(currentY - startY.current);

      // If vertical scroll is dominant, don't handle as swipe
      if (diffY > diffX) {
        isScrolling = true;
        return;
      }

      // Prevent default scrolling only for horizontal swipes at page level
      if (diffX > 10) {
        e.preventDefault();
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (isScrolling) return;

      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const duration = Date.now() - startTime.current;
      
      const diffX = startX.current - endX;
      const diffY = Math.abs(startY.current - endY);
      
      // Minimum swipe distance and maximum duration for a valid swipe
      const minSwipeDistance = 50;
      const maxSwipeDuration = 300;
      
      // Must be primarily horizontal and fast enough
      if (Math.abs(diffX) > minSwipeDistance && 
          diffY < Math.abs(diffX) / 2 && 
          duration < maxSwipeDuration) {
        
        if (diffX > 0) {
          // Swiped left (next month)
          handlers.onSwipeLeft();
        } else {
          // Swiped right (previous month) 
          handlers.onSwipeRight();
        }
      }
      
      // Reset
      startX.current = 0;
      startY.current = 0;
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handlers]);

  return ref;
};
