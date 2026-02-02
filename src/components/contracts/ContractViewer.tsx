import { useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ContractStatusBadge } from './ContractStatusBadge';
import { Contract, ContractTemplate } from '@/hooks/useContracts';
import { useAcademy } from '@/hooks/useAcademy';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Printer, FileText, ExternalLink } from 'lucide-react';

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
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { data: academy } = useAcademy();

  // Determine if content is full HTML (Snapshot) or Legacy fragment
  const content = contract.template.body_html || '';
  const isFullHtml = content.trim().toLowerCase().startsWith('<!doctype html') || content.trim().toLowerCase().startsWith('<html');

  // Legacy replacement (only if not full html snapshot)
  const getRenderedContent = () => {
    if (isFullHtml) return content;

    let html = content;
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

  const finalContent = getRenderedContent();

  // Update iframe
  useEffect(() => {
    if (iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(finalContent);
        doc.close();
      }
    }
  }, [finalContent]);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    if (isFullHtml) {
      printWindow.document.write(finalContent);
    } else {
      // Legacy print wrapper
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Contrato - ${contract.student.name}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; line-height: 1.6; }
              h1, h2, h3 { margin-top: 24px; }
              p { margin: 12px 0; text-align: justify; }
              .signature-area { margin-top: 60px; display: flex; justify-content: space-between; }
              .signature-line { width: 45%; text-align: center; border-top: 1px solid #000; padding-top: 8px; }
              @media print { body { padding: 20px; } }
            </style>
          </head>
          <body>
            ${finalContent}
            <div class="signature-area">
              <div class="signature-line"><p><strong>Contratante</strong><br/>${contract.student.guardian_name || contract.student.name}</p></div>
              <div class="signature-line"><p><strong>Contratada</strong><br/>${academy?.name || 'Academia'}</p></div>
            </div>
          </body>
        </html>
      `);
    }

    printWindow.document.close();
    // Allow images/styles to load
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 500);
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="flex flex-row items-center justify-between py-4">
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <div>
            <CardTitle className="text-lg">{contract.template.title || 'Contrato'}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {isFullHtml ? 'Documento Gerado Automaticamente' : `Versão ${contract.template.version}`} • {format(new Date(contract.created_at), 'dd/MM/yyyy')}
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
      <CardContent className="flex-1 min-h-[500px] p-0 overflow-hidden bg-white border-t rounded-b-lg">
        {isFullHtml ? (
          <iframe
            ref={iframeRef}
            className="w-full h-full min-h-[600px] border-0"
            title="Contract Content"
          />
        ) : (
          <div className="p-8 prose max-w-none">
            <div dangerouslySetInnerHTML={{ __html: finalContent }} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
