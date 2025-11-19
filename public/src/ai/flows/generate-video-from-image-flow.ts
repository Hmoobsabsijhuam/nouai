'use server';
/**
 * @fileOverview An image-to-video generation flow.
 *
 * - generateVideoFromImage - A function that handles the video generation process.
 * - GenerateVideoFromImageInput - The input type for the generateVideoFromImage function.
 * - GenerateVideoFromImageOutput - The return type for the generateVideoFromImage function.
 */

import {ai} from '@/ai/genkit';
import {googleAI} from '@genkit-ai/google-genai';
import {z} from 'genkit';

const GenerateVideoFromImageInputSchema = z.object({
  prompt: z.string().describe('The text prompt to guide the video generation.'),
  imageDataUri: z.string().describe("The source image as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
});
export type GenerateVideoFromImageInput = z.infer<typeof GenerateVideoFromImageInputSchema>;

const GenerateVideoFromImageOutputSchema = z.object({
  videoUrl: z.string().describe('The data URI of the generated video.'),
  videoContentType: z.string().describe('The content type of the video.'),
});
export type GenerateVideoFromImageOutput = z.infer<typeof GenerateVideoFromImageOutputSchema>;

export async function generateVideoFromImage(input: GenerateVideoFromImageInput): Promise<GenerateVideoFromImageOutput> {
  return generateVideoFromImageFlow(input);
}

const generateVideoFromImageFlow = ai.defineFlow(
  {
    name: 'generateVideoFromImageFlow',
    inputSchema: GenerateVideoFromImageInputSchema,
    outputSchema: GenerateVideoFromImageOutputSchema,
    system: 'You are an AI assistant that generates videos from a source image and a text prompt.',
  },
  async (input) => {
    let { operation } = await ai.generate({
        model: googleAI.model('veo-2.0-generate-001'),
        prompt: [
            { text: input.prompt },
            { media: { url: input.imageDataUri } },
        ],
        config: {
            durationSeconds: 5,
            aspectRatio: '16:9',
            personGeneration: 'allow_adult',
        },
    });

    if (!operation) {
        throw new Error('Expected the model to return an operation');
    }

    // Wait until the operation completes.
    while (!operation.done) {
        operation = await ai.checkOperation(operation);
        // Sleep for 5 seconds before checking again.
        await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    if (operation.error) {
        throw new Error('failed to generate video: ' + operation.error.message);
    }
    
    const video = operation.output?.message?.content.find((p) => !!p.media);
    if (!video || !video.media?.url) {
        throw new Error('Failed to find the generated video in the response.');
    }

    const fetch = (await import('node-fetch')).default;
    // Add API key before fetching the video.
    const videoDownloadResponse = await fetch(
        `${video.media.url}&key=${process.env.GEMINI_API_KEY}`
    );

    if (!videoDownloadResponse.ok || !videoDownloadResponse.body) {
        throw new Error(`Failed to download video: ${videoDownloadResponse.statusText}`);
    }

    const videoBuffer = await videoDownloadResponse.arrayBuffer();
    const base64Video = Buffer.from(videoBuffer).toString('base64');
    const contentType = video.media.contentType || 'video/mp4';

    return {
        videoUrl: `data:${contentType};base64,${base64Video}`,
        videoContentType: contentType
    };
  }
);
