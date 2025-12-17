
'use client';

import { useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { addDoc, collection, serverTimestamp, query, orderBy, doc, updateDoc, increment } from 'firebase/firestore';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import { useFirebase, useMemoFirebase } from '@/firebase';
import { useCollection, WithId } from '@/firebase/firestore/use-collection';
import { generateImage } from '@/ai/flows/generate-image-flow';
import { useToast } from '@/hooks/use-toast';
import { useDoc } from '@/firebase/firestore/use-doc';

import { GeneratorLayout } from '@/components/generator/generator-layout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Skeleton } from '@/components/ui/skeleton';
import { Download, ImageIcon, Loader2, Sparkles } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';


const formSchema = z.object({
  prompt: z.string().min(5, { message: 'Prompt yuav tsum muaj yam tsawg kawg yog 5 tus niam ntawv.' }),
  aspectRatio: z.string().default("1:1"),
  imageCount: z.number().min(1).max(4).default(1),
});

interface GeneratedImage {
  prompt: string;
  imageUrl: string;
  createdAt: any;
}

const BASE_IMAGE_COST = 10;

function calculateCost(imageCount: number): number {
    return BASE_IMAGE_COST * imageCount;
}

function ImageGallerySkeleton() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
                 <Card key={i} className="overflow-hidden bg-muted border-none">
                    <Skeleton className="h-48 w-full" />
                    <CardContent className="p-3">
                        <Skeleton className="h-3 w-3/4 mb-2" />
                        <Skeleton className="h-3 w-1/2" />
                    </CardContent>
                 </Card>
            ))}
        </div>
    )
}

function ImageFeed({ images, isLoading }: { images: WithId<GeneratedImage>[] | null, isLoading: boolean }) {
  if (isLoading) {
    return <ImageGallerySkeleton />;
  }
  
  if (!images || images.length === 0) {
    return (
       <div className="h-full flex flex-col items-center justify-center rounded-lg border border-dashed text-center p-8 bg-card">
            <ImageIcon className="mx-auto h-10 w-10 text-muted-foreground" />
            <h3 className="mt-4 text-md font-semibold">Tseem Tsis Tau Muaj Duab Li</h3>
            <p className="mt-1 text-xs text-muted-foreground">
            Koj cov duab yuav tshwm rau hauv qab no.
            </p>
        </div>
    )
  }
  
  return (
     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {images.map(image => (
             <Card key={image.id} className="overflow-hidden group bg-muted border-none">
                <div className="relative aspect-square w-full">
                    <Image src={image.imageUrl} alt={image.prompt} layout="fill" objectFit="cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                         <a href={image.imageUrl} download={`generated-image-${image.id}.png`} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="icon">
                                <Download className="h-4 w-4" />
                            </Button>
                         </a>
                    </div>
                </div>
                <CardContent className="p-3">
                    <p className="text-xs font-medium truncate" title={image.prompt}>{image.prompt}</p>
                    {image.createdAt?.toDate && (
                        <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(image.createdAt.toDate(), { addSuffix: true })}
                        </p>
                    )}
                </CardContent>
            </Card>
        ))}
    </div>
  )
}

function ImageGeneratorControls({ form, isGenerating }: { form: any, isGenerating: boolean }) {
     const imageCount = useWatch({ control: form.control, name: 'imageCount' });
     const cost = calculateCost(imageCount);
     
     return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(form.onSubmit)} className="space-y-6">
                <div className="space-y-6">
                    <FormField
                        control={form.control}
                        name="prompt"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Prompt</FormLabel>
                                <FormControl>
                                    <Textarea 
                                        placeholder="Piv txwv: Ib tug hluas nkauj hmoob zoo zoo nkauj tab tom ntsis plaub hau" 
                                        {...field} 
                                        className="min-h-[120px] bg-card border-none"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Card>
                        <CardContent className="space-y-6 pt-6">
                            <FormField
                                control={form.control}
                                name="aspectRatio"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Aspect Ratio</FormLabel>
                                        <FormControl>
                                           <ToggleGroup 
                                                type="single" 
                                                defaultValue="1:1" 
                                                className="justify-start"
                                                onValueChange={field.onChange}
                                                value={field.value}
                                            >
                                                <ToggleGroupItem value="1:1" aria-label="1:1">1:1</ToggleGroupItem>
                                                <ToggleGroupItem value="9:16" aria-label="9:16">9:16</ToggleGroupItem>
                                                <ToggleGroupItem value="16:9" aria-label="16:9">16:9</ToggleGroupItem>
                                            </ToggleGroup>
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            
                             <FormField
                                control={form.control}
                                name="imageCount"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Images per batch: {field.value}</FormLabel>
                                    <FormControl>
                                        <Slider
                                            min={1}
                                            max={4}
                                            step={1}
                                            value={[field.value]}
                                            onValueChange={(value) => field.onChange(value[0])}
                                        />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-2 pt-4">
                    <Button type="submit" disabled={isGenerating} size="lg" className="w-full">
                        {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                        {isGenerating ? 'Tab tom tsim duab...' : `Generate (${cost} credits)`}
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">Click Generate to create your image.</p>
                </div>
            </form>
        </Form>
    );
}

export default function GenerateImagePage() {
  const { user, firestore, firebaseApp, isUserLoading } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

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

  const imagesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'users', user.uid, 'generated_images'), orderBy('createdAt', 'desc'));
  }, [firestore, user]);

  const { data: images, isLoading: isImagesLoading } = useCollection<GeneratedImage>(imagesQuery);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: '',
      aspectRatio: "1:1",
      imageCount: 1,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !firestore || !firebaseApp || !profile) {
        toast({ title: 'Error', description: 'You must be logged in to generate images.', variant: 'destructive'});
        return;
    }

    const generationCost = calculateCost(values.imageCount);

    if (profile.credits < generationCost) {
        router.push('/billing');
        return;
    }
    
    setIsGenerating(true);
    try {
        await updateDoc(doc(firestore, 'users', user.uid), {
            credits: increment(-generationCost)
        });
        
        // This loop generates multiple images.
        for (let i = 0; i < values.imageCount; i++) {
            const { imageUrl: imageDataUri } = await generateImage({ prompt: values.prompt });

            const storage = getStorage(firebaseApp);
            const imageId = `${Date.now()}-${i}`;
            const storageRef = ref(storage, `generated-images/${user.uid}/${imageId}.png`);
            
            const uploadResult = await uploadString(storageRef, imageDataUri, 'data_url');
            const downloadUrl = await getDownloadURL(uploadResult.ref);

            const imagesCollection = collection(firestore, 'users', user.uid, 'generated_images');
            await addDoc(imagesCollection, {
                prompt: values.prompt,
                imageUrl: downloadUrl,
                createdAt: serverTimestamp(),
            });
        }


        toast({ title: 'Koj daim duab tau lawm lau!', description: `${values.imageCount} image(s) created and saved.` });

    } catch (error: any) {
      console.error('Koj daim duab tsim tsis tau:', error);

      // Re-credit user if generation fails
       await updateDoc(doc(firestore, 'users', user.uid), {
          credits: increment(generationCost)
      });
      
      let description = 'An unexpected error occurred.';
      if (typeof error.message === 'string') {
        const lowerCaseError = error.message.toLowerCase();
        if (lowerCaseError.includes('401') || lowerCaseError.includes('incorrect api key')) {
            description = 'Incorrect API key. Please make sure your OPENAI_API_KEY in the .env.local file is correct and restart the server.';
        } else if (lowerCaseError.includes('429') || lowerCaseError.includes('quota')) {
            description = 'You have exceeded the free usage limit for image generation. Please try again later or check your billing plan.';
        } else if (lowerCaseError.includes('billing')) {
             description = 'This feature may require a paid plan. Please check your billing details and try again.';
        }
        else {
            description = error.message;
        }
      }
      
      toast({
        title: 'Koj daim duab tsim tsis tau',
        description: description,
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  }

  // Attach onSubmit to the form object so it can be accessed in the child component
  (form as any).onSubmit = onSubmit;
  
  const isLoading = isUserLoading || isProfileLoading;

  if (isLoading || !user) {
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <p>Loading...</p>
        </div>
    );
  }

  const controlPanel = <ImageGeneratorControls form={form} isGenerating={isGenerating} />;
  const contentPanel = <ImageFeed images={images} isLoading={isImagesLoading} />;

  return (
    <GeneratorLayout
      activeTab="image"
      controlPanel={controlPanel}
      contentPanel={contentPanel}
    />
  );
}
