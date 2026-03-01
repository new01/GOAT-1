"use client";

import { useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface WizardStepProps {
  stepIndex: number;
  children: React.ReactNode;
}

const stepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 100 : -100,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 100 : -100,
    opacity: 0,
  }),
};

export function WizardStep({ stepIndex, children }: WizardStepProps) {
  const prevStepRef = useRef(stepIndex);
  const direction = stepIndex >= prevStepRef.current ? 1 : -1;

  // Update ref after calculating direction
  if (prevStepRef.current !== stepIndex) {
    prevStepRef.current = stepIndex;
  }

  return (
    <AnimatePresence mode="wait" custom={direction}>
      <motion.div
        key={stepIndex}
        custom={direction}
        variants={stepVariants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
