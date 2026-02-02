import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ExpenseMonthSelectorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function ExpenseMonthSelector({ selectedDate, onDateChange }: ExpenseMonthSelectorProps) {
  const goToPreviousMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() - 1);
    onDateChange(newDate);
  };

  const goToNextMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + 1);
    onDateChange(newDate);
  };

  const goToCurrentMonth = () => {
    onDateChange(new Date());
  };

  const isCurrentMonth = () => {
    const now = new Date();
    return selectedDate.getMonth() === now.getMonth() && 
           selectedDate.getFullYear() === now.getFullYear();
  };

  return (
    <div className="flex items-center gap-2 bg-card border rounded-lg p-2">
      <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      <div className="flex items-center gap-2 min-w-[180px] justify-center px-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium capitalize">
          {format(selectedDate, 'MMMM yyyy', { locale: ptBR })}
        </span>
      </div>
      
      <Button variant="outline" size="icon" onClick={goToNextMonth}>
        <ChevronRight className="h-4 w-4" />
      </Button>
      
      {!isCurrentMonth() && (
        <Button variant="ghost" size="sm" onClick={goToCurrentMonth}>
          Hoje
        </Button>
      )}
    </div>
  );
}
