import { useMemo, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    CONTRACT_PLACEHOLDERS,
    formatAddress,
    formatCurrency,
    formatDateBR,
    BILLING_CYCLE_LABELS,
    DEFAULT_CONTRACT_TERMS,
} from '@/lib/contractTemplates';
import { ADULT_CONTRACT_TEMPLATE, MINOR_CONTRACT_TEMPLATE } from '@/lib/contractHtmlTemplates';
import { FileText, Eye } from 'lucide-react';

interface ContractPreviewProps {
    isMinor: boolean;
    academyData: {
        name: string;
        razao_social?: string;
        cnpj?: string;
        address?: string;
        email?: string;
        whatsapp?: string;
        phone?: string;
        responsible_name?: string;
    };
    studentData: {
        name: string;
        cpf?: string;
        rg?: string;
        birth_date?: string;
        address?: string;
        email?: string;
        phone?: string;
    };
    guardianData?: {
        name: string;
        cpf?: string;
        rg?: string;
        address?: string;
        email?: string;
        phone?: string;
        relationship: string;
    };
    planData: {
        name: string;
        price: number;
        billing_cycle: string;
        due_day?: number;
        schedules?: string;
    };
    contractData: {
        start_date: string;
        city?: string;
        state?: string;
    };
    loading?: boolean;
}

export function ContractPreview({
    isMinor,
    academyData,
    studentData,
    guardianData,
    planData,
    contractData,
    loading = false,
}: ContractPreviewProps) {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // Choose template based on minor status
    const template = isMinor ? MINOR_CONTRACT_TEMPLATE : ADULT_CONTRACT_TEMPLATE;

    // Build rendered HTML with replaced placeholders
    const renderedHtml = useMemo(() => {
        let html = template;

        // Academy replacements
        html = html.replace(/\{\{ACADEMIA_NOME\}\}/g, academyData.name || 'Nome da Academia');
        html = html.replace(/\{\{ACADEMIA_RAZAO_SOCIAL\}\}/g, academyData.razao_social || '');
        html = html.replace(/\{\{ACADEMIA_CNPJ\}\}/g, academyData.cnpj || 'Não informado');
        html = html.replace(/\{\{ACADEMIA_ENDERECO\}\}/g, academyData.address || 'Não informado');
        html = html.replace(/\{\{ACADEMIA_EMAIL\}\}/g, academyData.email || 'Não informado');
        html = html.replace(/\{\{ACADEMIA_WHATSAPP\}\}/g, academyData.whatsapp || academyData.phone || 'Não informado');
        html = html.replace(/\{\{ACADEMIA_TELEFONE\}\}/g, academyData.phone || 'Não informado');
        html = html.replace(/\{\{ACADEMIA_RESPONSAVEL\}\}/g, academyData.responsible_name || '');

        // Student replacements
        html = html.replace(/\{\{ALUNO_NOME\}\}/g, studentData.name || 'Nome do Aluno');
        html = html.replace(/\{\{ALUNO_CPF\}\}/g, studentData.cpf || 'Não informado');
        html = html.replace(/\{\{ALUNO_RG\}\}/g, studentData.rg || 'Não informado');
        html = html.replace(/\{\{ALUNO_NASC\}\}/g, studentData.birth_date ? formatDateBR(studentData.birth_date) : 'Não informado');
        html = html.replace(/\{\{ALUNO_ENDERECO\}\}/g, studentData.address || 'Não informado');
        html = html.replace(/\{\{ALUNO_EMAIL\}\}/g, studentData.email || 'Não informado');
        html = html.replace(/\{\{ALUNO_TELEFONE\}\}/g, studentData.phone || 'Não informado');

        // Guardian replacements (for minors)
        if (isMinor && guardianData) {
            html = html.replace(/\{\{RESP_NOME\}\}/g, guardianData.name || 'Nome do Responsável');
            html = html.replace(/\{\{RESP_CPF\}\}/g, guardianData.cpf || 'Não informado');
            html = html.replace(/\{\{RESP_RG\}\}/g, guardianData.rg || 'Não informado');
            html = html.replace(/\{\{RESP_ENDERECO\}\}/g, guardianData.address || 'Não informado');
            html = html.replace(/\{\{RESP_EMAIL\}\}/g, guardianData.email || 'Não informado');
            html = html.replace(/\{\{RESP_TELEFONE\}\}/g, guardianData.phone || 'Não informado');
            html = html.replace(/\{\{RESP_VINCULO\}\}/g, guardianData.relationship || 'Responsável');
        }

        // Plan replacements
        html = html.replace(/\{\{PLANO_NOME\}\}/g, planData.name || 'Plano');
        html = html.replace(/\{\{PLANO_VALOR\}\}/g, formatCurrency(planData.price || 0));
        html = html.replace(/\{\{PLANO_RECORRENCIA\}\}/g, BILLING_CYCLE_LABELS[planData.billing_cycle] || planData.billing_cycle || 'mensal');
        html = html.replace(/\{\{PLANO_VENCIMENTO_DIA\}\}/g, String(planData.due_day || 5));
        html = html.replace(/\{\{HORARIOS\}\}/g, planData.schedules || 'A definir conforme disponibilidade');

        // Contract terms
        html = html.replace(/\{\{DATA_INICIO\}\}/g, contractData.start_date ? formatDateBR(contractData.start_date) : formatDateBR(new Date()));
        html = html.replace(/\{\{VIGENCIA\}\}/g, '12 meses');
        html = html.replace(/\{\{TAXA_MATRICULA\}\}/g, formatCurrency(0));
        html = html.replace(/\{\{FORMA_PAGAMENTO\}\}/g, 'Pix, cartão ou boleto');
        html = html.replace(/\{\{MULTA_ATRASO\}\}/g, String(DEFAULT_CONTRACT_TERMS.lateFeePercent));
        html = html.replace(/\{\{JUROS_MENSAL\}\}/g, String(DEFAULT_CONTRACT_TERMS.monthlyInterest));
        html = html.replace(/\{\{DIAS_TOLERANCIA\}\}/g, String(DEFAULT_CONTRACT_TERMS.graceDays));
        html = html.replace(/\{\{PRAZO_AVISO_REAJUSTE\}\}/g, String(DEFAULT_CONTRACT_TERMS.priceAdjustmentDays));
        html = html.replace(/\{\{AVISO_PREVIO_CANCELAMENTO\}\}/g, String(DEFAULT_CONTRACT_TERMS.cancellationNoticeDays));
        html = html.replace(/\{\{MULTA_FIDELIDADE\}\}/g, 'não aplicável');
        html = html.replace(/\{\{REGRA_FIDELIDADE\}\}/g, DEFAULT_CONTRACT_TERMS.loyaltyPenalty);
        html = html.replace(/\{\{REGRAS_TRANCAMENTO\}\}/g, DEFAULT_CONTRACT_TERMS.suspensionRules);
        html = html.replace(/\{\{REGRAS_REPOSICAO\}\}/g, DEFAULT_CONTRACT_TERMS.replacementRules);

        // Signature
        html = html.replace(/\{\{CIDADE\}\}/g, contractData.city || 'Cidade');
        html = html.replace(/\{\{DATA_ASSINATURA\}\}/g, formatDateBR(new Date()));
        html = html.replace(/\{\{FORO_CIDADE_UF\}\}/g,
            contractData.city && contractData.state
                ? `${contractData.city}/${contractData.state}`
                : 'Cidade/UF'
        );

        return html;
    }, [template, academyData, studentData, guardianData, planData, contractData, isMinor]);

    // Update iframe content when rendered HTML changes
    useEffect(() => {
        if (iframeRef.current && !loading) {
            const doc = iframeRef.current.contentDocument;
            if (doc) {
                doc.open();
                doc.write(renderedHtml);
                doc.close();
            }
        }
    }, [renderedHtml, loading]);

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Eye className="h-5 w-5" />
                        Pré-visualização do Contrato
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-[500px] w-full" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <FileText className="h-5 w-5" />
                        Pré-visualização do Contrato
                    </CardTitle>
                    <Badge variant={isMinor ? 'secondary' : 'default'}>
                        {isMinor ? '👶 Menor de Idade' : '👤 Adulto'}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                <div className="border rounded-lg overflow-hidden bg-white">
                    <iframe
                        ref={iframeRef}
                        className="w-full h-[500px] border-0"
                        title="Contract Preview"
                    />
                </div>
            </CardContent>
        </Card>
    );
}
