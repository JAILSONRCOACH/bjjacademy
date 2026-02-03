import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function SaasPlans() {
    return (
        <DashboardLayout title="Gerenciar Planos">
            <div className="space-y-6">
                <div className="flex justify-end">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Novo Plano
                    </Button>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>Planos Disponíveis</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">Implementação de planos em breve.</p>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
