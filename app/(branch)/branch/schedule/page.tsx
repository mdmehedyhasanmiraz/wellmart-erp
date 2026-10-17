'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AttendanceService } from '@/lib/attendanceService';
import { EmployeeService } from '@/lib/employeeService';
import { Doctor, Employee, DoctorVisitSchedule, MonthlyWorkday, ScheduleShift } from '@/types/user';
import {
  Calendar as CalendarIcon,
  Plus,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCircle,
  Clock,
  AlertCircle,
  Stethoscope,
  Trash2,
  CalendarCheck2,
} from 'lucide-react';

export default function BranchSchedulePage() {
  const { userProfile } = useAuth();
  const branchId = userProfile?.branch_id;

  // Selected calendar month (Current + upcoming 2 months restriction)
  const now = new Date();
  const [selectedMonthOffset, setSelectedMonthOffset] = useState<number>(0); // 0 = current, 1 = +1 month, 2 = +2 months

  const activeDate = new Date(now.getFullYear(), now.getMonth() + selectedMonthOffset, 1);
  const year = activeDate.getFullYear();
  const month = activeDate.getMonth() + 1; // 1-indexed

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [schedules, setSchedules] = useState<DoctorVisitSchedule[]>([]);
  const [workdays, setWorkdays] = useState<MonthlyWorkday | null>(null);
  const [loading, setLoading] = useState(true);

  // Filter
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('all');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [workdayModalOpen, setWorkdayModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    employee_id: '',
    doctor_id: '',
    schedule_date: '',
    shift_time: 'morning' as ScheduleShift,
    priority: 'normal' as 'normal' | 'urgent' | 'follow_up',
    notes: '',
  });

  // Workday form
  const [workdayForm, setWorkdayForm] = useState({
    total_calendar_days: 30,
    total_working_days: 26,
    weekend_days: 4,
    holiday_count: 0,
    notes: '',
  });

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    if (branchId) {
      loadInitialData();
    }
  }, [branchId]);

  useEffect(() => {
    if (branchId) {
      loadMonthData();
    }
  }, [branchId, selectedMonthOffset]);

  const loadInitialData = async () => {
    try {
      const [allEmps, allDocs] = await Promise.all([
        EmployeeService.getAll(),
        AttendanceService.getDoctors(branchId),
      ]);
      setEmployees(allEmps.filter((e) => e.branch_id === branchId));
      setDoctors(allDocs.filter((d) => d.is_active));
    } catch (err) {
      console.error('Error loading initial data:', err);
    }
  };

  const loadMonthData = async () => {
    if (!branchId) return;
    try {
      setLoading(true);
      const daysInMonth = new Date(year, month, 0).getDate();
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

      const [schedList, mw] = await Promise.all([
        AttendanceService.getSchedules({
          branchId,
          startDate,
          endDate,
        }),
        AttendanceService.getMonthlyWorkdays(branchId, year, month),
      ]);

      setSchedules(schedList);
      setWorkdays(mw);

      // Default calculation for workdays form
      let defaultWorking = 0;
      let weekends = 0;
      for (let day = 1; day <= daysInMonth; day++) {
        const d = new Date(year, month - 1, day);
        if (d.getDay() === 5) {
          // Friday off in BD
          weekends++;
        } else {
          defaultWorking++;
        }
      }

      setWorkdayForm({
        total_calendar_days: mw?.total_calendar_days ?? daysInMonth,
        total_working_days: mw?.total_working_days ?? defaultWorking,
        weekend_days: mw?.weekend_days ?? weekends,
        holiday_count: mw?.holiday_count ?? 0,
        notes: mw?.notes ?? '',
      });
    } catch (err) {
      console.error('Error loading month schedules:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddSchedule = (day?: number) => {
    const dateStr = day
      ? `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      : `${year}-${String(month).padStart(2, '0')}-01`;

    setFormData({
      employee_id: selectedEmployeeId !== 'all' ? selectedEmployeeId : employees[0]?.id || '',
      doctor_id: doctors[0]?.id || '',
      schedule_date: dateStr,
      shift_time: 'morning',
      priority: 'normal',
      notes: '',
    });
    setModalOpen(true);
  };

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employee_id || !formData.doctor_id || !formData.schedule_date) {
      alert('Please fill all required fields');
      return;
    }
    try {
      setSaving(true);
      await AttendanceService.saveSchedule({
        ...formData,
        branch_id: branchId,
        status: 'scheduled',
      });
      setModalOpen(false);
      loadMonthData();
    } catch (err: any) {
      alert(err.message || 'Error saving schedule');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    if (!confirm('Remove this scheduled visit?')) return;
    const ok = await AttendanceService.deleteSchedule(id);
    if (ok) {
      setSchedules((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const handleSaveWorkdays = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchId) return;
    try {
      setSaving(true);
      const saved = await AttendanceService.saveMonthlyWorkdays({
        branch_id: branchId,
        year,
        month,
        ...workdayForm,
      });
      setWorkdays(saved);
      setWorkdayModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Error saving workdays');
    } finally {
      setSaving(false);
    }
  };

  const filteredSchedules =
    selectedEmployeeId === 'all'
      ? schedules
      : schedules.filter((s) => s.employee_id === selectedEmployeeId);

  // Group schedules by day of month
  const daysInMonth = new Date(year, month, 0).getDate();
  const schedulesByDay: { [day: number]: DoctorVisitSchedule[] } = {};
  for (let i = 1; i <= daysInMonth; i++) {
    schedulesByDay[i] = [];
  }

  filteredSchedules.forEach((s) => {
    const day = parseInt(s.schedule_date.split('-')[2], 10);
    if (schedulesByDay[day]) {
      schedulesByDay[day].push(s);
    }
  });

  return (
    <div className="space-y-6">
      {/* Header with Month Navigator */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-100 text-purple-700 rounded-xl">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Doctor Visit Roster & Monthly Schedule
              </h1>
              <p className="text-sm text-gray-500">
                Plan and fix location schedules for the running and upcoming 2 months
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setWorkdayModalOpen(true)}
            className="px-4 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 font-medium rounded-xl text-sm flex items-center gap-2 transition"
          >
            <CalendarCheck2 className="w-4 h-4" />
            <span>Working Days ({workdays?.total_working_days ?? '--'})</span>
          </button>
          <button
            onClick={() => handleOpenAddSchedule()}
            className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium rounded-xl shadow-sm transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Visit</span>
          </button>
        </div>
      </div>

      {/* 3-Month Range Selector */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setSelectedMonthOffset(0)}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${
              selectedMonthOffset === 0
                ? 'bg-white text-purple-700 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Running Month ({monthNames[now.getMonth()]})
          </button>
          <button
            onClick={() => setSelectedMonthOffset(1)}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${
              selectedMonthOffset === 1
                ? 'bg-white text-purple-700 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Next Month ({monthNames[(now.getMonth() + 1) % 12]})
          </button>
          <button
            onClick={() => setSelectedMonthOffset(2)}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${
              selectedMonthOffset === 2
                ? 'bg-white text-purple-700 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Upcoming +2 ({monthNames[(now.getMonth() + 2) % 12]})
          </button>
        </div>

        {/* Employee Filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={selectedEmployeeId}
            onChange={(e) => setSelectedEmployeeId(e.target.value)}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Employees ({employees.length})</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name} ({emp.employee_code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Monthly Calendar View */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-purple-500 border-t-transparent"></div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <h2 className="text-base font-bold text-gray-800">
              {monthNames[month - 1]} {year} Roster Grid
            </h2>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                Scheduled ({filteredSchedules.filter((s) => s.status === 'scheduled').length})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                Completed ({filteredSchedules.filter((s) => s.status === 'completed').length})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                Missed ({filteredSchedules.filter((s) => s.status === 'missed').length})
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 p-4 bg-gray-50/30">
            {Array.from({ length: daysInMonth }, (_, idx) => {
              const day = idx + 1;
              const dateObj = new Date(year, month - 1, day);
              const isFriday = dateObj.getDay() === 5;
              const daySchedules = schedulesByDay[day] || [];
              const isToday =
                now.getDate() === day &&
                now.getMonth() === month - 1 &&
                now.getFullYear() === year;

              return (
                <div
                  key={day}
                  className={`min-h-[160px] p-3 rounded-xl border flex flex-col justify-between transition ${
                    isToday
                      ? 'bg-purple-50/40 border-purple-300 ring-2 ring-purple-400/30'
                      : isFriday
                      ? 'bg-amber-50/20 border-amber-200'
                      : 'bg-white border-gray-200/80 hover:border-purple-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-gray-100 mb-2">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            isToday
                              ? 'bg-purple-600 text-white'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {day}
                        </span>
                        <span className="text-[11px] font-medium text-gray-500">
                          {dateObj.toLocaleDateString('en-US', { weekday: 'short' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {isFriday && (
                          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                            Off
                          </span>
                        )}
                        <button
                          onClick={() => handleOpenAddSchedule(day)}
                          className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded"
                          title="Add visit for this day"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Scheduled Doctors List for this Day */}
                    <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-0.5">
                      {daySchedules.length === 0 ? (
                        <p className="text-[11px] text-gray-400 italic pt-2">No visits set</p>
                      ) : (
                        daySchedules.map((item) => {
                          const isDone = item.status === 'completed';
                          return (
                            <div
                              key={item.id}
                              className={`p-2 rounded-lg border text-xs relative group ${
                                isDone
                                  ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                                  : 'bg-purple-50/50 border-purple-200 text-purple-950'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-1">
                                <div className="font-semibold truncate">
                                  {item.doctor?.name || 'Doctor'}
                                </div>
                                <button
                                  onClick={() => handleDeleteSchedule(item.id)}
                                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                              <div className="text-[10px] text-gray-600 flex items-center justify-between mt-1">
                                <span className="font-medium text-purple-700">
                                  {item.employee?.name}
                                </span>
                                <span className="capitalize px-1 rounded bg-white/60">
                                  {item.shift_time}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <div className="text-[10px] text-gray-400 pt-2 border-t border-gray-50 flex items-center justify-between">
                    <span>{daySchedules.length} visit(s)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Schedule Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Schedule Doctor Visit</h2>
            <p className="text-xs text-gray-500 mb-4">
              Assign an employee to a doctor's location for geofence-verified attendance.
            </p>

            <form onSubmit={handleSaveSchedule} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Employee / Medical Representative *
                </label>
                <select
                  required
                  value={formData.employee_id}
                  onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-xs bg-white focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select Employee</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.employee_code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Doctor / Clinic *
                </label>
                <select
                  required
                  value={formData.doctor_id}
                  onChange={(e) => setFormData({ ...formData, doctor_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-xs bg-white focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select Doctor</option>
                  {doctors.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.name} - {doc.hospital_clinic_name || doc.specialty || 'Chamber'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Visit Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.schedule_date}
                    onChange={(e) =>
                      setFormData({ ...formData, schedule_date: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Shift / Time
                  </label>
                  <select
                    value={formData.shift_time}
                    onChange={(e) =>
                      setFormData({ ...formData, shift_time: e.target.value as ScheduleShift })
                    }
                    className="w-full px-3 py-2 border rounded-xl text-xs bg-white focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="morning">Morning Shift</option>
                    <option value="evening">Evening Shift</option>
                    <option value="full_day">Full Day</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      priority: e.target.value as 'normal' | 'urgent' | 'follow_up',
                    })
                  }
                  className="w-full px-3 py-2 border rounded-xl text-xs bg-white focus:ring-2 focus:ring-purple-500"
                >
                  <option value="normal">Normal</option>
                  <option value="urgent">Urgent / High Priority</option>
                  <option value="follow_up">Follow Up</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Visit Notes / Objectives
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Discuss new cardiology drug range, deliver samples..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-xs text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-purple-600 text-white rounded-xl text-xs font-medium hover:bg-purple-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Add to Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Monthly Workdays Settings Modal */}
      {workdayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <h2 className="text-lg font-bold text-gray-900 mb-1">
              Working Days for {monthNames[month - 1]} {year}
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              Set total working days to calculate accurate attendance rates and eliminate database bloat.
            </p>

            <form onSubmit={handleSaveWorkdays} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Calendar Days
                  </label>
                  <input
                    type="number"
                    value={workdayForm.total_calendar_days}
                    onChange={(e) =>
                      setWorkdayForm({
                        ...workdayForm,
                        total_calendar_days: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Working Days *
                  </label>
                  <input
                    type="number"
                    required
                    value={workdayForm.total_working_days}
                    onChange={(e) =>
                      setWorkdayForm({
                        ...workdayForm,
                        total_working_days: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-2 focus:ring-purple-500 font-bold text-purple-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Weekend Days
                  </label>
                  <input
                    type="number"
                    value={workdayForm.weekend_days}
                    onChange={(e) =>
                      setWorkdayForm({
                        ...workdayForm,
                        weekend_days: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Holidays
                  </label>
                  <input
                    type="number"
                    value={workdayForm.holiday_count}
                    onChange={(e) =>
                      setWorkdayForm({
                        ...workdayForm,
                        holiday_count: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Notes / Holiday Details
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. National holiday on 21st, 26 working days standard"
                  value={workdayForm.notes}
                  onChange={(e) =>
                    setWorkdayForm({ ...workdayForm, notes: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setWorkdayModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-xs text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-purple-600 text-white rounded-xl text-xs font-medium hover:bg-purple-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
