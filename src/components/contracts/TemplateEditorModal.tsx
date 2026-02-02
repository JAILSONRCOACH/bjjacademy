import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useCreateTemplate,
  useUpdateTemplate,
  useDeleteTemplate,
  ContractTemplate,
} from '@/hooks/useContracts';
import { DEFAULT_CONTRACT_TEMPLATE } from '@/lib/contractTemplate';
import { useToast } from '@/hooks/use-toast';
import { Loader2, FileText, Eye, Code, Trash2 } from 'lucide-react';
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

interface TemplateEditorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: ContractTemplate | null;
}

export function TemplateEditorModal({ open, onOpenChange, template }: TemplateEditorModalProps) {
  const { toast } = useToast();
  const createMutation = useCreateTemplate();
  const updateMutation = useUpdateTemplate();
  const deleteMutation = useDeleteTemplate();

  const [title, setTitle] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const isEditing = !!template;

  useEffect(() => {
    if (template) {
      setTitle(template.title);
      setBodyHtml(template.body_html);
      setIsActive(template.is_active);
    } else {
      setTitle('Contrato de Matrícula');
      setBodyHtml(DEFAULT_CONTRACT_TEMPLATE);
      setIsActive(true);
    }
  }, [template, open]);

  const handleSave = async () => {
    if (!title.trim() || !bodyHtml.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha o título e o conteúdo do template.',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (isEditing) {
        await updateMutation.mutateAsync({
          id: template.id,
          title,
          body_html: bodyHtml,
          is_active: isActive,
          version: template.version + 1,
        });
        toast({ title: 'Template atualizado!' });
      } else {
        await createMutation.mutateAsync({
          title,
          body_html: bodyHtml,
        });
        toast({ title: 'Template criado!' });
      }

      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!template) return;

    try {
      await deleteMutation.mutateAsync(template.id);
      toast({ title: 'Template excluído!' });
      setShowDeleteDialog(false);
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Erro ao excluir',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {isEditing ? 'Editar Template' : 'Novo Template'}
            </DialogTitle>
            <DialogDescription>
              Crie ou edite um modelo de contrato. Use variáveis como {'{{student_name}}'} para dados dinâmicos.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-auto space-y-4 py-4">
            <div className="flex gap-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor="title">Título do Template</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Contrato de Matrícula"
                />
              </div>
              <div className="flex items-end gap-2">
                <div className="flex items-center gap-2">
                  <Switch
                    id="active"
                    checked={isActive}
                    onCheckedChange={setIsActive}
                  />
                  <Label htmlFor="active">Ativo</Label>
                </div>
              </div>
            </div>

            <Tabs defaultValue="editor" className="flex-1">
              <TabsList>
                <TabsTrigger value="editor" className="gap-1">
                  <Code className="h-4 w-4" />
                  Editor
                </TabsTrigger>
                <TabsTrigger value="preview" className="gap-1">
                  <Eye className="h-4 w-4" />
                  Visualizar
                </TabsTrigger>
              </TabsList>
              <TabsContent value="editor" className="mt-2">
                <Textarea
                  value={bodyHtml}
                  onChange={(e) => setBodyHtml(e.target.value)}
                  className="min-h-[400px] font-mono text-sm"
                  placeholder="Cole o HTML do contrato aqui..."
                />
                <div className="mt-2 text-xs text-muted-foreground">
                  <strong>Variáveis disponíveis:</strong>{' '}
                  {'{{academy_name}}, {{academy_address}}, {{academy_phone}}, {{student_name}}, {{student_cpf}}, {{student_birthdate}}, {{student_email}}, {{responsible_name}}, {{date}}, {{contract_date}}'}
                </div>
              </TabsContent>
              <TabsContent value="preview" className="mt-2">
                <div
                  className="prose prose-sm max-w-none dark:prose-invert border rounded-lg p-6 bg-white text-black min-h-[400px] max-h-[400px] overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: bodyHtml }}
                />
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter className="flex justify-between">
            <div>
              {isEditing && (
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isEditing ? 'Salvar' : 'Criar'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir template?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Contratos existentes que usam este template permanecerão intactos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
