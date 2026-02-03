import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Check, Loader2, Trash2, Pencil } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function SaasPlans() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        price: '', // Input as string
        interval: 'month',
        active: true
    });

    // Fetch Plans
    const { data: plans, isLoading } = useQuery({
        queryKey: ['saas-plans'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('saas_plans')
                .select('*')
                .order('price', { ascending: true });
            if (error) throw error;
            return data;
        }
    });

    const openCreateDialog = () => {
        setEditingId(null);
        setFormData({ name: '', price: '', interval: 'month', active: true });
        setIsDialogOpen(true);
    };

    const openEditDialog = (plan: any) => {
        setEditingId(plan.id);
        // Convert integer cents back to string "99.90"
        const priceString = (plan.price / 100).toFixed(2);
        setFormData({
            name: plan.name,
            price: priceString,
            interval: plan.interval,
            active: plan.active
        });
        setIsDialogOpen(true);
    };

    // Create/Update Logic
    const savePlanMutation = useMutation({
        mutationFn: async () => {
            const priceInCents = Math.round(parseFloat(formData.price.replace(',', '.')) * 100);

            if (editingId) {
                // Update
                const { error } = await supabase
                    .from('saas_plans')
                    .update({
                        name: formData.name,
                        price: priceInCents,
                        interval: formData.interval
                        // Active is handled by the switch outside
                    })
                    .eq('id', editingId);
                if (error) throw error;
            } else {
                // Create
                const { error } = await supabase
                    .from('saas_plans')
                    .insert({
                        name: formData.name,
                        price: priceInCents,
                        interval: formData.interval,
                        active: formData.active
                    });
                if (error) throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['saas-plans'] });
            toast({ title: editingId ? 'Plano atualizado!' : 'Plano criado com sucesso!' });
            setIsDialogOpen(false);
        },
        onError: (error) => {
            toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
        }
    });

    // Toggle Active Mutation
    const toggleActiveMutation = useMutation({
        mutationFn: async ({ id, active }: { id: string, active: boolean }) => {
            const { error } = await supabase.from('saas_plans').update({ active }).eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['saas-plans'] })
    });

    // Delete Mutation
    const deletePlanMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('saas_plans').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['saas-plans'] });
            toast({ title: 'Plano removido' });
        },
        onError: (error) => {
            toast({ title: 'Erro ao remover', description: 'Talvez este plano já tenha assinaturas vinculadas.', variant: 'destructive' });
        }
    });

    const formatCurrency = (cents: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
    };

    return (
        <DashboardLayout title="Gerenciar Planos">
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Planos de Assinatura</h2>
                        <p className="text-muted-foreground">Crie e gerencie os planos disponíveis para as academias.</p>
                    </div>

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <Button onClick={openCreateDialog}>
                            <Plus className="mr-2 h-4 w-4" />
                            Novo Plano
                        </Button>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{editingId ? 'Editar Plano' : 'Criar Novo Plano'}</DialogTitle>
                                <DialogDescription>Defina o nome e o preço da assinatura.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="name" className="text-right">Nome</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="col-span-3"
                                        placeholder="Ex: Mensal Básico"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="price" className="text-right">Preço (R$)</Label>
                                    <Input
                                        id="price"
                                        type="number"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        className="col-span-3"
                                        placeholder="99.90"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="interval" className="text-right">Ciclo</Label>
                                    <Select
                                        value={formData.interval}
                                        onValueChange={(v) => setFormData({ ...formData, interval: v })}
                                    >
                                        <SelectTrigger className="col-span-3">
                                            <SelectValue placeholder="Selecione" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="month">Mensal</SelectItem>
                                            <SelectItem value="year">Anual</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                                <Button onClick={() => savePlanMutation.mutate()} disabled={savePlanMutation.isPending || !formData.name || !formData.price}>
                                    {savePlanMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {editingId ? 'Salvar Alterações' : 'Criar Plano'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                {isLoading ? (
                    <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {plans?.map((plan) => (
                            <Card key={plan.id} className={!plan.active ? "opacity-60 border-dashed" : ""}>
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-xl">{plan.name}</CardTitle>
                                        <Switch
                                            checked={plan.active}
                                            onCheckedChange={(checked) => toggleActiveMutation.mutate({ id: plan.id, active: checked })}
                                        />
                                    </div>
                                    <CardDescription>Cobrado {plan.interval === 'month' ? 'mensalmente' : 'anualmente'}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold">
                                        {formatCurrency(plan.price)}
                                        <span className="text-sm font-normal text-muted-foreground">/{plan.interval === 'month' ? 'mês' : 'ano'}</span>
                                    </div>
                                </CardContent>
                                <CardFooter className="flex justify-end gap-2 pt-4 border-t">
                                    <Button variant="outline" size="sm" onClick={() => openEditDialog(plan)}>
                                        <Pencil className="mr-2 h-4 w-4" />
                                        Editar
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => deletePlanMutation.mutate(plan.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                        {plans?.length === 0 && (
                            <div className="col-span-full text-center p-12 border-2 border-dashed rounded-lg text-muted-foreground">
                                Nenhum plano cadastrado. Clique em "Novo Plano" para começar.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
