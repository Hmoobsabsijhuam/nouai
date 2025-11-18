'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { addDoc, collection, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import { useFirebase, useMemoFirebase } from '@/firebase';
import { generateVideo } from '@/ai/flows/generate-video-flow';
import { useToast } from '@/hooks/use-toast';
import { useCollection, WithId } from '@/firebase/firestore/use-collection';

import { GeneratorLayout } from '@/components/generator/generator-layout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, Sparkles, Video } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';

const formSchema = z.object({
  prompt: z.string().min(5, { message: 'Prompt yuav tsum muaj yam tsawg kawg yog 5 tus niam ntawv.' }),
});

interface GeneratedVideo {
  prompt: string;
  videoUrl: string;
  createdAt: any;
}


function VideoFeedSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 2 }).map((_, i) => (
                <Card key={i} className="overflow-hidden bg-muted border-none">
                    <Skeleton className="aspect-video w-full" />
                </Card>
            ))}
        </div>
    );
}

function VideoFeed({ videos, isLoading, isGenerating }: { videos: WithId<GeneratedVideo>[] | null, isLoading: boolean, isGenerating: boolean }) {
    if (isLoading && !isGenerating) { // Show skeleton only on initial load
        return <VideoFeedSkeleton />;
    }

    if (!videos || videos.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center h-full">
                <Video className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">Tseem Tsis Tau Muaj Video</h3>
                <p className="mt-2 text-sm text-muted-foreground">Koj cov videos yuav tshwm rau hauv qab no.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isGenerating && (
                <Card className="overflow-hidden bg-muted border-none">
                    <div className="aspect-video w-full flex items-center justify-center">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <Loader2 className="h-8 w-8 animate-spin" />
                            <span>Generating video...</span>
                        </div>
                    </div>
                </Card>
            )}
            {videos.map(video => (
                <div key={video.id}>
                    <video src={video.videoUrl} controls autoPlay muted loop className="rounded-lg w-full aspect-video"></video>
                     <p className="text-xs text-muted-foreground mt-1 truncate" title={video.prompt}>{video.prompt}</p>
                     {video.createdAt?.toDate && (
                        <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(video.createdAt.toDate(), { addSuffix: true })}
                        </p>
                    )}
                </div>
            ))}
        </div>
    );
}

function TextToVideoControls({ form, isGenerating }: { form: any, isGenerating: boolean }) {
    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(form.onSubmit)} className="space-y-6 flex flex-col h-full">
                <div className="flex-1">
                    <FormField
                        control={form.control}
                        name="prompt"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Prompt</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="Piv txwv: Ib tug hluas nkauj hmoob zoo zoo nkauj tab tom ntis plaub hau"
                                        {...field}
                                        className="min-h-[150px] bg-secondary border-none"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <div className="space-y-2">
                    <Button type="submit" disabled={isGenerating} size="lg" className="w-full">
                        {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                        {isGenerating ? 'Tab tom tsim...' : 'Generate'}
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">Bring your ideas to life with AI-powered video.</p>
                </div>
            </form>
        </Form>
    );
}

export default function GenerateVideoPage() {
  const { user, firestore, firebaseApp, isUserLoading } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/login');
    }
  }, [user, isUserLoading, router]);
  
  const videosQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'users', user.uid, 'generated_videos'), orderBy('createdAt', 'desc'));
  }, [firestore, user]);

  const { data: videos, isLoading: isVideosLoading } = useCollection<GeneratedVideo>(videosQuery);


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: '',
    },
  });


  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !firestore || !firebaseApp) {
        toast({ title: 'Error', description: 'You must be logged in to generate videos.', variant: 'destructive'});
        return;
    }
    
    setIsGenerating(true);
    try {
        const { videoUrl: videoDataUri } = await generateVideo({ prompt: values.prompt });

        const storage = getStorage(firebaseApp);
        const videoId = `${Date.now()}`;
        const storageRef = ref(storage, `generated-videos/${user.uid}/${videoId}.mp4`);
        
        const uploadResult = await uploadString(storageRef, videoDataUri, 'data_url');
        const downloadUrl = await getDownloadURL(uploadResult.ref);

        const videosCollection = collection(firestore, 'users', user.uid, 'generated_videos');
        await addDoc(videosCollection, {
            prompt: values.prompt,
            videoUrl: downloadUrl,
            createdAt: serverTimestamp(),
        });

        toast({ title: 'Koj daim video tau lawm!', description: 'Koj daim video tsim tau thiab save cia lawm.' });

    } catch (error: any) {
      console.error('Koj daim video tsim tsis tau:', error);
      let description = 'Muaj tej yam yuam kev thaum Nou AI tab tom tsim koj daim video.';
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
        title: 'Koj li video tsim tsis tau',
        description: description,
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  }
  
  (form as any).onSubmit = onSubmit;
  
  if (isUserLoading || !user) {
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <p>Loading...</p>
        </div>
    );
  }

  return (
    <GeneratorLayout
      activeTab="video"
      controlPanel={<TextToVideoControls form={form} isGenerating={isGenerating} />}
      contentPanel={<VideoFeed videos={videos} isLoading={isVideosLoading} isGenerating={isGenerating} />}
    />
  );
}
