import { TatameStats as TatameStatsType } from '@/hooks/useTatameOnline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, UserCheck, Users, Award, User } from 'lucide-react';

interface TatameStatsProps {
  stats: TatameStatsType;
}

const beltLabels: Record<string, string> = {
  white: 'Branca',
  grey_white: 'Cinza/Branca',
  grey: 'Cinza',
  grey_black: 'Cinza/Preta',
  yellow_white: 'Amarela/Branca',
  yellow: 'Amarela',
  yellow_black: 'Amarela/Preta',
  orange_white: 'Laranja/Branca',
  orange: 'Laranja',
  orange_black: 'Laranja/Preta',
  green_white: 'Verde/Branca',
  green: 'Verde',
  green_black: 'Verde/Preta',
  blue: 'Azul',
  purple: 'Roxa',
  brown: 'Marrom',
  black: 'Preta',
  red_black: 'Coral',
  red_white: 'Coral/Branca',
  red: 'Vermelha',
  unknown: 'Não informada',
};

const beltColors: Record<string, string> = {
  white: 'bg-gray-200',
  grey_white: 'bg-gray-300',
  grey: 'bg-gray-400',
  grey_black: 'bg-gray-500',
  yellow_white: 'bg-yellow-200',
  yellow: 'bg-yellow-400',
  yellow_black: 'bg-yellow-500',
  orange_white: 'bg-orange-200',
  orange: 'bg-orange-400',
  orange_black: 'bg-orange-500',
  green_white: 'bg-green-200',
  green: 'bg-green-400',
  green_black: 'bg-green-500',
  blue: 'bg-blue-500',
  purple: 'bg-purple-600',
  brown: 'bg-amber-700',
  black: 'bg-gray-900',
  red_black: 'bg-red-700',
  red_white: 'bg-red-500',
  red: 'bg-red-600',
  unknown: 'bg-gray-400',
};

const beltOrder = [
  'white', 'grey_white', 'grey', 'grey_black',
  'yellow_white', 'yellow', 'yellow_black',
  'orange_white', 'orange', 'orange_black',
  'green_white', 'green', 'green_black',
  'blue', 'purple', 'brown', 'black',
  'red_black', 'red_white', 'red'
];

const genderLabels: Record<string, string> = {
  male: 'Masculino',
  masculino: 'Masculino',
  female: 'Feminino',
  feminino: 'Feminino',
  unknown: 'Não informado',
};

export function TatameStats({ stats }: TatameStatsProps) {
  const maxBeltCount = Math.max(...Object.values(stats.byBelt), 1);
  const sortedBelts = beltOrder.filter(belt => stats.byBelt[belt] > 0);
  
  // Sort professors by count
  const sortedProfessors = Object.entries(stats.byProfessor)
    .sort((a, b) => b[1].count - a[1].count);

  // Calculate gender totals
  const maleCount = (stats.byGender.male || 0) + (stats.byGender.masculino || 0);
  const femaleCount = (stats.byGender.female || 0) + (stats.byGender.feminino || 0);
  const unknownGenderCount = stats.byGender.unknown || 0;
  const totalGender = maleCount + femaleCount + unknownGenderCount;

  return (
    <div className="space-y-4">
      {/* Main stats row */}
      <div className="grid grid-cols-2 gap-3">
        {/* Total on mat (approved) */}
        <Card className="bg-green-500 text-white">
          <CardContent className="pt-6 text-center">
            <UserCheck className="h-6 w-6 mx-auto mb-1 opacity-80" />
            <div className="text-4xl font-bold">{stats.totalOnMat}</div>
            <div className="text-xs mt-1 opacity-90">NO TATAME</div>
          </CardContent>
        </Card>

        {/* Pending approval */}
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="pt-6 text-center">
            <Clock className="h-6 w-6 mx-auto mb-1 opacity-80" />
            <div className="text-4xl font-bold">{stats.pendingCount}</div>
            <div className="text-xs mt-1 opacity-90">PENDENTES</div>
          </CardContent>
        </Card>
      </div>

      {/* Distribution by belt */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Award className="h-4 w-4 text-primary" />
            Por Faixa
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {sortedBelts.length > 0 ? (
            <div className="space-y-3">
              {sortedBelts.map((belt) => {
                const count = stats.byBelt[belt] || 0;
                const percentage = (count / maxBeltCount) * 100;
                return (
                  <div key={belt} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{beltLabels[belt] || belt}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${beltColors[belt] || 'bg-gray-400'} transition-all`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum aluno no tatame
            </p>
          )}
        </CardContent>
      </Card>

      {/* Distribution by gender */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Por Sexo
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {totalGender > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-3 bg-blue-500/10 rounded-lg">
                <div className="text-2xl font-bold text-blue-500">{maleCount}</div>
                <div className="text-xs text-muted-foreground">Masc.</div>
              </div>
              <div className="text-center p-3 bg-pink-500/10 rounded-lg">
                <div className="text-2xl font-bold text-pink-500">{femaleCount}</div>
                <div className="text-xs text-muted-foreground">Fem.</div>
              </div>
              {unknownGenderCount > 0 && (
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-muted-foreground">{unknownGenderCount}</div>
                  <div className="text-xs text-muted-foreground">N/I</div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum aluno no tatame
            </p>
          )}
        </CardContent>
      </Card>

      {/* Distribution by professor */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            Por Professor
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {sortedProfessors.length > 0 ? (
            <div className="space-y-2">
              {sortedProfessors.map(([id, { name, count }]) => (
                <div key={id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <span className="text-sm truncate flex-1">{name}</span>
                  <span className="text-sm font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full ml-2">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum professor associado
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
