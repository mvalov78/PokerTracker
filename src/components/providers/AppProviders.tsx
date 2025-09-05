'use client'

import { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { AuthProvider } from '@/hooks/useAuth'
import { ToastProvider } from '@/components/ui/Toast'
import Navigation from '@/components/ui/Navigation'

interface AppProvidersProps {
  children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  const pathname = usePathname()
  
  // Страницы, на которых не нужна навигация
  const noNavigationPages = ['/auth']
  const showNavigation = !noNavigationPages.includes(pathname)

  return (
    <ToastProvider>
      <AuthProvider>
        <div className="min-h-screen bg-background text-foreground">
          {showNavigation && <Navigation />}
          <main className={showNavigation ? '' : 'min-h-screen'}>
            {children}
          </main>
        </div>
      </AuthProvider>
    </ToastProvider>
  )
}
