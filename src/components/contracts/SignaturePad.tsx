import { useRef, useEffect, useState } from 'react';
import SignaturePadLib from 'signature_pad';
import { Button } from '@/components/ui/button';
import { Eraser, Undo2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SignaturePadProps {
  onSignatureChange: (signature: string | null) => void;
  className?: string;
}

export function SignaturePad({ onSignatureChange, className }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const signaturePadRef = useRef<SignaturePadLib | null>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    
    // Set canvas size
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    canvas.getContext('2d')?.scale(ratio, ratio);

    signaturePadRef.current = new SignaturePadLib(canvas, {
      backgroundColor: 'rgb(255, 255, 255)',
      penColor: 'rgb(0, 0, 0)',
    });

    signaturePadRef.current.addEventListener('endStroke', () => {
      setIsEmpty(signaturePadRef.current?.isEmpty() ?? true);
      if (!signaturePadRef.current?.isEmpty()) {
        onSignatureChange(signaturePadRef.current?.toDataURL('image/svg+xml') || null);
      }
    });

    // Resize handler
    const resizeCanvas = () => {
      const data = signaturePadRef.current?.toData();
      canvas.width = canvas.offsetWidth * ratio;
      canvas.height = canvas.offsetHeight * ratio;
      canvas.getContext('2d')?.scale(ratio, ratio);
      signaturePadRef.current?.clear();
      if (data) {
        signaturePadRef.current?.fromData(data);
      }
    };

    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      signaturePadRef.current?.off();
    };
  }, [onSignatureChange]);

  const handleClear = () => {
    signaturePadRef.current?.clear();
    setIsEmpty(true);
    onSignatureChange(null);
  };

  const handleUndo = () => {
    const data = signaturePadRef.current?.toData();
    if (data) {
      data.pop();
      signaturePadRef.current?.fromData(data);
      setIsEmpty(signaturePadRef.current?.isEmpty() ?? true);
      if (signaturePadRef.current?.isEmpty()) {
        onSignatureChange(null);
      } else {
        onSignatureChange(signaturePadRef.current?.toDataURL('image/svg+xml') || null);
      }
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="border-2 border-dashed border-border rounded-lg overflow-hidden bg-white">
        <canvas
          ref={canvasRef}
          className="w-full h-40 touch-none"
          style={{ touchAction: 'none' }}
        />
      </div>
      <div className="flex gap-2 justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleUndo}
          disabled={isEmpty}
        >
          <Undo2 className="h-4 w-4 mr-1" />
          Desfazer
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleClear}
          disabled={isEmpty}
        >
          <Eraser className="h-4 w-4 mr-1" />
          Limpar
        </Button>
      </div>
      <p className="text-xs text-muted-foreground text-center">
        Desenhe sua assinatura acima
      </p>
    </div>
  );
}
