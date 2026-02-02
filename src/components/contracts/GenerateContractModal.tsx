import { useState, useMemo, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useStudents } from '@/hooks/useStudents';
import { usePlans } from '@/hooks/useFinance';
import { useAcademy } from '@/hooks/useAcademy';
import { useContractTemplates, useCreateContract, useCreateTemplate } from '@/hooks/useContracts';
import { useGuardians, usePrimaryGuardian } from '@/hooks/useGuardians';
import { isMinor, DEFAULT_CONTRACT_TERMS } from '@/lib/contractTemplates';
import { generateContractHtml } from '@/lib/contractGenerator';
import { GuardianFormModal } from './GuardianFormModal';
import { ContractPreview } from './ContractPreview';
import {
    Loader2,
    FileSignature,
    AlertTriangle,
    CheckCircle2,
    UserPlus,
    Baby,
    User,
    Percent,
} from 'lucide-react';

interface GenerateContractModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    preSelectedStudentId?: string;
    onSuccess?: () => void;
}

export function GenerateContractModal({
    open,
    onOpenChange,
    preSelectedStudentId,
    onSuccess,
}: GenerateContractModalProps) {
    const { toast } = useToast();
    const { data: students, isLoading: studentsLoading } = useStudents();
    const { data: plans, isLoading: plansLoading } = usePlans();
    const { data: academy } = useAcademy();
    const { data: templates } = useContractTemplates();
    const createContract = useCreateContract();
    const createTemplate = useCreateTemplate();

    // Form state
    const [selectedStudentId, setSelectedStudentId] = useState<string>(preSelectedStudentId || '');
    const [selectedPlanId, setSelectedPlanId] = useState<string>('');
    const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [finePercentage, setFinePercentage] = useState<string>(String(DEFAULT_CONTRACT_TERMS.lateFeePercent));
    const [interestPercentage, setInterestPercentage] = useState<string>(String(DEFAULT_CONTRACT_TERMS.monthlyInterest));

    const [activeTab, setActiveTab] = useState<string>('form');
    const [guardianModalOpen, setGuardianModalOpen] = useState(false);

    // Reset form when modal opens/closes
    useEffect(() => {
        if (open) {
            setSelectedStudentId(preSelectedStudentId || '');
            setSelectedPlanId('');
            setStartDate(new Date().toISOString().split('T')[0]);
            setFinePercentage(String(DEFAULT_CONTRACT_TERMS.lateFeePercent));
            setInterestPercentage(String(DEFAULT_CONTRACT_TERMS.monthlyInterest));
            setActiveTab('form');
        }
    }, [open, preSelectedStudentId]);

    // Get selected student data
    const selectedStudent = useMemo(() => {
        return students?.find((s) => s.id === selectedStudentId);
    }, [students, selectedStudentId]);

    // Get selected plan data
    const selectedPlan = useMemo(() => {
        return plans?.find((p) => p.id === selectedPlanId);
    }, [plans, selectedPlanId]);

    // Check if student is minor
    const studentIsMinor = useMemo(() => {
        return selectedStudent?.birth_date ? isMinor(selectedStudent.birth_date) : false;
    }, [selectedStudent]);

    // Fetch guardian for minor
    const { data: guardian, refetch: refetchGuardian } = usePrimaryGuardian(
        studentIsMinor ? selectedStudentId : null
    );

    // Build preview data
    const previewData = useMemo(() => {
        if (!selectedStudent || !selectedPlan || !academy) return null;

        return {
            isMinor: studentIsMinor,
            academyData: {
                name: academy.name || '',
                razao_social: (academy as any)?.razao_social || '',
                cnpj: (academy as any)?.cnpj || '',
                address: academy.address || '',
                email: (academy as any)?.email || '',
                whatsapp: (academy as any)?.whatsapp || '',
                phone: academy.phone || '',
                responsible_name: (academy as any)?.responsible_name || '',
            },
            studentData: {
                name: selectedStudent.name || '',
                cpf: selectedStudent.cpf || '',
                rg: (selectedStudent as any)?.rg || '',
                birth_date: selectedStudent.birth_date || '',
                address: '', // TODO: Student address
                email: selectedStudent.email || '',
                phone: selectedStudent.phone || '',
            },
            guardianData: guardian ? {
                name: guardian.name,
                cpf: guardian.cpf || '',
                rg: guardian.rg || '',
                address: '', // TODO: Guardian address
                email: guardian.email || '',
                phone: guardian.phone || '',
                relationship: guardian.relationship,
            } : undefined,
            planData: {
                name: selectedPlan.name || '',
                price: selectedPlan.price || 0,
                billing_cycle: selectedPlan.billing_cycle || 'monthly',
                due_day: 5,
                schedules: 'Conforme grade de horários',
            },
            contractData: {
                start_date: startDate,
                city: 'João Pessoa', // TODO: Get from academy config
                state: 'PB',
                finePercentage: parseFloat(finePercentage) || DEFAULT_CONTRACT_TERMS.lateFeePercent,
                interestPercentage: parseFloat(interestPercentage) || DEFAULT_CONTRACT_TERMS.monthlyInterest,
            },
        };
    }, [academy, selectedStudent, guardian, selectedPlan, startDate, studentIsMinor, finePercentage, interestPercentage]);

    // Validate form
    const validation = useMemo(() => {
        const errors: string[] = [];
        const warnings: string[] = [];

        if (!selectedStudentId) {
            errors.push('Selecione um aluno');
        }

        if (!selectedPlanId) {
            errors.push('Selecione um plano');
        }

        if (selectedStudent && !selectedStudent.cpf) {
            warnings.push('CPF do aluno não informado');
        }

        if (studentIsMinor && !guardian) {
            errors.push('Aluno menor de idade precisa de um responsável cadastrado');
        }

        if (studentIsMinor && guardian && !guardian.cpf) {
            warnings.push('CPF do responsável não informado');
        }

        if (isNaN(parseFloat(finePercentage)) || parseFloat(finePercentage) < 0) {
            errors.push('Multa inválida');
        }

        if (isNaN(parseFloat(interestPercentage)) || parseFloat(interestPercentage) < 0) {
            errors.push('Juros inválido');
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
        };
    }, [selectedStudentId, selectedPlanId, selectedStudent, studentIsMinor, guardian, finePercentage, interestPercentage]);

    // Handle contract generation
    const handleGenerate = async () => {
        if (!validation.isValid || !previewData) {
            return;
        }

        let templateToUse = templates?.find((t) => t.is_active) || templates?.[0];

        // Auto-create template if missing (Failover)
        if (!templateToUse) {
            try {
                // We don't have the full object returned by mutateAsync if it uses select().single() sometimes,
                // but useCreateTemplate types say it returns the data.
                const newTemplate = await createTemplate.mutateAsync({
                    title: 'Template Automático (Sistema)',
                    body_html: '<div>Este template é apenas um placeholder para o sistema de contratos automáticos.</div>'
                });

                // Assuming newTemplate conforms to ContractTemplate, or at least has the ID.
                // TypeScript might complain if types don't match exactly so casting if needed.
                templateToUse = newTemplate as any;

            } catch (e) {
                console.error("Failed to auto-create template", e);
                toast({
                    title: 'Erro Crítico',
                    description: 'Não foi possível inicializar o sistema de templates. Contate o suporte.',
                    variant: 'destructive',
                });
                return;
            }
        }

        if (!templateToUse) {
            toast({
                title: 'Erro',
                description: 'Erro ao identificar template. Tente novamente.',
                variant: 'destructive',
            });
            return;
        }

        try {
            // Generate the HTML snapshot
            const htmlSnapshot = generateContractHtml(previewData);

            await createContract.mutateAsync({
                studentId: selectedStudentId,
                templateId: templateToUse.id,
                snapshot: {
                    html: htmlSnapshot,
                    data: previewData
                }
            });

            toast({
                title: 'Sucesso',
                description: 'Contrato gerado com sucesso!',
            });

            onOpenChange(false);
            onSuccess?.();
        } catch (error) {
            console.error('Error generating contract:', error);
            toast({
                title: 'Erro',
                description: 'Não foi possível gerar o contrato',
                variant: 'destructive',
            });
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileSignature className="h-5 w-5" />
                            Gerar Contrato
                        </DialogTitle>
                        <DialogDescription>
                            Preencha os dados para gerar o contrato de matrícula
                        </DialogDescription>
                    </DialogHeader>

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="form">📝 Dados</TabsTrigger>
                            <TabsTrigger value="preview" disabled={!validation.isValid}>
                                👁️ Pré-visualização
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="form" className="space-y-4 mt-4">
                            {/* Student Selection */}
                            <div className="grid gap-2">
                                <Label htmlFor="student">Aluno *</Label>
                                <Select
                                    value={selectedStudentId}
                                    onValueChange={setSelectedStudentId}
                                    disabled={studentsLoading}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione o aluno" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {students?.filter(s => s.status === 'active').map((student) => (
                                            <SelectItem key={student.id} value={student.id}>
                                                <div className="flex items-center gap-2">
                                                    {student.birth_date && isMinor(student.birth_date) ? (
                                                        <Baby className="h-4 w-4 text-blue-500" />
                                                    ) : (
                                                        <User className="h-4 w-4" />
                                                    )}
                                                    {student.name}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Minor Alert */}
                            {studentIsMinor && (
                                <Alert variant={guardian ? 'default' : 'destructive'}>
                                    <Baby className="h-4 w-4" />
                                    <AlertTitle>Aluno Menor de Idade</AlertTitle>
                                    <AlertDescription className="flex items-center justify-between">
                                        <span>
                                            {guardian
                                                ? `Responsável: ${guardian.name} (${guardian.relationship})`
                                                : 'É necessário cadastrar um responsável legal'}
                                        </span>
                                        {!guardian && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => setGuardianModalOpen(true)}
                                            >
                                                <UserPlus className="h-4 w-4 mr-1" />
                                                Cadastrar
                                            </Button>
                                        )}
                                    </AlertDescription>
                                </Alert>
                            )}

                            {/* Plan Selection */}
                            <div className="grid gap-2">
                                <Label htmlFor="plan">Plano *</Label>
                                <Select
                                    value={selectedPlanId}
                                    onValueChange={setSelectedPlanId}
                                    disabled={plansLoading}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione o plano" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {plans?.filter(p => p.is_active).map((plan) => (
                                            <SelectItem key={plan.id} value={plan.id}>
                                                {plan.name} - R$ {plan.price?.toFixed(2)}/{plan.billing_cycle}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Start Date */}
                                <div className="grid gap-2">
                                    <Label htmlFor="startDate">Data de Início</Label>
                                    <Input
                                        id="startDate"
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                    />
                                </div>

                                {/* Fine Percentage */}
                                <div className="grid gap-2">
                                    <Label htmlFor="fine">Multa de Atraso (%)</Label>
                                    <div className="relative">
                                        <Percent className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="fine"
                                            type="number"
                                            step="0.1"
                                            min="0"
                                            value={finePercentage}
                                            onChange={(e) => setFinePercentage(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Interest Percentage */}
                                <div className="grid gap-2">
                                    <Label htmlFor="interest">Juros Mensal (%)</Label>
                                    <div className="relative">
                                        <Percent className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="interest"
                                            type="number"
                                            step="0.1"
                                            min="0"
                                            value={interestPercentage}
                                            onChange={(e) => setInterestPercentage(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Validation Summary */}
                            {(validation.errors.length > 0 || validation.warnings.length > 0) && (
                                <div className="space-y-2">
                                    {validation.errors.map((error, i) => (
                                        <Alert key={i} variant="destructive">
                                            <AlertTriangle className="h-4 w-4" />
                                            <AlertDescription>{error}</AlertDescription>
                                        </Alert>
                                    ))}
                                    {validation.warnings.map((warning, i) => (
                                        <Alert key={i}>
                                            <AlertTriangle className="h-4 w-4" />
                                            <AlertDescription>{warning}</AlertDescription>
                                        </Alert>
                                    ))}
                                </div>
                            )}

                            {validation.isValid && (
                                <Alert>
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                    <AlertDescription>
                                        Todos os dados estão válidos. Clique em "Pré-visualização" para revisar ou "Gerar Contrato" para finalizar.
                                    </AlertDescription>
                                </Alert>
                            )}
                        </TabsContent>

                        <TabsContent value="preview" className="mt-4">
                            {previewData ? (
                                <ContractPreview
                                    isMinor={previewData.isMinor}
                                    academyData={previewData.academyData}
                                    studentData={previewData.studentData}
                                    guardianData={previewData.guardianData}
                                    planData={previewData.planData}
                                    contractData={previewData.contractData}
                                />
                            ) : (
                                <div className="flex items-center justify-center p-8 border rounded-lg bg-muted/20">
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleGenerate}
                            disabled={!validation.isValid || createContract.isPending || createTemplate.isPending}
                        >
                            {(createContract.isPending || createTemplate.isPending) && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Gerar Contrato
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Guardian Form Modal */}
            {selectedStudent && (
                <GuardianFormModal
                    open={guardianModalOpen}
                    onOpenChange={setGuardianModalOpen}
                    studentId={selectedStudentId}
                    studentName={selectedStudent.name}
                    onSuccess={() => refetchGuardian()}
                />
            )}
        </>
    );
}
