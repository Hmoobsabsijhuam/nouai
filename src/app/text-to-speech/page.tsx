
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { useFirebase } from '@/firebase';
import { generateSpeech } from '@/ai/flows/generate-speech-flow';
import { useToast } from '@/hooks/use-toast';

import { GeneratorLayout } from '@/components/generator/generator-layout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Loader2, Mic, Wand2, X } from 'lucide-react';

const formSchema = z.object({
  text: z.string().min(5, { message: 'Cov ntawv yam tsawg kawg yuav tsum muaj li 5 tus niam ntawv.' }),
  voice: z.enum(['Algenib', 'Achernar', 'Erinome', 'Gacrux', 'Puck']),
});

const voices = ['Algenib', 'Achernar', 'Erinome', 'Gacrux', 'Puck'] as const;

function TextToSpeechControls({ form, isGenerating }: { form: any, isGenerating: boolean }) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(form.onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="text"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Text to Convert</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Nyob zoo ntawm no kuv yog Nou AI yuav pab koj tsim koj lub suab."
                  {...field}
                  className="min-h-[150px] bg-secondary border-none"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="voice"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Voice</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a voice" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {voices.map(voice => (
                    <SelectItem key={voice} value={voice}>{voice}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isGenerating} size="lg" className="w-full">
          {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
          {isGenerating ? 'Tab Tom Tsim Suab...' : 'Generate Speech'}
        </Button>
      </form>
    </Form>
  );
}

function SpeechContent({ isGenerating, generatedAudioUrl, onDownload }: { isGenerating: boolean; generatedAudioUrl: string | null; onDownload: () => void; }) {
  if (!isGenerating && !generatedAudioUrl) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center rounded-lg border border-dashed text-center p-8">
        <Mic className="mx-auto h-10 w-10 text-muted-foreground" />
        <h3 className="mt-4 text-md font-semibold">Tsis tau muaj suab li</h3>
        <p className="mt-1 text-xs text-muted-foreground">Koj lub suab yuav tshwm sim ntawm no.</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-full">
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle>Generated Audio</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center p-6">
                {isGenerating ? (
                    <div className="flex flex-col items-center gap-4 p-8 text-muted-foreground">
                        <Loader2 className="h-8 w-8 animate-spin" />
                        <p>Tab Tom Tsim Koj Lub Suab...</p>
                    </div>
                ) : generatedAudioUrl ? (
                    <audio src={generatedAudioUrl} controls className="w-full"></audio>
                ) : null}
            </CardContent>
            {generatedAudioUrl && !isGenerating && (
                <CardFooter>
                    <Button onClick={onDownload} className="w-full">
                        <Download className="mr-2 h-4 w-4" />
                        Download Audio (.wav)
                    </Button>
                </CardFooter>
            )}
        </Card>
    </div>
  );
}


export default function GenerateSpeechPage() {
  const { user, isUserLoading } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/login');
    }
  }, [user, isUserLoading, router]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      text: '',
      voice: 'Algenib',
    },
  });

  const handleDownload = () => {
    if (generatedAudioUrl) {
        const link = document.createElement('a');
        link.href = generatedAudioUrl;
        link.download = `generated-audio-${Date.now()}.wav`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
        toast({ title: 'Error', description: 'You must be logged in to generate audio.', variant: 'destructive'});
        return;
    }
    
    setIsGenerating(true);
    setGeneratedAudioUrl(null);
    try {
        const { audioUrl } = await generateSpeech({ text: values.text, voice: values.voice });
        setGeneratedAudioUrl(audioUrl);
        toast({ title: 'Koj Lub Suab Tsim Tau Lawm!', description: 'Your audio has been created.' });

    } catch (error: any) {
      console.error('Audio generation failed:', error);
      let description = 'An unexpected error occurred during audio generation.';
       if (typeof error.message === 'string') {
        if (error.message.includes('429') || error.message.toLowerCase().includes('quota')) {
            description = 'You have exceeded the free usage limit for audio generation. Please try again later.';
        } else if (error.message.toLowerCase().includes('billing')) {
            description = 'This feature is only available on a paid plan. Please enable billing for your project to generate audio.';
        } else if (error.message.toLowerCase().includes('voice name')) {
            description = 'An invalid voice was selected. Please choose a different voice and try again.';
        }
        else {
            description = error.message;
        }
      }
      
      toast({
        title: 'Koj Lub Suab Tsim Tsis Tau',
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
        activeTab="speech"
        controlPanel={<TextToSpeechControls form={form} isGenerating={isGenerating} />}
        contentPanel={
            <SpeechContent
                isGenerating={isGenerating}
                generatedAudioUrl={generatedAudioUrl}
                onDownload={handleDownload}
            />
        }
    />
  );
}
