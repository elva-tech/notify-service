'use client';

import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { PlatformSidebar } from '@/components/platform/platform-sidebar';

export function PlatformMobileNav() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="lg:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open platform navigation</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-80 p-0 pt-12">
        <SheetTitle className="sr-only">Platform navigation</SheetTitle>
        <div className="px-4">
          <PlatformSidebar />
        </div>
      </SheetContent>
    </Sheet>
  );
}
