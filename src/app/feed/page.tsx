'use client';

import { useMemo } from 'react';
import { useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, Timestamp } from 'firebase/firestore';
import { useCollection, WithId } from '@/firebase/firestore/use-collection';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ImageIcon, Download, Share2 } from 'lucide-react';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface PublicImage {
  prompt: string;
  imageUrl: string;
  createdAt: Timestamp;
  authorName: string;
  authorPhotoUrl?: string;
}

function FeedSkeleton() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
                <Card key={i} className="overflow-hidden bg-muted border-none">
                    <Skeleton className="aspect-square w-full" />
                    <div className="p-3">
                        <Skeleton className="h-4 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-1/2" />
                    </div>
                </Card>
            ))}
        </div>
    );
}

export default function FeedPage() {
    const { firestore } = useFirebase();

    const publicImagesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'public_images'), orderBy('createdAt', 'desc'));
    }, [firestore]);

    const { data: publicImages, isLoading } = useCollection<PublicImage>(publicImagesQuery);
    
    if (isLoading && (!publicImages || publicImages.length === 0)) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Public Feed</h1>
                        <p className="text-muted-foreground">Discover images created by the community.</p>
                    </div>
                </div>
                <FeedSkeleton />
            </DashboardLayout>
        );
    }
    
    return (
        <DashboardLayout>
             <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Public Feed</h1>
                    <p className="text-muted-foreground">Discover images created by the community.</p>
                </div>
                 <Link href="/gallery" passHref>
                    <Button>
                        <Share2 className="mr-2 h-4 w-4" />
                        Share Your Images
                    </Button>
                </Link>
            </div>

            {publicImages && publicImages.length === 0 ? (
                 <div className="flex flex-col items-center justify-center rounded-lg border border-dashed text-center p-12 h-full">
                    <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">The Feed is Empty</h3>
                    <p className="mt-2 mb-4 text-sm text-muted-foreground">
                        Be the first to share an image to the public feed!
                    </p>
                    <Link href="/gallery" passHref>
                        <Button>
                            <Share2 className="mr-2 h-4 w-4" />
                            Go to Gallery
                        </Button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {publicImages?.map(item => (
                         <Card key={item.id} className="overflow-hidden group bg-muted border-none">
                            <div className="relative aspect-square w-full">
                                <Image src={item.imageUrl} alt={item.prompt} layout="fill" objectFit="cover" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <a href={item.imageUrl} download={`public-image-${item.id}.png`} target="_blank" rel="noopener noreferrer">
                                        <Button variant="outline" size="icon">
                                            <Download className="h-4 w-4" />
                                        </Button>
                                    </a>
                                </div>
                            </div>
                            <div className="p-3">
                                <p className="text-xs font-medium truncate" title={item.prompt}>{item.prompt}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    {item.authorPhotoUrl ? 
                                      <Image src={item.authorPhotoUrl} alt={item.authorName} width={20} height={20} className="rounded-full" />
                                      : <div className="w-5 h-5 rounded-full bg-muted-foreground"></div>
                                    }
                                    <p className="text-xs text-muted-foreground truncate">{item.authorName}</p>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </DashboardLayout>
    );
}
