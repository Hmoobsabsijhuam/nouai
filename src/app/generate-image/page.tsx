'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { addDoc, collection, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import { useFirebase, useMemoFirebase } from '@/firebase';
import { useCollection, WithId } from '@/firebase/firestore/use-collection';
import { generateImage } from '@/ai/flows/generate-image-flow';
import { useToast } from '@/hooks/use-toast';

import { Header } from '@/components/dashboard/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Skeleton } from '@/components/ui/skeleton';
import { Download, ImageIcon, Loader2, Wand2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const formSchema = z.object({
  prompt: z.string().min(5, { message: 'Prompt must be at least 5 characters long.' }),
});

interface GeneratedImage {
  prompt: string;
  imageUrl: string;
  createdAt: any;
}

function ImageGallerySkeleton() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
                 <Card key={i} className="overflow-hidden">
                    <Skeleton className="h-48 w-full" />
                    <CardContent className="p-4">
                        <Skeleton className="h-4 w-3/4 mb-2" />
                        <Skeleton className="h-3 w-1/2" />
                    </CardContent>
                 </Card>
            ))}
        </div>
    )
}

export default function GenerateImagePage() {
  const { user, firestore, firebaseApp, isUserLoading } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);

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
    },
  });

  const handleDownload = () => {
    if (generatedImageUrl) {
        const link = document.createElement('a');
        link.href = generatedImageUrl;
        link.download = `generated-image-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !firestore || !firebaseApp) {
        toast({ title: 'Error', description: 'You must be logged in to generate images.', variant: 'destructive'});
        return;
    }
    
    setIsGenerating(true);
    setGeneratedImageUrl(null);
    try {
        const { imageUrl: imageDataUri } = await generateImage({ prompt: values.prompt });
        setGeneratedImageUrl(imageDataUri);

        // Upload to Firebase Storage
        const storage = getStorage(firebaseApp);
        const imageId = `${Date.now()}`;
        const storageRef = ref(storage, `generated-images/${user.uid}/${imageId}.png`);
        
        const uploadResult = await uploadString(storageRef, imageDataUri, 'data_url');
        const downloadUrl = await getDownloadURL(uploadResult.ref);

        // Save to Firestore
        const imagesCollection = collection(firestore, 'users', user.uid, 'generated_images');
        await addDoc(imagesCollection, {
            prompt: values.prompt,
            imageUrl: downloadUrl,
            createdAt: serverTimestamp(),
        });

        toast({ title: 'Image Generated!', description: 'Your image has been created and saved.' });

    } catch (error: any) {
      console.error('Image generation failed:', error);
      let description = 'An unexpected error occurred.';
      if (typeof error.message === 'string') {
        if (error.message.includes('429') || error.message.toLowerCase().includes('quota')) {
            description = 'You have exceeded the free usage limit for image generation. Please try again later or check your billing plan.';
        } else {
            description = error.message;
        }
      }
      
      toast({
        title: 'Image Generation Failed',
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
                    <CardTitle className="flex items-center gap-2">
                        <Wand2 />
                        Text-to-Image Generation
                    </CardTitle>
                    <CardDescription>Describe the image you want to create. Be as specific as you can!</CardDescription>
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
                                    <Input placeholder="e.g., A majestic lion in a futuristic city, cinematic lighting" {...field} />
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

            {(isGenerating || generatedImageUrl) && (
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle>Result</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center">
                       {isGenerating ? (
                           <div className="flex flex-col items-center gap-4 p-8 text-muted-foreground">
                               <Loader2 className="h-8 w-8 animate-spin" />
                               <p>Generating your masterpiece... this can take a moment.</p>
                           </div>
                       ) : generatedImageUrl ? (
                           <Image src={generatedImageUrl} alt={form.getValues('prompt')} width={512} height={512} className="rounded-lg" />
                       ) : null}
                    </CardContent>
                    {generatedImageUrl && (
                        <CardFooter>
                           <Button onClick={handleDownload} className="w-full">
                                <Download className="mr-2 h-4 w-4" />
                                Download Image
                            </Button>
                        </CardFooter>
                    )}
                </Card>
            )}

            <div className="space-y-4">
                <h2 className="text-2xl font-bold tracking-tight">Your Gallery</h2>
                 {isImagesLoading ? (
                    <ImageGallerySkeleton />
                ) : images && images.length > 0 ? (
                     <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {images.map(image => (
                             <Card key={image.id} className="overflow-hidden group">
                                <div className="relative h-48 w-full">
                                    <Image src={image.imageUrl} alt={image.prompt} layout="fill" objectFit="cover" />
                                </div>
                                <CardContent className="p-4">
                                    <p className="text-sm font-medium truncate" title={image.prompt}>{image.prompt}</p>
                                    {image.createdAt?.toDate && (
                                        <p className="text-xs text-muted-foreground">
                                            {formatDistanceToNow(image.createdAt.toDate(), { addSuffix: true })}
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
                        <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-semibold">No images yet</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                        Your generated images will appear here.
                        </p>
                    </div>
                )}
            </div>
        </div>
      </main>
    </div>
  );
}
