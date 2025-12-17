
'use server';
/**
 * @fileOverview An avatar generation flow.
 *
 * - generateAvatar - A function that handles the avatar generation process.
 * - GenerateAvatarInput - The input type for the generateAvatar function.
 * - GenerateAvatarOutput - The return type for the generateAvatar function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const GenerateAvatarInputSchema = z.object({
  prompt: z.string().describe('The text prompt to generate an avatar from.'),
});
export type GenerateAvatarInput = z.infer<typeof GenerateAvatarInputSchema>;

const GenerateAvatarOutputSchema = z.object({
  imageUrl: z.string().describe('The data URI of the generated image.'),
});
export type GenerateAvatarOutput = z.infer<typeof GenerateAvatarOutputSchema>;

export async function generateAvatar(input: GenerateAvatarInput): Promise<GenerateAvatarOutput> {
  return generateAvatarFlow(input);
}

const generateAvatarFlow = ai.defineFlow(
  {
    name: 'generateAvatarFlow',
    inputSchema: GenerateAvatarInputSchema,
    outputSchema: GenerateAvatarOutputSchema,
    system: 'You are an AI assistant that specializes in creating unique, high-quality avatars. Generate a visually appealing avatar based on the user\'s prompt. The avatar should be suitable for a profile picture and should be in a 1:1 aspect ratio.',
  },
  async (input) => {
    const image = await openai.images.generate({
      model: 'dall-e-3',
      prompt: `Generate an avatar of: ${input.prompt}`,
      n: 1,
      size: '1024x1024',
      response_format: 'b64_json',
    });

    const imageUrl = `data:image/png;base64,${image.data[0].b64_json}`;

    return {
      imageUrl: imageUrl,
    };
  }
);
