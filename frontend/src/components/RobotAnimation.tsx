import { motion } from 'motion/react';
import startGreeting from '../assets/animations/start-greeting.mp4';
import errorBot from '../assets/animations/error-bot.mp4';
import loadingFace from '../assets/animations/loading-face.mp4';
import surprisedFace from '../assets/animations/surprised-face.mp4';

export type RobotMood = 'greeting' | 'loading' | 'error' | 'surprised';

interface RobotAnimationProps {
  mood: RobotMood;
  className?: string;
  showLabel?: boolean;
}

const moodMap: Record<RobotMood, { src: string; label: string }> = {
  greeting: { src: startGreeting, label: 'Hi! Ready when you are.' },
  loading: { src: loadingFace, label: 'Thinking...' },
  error: { src: errorBot, label: 'Something went wrong.' },
  surprised: { src: surprisedFace, label: 'That sounds exciting!' }
};

export function RobotAnimation({ mood, className = '', showLabel = true }: RobotAnimationProps) {
  const selected = moodMap[mood];

  return (
    <motion.div
      key={mood}
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`p-0 bg-transparent border-0 shadow-none ${className}`}
    >
      <video
        key={selected.src}
        src={selected.src}
        autoPlay
        muted
        loop
        playsInline
        className="h-24 w-24 md:h-28 md:w-28 object-cover rounded-xl"
      />
      {showLabel && <p className="text-xs text-gray-500 text-center mt-2">{selected.label}</p>}
    </motion.div>
  );
}
