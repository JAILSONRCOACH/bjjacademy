import {
    CONTRACT_PLACEHOLDERS,
    formatAddress,
    formatCurrency,
    formatDateBR,
    BILLING_CYCLE_LABELS,
    DEFAULT_CONTRACT_TERMS,
} from './contractTemplates';
import { ADULT_CONTRACT_TEMPLATE, MINOR_CONTRACT_TEMPLATE } from './contractHtmlTemplates';

interface ContractData {
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
        finePercentage?: number;
        interestPercentage?: number;
    };
}

export function generateContractHtml(data: ContractData): string {
    const template = data.isMinor ? MINOR_CONTRACT_TEMPLATE : ADULT_CONTRACT_TEMPLATE;
    let html = template;

    // Academy replacements
    html = html.replace(/\{\{ACADEMIA_NOME\}\}/g, data.academyData.name || 'Nome da Academia');
    html = html.replace(/\{\{ACADEMIA_RAZAO_SOCIAL\}\}/g, data.academyData.razao_social || '');
    html = html.replace(/\{\{ACADEMIA_CNPJ\}\}/g, data.academyData.cnpj || 'Não informado');
    html = html.replace(/\{\{ACADEMIA_ENDERECO\}\}/g, data.academyData.address || 'Não informado');
    html = html.replace(/\{\{ACADEMIA_EMAIL\}\}/g, data.academyData.email || 'Não informado');
    html = html.replace(/\{\{ACADEMIA_WHATSAPP\}\}/g, data.academyData.whatsapp || data.academyData.phone || 'Não informado');
    html = html.replace(/\{\{ACADEMIA_TELEFONE\}\}/g, data.academyData.phone || 'Não informado');
    html = html.replace(/\{\{ACADEMIA_RESPONSAVEL\}\}/g, data.academyData.responsible_name || '');

    // Student replacements
    html = html.replace(/\{\{ALUNO_NOME\}\}/g, data.studentData.name || 'Nome do Aluno');
    html = html.replace(/\{\{ALUNO_CPF\}\}/g, data.studentData.cpf || 'Não informado');
    html = html.replace(/\{\{ALUNO_RG\}\}/g, data.studentData.rg || 'Não informado');
    html = html.replace(/\{\{ALUNO_NASC\}\}/g, data.studentData.birth_date ? formatDateBR(data.studentData.birth_date) : 'Não informado');
    html = html.replace(/\{\{ALUNO_ENDERECO\}\}/g, data.studentData.address || 'Não informado');
    html = html.replace(/\{\{ALUNO_EMAIL\}\}/g, data.studentData.email || 'Não informado');
    html = html.replace(/\{\{ALUNO_TELEFONE\}\}/g, data.studentData.phone || 'Não informado');

    // Guardian replacements (for minors)
    if (data.isMinor && data.guardianData) {
        html = html.replace(/\{\{RESP_NOME\}\}/g, data.guardianData.name || 'Nome do Responsável');
        html = html.replace(/\{\{RESP_CPF\}\}/g, data.guardianData.cpf || 'Não informado');
        html = html.replace(/\{\{RESP_RG\}\}/g, data.guardianData.rg || 'Não informado');
        html = html.replace(/\{\{RESP_ENDERECO\}\}/g, data.guardianData.address || 'Não informado');
        html = html.replace(/\{\{RESP_EMAIL\}\}/g, data.guardianData.email || 'Não informado');
        html = html.replace(/\{\{RESP_TELEFONE\}\}/g, data.guardianData.phone || 'Não informado');
        html = html.replace(/\{\{RESP_VINCULO\}\}/g, data.guardianData.relationship || 'Responsável');
    }

    // Plan replacements
    html = html.replace(/\{\{PLANO_NOME\}\}/g, data.planData.name || 'Plano');
    html = html.replace(/\{\{PLANO_VALOR\}\}/g, formatCurrency(data.planData.price || 0));
    html = html.replace(/\{\{PLANO_RECORRENCIA\}\}/g, BILLING_CYCLE_LABELS[data.planData.billing_cycle] || data.planData.billing_cycle || 'mensal');
    html = html.replace(/\{\{PLANO_VENCIMENTO_DIA\}\}/g, String(data.planData.due_day || 5));
    html = html.replace(/\{\{HORARIOS\}\}/g, data.planData.schedules || 'A definir conforme disponibilidade');

    // Contract terms
    html = html.replace(/\{\{DATA_INICIO\}\}/g, data.contractData.start_date ? formatDateBR(data.contractData.start_date) : formatDateBR(new Date()));
    html = html.replace(/\{\{VIGENCIA\}\}/g, '12 meses');
    html = html.replace(/\{\{TAXA_MATRICULA\}\}/g, formatCurrency(0));
    html = html.replace(/\{\{FORMA_PAGAMENTO\}\}/g, 'Pix, cartão ou boleto');
    html = html.replace(/\{\{MULTA_ATRASO\}\}/g, String(data.contractData.finePercentage ?? DEFAULT_CONTRACT_TERMS.lateFeePercent));
    html = html.replace(/\{\{JUROS_MENSAL\}\}/g, String(data.contractData.interestPercentage ?? DEFAULT_CONTRACT_TERMS.monthlyInterest));
    html = html.replace(/\{\{DIAS_TOLERANCIA\}\}/g, String(DEFAULT_CONTRACT_TERMS.graceDays));
    html = html.replace(/\{\{PRAZO_AVISO_REAJUSTE\}\}/g, String(DEFAULT_CONTRACT_TERMS.priceAdjustmentDays));
    html = html.replace(/\{\{AVISO_PREVIO_CANCELAMENTO\}\}/g, String(DEFAULT_CONTRACT_TERMS.cancellationNoticeDays));
    html = html.replace(/\{\{MULTA_FIDELIDADE\}\}/g, 'não aplicável');
    html = html.replace(/\{\{REGRA_FIDELIDADE\}\}/g, DEFAULT_CONTRACT_TERMS.loyaltyPenalty);
    html = html.replace(/\{\{REGRAS_TRANCAMENTO\}\}/g, DEFAULT_CONTRACT_TERMS.suspensionRules);
    html = html.replace(/\{\{REGRAS_REPOSICAO\}\}/g, DEFAULT_CONTRACT_TERMS.replacementRules);

    // Signature
    html = html.replace(/\{\{CIDADE\}\}/g, data.contractData.city || 'Cidade');
    html = html.replace(/\{\{DATA_ASSINATURA\}\}/g, formatDateBR(new Date()));
    html = html.replace(/\{\{FORMA_PAGAMENTO\}\}/g, 'Pix, cartão ou boleto');

    // Default fallback for location
    html = html.replace(/\{\{FORO_CIDADE_UF\}\}/g,
        data.contractData.city && data.contractData.state
            ? `${data.contractData.city}/${data.contractData.state}`
            : 'Cidade/UF'
    );

    // Clean up any remaining placeholders
    html = html.replace(/\{\{.*?\}\}/g, '_____');

    return html;
}
