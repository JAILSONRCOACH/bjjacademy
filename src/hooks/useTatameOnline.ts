import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type AttendanceStatusType = 'pending' | 'approved' | 'rejected';

export interface TatameCheckin {
  id: string;
  student_id: string;
  checked_in_at: string;
  status: AttendanceStatusType;
  source: 'app' | 'manual' | 'qrcode';
  profile: {
    id: string;
    name: string;
    belt: 'white' | 'blue' | 'purple' | 'brown' | 'black';
    stripes: number;
  } | null;
  studentRecord?: {
    id: string;
    name: string;
    belt_current: 'white' | 'blue' | 'purple' | 'brown' | 'black';
    stripes_cached: number;
    gender: 'male' | 'female' | null;
    category: string | null;
    responsible_instructor_id: string | null;
    financial_status: 'ok' | 'pending' | 'overdue' | 'blocked';
  } | null;
}

export interface TatameStats {
  totalOnMat: number;
  pendingCount: number;
  approvedCount: number;
  byBelt: Record<string, number>;
  byGender: Record<string, number>;
  byProfessor: Record<string, { name: string; count: number }>;
  lastEventTime: string | null;
}

function getTodayRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  return { start, end };
}

export function useTatameOnline(professorId?: string) {
  const [lastEventTime, setLastEventTime] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { start, end } = getTodayRange();

  // Fetch today's pending and approved check-ins
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['tatame-online', professorId],
    queryFn: async (): Promise<{ checkins: TatameCheckin[]; instructorMap: Record<string, string> }> => {
      const now = new Date();

      const isBeforeOrEqualEnd = (checkedInAt: string, endTime: string) => {
        const [h, m, s = '00'] = endTime.split(':');
        const endAt = new Date(checkedInAt);
        endAt.setHours(Number(h), Number(m), Number(s), 0);
        return now.getTime() <= endAt.getTime();
      };

      // First get attendance with profile data (pending and approved only)
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select(`
          id,
          student_id,
          checked_in_at,
          status,
          source,
          class_slot_id,
          profile:profiles!attendance_student_id_fkey(
            id,
            name,
            belt,
            stripes
          )
        `)
        .in('status', ['pending', 'approved'])
        .gte('checked_in_at', start.toISOString())
        .lte('checked_in_at', end.toISOString())
        .order('checked_in_at', { ascending: false });

      if (attendanceError) throw attendanceError;

      // Get class_slots info to filter by end_time
      const slotIds = attendanceData
        .map(a => a.class_slot_id)
        .filter((id): id is string => id !== null);

      let slotMap: Record<string, { end_time: string }> = {};
      if (slotIds.length > 0) {
        const { data: slotsData } = await supabase
          .from('class_slots')
          .select('id, end_time')
          .in('id', slotIds);

        if (slotsData) {
          slotsData.forEach(s => {
            slotMap[s.id] = { end_time: s.end_time };
          });
        }
      }

      // Filter out check-ins where the class has already ended
      // IMPORTANT: Only filter APPROVED check-ins by end_time
      // PENDING check-ins should stay visible regardless of class end time
      const activeAttendance = attendanceData.filter(a => {
        // Pending check-ins always stay visible for approval/rejection
        if (a.status === 'pending') {
          return true;
        }
        
        // For approved check-ins, filter by class end time
        // If no class_slot_id associated, keep it visible (manual check-in or no match)
        if (!a.class_slot_id || !slotMap[a.class_slot_id]) {
          return true;
        }
        const endTime = slotMap[a.class_slot_id].end_time;
        // Keep if current time is before or equal to end_time (based on the check-in date)
        return isBeforeOrEqualEnd(a.checked_in_at, endTime);
      });

      // Get student records for additional data (gender, category, instructor)
      const profileIds = activeAttendance
        .map(a => a.student_id)
        .filter((id, index, self) => self.indexOf(id) === index);

      let studentMap: Record<string, any> = {};
      let instructorIds: string[] = [];
      
      if (profileIds.length > 0) {
        const { data: studentsData } = await supabase
          .from('students')
          .select('id, profile_id, name, belt_current, stripes_cached, gender, category, responsible_instructor_id, financial_status')
          .in('profile_id', profileIds);

        if (studentsData) {
          studentsData.forEach(s => {
            if (s.profile_id) {
              studentMap[s.profile_id] = s;
              if (s.responsible_instructor_id) {
                instructorIds.push(s.responsible_instructor_id);
              }
            }
          });
        }
      }

      // Get instructor names
      let instructorMap: Record<string, string> = {};
      const uniqueInstructorIds = [...new Set(instructorIds)];
      if (uniqueInstructorIds.length > 0) {
        const { data: instructorsData } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', uniqueInstructorIds);

        if (instructorsData) {
          instructorsData.forEach(i => {
            instructorMap[i.id] = i.name;
          });
        }
      }

      // Merge data with instructor info
      const result: (TatameCheckin & { instructorName?: string })[] = activeAttendance.map(a => {
        const student = studentMap[a.student_id];
        return {
          id: a.id,
          student_id: a.student_id,
          checked_in_at: a.checked_in_at,
          status: a.status as AttendanceStatusType,
          source: a.source as 'app' | 'manual' | 'qrcode',
          profile: a.profile as TatameCheckin['profile'],
          studentRecord: student || null,
          instructorName: student?.responsible_instructor_id 
            ? instructorMap[student.responsible_instructor_id] 
            : undefined,
        };
      });

      // Filter by professor if provided
      let filtered = result;
      if (professorId) {
        filtered = result.filter(c => 
          c.studentRecord?.responsible_instructor_id === professorId
        );
      }

      // Update last event time
      if (filtered.length > 0) {
        setLastEventTime(filtered[0].checked_in_at);
      }

      return { checkins: filtered, instructorMap };
    },
    refetchInterval: 5000, // Poll every 5 seconds as backup
  });

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('tatame-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance',
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  // Extract data
  const checkins = data?.checkins || [];
  const instructorMap = data?.instructorMap || {};

  // Calculate stats (only count approved as "on the mat")
  const approvedCheckins = checkins.filter(c => c.status === 'approved');
  const pendingCheckins = checkins.filter(c => c.status === 'pending');
  
  // Calculate byProfessor stats
  const byProfessor: Record<string, { name: string; count: number }> = {};
  approvedCheckins.forEach((checkin) => {
    const instructorId = checkin.studentRecord?.responsible_instructor_id;
    if (instructorId) {
      if (!byProfessor[instructorId]) {
        byProfessor[instructorId] = {
          name: instructorMap[instructorId] || 'Desconhecido',
          count: 0,
        };
      }
      byProfessor[instructorId].count += 1;
    }
  });

  const stats: TatameStats = {
    totalOnMat: approvedCheckins.length,
    pendingCount: pendingCheckins.length,
    approvedCount: approvedCheckins.length,
    byBelt: {},
    byGender: {},
    byProfessor,
    lastEventTime,
  };

  // Stats only for approved students (on the mat)
  approvedCheckins.forEach((checkin) => {
    const belt = checkin.studentRecord?.belt_current || checkin.profile?.belt || 'unknown';
    stats.byBelt[belt] = (stats.byBelt[belt] || 0) + 1;

    const gender = checkin.studentRecord?.gender || 'unknown';
    stats.byGender[gender] = (stats.byGender[gender] || 0) + 1;
  });

  return {
    checkins,
    stats,
    isLoading,
    error,
    refetch,
  };
}

export function useSimulateCheckin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ studentId, academyId }: { studentId: string; academyId: string }) => {
      const { error } = await supabase.from('attendance').insert({
        academy_id: academyId,
        student_id: studentId,
        status: 'pending',
        source: 'app',
        checked_in_at: new Date().toISOString(),
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tatame-online'] });
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
  });
}
