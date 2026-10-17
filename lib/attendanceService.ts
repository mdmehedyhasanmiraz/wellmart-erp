import { supabase } from './supabase';
import {
  Doctor,
  MonthlyWorkday,
  DoctorVisitSchedule,
  DailyAttendance,
  DoctorVisitCheckin,
} from '@/types/user';

export class AttendanceService {
  // =========================================================================
  // DOCTORS MASTER
  // =========================================================================

  static async getDoctors(branchId?: string): Promise<Doctor[]> {
    let query = supabase
      .from('doctors')
      .select('*')
      .order('name', { ascending: true });

    if (branchId) {
      query = query.eq('branch_id', branchId);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching doctors:', error);
      return [];
    }
    return (data || []) as Doctor[];
  }

  static async saveDoctor(payload: Partial<Doctor>): Promise<Doctor | null> {
    if (payload.id) {
      const { data, error } = await supabase
        .from('doctors')
        .update({
          ...payload,
          updated_at: new Date().toISOString(),
        })
        .eq('id', payload.id)
        .select()
        .single();
      if (error) {
        console.error('Error updating doctor:', error);
        throw error;
      }
      return data as Doctor;
    } else {
      const { data, error } = await supabase
        .from('doctors')
        .insert([{
          ...payload,
          geofence_radius_meters: payload.geofence_radius_meters || 180,
          is_active: payload.is_active ?? true,
        }])
        .select()
        .single();
      if (error) {
        console.error('Error creating doctor:', error);
        throw error;
      }
      return data as Doctor;
    }
  }

  static async deleteDoctor(id: string): Promise<boolean> {
    const { error } = await supabase.from('doctors').delete().eq('id', id);
    if (error) {
      console.error('Error deleting doctor:', error);
      return false;
    }
    return true;
  }

  // =========================================================================
  // MONTHLY WORKDAYS CONFIGURATION
  // =========================================================================

  static async getMonthlyWorkdays(
    branchId: string,
    year: number,
    month: number
  ): Promise<MonthlyWorkday | null> {
    const { data, error } = await supabase
      .from('monthly_workdays')
      .select('*')
      .eq('branch_id', branchId)
      .eq('year', year)
      .eq('month', month)
      .maybeSingle();

    if (error) {
      console.error('Error fetching monthly workdays:', error);
      return null;
    }
    return data as MonthlyWorkday | null;
  }

  static async saveMonthlyWorkdays(
    payload: Partial<MonthlyWorkday> & {
      branch_id: string;
      year: number;
      month: number;
      total_calendar_days: number;
      total_working_days: number;
    }
  ): Promise<MonthlyWorkday> {
    const { data, error } = await supabase
      .from('monthly_workdays')
      .upsert(
        {
          branch_id: payload.branch_id,
          year: payload.year,
          month: payload.month,
          total_calendar_days: payload.total_calendar_days,
          total_working_days: payload.total_working_days,
          weekend_days: payload.weekend_days ?? 4,
          holiday_count: payload.holiday_count ?? 0,
          holiday_dates: payload.holiday_dates ?? [],
          notes: payload.notes || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'branch_id,year,month' }
      )
      .select()
      .single();

    if (error) {
      console.error('Error saving monthly workdays:', error);
      throw error;
    }
    return data as MonthlyWorkday;
  }

  // =========================================================================
  // DOCTOR VISIT SCHEDULES (Current + up to 2 upcoming months)
  // =========================================================================

  static async getSchedules(filters: {
    branchId?: string;
    employeeId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<DoctorVisitSchedule[]> {
    let query = supabase
      .from('doctor_visit_schedules')
      .select(`
        *,
        doctor:doctor_id(*),
        employee:employee_id(id, name, employee_code, phone)
      `)
      .order('schedule_date', { ascending: true });

    if (filters.branchId) query = query.eq('branch_id', filters.branchId);
    if (filters.employeeId) query = query.eq('employee_id', filters.employeeId);
    if (filters.startDate) query = query.gte('schedule_date', filters.startDate);
    if (filters.endDate) query = query.lte('schedule_date', filters.endDate);

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching visit schedules:', error);
      return [];
    }
    return (data || []) as DoctorVisitSchedule[];
  }

  static async saveSchedule(
    payload: Partial<DoctorVisitSchedule>
  ): Promise<DoctorVisitSchedule> {
    if (payload.id) {
      const { data, error } = await supabase
        .from('doctor_visit_schedules')
        .update({
          ...payload,
          updated_at: new Date().toISOString(),
        })
        .eq('id', payload.id)
        .select(`
          *,
          doctor:doctor_id(*),
          employee:employee_id(id, name, employee_code, phone)
        `)
        .single();
      if (error) throw error;
      return data as DoctorVisitSchedule;
    } else {
      const { data, error } = await supabase
        .from('doctor_visit_schedules')
        .upsert(
          {
            branch_id: payload.branch_id,
            employee_id: payload.employee_id,
            doctor_id: payload.doctor_id,
            schedule_date: payload.schedule_date,
            shift_time: payload.shift_time || 'morning',
            priority: payload.priority || 'normal',
            notes: payload.notes || null,
            status: payload.status || 'scheduled',
          },
          { onConflict: 'employee_id,doctor_id,schedule_date,shift_time' }
        )
        .select(`
          *,
          doctor:doctor_id(*),
          employee:employee_id(id, name, employee_code, phone)
        `)
        .single();
      if (error) throw error;
      return data as DoctorVisitSchedule;
    }
  }

  static async deleteSchedule(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('doctor_visit_schedules')
      .delete()
      .eq('id', id);
    if (error) {
      console.error('Error deleting schedule:', error);
      return false;
    }
    return true;
  }

  // =========================================================================
  // DAILY ATTENDANCE (General In / Out)
  // =========================================================================

  static async getDailyAttendance(
    employeeId: string,
    date: string
  ): Promise<DailyAttendance | null> {
    const { data, error } = await supabase
      .from('daily_attendances')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('attendance_date', date)
      .maybeSingle();

    if (error) {
      console.error('Error fetching daily attendance:', error);
      return null;
    }
    return data as DailyAttendance | null;
  }

  static async recordGeneralCheckIn(params: {
    employeeId: string;
    branchId: string;
    date: string;
    latitude?: number;
    longitude?: number;
    address?: string;
  }): Promise<DailyAttendance> {
    const existing = await this.getDailyAttendance(params.employeeId, params.date);

    if (existing) {
      // Already checked in, update check-in details if not set
      const { data, error } = await supabase
        .from('daily_attendances')
        .update({
          check_in_time: existing.check_in_time || new Date().toISOString(),
          check_in_lat: params.latitude ?? existing.check_in_lat,
          check_in_lng: params.longitude ?? existing.check_in_lng,
          check_in_address: params.address || existing.check_in_address,
          status: 'present',
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      return data as DailyAttendance;
    }

    const { data, error } = await supabase
      .from('daily_attendances')
      .insert([
        {
          employee_id: params.employeeId,
          branch_id: params.branchId,
          attendance_date: params.date,
          check_in_time: new Date().toISOString(),
          check_in_lat: params.latitude || null,
          check_in_lng: params.longitude || null,
          check_in_address: params.address || null,
          status: 'present',
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data as DailyAttendance;
  }

  static async recordGeneralCheckOut(params: {
    attendanceId: string;
    latitude?: number;
    longitude?: number;
    address?: string;
    workSummary?: string;
  }): Promise<DailyAttendance> {
    const { data, error } = await supabase
      .from('daily_attendances')
      .update({
        check_out_time: new Date().toISOString(),
        check_out_lat: params.latitude || null,
        check_out_lng: params.longitude || null,
        check_out_address: params.address || null,
        work_summary: params.workSummary || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.attendanceId)
      .select()
      .single();

    if (error) throw error;
    return data as DailyAttendance;
  }

  // =========================================================================
  // DOCTOR VISIT CHECK-IN (Geofence verified)
  // =========================================================================

  static async getCheckinsForSchedule(
    scheduleId: string
  ): Promise<DoctorVisitCheckin[]> {
    const { data, error } = await supabase
      .from('doctor_visit_checkins')
      .select('*')
      .eq('schedule_id', scheduleId);
    if (error) return [];
    return (data || []) as DoctorVisitCheckin[];
  }

  static async recordDoctorVisitCheckin(params: {
    scheduleId?: string;
    dailyAttendanceId?: string;
    employeeId: string;
    doctorId: string;
    branchId: string;
    visitDate: string;
    latitude: number;
    longitude: number;
    accuracyMeters?: number;
    distanceMeters: number;
    isWithinGeofence: boolean;
    verificationStatus: 'verified' | 'out_of_range' | 'flagged' | 'manual_approved';
    remarks?: string;
    productsDiscussed?: string;
    sampleGiven?: string;
    doctorFeedback?: string;
  }): Promise<DoctorVisitCheckin> {
    const { data, error } = await supabase
      .from('doctor_visit_checkins')
      .insert([
        {
          schedule_id: params.scheduleId || null,
          daily_attendance_id: params.dailyAttendanceId || null,
          employee_id: params.employeeId,
          doctor_id: params.doctorId,
          branch_id: params.branchId,
          visit_date: params.visitDate,
          checkin_time: new Date().toISOString(),
          latitude: params.latitude,
          longitude: params.longitude,
          accuracy_meters: params.accuracyMeters || null,
          distance_meters: params.distanceMeters,
          is_within_geofence: params.isWithinGeofence,
          verification_status: params.verificationStatus,
          remarks: params.remarks || null,
          products_discussed: params.productsDiscussed || null,
          sample_given: params.sampleGiven || null,
          doctor_feedback: params.doctorFeedback || null,
        },
      ])
      .select(`
        *,
        doctor:doctor_id(*),
        employee:employee_id(id, name, employee_code)
      `)
      .single();

    if (error) {
      console.error('Error creating doctor visit checkin:', error);
      throw error;
    }

    // Also update schedule status to 'completed' if scheduleId provided
    if (params.scheduleId) {
      await supabase
        .from('doctor_visit_schedules')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.scheduleId);
    }

    return data as DoctorVisitCheckin;
  }

  static async getVisitCheckins(filters: {
    branchId?: string;
    employeeId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<DoctorVisitCheckin[]> {
    let query = supabase
      .from('doctor_visit_checkins')
      .select(`
        *,
        doctor:doctor_id(id, name, specialty, hospital_clinic_name, chamber_address),
        employee:employee_id(id, name, employee_code)
      `)
      .order('checkin_time', { ascending: false });

    if (filters.branchId) query = query.eq('branch_id', filters.branchId);
    if (filters.employeeId) query = query.eq('employee_id', filters.employeeId);
    if (filters.startDate) query = query.gte('visit_date', filters.startDate);
    if (filters.endDate) query = query.lte('visit_date', filters.endDate);

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching checkins:', error);
      return [];
    }
    return (data || []) as DoctorVisitCheckin[];
  }
}
