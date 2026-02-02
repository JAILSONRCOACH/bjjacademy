import { useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ContractStatusBadge } from './ContractStatusBadge';
import { Contract, ContractTemplate } from '@/hooks/useContracts';
import { useAcademy } from '@/hooks/useAcademy';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Printer, FileText } from 'lucide-react';

interface ContractViewerProps {
  contract: Contract & { 
    template: ContractTemplate;
    student: { 
      name: string; 
      email: string | null; 
      cpf: string | null; 
      birth_date: string | null;
      guardian_name: string | null;
    };
  };
  showActions?: boolean;
}

export function ContractViewer({ contract, showActions = true }: ContractViewerProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const { data: academy } = useAcademy();

  // Replace template variables
  const renderContractHtml = () => {
    let html = contract.template.body_html;
    
    const variables: Record<string, string> = {
      '{{academy_name}}': academy?.name || '',
      '{{academy_address}}': academy?.address || '',
      '{{academy_phone}}': academy?.phone || '',
      '{{student_name}}': contract.student.name,
      '{{student_cpf}}': contract.student.cpf || '',
      '{{student_birthdate}}': contract.student.birth_date 
        ? format(new Date(contract.student.birth_date), 'dd/MM/yyyy')
        : '',
      '{{student_email}}': contract.student.email || '',
      '{{responsible_name}}': contract.student.guardian_name || contract.student.name,
      '{{date}}': format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }),
      '{{contract_date}}': format(new Date(contract.created_at), 'dd/MM/yyyy'),
    };

    Object.entries(variables).forEach(([key, value]) => {
      html = html.replace(new RegExp(key, 'g'), value);
    });

    return html;
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Contrato - ${contract.student.name}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 40px;
              max-width: 800px;
              margin: 0 auto;
              line-height: 1.6;
            }
            h1, h2, h3 { margin-top: 24px; }
            p { margin: 12px 0; text-align: justify; }
            .signature-area {
              margin-top: 60px;
              display: flex;
              justify-content: space-between;
            }
            .signature-line {
              width: 45%;
              text-align: center;
              border-top: 1px solid #000;
              padding-top: 8px;
            }
            @media print {
              body { padding: 20px; }
            }
          </style>
        </head>
        <body>
          ${renderContractHtml()}
          <div class="signature-area">
            <div class="signature-line">
              <p><strong>Contratante</strong><br/>${contract.student.guardian_name || contract.student.name}</p>
            </div>
            <div class="signature-line">
              <p><strong>Contratada</strong><br/>${academy?.name || 'Academia'}</p>
            </div>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <div>
            <CardTitle className="text-lg">{contract.template.title}</CardTitle>
            <p className="text-sm text-muted-foreground">
              Versão {contract.template.version} • Criado em {format(new Date(contract.created_at), 'dd/MM/yyyy')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ContractStatusBadge status={contract.status} />
          {showActions && (
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div 
          ref={contentRef}
          className="prose prose-sm max-w-none dark:prose-invert border rounded-lg p-6 bg-white text-black max-h-[500px] overflow-y-auto"
          dangerouslySetInnerHTML={{ __html: renderContractHtml() }}
        />
      </CardContent>
    </Card>
  );
}
