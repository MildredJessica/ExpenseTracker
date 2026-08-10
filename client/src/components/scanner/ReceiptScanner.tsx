import { useState, useRef, useCallback } from 'react'
import { Camera, Upload, X, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/index'
import { useApi } from '@/lib/apiContext'
import { cn } from '@/lib/utils'
import type { ScannedReceipt } from '@/types'

interface Props { onResult: (result: ScannedReceipt, imageFile: File) => void }
type ScanState = 'idle' | 'camera' | 'uploading' | 'processing' | 'done' | 'error'

export function ReceiptScanner({ onResult }: Props) {
  const api = useApi()
  const [state, setState] = useState<ScanState>('idle')
  const [preview, setPreview] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [confidence, setConfidence] = useState<number | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [])

  const startCamera = async () => {
    try {
      setState('camera')
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
    } catch {
      setState('error')
      setErrorMsg('Camera access denied. Please upload an image instead.')
    }
  }

  const capturePhoto = () => {
    if (!videoRef.current) return
    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    canvas.getContext('2d')!.drawImage(videoRef.current, 0, 0)
    canvas.toBlob(async (blob) => {
      if (!blob) return
      stopCamera()
      const file = new File([blob], 'receipt.jpg', { type: 'image/jpeg' })
      await processFile(file)
    }, 'image/jpeg', 0.92)
  }

  const processFile = async (file: File) => {
    setState('uploading')
    const url = URL.createObjectURL(file)
    setPreview(url)

    try {
      setState('processing')
      const result = await api.scanner.ocr(file)
      setConfidence(result.confidence)
      setState('done')
      onResult(result, file)
    } catch (err) {
      setState('error')
      setErrorMsg((err as Error).message || 'Could not read the receipt. Try a clearer image.')
    }
  }

  const reset = () => {
    stopCamera()
    setState('idle')
    setPreview(null)
    setErrorMsg(null)
    setConfidence(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="space-y-4">
      {/* Camera view */}
      {state === 'camera' && (
        <div className="relative overflow-hidden rounded-2xl bg-black aspect-[4/3]">
          <video ref={videoRef} autoPlay playsInline className="h-full w-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative h-56 w-72">
              {(['top-left','top-right','bottom-left','bottom-right'] as const).map((pos) => (
                <div key={pos} className={cn(
                  'corner-pulse absolute h-8 w-8 border-primary',
                  pos === 'top-left'     && 'top-0 left-0 border-t-2 border-l-2 rounded-tl-lg',
                  pos === 'top-right'    && 'top-0 right-0 border-t-2 border-r-2 rounded-tr-lg',
                  pos === 'bottom-left'  && 'bottom-0 left-0 border-b-2 border-l-2 rounded-bl-lg',
                  pos === 'bottom-right' && 'bottom-0 right-0 border-b-2 border-r-2 rounded-br-lg',
                )} />
              ))}
              <div className="scan-line absolute left-0 right-0 h-0.5 bg-primary/80 shadow-[0_0_8px_2px_hsl(var(--primary)/0.5)]" />
            </div>
          </div>
          <p className="absolute bottom-20 left-0 right-0 text-center text-xs text-white/70">
            Position receipt within the frame
          </p>
          <div className="absolute bottom-5 left-0 right-0 flex justify-center gap-3">
            <Button size="icon" variant="outline" className="rounded-full bg-white/10 border-white/30 text-white hover:bg-white/20" onClick={reset}>
              <X className="h-4 w-4" />
            </Button>
            <Button size="lg" className="rounded-full px-8" onClick={capturePhoto}>
              <Camera className="mr-2 h-4 w-4" />Capture
            </Button>
          </div>
        </div>
      )}

      {/* Processing */}
      {(state === 'uploading' || state === 'processing') && (
        <div className="rounded-2xl border bg-muted/30 p-8 text-center space-y-4">
          {preview && <img src={preview} alt="Receipt" className="mx-auto h-36 w-auto rounded-lg object-cover opacity-60" />}
          <div className="flex items-center justify-center gap-2 text-sm font-medium">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            {state === 'uploading' ? 'Uploading image...' : 'Reading receipt on server...'}
          </div>
          <p className="text-xs text-muted-foreground">
            {state === 'processing' && 'Tesseract.js is running server-side with image preprocessing'}
          </p>
        </div>
      )}

      {/* Done */}
      {state === 'done' && preview && (
        <div className="rounded-2xl border bg-accent/30 p-4 space-y-2">
          <div className="flex items-center gap-3">
            <img src={preview} alt="Receipt" className="h-16 w-12 rounded-lg object-cover" />
            <div className="flex-1">
              <div className="flex items-center gap-1.5 text-sm font-medium text-accent-foreground">
                <CheckCircle className="h-4 w-4 text-primary" />
                Receipt processed successfully
              </div>
              {confidence !== null && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  OCR confidence: {confidence.toFixed(0)}%
                </p>
              )}
            </div>
            <Button variant="ghost" size="icon-sm" onClick={reset}>
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Error */}
      {state === 'error' && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 flex items-start gap-3">
          <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
          <div className="flex-1 text-sm text-destructive">{errorMsg}</div>
          <Button variant="ghost" size="icon-sm" onClick={reset}>
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* Idle */}
      {(state === 'idle' || state === 'error') && (
        <div className="grid grid-cols-2 gap-3">
          <button onClick={startCamera}
            className="flex flex-col items-center gap-2.5 rounded-2xl border-2 border-dashed border-border bg-muted/30 p-6 text-center hover:border-primary/50 hover:bg-accent/30 transition-colors">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Camera className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">Take Photo</p>
              <p className="text-xs text-muted-foreground mt-0.5">Use your camera</p>
            </div>
          </button>
          <button onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center gap-2.5 rounded-2xl border-2 border-dashed border-border bg-muted/30 p-6 text-center hover:border-primary/50 hover:bg-accent/30 transition-colors">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">Upload Image</p>
              <p className="text-xs text-muted-foreground mt-0.5">JPG, PNG, WEBP</p>
            </div>
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
            const f = e.target.files?.[0]; if (f) processFile(f)
          }} />
        </div>
      )}
    </div>
  )
}
