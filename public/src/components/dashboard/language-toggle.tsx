'use client';

import * as React from 'react';
import { Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const languages = [
    { code: 'lo', name: 'Lao' },
    { code: 'th', name: 'Thai' },
    { code: 'en', name: 'English' },
    { code: 'vi', name: 'Vietnamese' },
    { code: 'hmn', name: 'Hmong' },
];

export function LanguageToggle() {
  const { toast } = useToast();

  const handleLanguageChange = (langName: string) => {
    toast({
        title: 'Feature Coming Soon',
        description: `${langName} translation is under development.`,
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Globe className="h-5 w-5" />
          <span className="sr-only">Toggle language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
            <DropdownMenuItem key={lang.code} onClick={() => handleLanguageChange(lang.name)}>
                {lang.name}
            </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
