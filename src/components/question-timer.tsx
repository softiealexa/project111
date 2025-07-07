
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RotateCcw, Maximize, Minimize, CheckCircle, BarChart, Clock, History } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from './ui/separator';
import { useData } from '@/contexts/data-context';
import type { QuestionSession } from '@/lib/types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format as formatDate } from 'date-fns';


const formatTime = (ms: number) => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  const remainingMs = ms % 1000;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}.${remainingMs.toString().padStart(3, '0')}`;
};

const formatAverageTime = (ms: number) => {
  if (ms === 0) return '00:00.00';
  const totalSeconds = ms / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toFixed(2).padStart(5, '0')}`;
};


export default function QuestionTimer() {
  const { activeProfile, addQuestionSession } = useData();
  const [numQuestions, setNumQuestions] = useState(10);
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isTiming, setIsTiming] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [questionTimes, setQuestionTimes] = useState<number[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [time, setTime] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const handleReset = useCallback(() => {
    setNumQuestions(10);
    setCurrentQuestion(1);
    setIsSessionActive(false);
    setIsTiming(false);
    setStartTime(null);
    setQuestionTimes([]);
    setIsFinished(false);
    setTime(0);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTiming && startTime) {
      interval = setInterval(() => {
        setTime(Date.now() - startTime);
      }, 50); // Update frequently for a smooth timer display
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTiming, startTime]);
  
  const handleSpacePress = useCallback(() => {
    if (isFinished) return;
  
    if (!isSessionActive) {
      setIsSessionActive(true);
      return; // The next space press will start the first question
    }
  
    if (isTiming && startTime) {
      // Stopping the timer
      const endTime = Date.now();
      const duration = endTime - startTime;
      const newQuestionTimes = [...questionTimes, duration];
      setQuestionTimes(newQuestionTimes);
      setIsTiming(false);
      setTime(0);
  
      if (currentQuestion >= numQuestions) {
        setIsFinished(true);
        setIsSessionActive(false);

        const newSession: QuestionSession = {
            id: crypto.randomUUID(),
            date: Date.now(),
            numQuestions: numQuestions,
            totalTime: newQuestionTimes.reduce((a, b) => a + b, 0),
            questionTimes: newQuestionTimes,
        };
        addQuestionSession(newSession);

      } else {
        setCurrentQuestion(prev => prev + 1);
      }
    } else {
      // Starting the timer
      setStartTime(Date.now());
      setIsTiming(true);
    }
  }, [isFinished, isSessionActive, isTiming, startTime, currentQuestion, numQuestions, questionTimes, addQuestionSession]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleSpacePress();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleSpacePress]);

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

  const totalTime = questionTimes.reduce((acc, curr) => acc + curr, 0);
  const averageTime = questionTimes.length > 0 ? totalTime / questionTimes.length : 0;

  const sessions = activeProfile?.questionSessions || [];

  const getStatusText = () => {
    if (isFinished) return "Session Complete!";
    if (!isSessionActive) return "Press Space to Begin Session";
    if (isTiming) return "Timing... Press Space to Stop";
    return `Ready for Question ${currentQuestion}. Press Space to Start`;
  };

  return (
    <>
      <div ref={containerRef} className={cn("transition-all focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0", isFullscreen && "bg-background p-8")}>
        <Card className={cn(isFullscreen && "border-none shadow-none")}>
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle>Question Attempt Timer</CardTitle>
              <CardDescription>Use the space bar to start and stop the timer for each question.</CardDescription>
            </div>
             <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => setHistoryOpen(true)} className="flex-shrink-0" disabled={sessions.length === 0}>
                    <History className="h-5 w-5" />
                    <span className="sr-only">View History</span>
                </Button>
                <Button variant="ghost" size="icon" onClick={handleFullscreen} className="flex-shrink-0">
                    {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
                    <span className="sr-only">{isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}</span>
                </Button>
             </div>
          </CardHeader>
          <CardContent>
            {isFinished ? (
              <div className="space-y-6">
                <div className="text-center">
                  <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
                  <h2 className="text-2xl font-bold">Session Finished!</h2>
                  <p className="text-muted-foreground">Great work. Here's your summary.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription className="flex items-center justify-center gap-2"><Clock className="h-4 w-4" /> Total Time</CardDescription>
                      <CardTitle className="text-3xl">{formatTime(totalTime)}</CardTitle>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription className="flex items-center justify-center gap-2"><BarChart className="h-4 w-4" /> Average Time</CardDescription>
                      <CardTitle className="text-3xl">{formatAverageTime(averageTime)}</CardTitle>
                    </CardHeader>
                  </Card>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Time per Question:</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 max-h-40 overflow-y-auto rounded-md border p-2">
                    {questionTimes.map((t, index) => (
                      <div key={index} className="flex justify-between items-center text-sm p-2 bg-muted/50 rounded-md">
                        <span className="font-medium text-muted-foreground">Question {index + 1}</span>
                        <span className="font-mono font-semibold">{formatTime(t)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <Button onClick={handleReset} className="w-full">
                  <RotateCcw className="mr-2 h-4 w-4" /> Start New Session
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-8">
                {!isSessionActive && (
                  <div className="grid w-full max-w-xs gap-1.5">
                    <Label htmlFor="num-questions">Number of Questions</Label>
                    <Input
                      id="num-questions"
                      type="number"
                      value={numQuestions}
                      onChange={(e) => setNumQuestions(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      min="1"
                    />
                  </div>
                )}
                {isSessionActive && (
                  <div className="text-center">
                      <p className="text-lg text-muted-foreground">Question</p>
                      <p className="text-6xl font-bold font-mono tracking-tighter">{currentQuestion}/{numQuestions}</p>
                  </div>
                )}
                <div className="text-center font-mono text-7xl font-bold tracking-tighter w-full rounded-lg py-4">
                  {formatTime(time)}
                </div>
                <div className="text-center space-y-2">
                   <p className={cn("text-xl font-medium", isTiming && "text-primary")}>{getStatusText()}</p>
                   <p className="text-sm text-muted-foreground">[ <span className="font-semibold">Space Bar</span> ]</p>
                </div>
                <Separator />
                 <Button onClick={handleReset} variant="outline" size="sm" className="self-end">
                  <RotateCcw className="mr-2 h-4 w-4" /> Reset
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

       <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Session History</DialogTitle>
            <DialogDescription>
              Here are your previously completed sessions.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[60vh] -mx-6 px-6">
            {sessions.length > 0 ? (
              <Accordion type="single" collapsible className="w-full space-y-3 pr-4">
                {sessions.map(session => (
                  <AccordionItem key={session.id} value={session.id} className="border rounded-md">
                    <AccordionTrigger className="px-4 py-3 hover:no-underline">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full text-left gap-2 sm:gap-4">
                        <span className="font-semibold">{formatDate(new Date(session.date), 'PPP p')}</span>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{session.numQuestions} Qs</span>
                          <span>Avg: {formatAverageTime(session.totalTime / session.numQuestions)}</span>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 mt-2 rounded-md border p-2 bg-muted/30">
                          {session.questionTimes.map((t, index) => (
                            <div key={index} className="flex justify-between items-center text-sm p-1.5 bg-muted/50 rounded-md">
                              <span className="font-medium text-muted-foreground">Question {index + 1}</span>
                              <span className="font-mono font-semibold">{formatTime(t)}</span>
                            </div>
                          ))}
                        </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <p className="text-center text-muted-foreground py-10">No history yet.</p>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
