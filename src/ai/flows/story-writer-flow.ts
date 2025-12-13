'use server';
/**
 * @fileOverview A story writing flow.
 *
 * - storyWriterFlow - A function that handles the story writing process.
 * - StoryWriterInput - The input type for the storyWriterFlow function.
 * - StoryWriterOutput - The return type for the storyWriterFlow function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const StoryWriterInputSchema = z.object({
  prompt: z.string().describe('The text prompt to write a story from.'),
});
export type StoryWriterInput = z.infer<typeof StoryWriterInputSchema>;

const StoryWriterOutputSchema = z.object({
  story: z.string().describe('The generated story.'),
});
export type StoryWriterOutput = z.infer<typeof StoryWriterOutputSchema>;

export const storyWriterFlow = ai.defineFlow(
  {
    name: 'storyWriterFlow',
    inputSchema: StoryWriterInputSchema,
    outputSchema: StoryWriterOutputSchema,
    system: 'You are a multilingual AI assistant capable of writing stories from text prompts in various languages, including Hmong.',
  },
  async (input) => {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: `Write a story about: ${input.prompt}` }],
    });

    const story = response.choices[0].message.content ?? '';

    return {
      story: story,
    };
  }
);
