'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import { useFirebase } from '@/firebase';
import { generateVideo } from '@/ai/flows/generate-video-flow';
import { useToast } from '@/hooks/use-toast';

import { Header } from '@/components/dashboard/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Download, Loader2, Video, Wand2, X } from 'lucide-react';

const formSchema = z.object({
  prompt: z.string().min(5, { message: 'Prompt must be at least 5 characters long.' }),
});

export default function GenerateVideoPage() {
  const { user, firestore, firebaseApp, isUserLoading } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: '',
    },
  });

  const handleDownload = () => {
    if (generatedVideoUrl) {
        const link = document.createElement('a');
        link.href = generatedVideoUrl;
        link.download = `generated-video-${Date.now()}.mp4`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !firestore || !firebaseApp) {
        toast({ title: 'Error', description: 'You must be logged in to generate videos.', variant: 'destructive'});
        return;
    }
    
    setIsGenerating(true);
    setGeneratedVideoUrl(null);
    try {
        const { videoUrl: videoDataUri } = await generateVideo({ prompt: values.prompt });
        setGeneratedVideoUrl(videoDataUri);

        // Upload to Firebase Storage
        const storage = getStorage(firebaseApp);
        const videoId = `${Date.now()}`;
        const storageRef = ref(storage, `generated-videos/${user.uid}/${videoId}.mp4`);
        
        const uploadResult = await uploadString(storageRef, videoDataUri, 'data_url');
        const downloadUrl = await getDownloadURL(uploadResult.ref);

        // Save to Firestore
        const videosCollection = collection(firestore, 'users', user.uid, 'generated_videos');
        await addDoc(videosCollection, {
            prompt: values.prompt,
            videoUrl: downloadUrl,
            createdAt: serverTimestamp(),
        });

        toast({ title: 'Video Generated!', description: 'Your video has been created and saved.' });

    } catch (error: any) {
      console.error('Video generation failed:', error);
      let description = 'An unexpected error occurred during video generation.';
       if (typeof error.message === 'string') {
        if (error.message.includes('429') || error.message.toLowerCase().includes('quota')) {
            description = 'You have exceeded the free usage limit for video generation. Please try again later.';
        } else if (error.message.toLowerCase().includes('billing')) {
            description = 'This feature is only available on a paid plan. Please enable billing for your project to generate videos.';
        } else {
            description = error.message;
        }
      }
      
      toast({
        title: 'Video Generation Failed',
        description: description,
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  }
  
  if (isUserLoading || !user) {
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <p>Loading...</p>
        </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Header />
      <main className="flex-1 p-4 md:p-8">
        <div className="mx-auto max-w-4xl">
            <Card className="mb-8">
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Video />
                                Text-to-Video Generation
                            </CardTitle>
                            <CardDescription>Describe the video you want to create. This can take up to a minute.</CardDescription>
                        </div>
                        <Link href="/" passHref>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <X className="h-5 w-5" />
                                <span className="sr-only">Close</span>
                            </Button>
                        </Link>
                    </div>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col sm:flex-row items-start gap-4">
                            <FormField
                                control={form.control}
                                name="prompt"
                                render={({ field }) => (
                                <FormItem className="w-full">
                                    <FormLabel className="sr-only">Prompt</FormLabel>
                                    <FormControl>
                                    <Input placeholder="e.g., A majestic dragon soaring over a mystical forest at dawn." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <Button type="submit" disabled={isGenerating} className="w-full sm:w-auto">
                                {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                                {isGenerating ? 'Generating...' : 'Generate'}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>

            {(isGenerating || generatedVideoUrl) && (
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle>Result</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center">
                       {isGenerating ? (
                           <div className="flex flex-col items-center gap-4 p-8 text-muted-foreground">
                               <Loader2 className="h-8 w-8 animate-spin" />
                               <p>Generating your video... this can take up to a minute.</p>
                           </div>
                       ) : generatedVideoUrl ? (
                           <video src={generatedVideoUrl} controls autoPlay muted loop className="rounded-lg w-full max-w-md"></video>
                       ) : null}
                    </CardContent>
                    {generatedVideoUrl && (
                        <CardFooter>
                           <Button onClick={handleDownload} className="w-full">
                                <Download className="mr-2 h-4 w-4" />
                                Download Video
                            </Button>
                        </CardFooter>
                    )}
                </Card>
            )}

            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
                <Video className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">Video Gallery Coming Soon</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                Your generated videos will appear here in a future update.
                </p>
            </div>
        </div>
      </main>
    </div>
  );
}
