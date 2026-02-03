import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2, MoreHorizontal, ShieldAlert, ShieldCheck, Phone } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';

export default function SaasSubscriptions() {
    const [searchTerm, setSearchTerm] = useState('');
    const queryClient = useQueryClient();

    // Fetch subscriptions with academy details
    const { data: subscriptions, isLoading } = useQuery({
        queryKey: ['saas-subscriptions'],
        queryFn: async () => {
            // 1. Fetch Subscriptions + Academy
            const { data: subs, error } = await supabase
                .from('saas_subscriptions')
                .select(`
          *,
          academies:academy_id (
            id,
            name,
            phone,
            whatsapp,
            responsible_name
          )
        `);

            if (error) throw error;

            // 2. For each subscription, fetch the Admin Profile(s)
            // This is N+1 but acceptable for a dashboard with ~100 items for now. 
            // Optimization: Create a Database View 'saas_dashboard_view'
            const enriched = await Promise.all(subs.map(async (sub: any) => {
                const { data: admins } = await supabase
                    .from('profiles')
                    .select('name, email, cpf, phone, address_street, address_number, address_neighborhood, address_city, address_state')
                    .eq('academy_id', sub.academy_id)
                    .eq('role', 'admin')
                    .limit(1);

                return {
                    ...sub,
                    admin_name: admins?.[0]?.name || 'N/A',
                    admin_email: admins?.[0]?.email || 'N/A',
                    admin_phone: admins?.[0]?.phone || 'N/A',
                    admin_cpf: admins?.[0]?.cpf || 'N/A',
                    // Use Academy Responsible Name if available, otherwise Admin Name
                    contact_name: sub.academies?.responsible_name || admins?.[0]?.name || 'N/A',
                    // Use Academy WhatsApp/Phone if available, otherwise Admin Phone
                    contact_phone: sub.academies?.whatsapp || sub.academies?.phone || admins?.[0]?.phone || 'N/A',
                    admin_address: admins?.[0]?.address_street ?
                        `${admins[0].address_street}, ${admins[0].address_number || ''} - ${admins[0].address_neighborhood || ''}, ${admins[0].address_city || ''}/${admins[0].address_state || ''}`
                        : 'Endereço não inf.'
                };
            }));

            return enriched;
        }
    });

    const toggleStatusMutation = useMutation({
        mutationFn: async ({ id, status }: { id: string, status: string }) => {
            const { error } = await supabase
                .from('saas_subscriptions')
                .update({ status })
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['saas-subscriptions'] });
            toast.success("Status atualizado com sucesso");
        },
        onError: (e) => {
            toast.error("Erro ao atualizar status: " + e.message);
        }
    });

    const filteredSubscriptions = subscriptions?.filter((sub: any) => {
        const search = searchTerm.toLowerCase();
        return (
            sub.academies?.name?.toLowerCase().includes(search) ||
            sub.admin_name?.toLowerCase().includes(search) ||
            sub.admin_email?.toLowerCase().includes(search)
        );
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active': return <Badge className="bg-green-500">Ativo</Badge>;
            case 'trial': return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Trial</Badge>;
            case 'past_due': return <Badge variant="destructive">Atrasado</Badge>;
            case 'canceled': return <Badge variant="outline" className="text-muted-foreground">Cancelado</Badge>;
            case 'lifetime': return <Badge className="bg-purple-500">Vitalício</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <DashboardLayout title="Gerenciar Assinaturas">
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Academias e Assinaturas</CardTitle>
                        <CardDescription>
                            Gerencie o acesso das academias ao sistema.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 mb-6">
                            <div className="relative flex-1 max-w-sm">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="Buscar por nome, email ou academia..."
                                    className="pl-8"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        {isLoading ? (
                            <div className="flex justify-center p-8">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Academia</TableHead>
                                            <TableHead>Administrador</TableHead>
                                            <TableHead>Contato</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Fim do Período</TableHead>
                                            <TableHead className="w-[80px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredSubscriptions?.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                                    Nenhum registro encontrado.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                        {filteredSubscriptions?.map((sub: any) => (
                                            <TableRow key={sub.id}>
                                                <TableCell className="font-medium">
                                                    <div>{sub.academies?.name}</div>
                                                    <div className="text-xs text-muted-foreground">ID: {sub.academy_id.slice(0, 8)}...</div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-xs text-muted-foreground">{sub.admin_email}</div>
                                                    <div className="text-xs text-muted-foreground">{sub.admin_cpf || 'CPF não inf.'}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm font-medium">{sub.contact_name}</div>
                                                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <Phone className="h-3 w-3" />
                                                        {sub.contact_phone}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {getStatusBadge(sub.status)}
                                                </TableCell>
                                                <TableCell>
                                                    {sub.current_period_end ? format(new Date(sub.current_period_end), 'dd/MM/yyyy') : '-'}
                                                </TableCell>
                                                <TableCell>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                                            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(sub.academy_id)}>
                                                                Copiar ID da Academia
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(sub.admin_email)}>
                                                                Copiar Email
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem onClick={() => toggleStatusMutation.mutate({ id: sub.id, status: 'active' })}>
                                                                <ShieldCheck className="mr-2 h-4 w-4 text-green-500" />
                                                                Liberar Acesso Total
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => toggleStatusMutation.mutate({ id: sub.id, status: 'past_due' })}>
                                                                <ShieldAlert className="mr-2 h-4 w-4 text-red-500" />
                                                                Bloquear (Pagamento Pendente)
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
