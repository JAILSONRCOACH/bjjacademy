import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { InvoicesTable } from '@/components/finance/InvoicesTable';
import { InvoiceStats } from '@/components/finance/InvoiceStats';
import { ExpensesTable } from '@/components/finance/ExpensesTable';
import { ExpenseStats } from '@/components/finance/ExpenseStats';
import { ExpenseMonthSelector } from '@/components/finance/ExpenseMonthSelector';
import { useEnsureRecurringExpensesForMonth } from '@/hooks/useRecurringExpenses';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, TrendingDown } from 'lucide-react';

export default function AdminFinance() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  useEnsureRecurringExpensesForMonth({
    month: selectedDate.getMonth(),
    year: selectedDate.getFullYear(),
  });

  return (
    <DashboardLayout title="Financeiro">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Financeiro</h1>
          <p className="text-muted-foreground">
            Gerencie receitas e despesas da academia
          </p>
        </div>

        <Tabs defaultValue="receitas" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="receitas" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Receitas
            </TabsTrigger>
            <TabsTrigger value="despesas" className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              Despesas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="receitas" className="space-y-6">
            <InvoiceStats />
            <InvoicesTable />
          </TabsContent>

          <TabsContent value="despesas" className="space-y-6">
            <div className="flex justify-end">
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
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
