import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ClassSlotOption {
  id: string;
  start_time: string;
  end_time: string;
  title: string | null;
  modality?: {
    name: string;
    variant: string | null;
  } | null;
}

interface SelectClassSlotModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slots: ClassSlotOption[];
  isLoading: boolean;
  onSelect: (slotId: string) => void;
  isPending: boolean;
}

export function SelectClassSlotModal({
  open,
  onOpenChange,
  slots,
  isLoading,
  onSelect,
  isPending,
}: SelectClassSlotModalProps) {
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

  const handleConfirm = () => {
    if (selectedSlotId) {
      onSelect(selectedSlotId);
    }
  };

  const formatTime = (time: string) => {
    return time.slice(0, 5);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Escolha o horário
          </DialogTitle>
          <DialogDescription>
            Selecione a aula em que você vai treinar hoje
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : slots.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              Nenhum horário disponível para hoje
            </div>
          ) : (
            slots.map((slot) => (
              <button
                key={slot.id}
                onClick={() => setSelectedSlotId(slot.id)}
                className={cn(
                  "w-full p-4 rounded-lg border text-left transition-all",
                  selectedSlotId === slot.id
                    ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                    : "border-border hover:border-primary/50 hover:bg-muted/50"
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">
                      {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {slot.modality?.name || slot.title || 'Aula'}
                      {slot.modality?.variant && slot.modality.variant !== 'none' && (
                        <span className="ml-1 uppercase text-xs">
                          ({slot.modality.variant})
                        </span>
                      )}
                    </p>
                  </div>
                  <div
                    className={cn(
                      "w-5 h-5 rounded-full border-2 transition-all",
                      selectedSlotId === slot.id
                        ? "border-primary bg-primary"
                        : "border-muted-foreground/40"
                    )}
                  >
                    {selectedSlotId === slot.id && (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-white" />
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedSlotId || isPending}
            className="flex-1"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar Presença
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
