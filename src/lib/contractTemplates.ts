// Default Contract Templates for BJJ Academy
// These are used to generate contracts with placeholders that are replaced with actual data

export const CONTRACT_PLACEHOLDERS = {
    // Academy (tenant) placeholders
    ACADEMIA_NOME: '{{ACADEMIA_NOME}}',
    ACADEMIA_RAZAO_SOCIAL: '{{ACADEMIA_RAZAO_SOCIAL}}',
    ACADEMIA_CNPJ: '{{ACADEMIA_CNPJ}}',
    ACADEMIA_ENDERECO: '{{ACADEMIA_ENDERECO}}',
    ACADEMIA_EMAIL: '{{ACADEMIA_EMAIL}}',
    ACADEMIA_WHATSAPP: '{{ACADEMIA_WHATSAPP}}',
    ACADEMIA_TELEFONE: '{{ACADEMIA_TELEFONE}}',
    ACADEMIA_RESPONSAVEL: '{{ACADEMIA_RESPONSAVEL}}',

    // Student placeholders
    ALUNO_NOME: '{{ALUNO_NOME}}',
    ALUNO_CPF: '{{ALUNO_CPF}}',
    ALUNO_RG: '{{ALUNO_RG}}',
    ALUNO_NASC: '{{ALUNO_NASC}}',
    ALUNO_ENDERECO: '{{ALUNO_ENDERECO}}',
    ALUNO_EMAIL: '{{ALUNO_EMAIL}}',
    ALUNO_TELEFONE: '{{ALUNO_TELEFONE}}',

    // Guardian placeholders (for minors)
    RESP_NOME: '{{RESP_NOME}}',
    RESP_CPF: '{{RESP_CPF}}',
    RESP_RG: '{{RESP_RG}}',
    RESP_ENDERECO: '{{RESP_ENDERECO}}',
    RESP_EMAIL: '{{RESP_EMAIL}}',
    RESP_TELEFONE: '{{RESP_TELEFONE}}',
    RESP_VINCULO: '{{RESP_VINCULO}}',

    // Plan placeholders
    PLANO_NOME: '{{PLANO_NOME}}',
    PLANO_VALOR: '{{PLANO_VALOR}}',
    PLANO_RECORRENCIA: '{{PLANO_RECORRENCIA}}',
    PLANO_VENCIMENTO_DIA: '{{PLANO_VENCIMENTO_DIA}}',
    HORARIOS: '{{HORARIOS}}',

    // Contract terms
    DATA_INICIO: '{{DATA_INICIO}}',
    VIGENCIA: '{{VIGENCIA}}',
    TAXA_MATRICULA: '{{TAXA_MATRICULA}}',
    FORMA_PAGAMENTO: '{{FORMA_PAGAMENTO}}',
    MULTA_ATRASO: '{{MULTA_ATRASO}}',
    JUROS_MENSAL: '{{JUROS_MENSAL}}',
    DIAS_TOLERANCIA: '{{DIAS_TOLERANCIA}}',
    PRAZO_AVISO_REAJUSTE: '{{PRAZO_AVISO_REAJUSTE}}',
    AVISO_PREVIO_CANCELAMENTO: '{{AVISO_PREVIO_CANCELAMENTO}}',
    MULTA_FIDELIDADE: '{{MULTA_FIDELIDADE}}',
    REGRA_FIDELIDADE: '{{REGRA_FIDELIDADE}}',
    REGRAS_TRANCAMENTO: '{{REGRAS_TRANCAMENTO}}',
    REGRAS_REPOSICAO: '{{REGRAS_REPOSICAO}}',

    // Signature
    CIDADE: '{{CIDADE}}',
    DATA_ASSINATURA: '{{DATA_ASSINATURA}}',
    FORO_CIDADE_UF: '{{FORO_CIDADE_UF}}',
} as const;

export type PlaceholderKey = keyof typeof CONTRACT_PLACEHOLDERS;

// Relationship types for guardians
export const GUARDIAN_RELATIONSHIPS = [
    { value: 'pai', label: 'Pai' },
    { value: 'mae', label: 'Mãe' },
    { value: 'tutor', label: 'Tutor Legal' },
    { value: 'outro', label: 'Outro' },
] as const;

// Format address from JSON
export function formatAddress(addressJson: {
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zip?: string;
} | null): string {
    if (!addressJson) return 'Não informado';

    const parts = [
        addressJson.street,
        addressJson.number,
        addressJson.complement,
        addressJson.neighborhood,
        addressJson.city && addressJson.state ? `${addressJson.city}/${addressJson.state}` : addressJson.city,
        addressJson.zip ? `CEP: ${addressJson.zip}` : null,
    ].filter(Boolean);

    return parts.join(', ') || 'Não informado';
}

// Format currency
export function formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);
}

// Format date to Brazilian format
export function formatDateBR(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
}

// Calculate age from birth date
export function calculateAge(birthDate: string | Date): number {
    const today = new Date();
    const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
}

// Check if student is minor
export function isMinor(birthDate: string | Date | null): boolean {
    if (!birthDate) return false;
    return calculateAge(birthDate) < 18;
}

// Billing cycle labels
export const BILLING_CYCLE_LABELS: Record<string, string> = {
    monthly: 'mensal',
    quarterly: 'trimestral',
    semiannual: 'semestral',
    annual: 'anual',
};

// Default values for contract terms
export const DEFAULT_CONTRACT_TERMS = {
    lateFeePercent: 2,
    monthlyInterest: 1,
    graceDays: 5,
    priceAdjustmentDays: 30,
    cancellationNoticeDays: 30,
    loyaltyPenalty: 'proporcional ao período restante',
    suspensionRules: 'até 30 dias por ano, mediante solicitação com 5 dias de antecedência',
    replacementRules: 'reposição em horários alternativos conforme disponibilidade',
};
