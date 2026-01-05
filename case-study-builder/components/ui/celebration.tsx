'use client';

/**
 * Celebration Component (BRD 3.1 - Challenge Qualifier Visual Feedback)
 *
 * Provides visual celebration effects (confetti) when a case study
 * qualifies for the BHAG 10,000 Challenge target.
 */

import { useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';

type CelebrationProps = {
  trigger: boolean;
  type?: 'confetti' | 'fireworks' | 'stars';
  duration?: number;
};

export default function Celebration({
  trigger,
  type = 'confetti',
  duration = 3000,
}: CelebrationProps) {
  const fireConfetti = useCallback(() => {
    const end = Date.now() + duration;

    // Company colors: WA blue/green theme
    const colors = ['#22c55e', '#10b981', '#0ea5e9', '#3b82f6', '#f59e0b'];

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors,
      });

      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();
  }, [duration]);

  const fireFireworks = useCallback(() => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    };

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      // Fireworks from random positions
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#22c55e', '#10b981', '#fbbf24'],
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#0ea5e9', '#3b82f6', '#f59e0b'],
      });
    }, 250);
  }, []);

  const fireStars = useCallback(() => {
    const defaults = {
      spread: 360,
      ticks: 100,
      gravity: 0,
      decay: 0.94,
      startVelocity: 30,
      shapes: ['star'] as confetti.Shape[],
      colors: ['#FFE400', '#FFBD00', '#E89400', '#FFCA6C', '#FDFFB8'],
    };

    const shoot = () => {
      confetti({
        ...defaults,
        particleCount: 40,
        scalar: 1.2,
        origin: { x: 0.5, y: 0.5 },
      });

      confetti({
        ...defaults,
        particleCount: 10,
        scalar: 0.75,
        origin: { x: 0.5, y: 0.5 },
      });
    };

    setTimeout(shoot, 0);
    setTimeout(shoot, 100);
    setTimeout(shoot, 200);
  }, []);

  useEffect(() => {
    if (!trigger) return;

    switch (type) {
      case 'fireworks':
        fireFireworks();
        break;
      case 'stars':
        fireStars();
        break;
      case 'confetti':
      default:
        fireConfetti();
        break;
    }
  }, [trigger, type, fireConfetti, fireFireworks, fireStars]);

  // This component doesn't render anything visible
  return null;
}

/**
 * Helper function to trigger a one-time celebration
 */
export function triggerCelebration(type: 'confetti' | 'fireworks' | 'stars' = 'confetti') {
  const colors = ['#22c55e', '#10b981', '#0ea5e9', '#3b82f6', '#f59e0b'];

  switch (type) {
    case 'fireworks':
      // Single firework burst
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors,
      });
      break;
    case 'stars':
      confetti({
        particleCount: 50,
        spread: 360,
        shapes: ['star'],
        colors: ['#FFE400', '#FFBD00', '#E89400'],
        origin: { x: 0.5, y: 0.5 },
      });
      break;
    case 'confetti':
    default:
      // Burst from both sides
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors,
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors,
      });
      break;
  }
}
