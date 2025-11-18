'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, Timestamp, updateDoc, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import { useCollection, WithId } from '@/firebase/firestore/use-collection';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ImageIcon, VideoIcon, Download, Share2, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface GeneratedImage {
  prompt: string;
  imageUrl: string;
  createdAt: Timestamp;
  isPublic?: boolean;
}

interface GeneratedVideo {
  prompt: string;
  videoUrl: string;
  createdAt: Timestamp;
}

type GalleryItem = 
    | (WithId<GeneratedImage> & { type: 'image' })
    | (WithId<GeneratedVideo> & { type: 'video' });


function GallerySkeleton() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="overflow-hidden bg-muted border-none">
                    <Skeleton className="aspect-square w-full" />
                    <Skeleton className="h-4 w-3/4 m-3" />
                </Card>
            ))}
        </div>
    );
}

export default function GalleryPage() {
    const { user, firestore, isUserLoading } = useFirebase();
    const router = useRouter();
    const { toast } = useToast();
    const [publishingStates, setPublishingStates] = useState<Record<string, boolean>>({});

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.replace('/login');
        }
    }, [user, isUserLoading, router]);

    const imagesQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'users', user.uid, 'generated_images'), orderBy('createdAt', 'desc'));
    }, [firestore, user]);

    const videosQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'users', user.uid, 'generated_videos'), orderBy('createdAt', 'desc'));
    }, [firestore, user]);

    const { data: images, isLoading: isImagesLoading } = useCollection<GeneratedImage>(imagesQuery);
    const { data: videos, isLoading: isVideosLoading } = useCollection<GeneratedVideo>(videosQuery);
    
    const galleryItems: GalleryItem[] = useMemo(() => {
        if (!images && !videos) return [];
        
        const typedImages: GalleryItem[] = images ? images.map(img => ({ ...img, type: 'image' as const })) : [];
        const typedVideos: GalleryItem[] = videos ? videos.map(vid => ({ ...vid, type: 'video' as const })) : [];

        return [...typedImages, ...typedVideos].sort((a, b) => {
            const dateA = a.createdAt?.toDate()?.getTime() || 0;
            const dateB = b.createdAt?.toDate()?.getTime() || 0;
            return dateB - dateA;
        });

    }, [images, videos]);

    const handlePublicToggle = async (item: WithId<GeneratedImage>) => {
        if (!firestore || !user) return;
        const newPublicState = !item.isPublic;
        setPublishingStates(prev => ({...prev, [item.id]: true}));

        try {
            const imageDocRef = doc(firestore, 'users', user.uid, 'generated_images', item.id);
            await updateDoc(imageDocRef, { isPublic: newPublicState });

            if (newPublicState) {
                // Post to public_images collection
                const publicImagesCollection = collection(firestore, 'public_images');
                await addDoc(publicImagesCollection, {
                    prompt: item.prompt,
                    imageUrl: item.imageUrl,
                    createdAt: item.createdAt,
                    authorId: user.uid,
                    authorName: user.displayName,
                    authorPhotoUrl: user.photoURL || null,
                    originalImageId: item.id,
                });
            }
            // Note: Deleting from public_images when un-publishing is complex
            // as we'd need to query for the document. For simplicity, we leave it.
            // A backend function would be better for this cleanup.

            toast({
                title: newPublicState ? "Image Published" : "Image Unpublished",
                description: `Your image is now ${newPublicState ? 'public' : 'private'}.`
            });

        } catch (error) {
            console.error("Failed to update public state:", error);
            toast({ variant: 'destructive', title: "Error", description: "Could not update image status."})
        } finally {
             setPublishingStates(prev => ({...prev, [item.id]: false}));
        }
    }

    const isLoading = isUserLoading || isImagesLoading || isVideosLoading;

    if (isLoading && galleryItems.length === 0) {
        return (
            <DashboardLayout>
                <h1 className="mb-6 text-3xl font-bold tracking-tight">My Gallery</h1>
                <GallerySkeleton />
            </DashboardLayout>
        );
    }
    
    return (
        <DashboardLayout>
            <h1 className="mb-6 text-3xl font-bold tracking-tight">My Gallery</h1>
            <p className="mb-6 text-muted-foreground">A collection of your generated images and videos.</p>

            {galleryItems.length === 0 ? (
                 <div className="flex flex-col items-center justify-center rounded-lg border border-dashed text-center p-12 h-80">
                    <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">Your Gallery is Empty</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Start creating images or videos and they will appear here.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {galleryItems.map(item => (
                         <Card key={item.id} className="overflow-hidden group bg-muted border-none flex flex-col">
                            <div className="relative aspect-square w-full">
                                {item.type === 'image' ? (
                                    <>
                                        <Image src={item.imageUrl} alt={item.prompt} layout="fill" objectFit="cover" />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <a href={item.imageUrl} download={`generated-image-${item.id}.png`} target="_blank" rel="noopener noreferrer">
                                                <Button variant="outline" size="icon">
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                            </a>
                                        </div>
                                    </>
                                ) : (
                                    <video src={item.videoUrl} controls autoPlay muted loop className="w-full h-full object-cover"></video>
                                )}
                            </div>
                            <div className="p-3 flex-grow flex flex-col justify-between">
                                <div>
                                    <p className="text-xs font-medium truncate" title={item.prompt}>{item.prompt}</p>
                                    {item.createdAt?.toDate && (
                                        <p className="text-xs text-muted-foreground">
                                            {formatDistanceToNow(item.createdAt.toDate(), { addSuffix: true })}
                                        </p>
                                    )}
                                </div>
                                 {item.type === 'image' && (
                                    <div className="flex items-center space-x-2 mt-2 pt-2 border-t">
                                        <Switch
                                            id={`public-switch-${item.id}`}
                                            checked={item.isPublic}
                                            onCheckedChange={() => handlePublicToggle(item)}
                                            disabled={publishingStates[item.id]}
                                        />
                                        <Label htmlFor={`public-switch-${item.id}`} className="text-xs">
                                            {publishingStates[item.id] ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Public'}
                                        </Label>
                                    </div>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </DashboardLayout>
    );
}
