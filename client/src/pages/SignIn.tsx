import { SignIn } from '@clerk/clerk-react'
import { Receipt } from 'lucide-react'

export function SignInPage() {
  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-foreground p-12 text-background">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Receipt className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-display text-lg font-bold">Expensify</span>
        </div>
        <div className="space-y-4">
          <blockquote className="font-display text-3xl font-bold leading-tight">
            "Track every penny, understand every pattern."
          </blockquote>
          <p className="text-background/60">Fullstack expense tracking with server-side OCR.</p>
        </div>
        <div className="flex gap-6 text-sm text-background/50">
          <span>✓ Server-side OCR</span><span>✓ Budget alerts</span><span>✓ CSV export</span>
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-md">
          <SignIn routing="path" path="/sign-in" afterSignInUrl="/"
            appearance={{ elements: { rootBox: 'w-full', card: 'shadow-none border rounded-2xl', headerTitle: 'font-display' } }} />
        </div>
      </div>
    </div>
  )
}
