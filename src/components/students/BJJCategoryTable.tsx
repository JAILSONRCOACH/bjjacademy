import { ageCategories, Gender, formatWeight } from '@/lib/bjjCategories';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface BJJCategoryTableProps {
  highlightCategory?: string;
  highlightAgeGroup?: string;
  gender: Gender;
}

export function BJJCategoryTable({ highlightCategory, highlightAgeGroup, gender }: BJJCategoryTableProps) {
  return (
    <div className="border rounded-lg">
      <Tabs defaultValue="Adulto" className="w-full">
        <TabsList className="w-full flex-wrap h-auto p-1 gap-1">
          {ageCategories.map((ageCat) => (
            <TabsTrigger 
              key={ageCat.name} 
              value={ageCat.name}
              className="text-xs px-2 py-1"
            >
              {ageCat.name}
              {ageCat.name === highlightAgeGroup && (
                <Badge variant="default" className="ml-1 h-4 px-1 text-[10px]">!</Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {ageCategories.map((ageCat) => {
          const categories = gender === 'male' 
            ? ageCat.maleCategories 
            : ageCat.femaleCategories;

          return (
            <TabsContent key={ageCat.name} value={ageCat.name} className="mt-0">
              <ScrollArea className="h-[200px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Categoria</TableHead>
                      <TableHead className="text-xs">Peso Mín.</TableHead>
                      <TableHead className="text-xs">Peso Máx.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((cat) => {
                      const isHighlighted = 
                        ageCat.name === highlightAgeGroup && 
                        cat.name === highlightCategory;

                      return (
                        <TableRow 
                          key={cat.name}
                          className={isHighlighted ? 'bg-primary/10 font-medium' : ''}
                        >
                          <TableCell className="text-xs py-1">
                            {cat.name}
                            {isHighlighted && (
                              <Badge variant="default" className="ml-2 h-4 px-1 text-[10px]">
                                Sua categoria
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-xs py-1">
                            {cat.minWeight === 0 ? '-' : `${cat.minWeight} kg`}
                          </TableCell>
                          <TableCell className="text-xs py-1">
                            {formatWeight(cat.maxWeight)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
              <div className="px-3 py-2 border-t bg-muted/50">
                <p className="text-xs text-muted-foreground">
                  Idade: {ageCat.minAge} - {ageCat.maxAge === Infinity ? '56+' : ageCat.maxAge} anos
                </p>
              </div>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
