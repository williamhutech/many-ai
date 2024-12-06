import React, { useState } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import ResultCard from './resultcard';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { getProviderForModel } from '@/config/models';
import Image from 'next/image';

interface MobileResultCarouselProps {
  models: string[];
  results: string[];
  fusionResult: string;
  isFusionLoading: boolean;
  activeButton: string | null;
}

const MobileResultCarousel: React.FC<MobileResultCarouselProps> = ({
  models,
  results,
  fusionResult,
  isFusionLoading,
  activeButton,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const totalSlides = models.length + 1;

  const replacePersonWithNickname = (text: string) => {
    let modifiedText = text;
    models.forEach((modelId, index) => {
      const provider = getProviderForModel(modelId);
      if (provider) {
        const regexName = new RegExp(`${index === 0 ? 'Anny' : index === 1 ? 'Ben' : 'Clarice'}`, 'g');
        modifiedText = modifiedText.replace(regexName, provider.nickname);
      }
    });
    return modifiedText;
  };

  const ContentSkeletonLoader = () => (
    <div className="animate-pulse space-y-2 p-4">
      <div className="space-y-2">
        <div className="h-4 bg-zinc-100 rounded w-[100%]"></div>
        <div className="h-4 bg-zinc-100 rounded w-[100%]"></div>
        <div className="h-4 bg-zinc-100 rounded w-[95%]"></div>
      </div>
    </div>
  );

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0.5
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0.5
    })
  };

  const swipeConfidenceThreshold = 1000;
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
    <div className="relative w-full h-full flex flex-col z-0">
      <div className="absolute inset-0 bottom-8 z-0">
        <AnimatePresence initial={false} custom={direction} mode="sync">
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "tween", duration: 0.15 },
              opacity: { duration: 0.1 }
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.3}
            onDragEnd={handleDragEnd}
            className="absolute inset-0 px-2"
          >
            <div className="h-full">
              {currentIndex === 0 ? (
                <ResultCard
                  index={models.length}
                  models={models}
                  results={results}
                  isFusionCard={true}
                  fusionResult={fusionResult}
                  isFusionLoading={isFusionLoading}
                />
              ) : (
                <ResultCard
                  index={currentIndex - 1}
                  models={models}
                  results={results}
                  isStreaming={true}
                />
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-6 flex items-center justify-center">
        <div className="bg-zinc-200 h-1 rounded-full w-48 overflow-hidden">
          <motion.div
            className="bg-zinc-800 h-full rounded-full"
            initial={false}
            animate={{
              width: `${100 / totalSlides}%`,
              x: `${(100 * currentIndex)}%`
            }}
            transition={{
              type: "tween",
              duration: 0.15
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default MobileResultCarousel; 