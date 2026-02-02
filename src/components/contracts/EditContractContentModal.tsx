import { useState, useEffect, useRef } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useUpdateContract, Contract } from '@/hooks/useContracts';
import { Bold, Italic, Underline, List, AlignLeft, AlignCenter, AlignRight, Save } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface EditContractContentModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    contract: Contract | null;
}

export function EditContractContentModal({ open, onOpenChange, contract }: EditContractContentModalProps) {
    const { toast } = useToast();
    const updateContract = useUpdateContract();
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Initialization Logic using onLoad to ensure iframe availability
    const initializeEditor = () => {
        if (!iframeRef.current || !contract) return;

        const doc = iframeRef.current.contentDocument;
        if (doc) {
            const content = contract.template?.body_html || '';

            doc.open();
            if (content) {
                doc.write(content);
            } else {
                doc.write('<div style="padding: 2rem; font-family: sans-serif; color: #666; text-align: center;">(O conteúdo deste contrato está vazio. Você pode começar a digitar aqui...)</div>');
            }
            doc.close();

            // Enable editing
            doc.designMode = 'on';
            doc.body.style.backgroundColor = 'white';
            doc.body.style.minHeight = '100vh';

            // Force focus
            // iframeRef.current.focus();
        }
    };

    // Also trigger if open/contract changes, but check readiness
    useEffect(() => {
        if (open && contract) {
            // Give React a moment to mount the iframe/ref
            const timer = setTimeout(() => {
                initializeEditor();
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [open, contract]);

    const handleSave = async () => {
        if (!contract || !iframeRef.current?.contentDocument) return;

        setIsSaving(true);
        const doc = iframeRef.current.contentDocument;
        const newHtml = doc.documentElement.outerHTML;

        try {
            await updateContract.mutateAsync({
                contractId: contract.id,
                snapshot: {
                    html: newHtml,
                    data: (contract.snapshot_json as any)?.data
                }
            });

            toast({
                title: 'Contrato atualizado',
                description: 'As alterações foram salvas com sucesso.',
            });
            onOpenChange(false);
        } catch (error) {
            console.error(error);
            toast({
                title: 'Erro ao salvar',
                description: 'Não foi possível salvar as alterações.',
                variant: 'destructive',
            });
        } finally {
            setIsSaving(false);
        }
    };

    const execCmd = (cmd: string, value?: string) => {
        if (iframeRef.current?.contentDocument) {
            iframeRef.current.contentDocument.execCommand(cmd, false, value);
            iframeRef.current.focus();
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 gap-0">
                <DialogHeader className="p-6 pb-2 border-b">
                    <DialogTitle>Editar Rascunho do Contrato</DialogTitle>
                    <DialogDescription>
                        Faça alterações manuais no texto do contrato.
                    </DialogDescription>
                </DialogHeader>

                {/* Toolbar */}
                <div className="flex items-center gap-1 p-2 border-b bg-muted/40">
                    <Button variant="ghost" size="icon" onClick={() => execCmd('bold')} title="Negrito">
                        <Bold className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => execCmd('italic')} title="Itálico">
                        <Italic className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => execCmd('underline')} title="Sublinhado">
                        <Underline className="h-4 w-4" />
                    </Button>

                    <Separator orientation="vertical" className="mx-1 h-6" />

                    <Button variant="ghost" size="icon" onClick={() => execCmd('justifyLeft')} title="Alinhar Esquerda">
                        <AlignLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => execCmd('justifyCenter')} title="Centralizar">
                        <AlignCenter className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => execCmd('justifyRight')} title="Alinhar Direita">
                        <AlignRight className="h-4 w-4" />
                    </Button>

                    <Separator orientation="vertical" className="mx-1 h-6" />

                    <Button variant="ghost" size="icon" onClick={() => execCmd('insertUnorderedList')} title="Lista">
                        <List className="h-4 w-4" />
                    </Button>
                </div>

                {/* Editor Area */}
                <div className="flex-1 overflow-auto bg-slate-50 p-6">
                    <div className="max-w-[210mm] mx-auto bg-white shadow-sm h-full min-h-[500px]">
                        <iframe
                            ref={iframeRef}
                            className="w-full h-full border-0 channel-editor"
                            title="Contract Editor"
                            style={{ backgroundColor: 'white' }}
                            // Also trigger on load to be safe
                            onLoad={initializeEditor}
                        />
                    </div>
                </div>

                <DialogFooter className="p-4 border-t">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        <Save className="h-4 w-4 mr-2" />
                        {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
