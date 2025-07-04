import { useRef, useEffect } from 'react';

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onTap?: () => void;
}

export const useSwipeGestures = (handlers: SwipeHandlers) => {
  const ref = useRef<HTMLLIElement>(null);
  const startX = useRef<number>(0);
  const startY = useRef<number>(0);
  const startTime = useRef<number>(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    let isScrolling = false;
    
    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      startX.current = touch.clientX;
      startY.current = touch.clientY;
      startTime.current = Date.now();
      isScrolling = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isScrolling) {
        const touch = e.touches[0];
        const deltaY = Math.abs(touch.clientY - startY.current);
        const deltaX = Math.abs(touch.clientX - startX.current);
        
        // If vertical movement is greater, it's probably scrolling
        if (deltaY > deltaX && deltaY > 10) {
          isScrolling = true;
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (isScrolling) return;
      
      const touch = e.changedTouches[0];
      const endX = touch.clientX;
      const endY = touch.clientY;
      const endTime = Date.now();
      
      const deltaX = endX - startX.current;
      const deltaY = endY - startY.current;
      const deltaTime = endTime - startTime.current;
      
      const minSwipeDistance = 50;
      const maxSwipeTime = 300;
      const maxTapDistance = 10;
      const maxTapTime = 200;
      
      // Check for tap
      if (Math.abs(deltaX) < maxTapDistance && 
          Math.abs(deltaY) < maxTapDistance && 
          deltaTime < maxTapTime) {
        handlers.onTap?.();
        return;
      }
      
      // Check for swipe
      if (deltaTime < maxSwipeTime && Math.abs(deltaX) > minSwipeDistance) {
        if (Math.abs(deltaY) < Math.abs(deltaX) * 0.5) { // Ensure horizontal swipe
          if (deltaX > 0) {
            handlers.onSwipeRight?.();
          } else {
            handlers.onSwipeLeft?.();
          }
          e.preventDefault();
        }
      }
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handlers]);

  return ref;
};
