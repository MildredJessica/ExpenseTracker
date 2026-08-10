import * as ToastPrimitives from '@radix-ui/react-toast'
import { X } from 'lucide-react'
import { useToast } from '@/hooks/useToast'
import { cn } from '@/lib/utils'

export function Toaster() {
  const { toasts } = useToast()
  return (
    <ToastPrimitives.Provider>
      {toasts.map(({ id, title, description, variant, open, onOpenChange }) => (
        <ToastPrimitives.Root
          key={id}
          open={open}
          onOpenChange={onOpenChange}
          className={cn(
            'group pointer-events-auto relative flex w-full max-w-sm items-center justify-between space-x-4 overflow-hidden rounded-xl border p-4 pr-8 shadow-lg transition-all data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-80 data-[state=open]:slide-in-from-bottom-full',
            variant === 'destructive' && 'border-destructive/30 bg-destructive/10 text-destructive',
            variant === 'success' && 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100',
            (!variant || variant === 'default') && 'border bg-card text-card-foreground'
          )}
        >
          <div className="grid gap-1">
            {title && <p className="text-sm font-semibold">{title}</p>}
            {description && <p className="text-sm opacity-90">{description}</p>}
          </div>
          <ToastPrimitives.Close className="absolute right-2 top-2 rounded-md p-1 opacity-0 transition-opacity hover:opacity-100 group-hover:opacity-100">
            <X className="h-4 w-4" />
          </ToastPrimitives.Close>
        </ToastPrimitives.Root>
      ))}
      <ToastPrimitives.Viewport className="fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:max-w-[420px]" />
    </ToastPrimitives.Provider>
  )
}
