import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import ResultCard from './resultcard';
import { Button } from '@/components/ui/button';

interface MobileResultCarouselProps {
  models: string[];
  results: string[];
  fusionResult: string;
  isFusionLoading: boolean;
  activeButton: string | null;
  onRegenerate: (modelIndex: number | null) => void;
  isLatestConversation: boolean;
  isStreaming: boolean;
}

const MobileResultCarousel: React.FC<MobileResultCarouselProps> = ({
  models,
  results,
  fusionResult,
  isFusionLoading,
  activeButton,
  onRegenerate,
  isLatestConversation,
  isStreaming,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const totalSlides = models.length + 1;
  const [direction, setDirection] = useState(0);

  // Ref to the main container to auto-scroll to top on slide change
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll to top whenever the currentIndex changes
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentIndex]);

  const handleNext = () => {
    if (currentIndex < totalSlides - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 20 : 0,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 20 : 0,
      opacity: 0,
    }),
  };

  const swipeConfidenceThreshold = 1000;
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };

  const paginate = (newDirection: number) => {
    const newIndex = currentIndex + newDirection;
    if (newIndex >= 0 && newIndex < totalSlides) {
      setDirection(newDirection);
      setCurrentIndex(newIndex);
    }
  };

  const handleDragEnd = (
    _: MouseEvent | TouchEvent | PointerEvent,
    { offset, velocity }: PanInfo
  ) => {
    const swipe = swipePower(offset.x, velocity.x);

    if (swipe < -swipeConfidenceThreshold) {
      paginate(1);
    } else if (swipe > swipeConfidenceThreshold) {
      paginate(-1);
    }
  };

  return (
    <div
      className="relative w-full h-full flex flex-col overflow-hidden mobile-carousel-container"
      ref={containerRef}
    >
      <div className="absolute inset-0 bottom-8">
        <AnimatePresence initial={false} custom={direction} mode="sync">
          <motion.div
            key={currentIndex}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            custom={direction}
            transition={{
              x: { type: 'tween', duration: 0.2 },
              opacity: { duration: 0.15 },
            }}
            className="absolute inset-0"
            onDragEnd={handleDragEnd}
          >
            <div className="h-full px-0">
              {currentIndex === 0 ? (
                <ResultCard
                  index={models.length}
                  models={models}
                  results={results}
                  isFusionCard={true}
                  fusionResult={fusionResult}
                  isFusionLoading={isFusionLoading}
                  onRegenerate={onRegenerate}
                  isLatestConversation={isLatestConversation}
                  isStreaming={isStreaming}
                  isMobile={true}
                />
              ) : (
                <ResultCard
                  index={currentIndex - 1}
                  models={models}
                  results={results}
                  isStreaming={isStreaming}
                  onRegenerate={onRegenerate}
                  isLatestConversation={isLatestConversation}
                  isRegenerating={false}
                  isMobile={true}
                />
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Left Arrow */}
        <div className="absolute top-1/2 -translate-y-1/2 left-2 z-10 flex items-center">
          {currentIndex > 0 && (
            <Button
              variant="ghost"
              onClick={handlePrev}
              className="h-10 w-10 rounded-md bg-gray-100 hover:bg-gray-200"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-gray-600"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
            </Button>
          )}
        </div>

        {/* Right Arrow */}
        <div className="absolute top-1/2 -translate-y-1/2 right-2 z-10 flex items-center">
          {currentIndex < totalSlides - 1 && (
            <Button
              variant="ghost"
              onClick={handleNext}
              className="h-10 w-10 rounded-md bg-gray-100 hover:bg-gray-200"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-gray-500"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileResultCarousel; 