import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useCreateGuardian, type CreateGuardianInput } from '@/hooks/useGuardians';
import { GUARDIAN_RELATIONSHIPS } from '@/lib/contractTemplates';
import { Loader2, UserPlus } from 'lucide-react';

interface GuardianFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    studentId: string;
    studentName: string;
    onSuccess?: () => void;
}

export function GuardianFormModal({
    open,
    onOpenChange,
    studentId,
    studentName,
    onSuccess,
}: GuardianFormModalProps) {
    const { toast } = useToast();
    const createGuardian = useCreateGuardian();

    const [formData, setFormData] = useState<Partial<CreateGuardianInput>>({
        name: '',
        cpf: '',
        email: '',
        phone: '',
        relationship: 'pai',
        is_primary: true,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name?.trim()) {
            toast({
                title: 'Erro',
                description: 'Nome do responsável é obrigatório',
                variant: 'destructive',
            });
            return;
        }

        if (!formData.relationship) {
            toast({
                title: 'Erro',
                description: 'Tipo de vínculo é obrigatório',
                variant: 'destructive',
            });
            return;
        }

        try {
            await createGuardian.mutateAsync({
                student_id: studentId,
                name: formData.name.trim(),
                cpf: formData.cpf?.trim() || undefined,
                email: formData.email?.trim() || undefined,
                phone: formData.phone?.trim() || undefined,
                relationship: formData.relationship as 'pai' | 'mae' | 'tutor' | 'outro',
                is_primary: formData.is_primary,
            });

            toast({
                title: 'Sucesso',
                description: 'Responsável cadastrado com sucesso',
            });

            // Reset form
            setFormData({
                name: '',
                cpf: '',
                email: '',
                phone: '',
                relationship: 'pai',
                is_primary: true,
            });

            onOpenChange(false);
            onSuccess?.();
        } catch (error) {
            console.error('Error creating guardian:', error);
            toast({
                title: 'Erro',
                description: 'Não foi possível cadastrar o responsável',
                variant: 'destructive',
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5" />
                        Cadastrar Responsável
                    </DialogTitle>
                    <DialogDescription>
                        Cadastre o responsável legal para o aluno <strong>{studentName}</strong>
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Nome Completo *</Label>
                            <Input
                                id="name"
                                placeholder="Nome do responsável"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="cpf">CPF</Label>
                                <Input
                                    id="cpf"
                                    placeholder="000.000.000-00"
                                    value={formData.cpf}
                                    onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="relationship">Vínculo *</Label>
                                <Select
                                    value={formData.relationship}
                                    onValueChange={(value) => setFormData({ ...formData, relationship: value as any })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {GUARDIAN_RELATIONSHIPS.map((rel) => (
                                            <SelectItem key={rel.value} value={rel.value}>
                                                {rel.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="email">E-mail</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="email@exemplo.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="phone">Telefone/WhatsApp</Label>
                                <Input
                                    id="phone"
                                    placeholder="(00) 00000-0000"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={createGuardian.isPending}>
                            {createGuardian.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Cadastrar Responsável
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
