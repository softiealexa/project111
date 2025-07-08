'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { solveMath, type SolveMathOutput } from '@/ai/flows/solve-math-flow';
import { LoadingSpinner } from './loading-spinner';
import { BrainCircuit, BotMessageSquare } from 'lucide-react';

export default function MathSolver() {
  const [equation, setEquation] = useState('2x^2 - 3x - 5 = 0');
  const [result, setResult] = useState<SolveMathOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSteps, setShowSteps] = useState(true);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!equation.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter an equation to solve.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const response = await solveMath({ equation });
      setResult(response);
    } catch (error) {
      console.error('Error solving math problem:', error);
      toast({
        title: 'An Error Occurred',
        description: 'Could not solve the math problem. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Math Solver</CardTitle>
        <CardDescription>Enter a math problem, and the AI will provide the solution and step-by-step instructions.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="equation-input">Math Problem</Label>
            <Textarea
              id="equation-input"
              placeholder="e.g., 2x + 5 = 15 or solve for y in y = x^2 + 3"
              value={equation}
              onChange={(e) => setEquation(e.target.value)}
              className="min-h-[96px] text-base font-mono"
              disabled={isLoading}
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4">
             <div className="flex items-center space-x-2">
                <Switch
                    id="show-steps-switch"
                    checked={showSteps}
                    onCheckedChange={setShowSteps}
                    disabled={isLoading}
                />
                <Label htmlFor="show-steps-switch">Show steps</Label>
            </div>
            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
              {isLoading ? 'Solving...' : 'Solve Equation'}
            </Button>
          </div>
        </form>

        {isLoading && <LoadingSpinner containerClassName="h-48" text="AI is thinking..." />}

        {result && (
          <div className="space-y-6 pt-4 border-t">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
                <BrainCircuit className="h-5 w-5 text-primary" />
                Solution
              </h3>
              <div className="p-4 bg-muted rounded-lg text-lg font-bold font-mono text-center">
                {result.solution}
              </div>
            </div>

            {showSteps && (
               <div>
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
                    <BotMessageSquare className="h-5 w-5 text-primary" />
                    Step-by-step Explanation
                </h3>
                <div className="space-y-3">
                  {result.steps.map((step, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                      <div className="flex-shrink-0 h-6 w-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                        {index + 1}
                      </div>
                      <p className="flex-1 text-base">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
