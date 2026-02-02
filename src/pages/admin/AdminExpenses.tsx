import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ExpensesTable } from '@/components/finance/ExpensesTable';
import { ExpenseStats } from '@/components/finance/ExpenseStats';
import { ExpenseMonthSelector } from '@/components/finance/ExpenseMonthSelector';
import { useEnsureRecurringExpensesForMonth } from '@/hooks/useRecurringExpenses';

export default function AdminExpenses() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  useEnsureRecurringExpensesForMonth({
    month: selectedDate.getMonth(),
    year: selectedDate.getFullYear(),
  });

  return (
    <DashboardLayout title="Despesas">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Despesas</h1>
            <p className="text-muted-foreground">
              Controle as despesas da academia
            </p>
          </div>
          <ExpenseMonthSelector 
            selectedDate={selectedDate} 
            onDateChange={setSelectedDate} 
          />
        </div>

        <ExpenseStats 
          month={selectedDate.getMonth()} 
          year={selectedDate.getFullYear()} 
        />
        <ExpensesTable 
          month={selectedDate.getMonth()} 
          year={selectedDate.getFullYear()} 
        />
      </div>
    </DashboardLayout>
  );
}
