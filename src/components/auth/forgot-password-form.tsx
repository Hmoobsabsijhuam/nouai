'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { AuthCard } from './auth-card';
import { KeyRound } from 'lucide-react';

const formSchema = z.object({
  email: z.string().email({ message: 'Ntaus koj tus email kom raug' }),
});

export function ForgotPasswordForm() {
  const { toast } = useToast();
  const { auth } = useFirebase();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    if (!auth) return;
    try {
      await sendPasswordResetEmail(auth, values.email);
      setSubmitted(true);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to send password reset email. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }
  
  if (submitted) {
    return (
      <AuthCard
        title="Check Your Email"
        description={`We've sent a password reset link to ${form.getValues('email')}.`}
      >
        <div className="text-center text-sm">
          Didn&apos;t receive it? Check your spam folder or{' '}
          <button
            onClick={() => onSubmit(form.getValues())}
            disabled={loading}
            className="font-semibold text-primary hover:underline disabled:opacity-50"
          >
            try again
          </button>
          .
        </div>
        <div className="mt-6 text-center text-sm">
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Back to login
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Hnov Qab Password?"
      description="Txhob txhawj, Peb mam li xa ib tug link rau koj tus email."
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="name@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Sending...' : 'Xa tus Password Reset Link'}
            <KeyRound className="ml-2 h-4 w-4" />
          </Button>
        </form>
      </Form>
      <div className="mt-6 text-center text-sm">
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Rov qab mus rau Login
        </Link>
      </div>
    </AuthCard>
  );
}
