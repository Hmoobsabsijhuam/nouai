'use server';
/**
 * @fileOverview A story weaving flow.
 *
 * - storyWeaverFlow - A function that handles the story weaving process.
 * - StoryWeaverInput - The input type for the storyWeaverFlow function.
 * - StoryWeaverOutput - The return type for the storyWeaverFlow function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const StoryWeaverInputSchema = z.object({
  prompt: z.string().describe('The text prompt to weave a story from.'),
});
export type StoryWeaverInput = z.infer<typeof StoryWeaverInputSchema>;

const StoryWeaverOutputSchema = z.object({
  story: z.string().describe('The generated story.'),
});
export type StoryWeaverOutput = z.infer<typeof StoryWeaverOutputSchema>;

export const storyWeaverFlow = ai.defineFlow(
  {
    name: 'storyWeaverFlow',
    inputSchema: StoryWeaverInputSchema,
    outputSchema: StoryWeaverOutputSchema,
  },
  async (input) => {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content:
            'You are a multilingual AI assistant capable of weaving stories from text prompts in various languages, including Hmong.',
        },
        { role: 'user', content: `Weave a story about: ${input.prompt}` }
    ],
    });

    const story = response.choices[0].message.content ?? '';

    return {
      story: story,
    };
  }
);
