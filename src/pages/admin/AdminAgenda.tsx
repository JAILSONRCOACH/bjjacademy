import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Calendar, Filter } from 'lucide-react';
import { useClassSlots, useCreateClassSlot, useUpdateClassSlot, useDeleteClassSlot, ClassSlot, DAY_NAMES, SHIFT_NAMES } from '@/hooks/useClassSlots';
import { useModalities } from '@/hooks/useModalities';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function AdminAgenda() {
  const [filters, setFilters] = useState<{ modality_id?: string; instructor_id?: string; shift?: string }>({});
  const { data: classSlots, isLoading } = useClassSlots(filters);
  const { data: modalities } = useModalities();
  const { data: instructors } = useQuery({
    queryKey: ['instructors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name')
        .in('role', ['admin', 'professor'])
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  const createSlot = useCreateClassSlot();
  const updateSlot = useUpdateClassSlot();
  const deleteSlot = useDeleteClassSlot();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<ClassSlot | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    modality_id: '',
    instructor_id: '',
    days_of_week: [1] as number[], // Changed to array
    start_time: '08:00',
    end_time: '09:00',
    shift: 'morning',
    title: '',
    active: true,
  });

  const openCreate = () => {
    setEditingSlot(null);
    setForm({
      modality_id: '',
      instructor_id: '',
      days_of_week: [1],
      start_time: '08:00',
      end_time: '09:00',
      shift: 'morning',
      title: '',
      active: true,
    });
    setIsModalOpen(true);
  };

  const openEdit = (slot: ClassSlot) => {
    setEditingSlot(slot);
    setForm({
      modality_id: slot.modality_id,
      instructor_id: slot.instructor_id || '',
      days_of_week: Array.isArray(slot.day_of_week) ? slot.day_of_week : [slot.day_of_week],
      start_time: slot.start_time,
      end_time: slot.end_time,
      shift: slot.shift,
      title: slot.title || '',
      active: slot.active,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.days_of_week.length === 0) {
      return; // At least one day required
    }
    const data = {
      modality_id: form.modality_id,
      instructor_id: form.instructor_id || undefined,
      day_of_week: form.days_of_week,
      start_time: form.start_time,
      end_time: form.end_time,
      shift: form.shift,
      title: form.title || undefined,
      active: form.active,
    };
    if (editingSlot) {
      await updateSlot.mutateAsync({ id: editingSlot.id, ...data });
    } else {
      await createSlot.mutateAsync(data);
    }
    setIsModalOpen(false);
  };

  const toggleDay = (day: number) => {
    setForm((prev) => {
      const days = prev.days_of_week.includes(day)
        ? prev.days_of_week.filter((d) => d !== day)
        : [...prev.days_of_week, day].sort((a, b) => a - b);
      return { ...prev, days_of_week: days };
    });
  };

  const formatDays = (days: number[]) => {
    if (!Array.isArray(days)) return DAY_NAMES[days as number] || '-';
    if (days.length === 0) return '-';
    if (days.length === 7) return 'Todos os dias';
    return days.map((d) => DAY_NAMES[d]?.substring(0, 3)).join(', ');
  };

  const handleDelete = async () => {
    if (deletingId) {
      await deleteSlot.mutateAsync(deletingId);
      setIsDeleteOpen(false);
      setDeletingId(null);
    }
  };

  return (
    <DashboardLayout title="Agenda de Aulas">
      <div className="space-y-4">
        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Filter className="h-4 w-4" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Modalidade</Label>
                <Select
                  value={filters.modality_id || 'all'}
                  onValueChange={(v) => setFilters({ ...filters, modality_id: v === 'all' ? undefined : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {modalities?.map((m) => (
                      <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Instrutor</Label>
                <Select
                  value={filters.instructor_id || 'all'}
                  onValueChange={(v) => setFilters({ ...filters, instructor_id: v === 'all' ? undefined : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {instructors?.map((i) => (
                      <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Turno</Label>
                <Select
                  value={filters.shift || 'all'}
                  onValueChange={(v) => setFilters({ ...filters, shift: v === 'all' ? undefined : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="morning">Manhã</SelectItem>
                    <SelectItem value="afternoon">Tarde</SelectItem>
                    <SelectItem value="night">Noite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Horários de Aula
            </CardTitle>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Horário
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground">Carregando...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dia</TableHead>
                    <TableHead>Horário</TableHead>
                    <TableHead>Turno</TableHead>
                    <TableHead>Modalidade</TableHead>
                    <TableHead>Instrutor</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classSlots?.map((slot) => (
                    <TableRow key={slot.id}>
                      <TableCell>{formatDays(slot.day_of_week)}</TableCell>
                      <TableCell>{slot.start_time} - {slot.end_time}</TableCell>
                      <TableCell>{SHIFT_NAMES[slot.shift]}</TableCell>
                      <TableCell>{slot.modality?.name || '-'}</TableCell>
                      <TableCell>{slot.instructor?.name || '-'}</TableCell>
                      <TableCell>{slot.title || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={slot.active ? 'default' : 'secondary'}>
                          {slot.active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="icon" variant="ghost" onClick={() => openEdit(slot)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => {
                              setDeletingId(slot.id);
                              setIsDeleteOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {classSlots?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground">
                        Nenhum horário cadastrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingSlot ? 'Editar Horário' : 'Novo Horário'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="modality">Modalidade *</Label>
              <Select value={form.modality_id} onValueChange={(v) => setForm({ ...form, modality_id: v })} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {modalities?.filter((m) => m.active).map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="instructor">Instrutor</Label>
              <Select
                value={form.instructor_id || '__none__'}
                onValueChange={(v) => setForm({ ...form, instructor_id: v === '__none__' ? '' : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Nenhum</SelectItem>
                  {instructors?.map((i) => (
                    <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Dias da Semana *</Label>
              <div className="grid grid-cols-4 gap-2">
                {DAY_NAMES.map((day, i) => (
                  <div key={i} className="flex items-center space-x-2">
                    <Checkbox
                      id={`day-${i}`}
                      checked={form.days_of_week.includes(i)}
                      onCheckedChange={() => toggleDay(i)}
                    />
                    <label htmlFor={`day-${i}`} className="text-sm cursor-pointer">
                      {day.substring(0, 3)}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="shift">Turno *</Label>
              <Select value={form.shift} onValueChange={(v) => setForm({ ...form, shift: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">Manhã</SelectItem>
                  <SelectItem value="afternoon">Tarde</SelectItem>
                  <SelectItem value="night">Noite</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_time">Início *</Label>
                <Input
                  type="time"
                  id="start_time"
                  value={form.start_time}
                  onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_time">Término *</Label>
                <Input
                  type="time"
                  id="end_time"
                  value={form.end_time}
                  onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Título (opcional)</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Ex: Turma Iniciante"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="active"
                checked={form.active}
                onCheckedChange={(v) => setForm({ ...form, active: v })}
              />
              <Label htmlFor="active">Ativo</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createSlot.isPending || updateSlot.isPending}>
                {editingSlot ? 'Salvar' : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir horário?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
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
    </DashboardLayout>
  );
}
