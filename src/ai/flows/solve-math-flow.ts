'use server';
/**
 * @fileOverview An AI flow for solving mathematical equations.
 *
 * - solveMath - A function that handles solving a math problem.
 * - SolveMathInput - The input type for the solveMath function.
 * - SolveMathOutput - The return type for the solveMath function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SolveMathInputSchema = z.object({
  equation: z.string().describe('The mathematical equation or problem to solve.'),
});
export type SolveMathInput = z.infer<typeof SolveMathInputSchema>;

const SolveMathOutputSchema = z.object({
  solution: z.string().describe('The final answer or solution to the equation.'),
  steps: z.array(z.string()).describe('An array of strings, where each string is a step in the solution process.'),
});
export type SolveMathOutput = z.infer<typeof SolveMathOutputSchema>;

export async function solveMath(input: SolveMathInput): Promise<SolveMathOutput> {
  return solveMathFlow(input);
}

const prompt = ai.definePrompt({
  name: 'solveMathPrompt',
  input: {schema: SolveMathInputSchema},
  output: {schema: SolveMathOutputSchema},
  prompt: `You are a brilliant math expert. Your task is to solve the following mathematical problem and provide a detailed, step-by-step explanation of how to arrive at the solution.

Problem: "{{equation}}"

First, solve the problem to find the final answer.
Then, break down the solution into clear, easy-to-follow steps.

Provide the final solution and the steps in the specified JSON format. For example, for "2x + 5 = 15", the output should be:
{
  "solution": "x = 5",
  "steps": [
    "Subtract 5 from both sides of the equation: 2x + 5 - 5 = 15 - 5",
    "Simplify the equation: 2x = 10",
    "Divide both sides by 2: 2x / 2 = 10 / 2",
    "The final answer is x = 5"
  ]
}
`,
});

const solveMathFlow = ai.defineFlow(
  {
    name: 'solveMathFlow',
    inputSchema: SolveMathInputSchema,
    outputSchema: SolveMathOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
