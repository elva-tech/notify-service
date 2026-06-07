'use client';

import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { PlaygroundSidebar } from '@/components/playground/playground-sidebar';
import type { PlaygroundTab } from '@/lib/playground-config';

interface PlaygroundMobileNavProps {
  tabs: PlaygroundTab[];
  activeTab: 'sms' | 'email';
  activeEndpointId: string;
  onTabChange: (tab: 'sms' | 'email') => void;
  onEndpointSelect: (endpointId: string) => void;
  hidden?: boolean;
}

export function PlaygroundMobileNav({ hidden = false, ...props }: PlaygroundMobileNavProps) {
  if (hidden) return null;
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="w-full justify-start gap-2 lg:hidden">
          <Menu className="h-4 w-4" />
          Choose API endpoint
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[min(100vw-1.5rem,20rem)] overflow-y-auto p-4 pt-12">
        <SheetTitle className="sr-only">Playground endpoints</SheetTitle>
        <PlaygroundSidebar embedded {...props} />
      </SheetContent>
    </Sheet>
  );
}
