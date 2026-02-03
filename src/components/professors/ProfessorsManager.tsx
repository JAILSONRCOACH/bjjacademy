import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CreateProfessorModal } from '@/components/professors/CreateProfessorModal';
import { EditProfessorModal } from '@/components/professors/EditProfessorModal';
import { useInstructors } from '@/hooks/useStudents';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, AlertCircle, UserCog, MoreHorizontal, Pencil, Trash2, KeyRound } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { maskCPF, maskPhone } from '@/lib/masks';

interface Professor {
    id: string;
    name: string;
    email: string | null;
    cpf: string | null;
    phone: string | null;
}

export function ProfessorsManager() {
    const { profile } = useAuth();
    const { data: instructors = [], isLoading, error } = useInstructors(profile?.academy_id);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingProfessor, setEditingProfessor] = useState<Professor | null>(null);
    const [deletingProfessor, setDeletingProfessor] = useState<Professor | null>(null);
    const [resettingProfessor, setResettingProfessor] = useState<Professor | null>(null);

    const { toast } = useToast();
    const queryClient = useQueryClient();

    const deleteMutation = useMutation({
        mutationFn: async (professorId: string) => {
            const { error } = await supabase
                .from('profiles')
                .delete()
                .eq('id', professorId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['instructors'] });
            toast({ title: 'Professor excluído com sucesso' });
            setDeletingProfessor(null);
        },
        onError: (error) => {
            toast({
                title: 'Erro ao excluir professor',
                description: error.message,
                variant: 'destructive',
            });
        },
    });

    const resetPasswordMutation = useMutation({
        mutationFn: async (professor: Professor) => {
            const response = await supabase.functions.invoke('reset-professor-password', {
                body: { professorId: professor.id, email: professor.email }
            });
            if (response.error) throw response.error;
            if (!response.data?.ok) throw new Error(response.data?.error || 'Erro ao resetar senha');
            return response.data;
        },
        onSuccess: () => {
            toast({
                title: 'Senha resetada com sucesso',
                description: 'Uma nova senha foi enviada para o e-mail do professor.'
            });
            setResettingProfessor(null);
        },
        onError: (error: any) => {
            toast({
                title: 'Erro ao resetar senha',
                description: error.message,
                variant: 'destructive',
            });
        },
    });

    if (error) {
        return (
            <Card className="border-destructive">
                <CardContent className="flex items-center gap-3 py-6">
                    <AlertCircle className="h-5 w-5 text-destructive" />
                    <p className="text-destructive">Erro ao carregar professores: {error.message}</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <p className="text-muted-foreground">
                    Gerencie os professores da sua academia
                </p>
                <Button onClick={() => setIsCreateModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Professor
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <UserCog className="h-5 w-5" />
                        Lista de Professores
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-3">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                        </div>
                    ) : instructors.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            Nenhum professor cadastrado
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nome</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>CPF</TableHead>
                                    <TableHead>Telefone</TableHead>
                                    <TableHead className="w-[60px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {instructors.map((instructor) => (
                                    <TableRow key={instructor.id}>
                                        <TableCell className="font-medium">{instructor.name}</TableCell>
                                        <TableCell>{instructor.email || '-'}</TableCell>
                                        <TableCell>{instructor.cpf ? maskCPF(instructor.cpf) : '-'}</TableCell>
                                        <TableCell>{instructor.phone ? maskPhone(instructor.phone) : '-'}</TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-popover">
                                                    <DropdownMenuItem onClick={() => setEditingProfessor(instructor)}>
                                                        <Pencil className="h-4 w-4 mr-2" />
                                                        Editar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => setResettingProfessor(instructor)}>
                                                        <KeyRound className="h-4 w-4 mr-2" />
                                                        Resetar Senha
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        className="text-destructive focus:text-destructive"
                                                        onClick={() => setDeletingProfessor(instructor)}
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Excluir
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <CreateProfessorModal
                open={isCreateModalOpen}
                onOpenChange={setIsCreateModalOpen}
            />

            <EditProfessorModal
                professor={editingProfessor}
                onClose={() => setEditingProfessor(null)}
            />

            <AlertDialog open={!!deletingProfessor} onOpenChange={() => setDeletingProfessor(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir professor?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir o professor "{deletingProfessor?.name}"?
                            Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => deletingProfessor && deleteMutation.mutate(deletingProfessor.id)}
                        >
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={!!resettingProfessor} onOpenChange={() => setResettingProfessor(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Resetar senha do professor?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Uma nova senha temporária será gerada e enviada para o e-mail:
                            <strong className="block mt-2">{resettingProfessor?.email}</strong>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => resettingProfessor && resetPasswordMutation.mutate(resettingProfessor)}
                        >
                            Resetar Senha
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
