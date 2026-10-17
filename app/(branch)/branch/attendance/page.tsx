'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AttendanceService } from '@/lib/attendanceService';
import { EmployeeService } from '@/lib/employeeService';
import { Employee, DoctorVisitCheckin, DailyAttendance, MonthlyWorkday } from '@/types/user';
import {
  UserCheck,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MapPin,
  Filter,
  FileSpreadsheet,
} from 'lucide-react';

export default function BranchAttendanceReportsPage() {
  const { userProfile } = useAuth();
  const branchId = userProfile?.branch_id;

  const today = new Date();
  const [selectedDate, setSelectedDate] = useState<string>(
    today.toISOString().split('T')[0]
  );
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [visitCheckins, setVisitCheckins] = useState<DoctorVisitCheckin[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterEmployee, setFilterEmployee] = useState<string>('all');

  useEffect(() => {
    if (branchId) {
      loadData();
    }
  }, [branchId, selectedDate]);

  const loadData = async () => {
    if (!branchId) return;
    try {
      setLoading(true);
      const [allEmps, checkins] = await Promise.all([
        EmployeeService.getAll(),
        AttendanceService.getVisitCheckins({
          branchId,
          startDate: selectedDate,
          endDate: selectedDate,
        }),
      ]);
      setEmployees(allEmps.filter((e) => e.branch_id === branchId));
      setVisitCheckins(checkins);
    } catch (err) {
      console.error('Error loading attendance logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCheckins =
    filterEmployee === 'all'
      ? visitCheckins
      : visitCheckins.filter((c) => c.employee_id === filterEmployee);

  const verifiedCount = filteredCheckins.filter((c) => c.is_within_geofence).length;
  const outOfRangeCount = filteredCheckins.filter((c) => !c.is_within_geofence).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-purple-100 text-purple-700 rounded-xl">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Attendance & Visit Verification Audit
            </h1>
            <p className="text-sm text-gray-500">
              Real-time geofence proximity reports and doctor visit attendance tracking
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-semibold text-gray-700 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500">Total Visits Recorded</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">
              {filteredCheckins.length}
            </h3>
            <span className="text-[11px] text-gray-400">On {selectedDate}</span>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-emerald-600">Geofence Verified (In-Range)</p>
            <h3 className="text-2xl font-bold text-emerald-700 mt-1">
              {verifiedCount}
            </h3>
            <span className="text-[11px] text-emerald-600 font-medium">
              Within 150-200m doctor radius
            </span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-amber-600">Out of Range / Flagged</p>
            <h3 className="text-2xl font-bold text-amber-700 mt-1">
              {outOfRangeCount}
            </h3>
            <span className="text-[11px] text-amber-600 font-medium">
              Exceeded doctor's location radius
            </span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50/50">
          <h2 className="text-base font-bold text-gray-800">Visit Check-In Records</h2>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterEmployee}
              onChange={(e) => setFilterEmployee(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 bg-white focus:outline-none"
            >
              <option value="all">All Field Reps</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} ({e.employee_code})
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-purple-500 border-t-transparent"></div>
          </div>
        ) : filteredCheckins.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <MapPin className="w-10 h-10 mx-auto text-gray-300 mb-2" />
            <p className="text-sm font-medium">No check-in records found for this date.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600">
              <thead className="bg-gray-50 text-gray-700 font-semibold border-b uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3.5">Time</th>
                  <th className="p-3.5">Employee</th>
                  <th className="p-3.5">Doctor & Location</th>
                  <th className="p-3.5">Distance</th>
                  <th className="p-3.5">Geofence Status</th>
                  <th className="p-3.5">Notes & Samples</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCheckins.map((chk) => (
                  <tr key={chk.id} className="hover:bg-gray-50/60 transition">
                    <td className="p-3.5 whitespace-nowrap font-mono">
                      {new Date(chk.checkin_time).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="p-3.5">
                      <div className="font-semibold text-gray-900">
                        {chk.employee?.name || 'Field Rep'}
                      </div>
                      <div className="text-[10px] text-gray-400">
                        {chk.employee?.employee_code}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-semibold text-gray-900">
                        {chk.doctor?.name || 'Doctor'}
                      </div>
                      <div className="text-[10px] text-gray-400 truncate max-w-xs">
                        {chk.doctor?.hospital_clinic_name || chk.doctor?.chamber_address || 'Clinic'}
                      </div>
                    </td>
                    <td className="p-3.5 whitespace-nowrap font-mono">
                      {chk.distance_meters != null ? (
                        <span
                          className={`font-semibold ${
                            chk.is_within_geofence
                              ? 'text-emerald-600'
                              : 'text-amber-600'
                          }`}
                        >
                          {chk.distance_meters} m
                        </span>
                      ) : (
                        '--'
                      )}
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      {chk.is_within_geofence ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3" />
                          VERIFIED PRESENT
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          <AlertTriangle className="w-3 h-3" />
                          OUT OF RANGE
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 max-w-xs">
                      {chk.remarks && (
                        <div className="text-gray-800 font-medium truncate">
                          "{chk.remarks}"
                        </div>
                      )}
                      {chk.sample_given && (
                        <div className="text-[10px] text-purple-600">
                          Samples: {chk.sample_given}
                        </div>
                      )}
                      {!chk.remarks && !chk.sample_given && (
                        <span className="text-gray-400 italic">None</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
