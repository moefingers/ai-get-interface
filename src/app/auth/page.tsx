import { AuthTabs } from '@/components/shared'
import { tw } from '@/lib/tw-theme'
import { cn } from '@/lib/cn'
import Link from 'next/link'
import Image from 'next/image'

interface AuthPageProps {
  searchParams: Promise<{ after_auth_return_to?: string }>
}

export default async function AuthPage({ searchParams }: AuthPageProps) {
  const { after_auth_return_to } = await searchParams
  
  return (
    <main className={cn('min-h-dvh flex flex-col items-center justify-center p-4 gap-6', tw.bg.main)}>
      <Link href="/" className="transition-opacity hover:opacity-80">
        <Image src="/icon.png" alt="AI Get Interface" width={48} height={48} />
      </Link>
      <AuthTabs afterAuthReturnTo={after_auth_return_to} />
    </main>
  )
}
