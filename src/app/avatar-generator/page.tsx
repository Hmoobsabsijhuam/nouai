
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { useFirebase, useMemoFirebase } from '@/firebase';
import { generateAvatar } from '@/ai/flows/generate-avatar-flow';
import { useToast } from '@/hooks/use-toast';
import { useCollection, WithId } from '@/firebase/firestore/use-collection';
import { collection, query, orderBy, serverTimestamp, addDoc, doc, updateDoc, increment } from 'firebase/firestore';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';

import { GeneratorLayout } from '@/components/generator/generator-layout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Image as ImageIcon, Loader2, Sparkles, Wand2 } from 'lucide-react';
import Image from 'next/image';
import { useDoc } from '@/firebase/firestore/use-doc';

const formSchema = z.object({
  prompt: z.string().min(5, { message: 'Prompt must be at least 5 characters long.' }),
});

interface GeneratedAvatar {
  prompt: string;
  imageUrl: string;
  createdAt: any;
}

const AVATAR_GENERATION_COST = 10;

function calculateCost(): number {
  return AVATAR_GENERATION_COST;
}

function AvatarFeedSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="overflow-hidden bg-muted border-none">
          <Skeleton className="aspect-square w-full" />
        </Card>
      ))}
    </div>
  );
}

function AvatarFeed({ avatars, isLoading, isGenerating }: { avatars: WithId<GeneratedAvatar>[] | null, isLoading: boolean, isGenerating: boolean }) {
  if (isLoading && !isGenerating) {
    return <AvatarFeedSkeleton />;
  }

  if ((!avatars || avatars.length === 0) && !isGenerating) {
    return (
      <div className="h-full flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center bg-card">
        <ImageIcon className="mx-auto h-10 w-10 text-muted-foreground" />
        <h3 className="mt-4 text-md font-semibold">No Avatars Generated Yet</h3>
        <p className="mt-1 text-xs text-muted-foreground">Your generated avatars will appear here.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {isGenerating && (
        <Card className="overflow-hidden bg-muted border-none aspect-square">
          <div className="w-full h-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span>Generating Avatar...</span>
            </div>
          </div>
        </Card>
      )}
      {avatars?.map(avatar => (
        <div key={avatar.id}>
          <Image src={avatar.imageUrl} alt={avatar.prompt} width={256} height={256} className="rounded-lg w-full aspect-square object-cover" />
          <p className="text-xs text-muted-foreground mt-1 truncate" title={avatar.prompt}>{avatar.prompt}</p>
        </div>
      ))}
    </div>
  );
}

function AvatarGeneratorControls({ form, isGenerating, cost }: { form: any, isGenerating: boolean, cost: number }) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(form.onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="prompt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Avatar Prompt</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="e.g., A futuristic robot with a friendly smile"
                  {...field}
                  className="min-h-[100px] bg-card border-none"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="space-y-2 pt-4">
          <Button type="submit" disabled={isGenerating} size="lg" className="w-full">
            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            {isGenerating ? 'Generating...' : `Generate Avatar (${cost} credits)`}
          </Button>
          <p className="text-xs text-muted-foreground text-center">Create a unique avatar for your profile.</p>
        </div>
      </form>
    </Form>
  );
}

export default function AvatarGeneratorPage() {
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

  const avatarsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'users', user.uid, 'generated_avatars'), orderBy('createdAt', 'desc'));
  }, [firestore, user]);

  const { data: avatars, isLoading: isAvatarsLoading } = useCollection<GeneratedAvatar>(avatarsQuery);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: '',
    },
  });

  const cost = calculateCost();

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !firestore || !firebaseApp || !profile) {
      toast({ title: 'Error', description: 'You must be logged in to generate avatars.', variant: 'destructive' });
      return;
    }

    if (profile.credits < cost) {
      router.push('/billing');
      return;
    }

    setIsGenerating(true);
    try {
      await updateDoc(doc(firestore, 'users', user.uid), {
        credits: increment(-cost)
      });

      const { imageUrl: imageDataUri } = await generateAvatar({ prompt: values.prompt });

      const storage = getStorage(firebaseApp);
      const avatarId = `${Date.now()}`;
      const storageRef = ref(storage, `generated-avatars/${user.uid}/${avatarId}.png`);

      const uploadResult = await uploadString(storageRef, imageDataUri, 'data_url');
      const downloadUrl = await getDownloadURL(uploadResult.ref);

      const avatarsCollection = collection(firestore, 'users', user.uid, 'generated_avatars');
      await addDoc(avatarsCollection, {
        prompt: values.prompt,
        imageUrl: downloadUrl,
        createdAt: serverTimestamp(),
      });

      toast({ title: 'Avatar Generated!', description: 'Your new avatar has been created and saved.' });

    } catch (error: any) {
      console.error('Avatar generation failed:', error);

      await updateDoc(doc(firestore, 'users', user.uid), {
        credits: increment(cost)
      });

      let description = 'An unexpected error occurred.';
      if (typeof error.message === 'string') {
        const lowerCaseError = error.message.toLowerCase();
        if (lowerCaseError.includes('429') || lowerCaseError.includes('quota')) {
          description = 'You have exceeded the free usage limit for avatar generation. Please try again later or check your billing plan.';
        } else if (lowerCaseError.includes('billing')) {
          description = 'This feature may require a paid plan. Please check your billing details and try again.';
        } else {
          description = 'An unexpected error occurred during avatar generation.';
        }
      }

      toast({
        title: 'Avatar Generation Failed',
        description: description,
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  }

  (form as any).onSubmit = onSubmit;

  const isLoading = isUserLoading || isProfileLoading;

  if (isLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  const controlPanel = <AvatarGeneratorControls form={form} isGenerating={isGenerating} cost={cost} />;
  const contentPanel = <AvatarFeed avatars={avatars} isLoading={isAvatarsLoading} isGenerating={isGenerating} />;

  return (
    <GeneratorLayout
      activeTab="avatar"
      controlPanel={controlPanel}
      contentPanel={contentPanel}
    />
  );
}
