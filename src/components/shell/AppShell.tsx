import type { ReactNode } from 'react';

import { AppFooter } from './AppFooter';
import { AppHeader } from './AppHeader';

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex min-h-screen min-w-0 flex-col overflow-x-clip bg-gray-50">
      <AppHeader />
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      <AppFooter />
    </div>
  );
}
