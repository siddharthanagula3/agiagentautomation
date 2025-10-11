import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  targetDate: Date;
  className?: string;
}

interface TimeLeft {
  totalHours: number;
  minutes: number;
  seconds: number;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ targetDate, className = '' }) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft());

  function calculateTimeLeft(): TimeLeft {
    const difference = +targetDate - +new Date();

    if (difference > 0) {
      const totalSeconds = Math.floor(difference / 1000);
      const totalMinutes = Math.floor(totalSeconds / 60);
      const totalHours = Math.floor(totalMinutes / 60);
      
      return {
        totalHours: totalHours,
        minutes: totalMinutes % 60,
        seconds: totalSeconds % 60,
      };
    }

    return { totalHours: 0, minutes: 0, seconds: 0 };
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  const timeBlocks = [
    { label: 'Hours', value: timeLeft.totalHours },
    { label: 'Minutes', value: timeLeft.minutes },
    { label: 'Seconds', value: timeLeft.seconds },
  ];

  return (
    <div className={`flex items-center justify-center gap-4 ${className}`}>
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Clock className="h-4 w-4" />
        <span>Limited Time Offer Ends In:</span>
      </div>
      <div className="flex gap-2">
        {timeBlocks.map((block, index) => (
          <React.Fragment key={block.label}>
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="flex flex-col items-center justify-center min-w-[60px] p-2 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30"
            >
              <motion.div
                key={block.value}
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent"
              >
                {block.value.toString().padStart(2, '0')}
              </motion.div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide mt-1">
                {block.label}
              </div>
            </motion.div>
            {index < timeBlocks.length - 1 && (
              <div className="flex items-center text-2xl font-bold text-primary">:</div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

// Helper to create a date 1 month from now
export const getOneMonthFromNow = (): Date => {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  return date;
};

// Helper to create a specific end date (e.g., end of January 2026)
export const createDiscountEndDate = (): Date => {
  // Set to 99 hours, 59 minutes, 59 seconds from now
  const now = new Date();
  const targetTime = new Date(now.getTime() + (99 * 60 * 60 * 1000) + (59 * 60 * 1000) + (59 * 1000));
  return targetTime;
};
