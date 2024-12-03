import React, { useState } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import ResultCard from './resultcard';
import FusionResult from './fusionresult';

interface MobileResultCarouselProps {
  models: string[];
  results: string[];
  handleModelChange: (index: number, value: string) => void;
  fusionResult: string;
  isFusionLoading: boolean;
  activeButton: string | null;
}

const MobileResultCarousel: React.FC<MobileResultCarouselProps> = ({
  models,
  results,
  handleModelChange,
  fusionResult,
  isFusionLoading,
  activeButton,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const totalSlides = (activeButton || fusionResult) ? models.length + 1 : models.length;

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0
    })
  };

  // Reduced threshold for more responsive swipes
  const swipeConfidenceThreshold = 5000;
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };

  const paginate = (newDirection: number) => {
    if (currentIndex + newDirection >= 0 && currentIndex + newDirection < totalSlides) {
      setDirection(newDirection);
      setCurrentIndex(currentIndex + newDirection);
    }
  };

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, { offset, velocity }: PanInfo) => {
    const swipe = swipePower(offset.x, velocity.x);

    if (swipe < -swipeConfidenceThreshold) {
      paginate(1);
    } else if (swipe > swipeConfidenceThreshold) {
      paginate(-1);
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col">
      <div className="flex-1 overflow-hidden">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 400, damping: 30 },
              opacity: { duration: 0.15 }
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.7}
            onDragEnd={handleDragEnd}
            className="absolute inset-0"
          >
            {currentIndex === 0 && (activeButton || fusionResult) ? (
              <div className="h-full px-2">
                <FusionResult
                  result={fusionResult}
                  isLoading={isFusionLoading}
                  models={models}
                />
              </div>
            ) : (
              <div className="h-full px-2">
                <ResultCard
                  index={currentIndex - ((activeButton || fusionResult) ? 1 : 0)}
                  models={models}
                  results={results}
                  handleModelChange={handleModelChange}
                />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
        {Array.from({ length: totalSlides }).map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full transition-colors duration-200 ${
              index === currentIndex ? 'bg-zinc-800' : 'bg-zinc-300'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default MobileResultCarousel; 