
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, Pause, RotateCcw, Settings, Maximize, Minimize } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type SessionType = 'pomodoro' | 'shortBreak' | 'longBreak';

export default function PomodoroTimer() {
  const [sessionTimes, setSessionTimes] = useState({
    pomodoro: 25,
    shortBreak: 5,
    longBreak: 15,
  });

  const [sessionType, setSessionType] = useState<SessionType>('pomodoro');
  const [time, setTime] = useState(sessionTimes.pomodoro * 60);
  const [isActive, setIsActive] = useState(false);
  const [key, setKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSessionChange = useCallback((type: SessionType) => {
    setSessionType(type);
    setKey(prev => prev + 1);
  }, []);

  useEffect(() => {
    setIsActive(false);
    setTime(sessionTimes[sessionType] * 60);
  }, [sessionType, sessionTimes, key]);


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

      const nextSession = sessionType === 'pomodoro' ? 'shortBreak' : 'pomodoro';
      handleSessionChange(nextSession);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isActive, time, sessionType, handleSessionChange]);

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setKey(prev => prev + 1);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
        document.title = `${formatTime(time)} - ${
        sessionType === 'pomodoro' ? 'Pomodoro' : (sessionType === 'shortBreak' ? 'Short Break' : 'Long Break')
        } | StudyTracker`;
    }
  }, [time, sessionType]);

  const handleTimeChange = (type: SessionType, value: string) => {
    const newTime = parseInt(value, 10);
    if (!isNaN(newTime) && newTime > 0) {
        setSessionTimes(prev => ({...prev, [type]: newTime}));
    }
  }

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
    };
  }, []);

  const handleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const handleSpacebar = useCallback((event: KeyboardEvent) => {
    if (event.code === 'Space') {
      event.preventDefault();
      toggleTimer();
    }
  }, [isActive]);

  useEffect(() => {
    window.addEventListener('keydown', handleSpacebar);
    return () => {
      window.removeEventListener('keydown', handleSpacebar);
    };
  }, [handleSpacebar]);


  const totalDuration = sessionTimes[sessionType] * 60;
  const progress = totalDuration > 0 ? (totalDuration - time) / totalDuration : 0;
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div ref={containerRef} className={cn("transition-all rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-background focus-visible:ring-offset-2", isFullscreen && "bg-background p-8")}>
      <Card className={cn(isFullscreen && "border-none shadow-none")}>
        <CardHeader>
          <div className="flex flex-row items-start justify-between">
              <div>
                  <CardTitle>Pomodoro Timer</CardTitle>
                  <CardDescription>Stay focused with the Pomodoro technique.</CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={handleFullscreen} className="flex-shrink-0">
                  {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
                  <span className="sr-only">{isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}</span>
              </Button>
          </div>
        </CardHeader>
        <CardContent>
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

            <div className="relative h-60 w-60 md:h-64 md:w-64">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 200 200">
                <circle
                  cx="100"
                  cy="100"
                  r={radius}
                  strokeWidth="12"
                  className="stroke-muted"
                  fill="transparent"
                />
                <circle
                  cx="100"
                  cy="100"
                  r={radius}
                  strokeWidth="12"
                  className="stroke-primary transition-all duration-300"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                  <div className="font-mono text-5xl md:text-6xl font-bold tracking-tighter text-foreground">
                      {formatTime(time)}
                  </div>
              </div>
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

            <Accordion type="single" collapsible className="w-full max-w-sm pt-4">
              <AccordionItem value="settings" className="border-border">
                  <AccordionTrigger className="text-sm font-medium text-muted-foreground hover:text-foreground hover:no-underline">
                      <div className="flex items-center gap-2">
                          <Settings className="h-4 w-4" />
                          <span>Custom Durations (minutes)</span>
                      </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4">
                      <div className="grid grid-cols-3 gap-4">
                          <div className="grid gap-1.5">
                              <Label htmlFor="pomodoro-time">Pomodoro</Label>
                              <Input
                                  id="pomodoro-time"
                                  type="number"
                                  value={sessionTimes.pomodoro}
                                  onChange={(e) => handleTimeChange('pomodoro', e.target.value)}
                                  disabled={isActive}
                              />
                          </div>
                          <div className="grid gap-1.5">
                              <Label htmlFor="short-break-time">Short Break</Label>
                              <Input
                                  id="short-break-time"
                                  type="number"
                                  value={sessionTimes.shortBreak}
                                  onChange={(e) => handleTimeChange('shortBreak', e.target.value)}
                                  disabled={isActive}
                              />
                          </div>
                          <div className="grid gap-1.5">
                              <Label htmlFor="long-break-time">Long Break</Label>
                              <Input
                                  id="long-break-time"
                                  type="number"
                                  value={sessionTimes.longBreak}
                                  onChange={(e) => handleTimeChange('longBreak', e.target.value)}
                                  disabled={isActive}
                              />
                          </div>
                      </div>
                  </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
