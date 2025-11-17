'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { doc, collection, query, orderBy, addDoc, serverTimestamp, updateDoc, Timestamp } from 'firebase/firestore';
import { useFirebase, useMemoFirebase } from '@/firebase';
import { useDoc } from '@/firebase/firestore/use-doc';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useToast } from '@/hooks/use-toast';
import { format, formatDistanceToNow } from 'date-fns';

import { Header } from '@/components/dashboard/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface SupportTicket {
  userId: string;
  subject: string;
  status: 'open' | 'closed';
  createdAt: Timestamp;
}

interface TicketMessage {
  text: string;
  senderId: string;
  senderRole: 'user' | 'admin';
  createdAt: Timestamp;
}

function PageSkeleton() {
    return (
        <div className="flex min-h-screen w-full flex-col bg-background">
            <Header />
            <main className="flex-1 p-4 md:p-8">
                <div className="mx-auto max-w-3xl">
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <Skeleton className="h-20 w-full" />
                                <Skeleton className="h-20 w-full" />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Skeleton className="h-10 w-full" />
                        </CardFooter>
                    </Card>
                </div>
            </main>
        </div>
    )
}

export default function TicketDetailsPage() {
  const { user, firestore, isUserLoading } = useFirebase();
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const ticketId = params.ticketId as string;

  const [reply, setReply] = useState('');
  const [isSending, setIsSending] = useState(false);
  const isAdmin = user?.email === 'admin@noukha.com';

  const ticketDocRef = useMemoFirebase(() => {
    if (!firestore || !ticketId) return null;
    return doc(firestore, 'support_tickets', ticketId);
  }, [firestore, ticketId]);

  const { data: ticket, isLoading: isTicketLoading, error: ticketError } = useDoc<SupportTicket>(ticketDocRef);
  
  const messagesQuery = useMemoFirebase(() => {
    if (!firestore || !ticketId) return null;
    return query(collection(firestore, `support_tickets/${ticketId}/messages`), orderBy('createdAt', 'asc'));
  }, [firestore, ticketId]);
  
  const { data: messages, isLoading: messagesLoading } = useCollection<TicketMessage>(messagesQuery);
  
  useEffect(() => {
      if (!isUserLoading && !user) {
          router.replace('/login');
        }
    }, [user, isUserLoading, router]);
    
    useEffect(() => {
        if (!isTicketLoading && ticket && user) {
            if (ticket.userId !== user.uid && !isAdmin) {
                toast({ title: 'Access Denied', description: 'You can only view your own tickets.', variant: 'destructive'});
                router.replace('/my-tickets');
            }
    }
  }, [ticket, isTicketLoading, user, isAdmin, router, toast]);


  const handleReplySubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!reply.trim() || !ticket || !user || !firestore) return;
    setIsSending(true);

    try {
        const messagesCol = collection(firestore, `support_tickets/${ticketId}/messages`);
        await addDoc(messagesCol, {
            text: reply,
            senderId: user.uid,
            senderRole: isAdmin ? 'admin' : 'user',
            createdAt: serverTimestamp(),
        });
        
        await updateDoc(ticketDocRef!, { updatedAt: serverTimestamp() });

        setReply('');
        toast({ title: 'Reply Sent' });

    } catch (error: any) {
        console.error("Error sending reply:", error);
        toast({ title: 'Error', description: 'Could not send reply.', variant: 'destructive' });
    } finally {
        setIsSending(false);
    }
  };


  if (isUserLoading || isTicketLoading || !user) {
    return <PageSkeleton />;
  }
  
  if (!ticket) {
      return (
          <div className="flex min-h-screen w-full flex-col bg-background">
                <Header />
                 <main className="flex flex-1 items-center justify-center p-4 md:p-8">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold">Ticket Not Found</h1>
                        <p className="text-muted-foreground">This support ticket could not be found.</p>
                        <Button asChild className="mt-4">
                            <Link href={isAdmin ? '/admin' : '/my-tickets'}>Go Back</Link>
                        </Button>
                    </div>
                </main>
           </div>
      )
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Header />
      <main className="flex-1 p-4 md:p-8">
        <div className="mx-auto max-w-3xl">
          <Card className="flex flex-col h-[85vh]">
            <CardHeader>
                <div className="flex items-center gap-4">
                    <Link href={isAdmin ? "/admin" : "/my-tickets"} passHref>
                        <Button variant="outline" size="icon" className="h-8 w-8">
                           <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-2">
                             <CardTitle>{ticket.subject}</CardTitle>
                             <Badge variant={ticket.status === 'open' ? 'destructive' : 'secondary'}>{ticket.status}</Badge>
                        </div>
                        <CardDescription>
                            Created on {ticket.createdAt && format(ticket.createdAt.toDate(), "PPP")}
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <ScrollArea className="flex-1 -mt-6">
                <CardContent className="py-6 space-y-6">
                    {messagesLoading ? (
                        <div className="space-y-4">
                            <Skeleton className="h-16 w-3/4" />
                            <Skeleton className="h-16 w-3/4 ml-auto" />
                        </div>
                    ) : (
                        messages?.map(message => (
                             <div key={message.id} className={cn(
                                "flex items-end gap-2",
                                (message.senderRole === 'admin' && isAdmin) || (message.senderRole === 'user' && !isAdmin)
                                    ? 'justify-end' 
                                    : 'justify-start'
                            )}>
                                {((message.senderRole === 'user' && isAdmin) || (message.senderRole === 'admin' && !isAdmin)) && (
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback>{message.senderRole.charAt(0).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                )}
                                <div className={cn(
                                    "max-w-xs md:max-w-md p-3 rounded-lg",
                                     (message.senderRole === 'admin' && isAdmin) || (message.senderRole === 'user' && !isAdmin)
                                        ? 'bg-primary text-primary-foreground' 
                                        : 'bg-muted'
                                )}>
                                    <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                                    <p className={cn("text-xs mt-1", (message.senderRole === 'admin' && isAdmin) || (message.senderRole === 'user' && !isAdmin) ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                                        {message.createdAt && formatDistanceToNow(message.createdAt.toDate(), { addSuffix: true })}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </CardContent>
            </ScrollArea>
             {ticket.status === 'open' && (
                <CardFooter>
                    <form onSubmit={handleReplySubmit} className="w-full flex items-start gap-2">
                        <Textarea
                            placeholder="Type your reply..."
                            value={reply}
                            onChange={(e) => setReply(e.target.value)}
                            disabled={isSending}
                            className="min-h-[40px] max-h-48"
                        />
                        <Button type="submit" size="icon" disabled={isSending || !reply.trim()}>
                            {isSending ? <Loader2 className="animate-spin" /> : <Send />}
                            <span className="sr-only">Send Reply</span>
                        </Button>
                    </form>
                </CardFooter>
             )}
          </Card>
        </div>
      </main>
    </div>
  );
}
