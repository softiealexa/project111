'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, Pause, RotateCcw } from 'lucide-react';

const SESSION_TIMES = {
  pomodoro: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
};

type SessionType = keyof typeof SESSION_TIMES;

export default function PomodoroTimer() {
  const [sessionType, setSessionType] = useState<SessionType>('pomodoro');
  const [time, setTime] = useState(SESSION_TIMES[sessionType]);
  const [isActive, setIsActive] = useState(false);
  const [key, setKey] = useState(0); 

  const handleSessionChange = useCallback((type: SessionType) => {
    setIsActive(false);
    setSessionType(type);
    setTime(SESSION_TIMES[type]);
    setKey(prev => prev + 1);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (typeof window !== 'undefined' && "Notification" in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }

    if (isActive && time > 0) {
      interval = setInterval(() => {
        setTime((prevTime) => prevTime - 1);
      }, 1000);
    } else if (time === 0 && isActive) {
      setIsActive(false);
      
      if (Notification.permission === 'granted') {
          const notificationText = sessionType === 'pomodoro' ? "Time for a break!" : "Time to get back to work!";
          new Notification('Pomodoro Timer', {
              body: notificationText,
          });
      }

      if (sessionType === 'pomodoro') {
        handleSessionChange('shortBreak');
      } else {
        handleSessionChange('pomodoro');
      }
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isActive, time, sessionType, key, handleSessionChange]);

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    handleSessionChange(sessionType);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
        document.title = `${formatTime(time)} - ${
        sessionType.charAt(0).toUpperCase() + sessionType.slice(1).replace('B', ' B')
        } | TrackAcademic`;
    }
  }, [time, sessionType]);

  return (
    <div className="flex flex-col items-center gap-6">
        <Tabs
        value={sessionType}
        onValueChange={(value) => handleSessionChange(value as SessionType)}
        className="w-full"
        >
        <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pomodoro">Pomodoro</TabsTrigger>
            <TabsTrigger value="shortBreak">Short Break</TabsTrigger>
            <TabsTrigger value="longBreak">Long Break</TabsTrigger>
        </TabsList>
        </Tabs>

        <div className="font-mono text-7xl md:text-8xl font-bold tracking-tighter">
        {formatTime(time)}
        </div>

        <div className="flex items-center gap-4">
        <Button onClick={toggleTimer} size="lg" className="w-32">
            {isActive ? <Pause className="mr-2 h-5 w-5" /> : <Play className="mr-2 h-5 w-5" />}
            {isActive ? 'Pause' : 'Start'}
        </Button>
        <Button onClick={resetTimer} variant="outline" size="icon" aria-label="Reset Timer">
            <RotateCcw className="h-5 w-5" />
        </Button>
        </div>
    </div>
  );
}
