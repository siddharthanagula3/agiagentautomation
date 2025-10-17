import React, { useState, useEffect, useCallback } from 'react';
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

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  targetDate,
  className = '',
}) => {
  const calculateTimeLeft = useCallback((): TimeLeft => {
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
  }, [targetDate]);

  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [calculateTimeLeft]);

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
              className="flex min-w-[60px] flex-col items-center justify-center rounded-lg border border-primary/30 bg-gradient-to-br from-primary/20 to-accent/20 p-2"
            >
              <motion.div
                key={block.value}
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="bg-gradient-to-r from-primary to-accent bg-clip-text text-2xl font-bold text-transparent"
              >
                {block.value.toString().padStart(2, '0')}
              </motion.div>
              <div className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
                {block.label}
              </div>
            </motion.div>
            {index < timeBlocks.length - 1 && (
              <div className="flex items-center text-2xl font-bold text-primary">
                :
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
