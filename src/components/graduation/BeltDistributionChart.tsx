import { Card, CardContent } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { BarChart3 } from 'lucide-react';

interface BeltDistributionChartProps {
  distribution: Record<string, number>;
}

const beltColors: Record<string, string> = {
  white: '#E5E7EB',
  blue: '#3B82F6',
  purple: '#9333EA',
  brown: '#B45309',
  black: '#1F2937',
};

const beltLabels: Record<string, string> = {
  white: 'Branca',
  blue: 'Azul',
  purple: 'Roxa',
  brown: 'Marrom',
  black: 'Preta',
};

const beltOrder = ['white', 'blue', 'purple', 'brown', 'black'];

export function BeltDistributionChart({ distribution }: BeltDistributionChartProps) {
  const data = beltOrder
    .filter(belt => distribution[belt] > 0)
    .map(belt => ({
      name: beltLabels[belt],
      value: distribution[belt],
      color: beltColors[belt],
    }));

  const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);

  if (total === 0) {
    return (
      <Card className="h-full">
        <CardContent className="pt-6 flex flex-col items-center justify-center h-full min-h-[200px]">
          <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Sem dados de distribuição</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-5 w-5 text-primary" />
          <span className="font-semibold">Distribuição do Tatame</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-48 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex-1 space-y-2">
            {data.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span>{item.name}:</span>
                </div>
                <span className="font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
