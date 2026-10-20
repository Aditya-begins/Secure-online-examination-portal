import React from 'react';
import { motion, useReducedMotion, Variants } from 'framer-motion';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
}

// Apple / Linear inspired easing curve - snappy initial acceleration, silky smooth deceleration
export const transitionEase = [0.16, 1, 0.3, 1] as const;

export const pageMotionVariants: Variants = {
  initial: {
    opacity: 0,
    y: 10,
    filter: 'blur(3px)',
  },
  animate: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.24,
      ease: transitionEase,
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    filter: 'blur(2px)',
    transition: {
      duration: 0.16,
      ease: transitionEase,
    },
  },
};

export const pageMotionVariantsReduced: Variants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.18,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.14,
    },
  },
};

/**
 * PageTransition Component
 * Provides fluid, cinematic route transition animation for all page views.
 */
export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  className = '',
  id,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const variants = shouldReduceMotion ? pageMotionVariantsReduced : pageMotionVariants;

  return (
    <motion.div
      id={id}
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={`w-full ${className}`}
    >
      {children}
    </motion.div>
  );
};
