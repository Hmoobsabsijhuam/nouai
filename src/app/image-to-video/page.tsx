
'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { addDoc, collection, serverTimestamp, query, orderBy, doc, updateDoc, increment } from 'firebase/firestore';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import { useFirebase, useMemoFirebase } from '@/firebase';
import { generateVideoFromImage } from '@/ai/flows/generate-video-from-image-flow';
import { useToast } from '@/hooks/use-toast';
import { useDoc } from '@/firebase/firestore/use-doc';

import { GeneratorLayout } from '@/components/generator/generator-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, Sparkles, Video, ImagePlus, Upload } from 'lucide-react';
import { useCollection, WithId } from '@/firebase/firestore/use-collection';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';

const formSchema = z.object({
  prompt: z.string().min(5, { message: 'Prompt yuav tsum muaj yam tsawg kawg yog 5 tus niam ntawv.' }),
  image: z.any().refine(file => file !== null && file !== undefined, 'An image is required.'),
});

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

interface GeneratedVideo {
  prompt: string;
  videoUrl: string;
  createdAt: any;
}

const VIDEO_GENERATION_COST = 25;

function calculateCost(): number {
    return VIDEO_GENERATION_COST;
}

function VideoFeedSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            {Array.from({ length: 2 }).map((_, i) => (
                <Card key={i} className="overflow-hidden bg-muted border-none">
                    <Skeleton className="aspect-video w-full" />
                </Card>
            ))}
        </div>
    );
}


function VideoFeed({ videos, isLoading, isGenerating }: { videos: WithId<GeneratedVideo>[] | null, isLoading: boolean, isGenerating: boolean }) {
    if (isLoading && !isGenerating) {
        return <VideoFeedSkeleton />;
    }

    if ((!videos || videos.length === 0) && !isGenerating) {
        return (
            <div className="mt-6 flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center bg-card">
                <Video className="mx-auto h-10 w-10 text-muted-foreground" />
                <h3 className="mt-4 text-md font-semibold">Tseem Tsis Tau Muaj Video</h3>
                <p className="mt-1 text-xs text-muted-foreground">Koj cov videos yuav tshwm rau hauv qab no.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
             {isGenerating && (
                <Card className="overflow-hidden bg-muted border-none">
                    <div className="aspect-video w-full flex items-center justify-center">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <Loader2 className="h-8 w-8 animate-spin" />
                            <span>Animating image...</span>
                        </div>
                    </div>
                </Card>
            )}
            {videos?.map(video => (
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

function ImageToVideoControls({ form, isGenerating, cost }: { form: any, isGenerating: boolean, cost: number }) {
    const { imagePreview, fileError, handleImageChange } = form;
    const fileInputRef = useRef<HTMLInputElement>(null);

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(form.onSubmit)} className="space-y-6">
                <div className="space-y-6">
                    <FormField
                        control={form.control}
                        name="image"
                        render={() => (
                            <FormItem>
                                <FormLabel>Upload Image</FormLabel>
                                <FormControl>
                                    <div
                                        className="relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted transition-colors"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        {imagePreview ? (
                                            <Image src={imagePreview} alt="Image preview" layout="fill" objectFit="cover" className="rounded-lg" />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                                                <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                                <p className="text-xs text-muted-foreground">Image file (MAX. 5MB)</p>
                                            </div>
                                        )}
                                        <Input
                                            ref={fileInputRef}
                                            id="image-upload"
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className="hidden"
                                        />
                                    </div>
                                </FormControl>
                                <FormMessage />
                                {fileError && <p className="text-sm font-medium text-destructive">{fileError}</p>}
                            </FormItem>
                        )}
                    />
                    
                    <FormField
                        control={form.control}
                        name="prompt"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Prompt</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="Piv txwv: make this character walk in a forest"
                                        {...field}
                                        className="min-h-[100px] bg-card border-none"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                 <div className="space-y-2 pt-4">
                    <Button type="submit" disabled={isGenerating || !imagePreview} size="lg" className="w-full">
                        {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                        {isGenerating ? 'Tab tom tsim...' : `Generate (${cost} credits)`}
                    </Button>
                     <p className="text-xs text-muted-foreground text-center">Animate your image with a text prompt.</p>
                </div>
            </form>
        </Form>
    );
}

export default function ImageToVideoPage() {
  const { user, firestore, firebaseApp, isUserLoading } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const userDocRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, 'users', user.uid) : null),
    [firestore, user]
  );
  
  const { data: profile, isLoading: isProfileLoading } = useDoc<{ credits: number }>(userDocRef);

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
      image: undefined,
    },
  });

  const cost = calculateCost();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    form.setValue('image', null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      if (file.size > MAX_FILE_SIZE) {
        setFileError('File size must be less than 5MB.');
        setImagePreview(null);
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        setFileError('Invalid file type. Please select an image.');
        setImagePreview(null);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        form.setValue('image', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !firestore || !firebaseApp || !values.image || !profile) {
        toast({ title: 'Error', description: 'You must be logged in and select an image.', variant: 'destructive'});
        return;
    }

    const generationCost = calculateCost();

    if (profile.credits < generationCost) {
        router.push('/billing');
        return;
    }
    
    setIsGenerating(true);
    try {
        await updateDoc(doc(firestore, 'users', user.uid), {
            credits: increment(-generationCost)
        });

        const { videoUrl: videoDataUri } = await generateVideoFromImage({ 
            prompt: values.prompt,
            imageDataUri: values.image
        });

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

      await updateDoc(doc(firestore, 'users', user.uid), {
          credits: increment(generationCost)
      });

      let description = 'An unexpected error occurred.';
       if (typeof error.message === 'string') {
        const lowerCaseError = error.message.toLowerCase();
        if (lowerCaseError.includes('429') || lowerCaseError.includes('quota')) {
            description = 'You have exceeded the free usage limit for video generation. Please try again later or check your billing plan.';
        } else if (lowerCaseError.includes('billing')) {
             description = 'This feature may require a paid plan. Please check your billing details and try again.';
        } else {
            description = 'An unexpected error occurred during video generation.';
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
  (form as any).imagePreview = imagePreview;
  (form as any).fileError = fileError;
  (form as any).handleImageChange = handleImageChange;

  const isLoading = isUserLoading || isProfileLoading;

  if (isLoading || !user) {
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <p>Loading...</p>
        </div>
    );
  }

  const controlPanel = (
    <div className="flex flex-col gap-6">
      <ImageToVideoControls form={form} isGenerating={isGenerating} cost={cost} />
      <VideoFeed videos={videos} isLoading={isVideosLoading} isGenerating={isGenerating} />
    </div>
  );

  return (
    <GeneratorLayout
      activeTab="animate"
      controlPanel={controlPanel}
      contentPanel={null}
    />
  );
}
