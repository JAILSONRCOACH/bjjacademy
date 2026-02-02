import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type AttendanceStatus = 'pending' | 'approved' | 'rejected';
export type AttendanceSource = 'app' | 'manual' | 'qrcode';

export interface Attendance {
  id: string;
  academy_id: string;
  student_id: string;
  checked_in_at: string;
  status: AttendanceStatus;
  source: AttendanceSource;
  validated_by: string | null;
  validated_at: string | null;
  created_at: string;
  notes: string | null;
  student?: {
    id: string;
    name: string;
    belt: 'white' | 'blue' | 'purple' | 'brown' | 'black';
    stripes: number;
    classes_since_last_stripe: number;
    total_classes: number;
  } | null;
  validator?: {
    name: string;
  } | null;
}

interface UseAttendanceOptions {
  status?: AttendanceStatus | 'all';
  startDate?: Date;
  endDate?: Date;
  studentSearch?: string;
}

export function useAttendance(options: UseAttendanceOptions = {}) {
  const { status = 'pending', startDate, endDate, studentSearch } = options;

  return useQuery({
    queryKey: ['attendance', status, startDate?.toISOString(), endDate?.toISOString(), studentSearch],
    queryFn: async () => {
      let query = supabase
        .from('attendance')
        .select(`
          *,
          student:profiles!attendance_student_id_fkey(id, name, belt, stripes, classes_since_last_stripe, total_classes),
          validator:profiles!attendance_validated_by_fkey(name)
        `)
        .order('checked_in_at', { ascending: false });

      if (status !== 'all') {
        query = query.eq('status', status);
      }

      if (startDate) {
        query = query.gte('checked_in_at', startDate.toISOString());
      }

      if (endDate) {
        query = query.lte('checked_in_at', endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      // Filter by student name if provided
      let result = data as unknown as Attendance[];
      if (studentSearch) {
        const searchLower = studentSearch.toLowerCase();
        result = result.filter(a => 
          a.student?.name?.toLowerCase().includes(searchLower)
        );
      }

      return result;
    },
  });
}

export function useStudentAttendance(studentId: string | undefined) {
  return useQuery({
    queryKey: ['student-attendance', studentId],
    queryFn: async () => {
      if (!studentId) return [];

      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('student_id', studentId)
        .order('checked_in_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as Attendance[];
    },
    enabled: !!studentId,
  });
}

export function useCheckIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      studentId, 
      academyId, 
      classSlotId 
    }: { 
      studentId: string; 
      academyId: string; 
      classSlotId: string;
    }) => {
      const { error } = await supabase.from('attendance').insert({
        academy_id: academyId,
        student_id: studentId,
        status: 'pending',
        source: 'app',
        checked_in_at: new Date().toISOString(),
        class_slot_id: classSlotId,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['student-attendance'] });
      queryClient.invalidateQueries({ queryKey: ['tatame-online'] });
    },
  });
}

// Hook to get available class slots for today (all slots - used by admin/professor)
export function useTodayClassSlots(academyId: string | undefined) {
  return useQuery({
    queryKey: ['today-class-slots', academyId],
    queryFn: async () => {
      if (!academyId) return [];

      const now = new Date();
      const dayOfWeek = now.getDay();

      const { data, error } = await supabase
        .from('class_slots')
        .select(`
          id, 
          start_time, 
          end_time, 
          title,
          day_of_week,
          modality:modalities(name, variant)
        `)
        .eq('academy_id', academyId)
        .eq('active', true)
        .order('start_time');

      if (error) throw error;

      // Filter by current day of week
      const todaySlots = (data || []).filter(slot =>
        (slot.day_of_week as number[]).includes(dayOfWeek)
      );

      return todaySlots;
    },
    enabled: !!academyId,
  });
}

// Hook to get enrolled class slots for a student (filtered by student_enrollments)
export function useStudentEnrolledSlots(studentId: string | undefined, academyId: string | undefined) {
  return useQuery({
    queryKey: ['student-enrolled-slots', studentId, academyId],
    queryFn: async () => {
      if (!studentId || !academyId) return [];

      const now = new Date();
      const dayOfWeek = now.getDay();

      // First get the student's enrolled class slot IDs
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('student_enrollments')
        .select('class_slot_id')
        .eq('student_id', studentId)
        .eq('status', 'active');

      if (enrollmentsError) throw enrollmentsError;

      // If no enrollments, return empty array
      if (!enrollments || enrollments.length === 0) return [];

      const enrolledSlotIds = enrollments.map(e => e.class_slot_id);

      // Fetch class slots that the student is enrolled in
      const { data, error } = await supabase
        .from('class_slots')
        .select(`
          id, 
          start_time, 
          end_time, 
          title,
          day_of_week,
          modality:modalities(name, variant)
        `)
        .eq('academy_id', academyId)
        .eq('active', true)
        .in('id', enrolledSlotIds)
        .order('start_time');

      if (error) throw error;

      // Filter by current day of week
      const todaySlots = (data || []).filter(slot =>
        (slot.day_of_week as number[]).includes(dayOfWeek)
      );

      return todaySlots;
    },
    enabled: !!studentId && !!academyId,
  });
}

export function useApproveAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ attendanceId, validatorId }: { attendanceId: string; validatorId: string }) => {
      const { error } = await supabase
        .from('attendance')
        .update({
          status: 'approved',
          validated_by: validatorId,
          validated_at: new Date().toISOString(),
        })
        .eq('id', attendanceId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['tatame-online'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['student'] });
    },
  });
}

export function useRejectAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ attendanceId, validatorId }: { attendanceId: string; validatorId: string }) => {
      const { error } = await supabase
        .from('attendance')
        .update({
          status: 'rejected',
          validated_by: validatorId,
          validated_at: new Date().toISOString(),
        })
        .eq('id', attendanceId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['tatame-online'] });
    },
  });
}
