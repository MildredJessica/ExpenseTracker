import { SignUp } from '@clerk/clerk-react'
import { Receipt } from 'lucide-react'

export function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-8">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <Receipt className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="font-display text-2xl font-bold">Create your account</h1>
          <p className="mt-1 text-sm text-muted-foreground">Start tracking expenses today</p>
        </div>
        <SignUp routing="path" path="/sign-up" afterSignUpUrl="/"
          appearance={{ elements: { rootBox: 'w-full', card: 'shadow-none border rounded-2xl', headerTitle: 'font-display' } }} />
      </div>
    </div>
  )
}
