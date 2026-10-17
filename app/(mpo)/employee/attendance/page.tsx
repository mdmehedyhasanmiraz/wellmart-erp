'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AttendanceService } from '@/lib/attendanceService';
import { isWithinGeofence, formatDistance } from '@/lib/geoUtils';
import {
  DoctorVisitSchedule,
  DailyAttendance,
  DoctorVisitCheckin,
  Doctor,
} from '@/types/user';
import {
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Navigation,
  LogOut,
  Building,
  RefreshCw,
  Calendar,
  Sparkles,
} from 'lucide-react';

export default function EmployeeAttendancePage() {
  const { userProfile } = useAuth();

  const todayStr = new Date().toISOString().split('T')[0];

  const [loading, setLoading] = useState(true);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [dailyAttendance, setDailyAttendance] = useState<DailyAttendance | null>(null);
  const [todaySchedules, setTodaySchedules] = useState<DoctorVisitSchedule[]>([]);
  const [todayCheckins, setTodayCheckins] = useState<DoctorVisitCheckin[]>([]);

  // Geolocation state
  const [locating, setLocating] = useState(false);
  const [currentCoords, setCurrentCoords] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number;
  } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Visit check-in modal
  const [activeVisitSchedule, setActiveVisitSchedule] =
    useState<DoctorVisitSchedule | null>(null);
  const [visitForm, setVisitForm] = useState({
    remarks: '',
    products_discussed: '',
    sample_given: '',
    doctor_feedback: '',
  });
  const [submittingVisit, setSubmittingVisit] = useState(false);

  // General check-out modal
  const [checkoutModal, setCheckoutModal] = useState(false);
  const [workSummary, setWorkSummary] = useState('');
  const [submittingCheckout, setSubmittingCheckout] = useState(false);

  useEffect(() => {
    fetchEmployeeAndData();
  }, [userProfile?.email]);

  const fetchEmployeeAndData = async () => {
    if (!userProfile?.email) return;
    try {
      setLoading(true);
      const supa = (await import('@/lib/supabase')).supabase;

      const { data: emp } = await supa
        .from('employees')
        .select('id, name, branch_id')
        .eq('email', userProfile.email)
        .eq('is_active', true)
        .maybeSingle();

      if (!emp) {
        setLoading(false);
        return;
      }

      setEmployeeId(emp.id);

      // Load today's general attendance, schedules, and visit check-ins
      const [att, scheds, chks] = await Promise.all([
        AttendanceService.getDailyAttendance(emp.id, todayStr),
        AttendanceService.getSchedules({
          employeeId: emp.id,
          startDate: todayStr,
          endDate: todayStr,
        }),
        AttendanceService.getVisitCheckins({
          employeeId: emp.id,
          startDate: todayStr,
          endDate: todayStr,
        }),
      ]);

      setDailyAttendance(att);
      setTodaySchedules(scheds);
      setTodayCheckins(chks);
    } catch (err) {
      console.error('Error fetching employee attendance data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Obtain Live Device GPS Position
  const getDeviceLocation = (): Promise<{
    latitude: number;
    longitude: number;
    accuracy: number;
  }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your device/browser.'));
        return;
      }
      setLocating(true);
      setGeoError(null);

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          };
          setCurrentCoords(coords);
          setLocating(false);
          resolve(coords);
        },
        (err) => {
          setLocating(false);
          let msg = 'Failed to get location';
          if (err.code === 1) msg = 'Location access permission denied. Please allow GPS access.';
          else if (err.code === 2) msg = 'Position unavailable. Make sure GPS is turned on.';
          else if (err.code === 3) msg = 'Location request timed out.';
          setGeoError(msg);
          reject(new Error(msg));
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    });
  };

  // General Daily Check-In
  const handleGeneralCheckIn = async () => {
    if (!employeeId || !userProfile?.branch_id) return;
    try {
      const coords = await getDeviceLocation();
      const updated = await AttendanceService.recordGeneralCheckIn({
        employeeId,
        branchId: userProfile.branch_id,
        date: todayStr,
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
      setDailyAttendance(updated);
      alert('✅ Daily Attendance Checked In Successfully!');
    } catch (err: any) {
      alert(err.message || 'Check-in failed');
    }
  };

  // General Daily Check-Out
  const handleGeneralCheckOut = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dailyAttendance) return;
    try {
      setSubmittingCheckout(true);
      const coords = await getDeviceLocation();
      const updated = await AttendanceService.recordGeneralCheckOut({
        attendanceId: dailyAttendance.id,
        latitude: coords.latitude,
        longitude: coords.longitude,
        workSummary,
      });
      setDailyAttendance(updated);
      setCheckoutModal(false);
      alert('👋 Checked out successfully! Have a great evening.');
    } catch (err: any) {
      alert(err.message || 'Check-out failed');
    } finally {
      setSubmittingCheckout(false);
    }
  };

  // Open Geofence Verification Modal for a Doctor Visit
  const handleOpenDoctorCheckIn = async (sched: DoctorVisitSchedule) => {
    setActiveVisitSchedule(sched);
    setVisitForm({
      remarks: '',
      products_discussed: '',
      sample_given: '',
      doctor_feedback: '',
    });
    try {
      await getDeviceLocation();
    } catch (e) {
      // Handled in getDeviceLocation
    }
  };

  // Submit Geofence Verified Doctor Check-In
  const handleSubmitDoctorCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeVisitSchedule || !employeeId || !userProfile?.branch_id) return;

    try {
      setSubmittingVisit(true);
      const coords = currentCoords || (await getDeviceLocation());
      const doctor = activeVisitSchedule.doctor;

      if (!doctor || doctor.latitude == null || doctor.longitude == null) {
        throw new Error(
          'Doctor location coordinates are not set in the master directory. Please ask your branch manager to set chamber GPS.'
        );
      }

      // Check distance using Haversine formula
      const geofenceResult = isWithinGeofence(
        coords.latitude,
        coords.longitude,
        doctor.latitude,
        doctor.longitude,
        doctor.geofence_radius_meters || 180
      );

      const checkin = await AttendanceService.recordDoctorVisitCheckin({
        scheduleId: activeVisitSchedule.id,
        dailyAttendanceId: dailyAttendance?.id,
        employeeId,
        doctorId: doctor.id,
        branchId: userProfile.branch_id,
        visitDate: todayStr,
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracyMeters: coords.accuracy,
        distanceMeters: geofenceResult.distanceMeters,
        isWithinGeofence: geofenceResult.isWithin,
        verificationStatus: geofenceResult.isWithin ? 'verified' : 'out_of_range',
        remarks: visitForm.remarks,
        productsDiscussed: visitForm.products_discussed,
        sampleGiven: visitForm.sample_given,
        doctorFeedback: visitForm.doctor_feedback,
      });

      setActiveVisitSchedule(null);
      fetchEmployeeAndData();

      if (geofenceResult.isWithin) {
        alert(
          `🎉 Location Verified! Visit recorded within ${geofenceResult.distanceMeters}m of ${doctor.name}'s chamber.`
        );
      } else {
        alert(
          `⚠️ Visit recorded, but you were ${geofenceResult.distanceMeters}m away (allowed: ${
            doctor.geofence_radius_meters || 180
          }m). Flagged as out-of-range.`
        );
      }
    } catch (err: any) {
      alert(err.message || 'Failed to submit visit check-in');
    } finally {
      setSubmittingVisit(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-600 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-indigo-100 text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Field Attendance & Doctor Visits</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Today's Visit Schedule & Check-In
          </h1>
          <p className="text-sm text-indigo-100 mt-1 max-w-xl">
            Provide your verified attendance directly on-site at each scheduled doctor's chamber.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {!dailyAttendance?.check_in_time ? (
              <button
                onClick={handleGeneralCheckIn}
                disabled={locating}
                className="px-6 py-3 bg-white text-indigo-700 hover:bg-indigo-50 font-bold rounded-2xl shadow-lg transition flex items-center gap-2 text-sm"
              >
                <Navigation className="w-4 h-4 text-indigo-600" />
                <span>{locating ? 'Reading GPS...' : 'Daily Check-In Now'}</span>
              </button>
            ) : !dailyAttendance?.check_out_time ? (
              <div className="flex items-center gap-3">
                <span className="px-4 py-2 bg-emerald-500/20 backdrop-blur-md border border-emerald-400/30 text-white rounded-xl text-xs font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  Checked In at{' '}
                  {new Date(dailyAttendance.check_in_time).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                <button
                  onClick={() => setCheckoutModal(true)}
                  className="px-4 py-2 bg-rose-600/90 hover:bg-rose-600 text-white font-medium rounded-xl text-xs shadow-md flex items-center gap-1.5 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Check Out</span>
                </button>
              </div>
            ) : (
              <span className="px-4 py-2 bg-white/20 backdrop-blur-md rounded-xl text-xs font-medium">
                Day Complete (Out at{' '}
                {new Date(dailyAttendance.check_out_time).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
                )
              </span>
            )}

            <button
              onClick={() => getDeviceLocation()}
              disabled={locating}
              className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl text-xs font-medium transition flex items-center gap-1.5"
              title="Refresh GPS"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${locating ? 'animate-spin' : ''}`} />
              <span>
                {currentCoords
                  ? `GPS: ±${Math.round(currentCoords.accuracy)}m`
                  : 'Calibrate GPS'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {geoError && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{geoError}</span>
        </div>
      )}

      {/* Scheduled Doctors Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Scheduled Doctor Visits Today ({todaySchedules.length})
            </h2>
            <p className="text-xs text-gray-500">
              Assigned by branch manager. Be within doctor's chamber radius to verify attendance.
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 bg-purple-50 text-purple-700 rounded-full">
            {todayCheckins.length}/{todaySchedules.length} Completed
          </span>
        </div>

        {todaySchedules.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-gray-100">
            <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <h3 className="font-semibold text-gray-800 text-sm">No Visits Scheduled Today</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              Your branch manager hasn't assigned any doctor visits for today. Check your monthly roster or contact your branch.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {todaySchedules.map((item) => {
              const doc = item.doctor;
              const hasCheckedIn = todayCheckins.some(
                (c) => c.doctor_id === item.doctor_id
              );
              const checkinRecord = todayCheckins.find(
                (c) => c.doctor_id === item.doctor_id
              );

              // Calculate live distance if currentCoords available
              let liveDist: number | null = null;
              let inRange = false;
              if (
                currentCoords &&
                doc?.latitude != null &&
                doc?.longitude != null
              ) {
                const geo = isWithinGeofence(
                  currentCoords.latitude,
                  currentCoords.longitude,
                  doc.latitude,
                  doc.longitude,
                  doc.geofence_radius_meters || 180
                );
                liveDist = geo.distanceMeters;
                inRange = geo.isWithin;
              }

              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-2xl p-5 border transition flex flex-col justify-between ${
                    hasCheckedIn
                      ? 'border-emerald-200 bg-emerald-50/20'
                      : 'border-gray-200 hover:border-purple-300 hover:shadow-sm'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-gray-900 text-base">
                          {doc?.name || 'Doctor'}
                        </h3>
                        {doc?.degrees && (
                          <p className="text-xs text-purple-600 font-medium">
                            {doc.degrees}
                          </p>
                        )}
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          hasCheckedIn
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {hasCheckedIn ? 'Completed' : item.shift_time}
                      </span>
                    </div>

                    {doc?.specialty && (
                      <div className="mt-2 inline-block px-2 py-0.5 bg-gray-100 text-gray-700 text-[11px] rounded font-medium">
                        {doc.specialty}
                      </div>
                    )}

                    <div className="mt-3 space-y-1.5 text-xs text-gray-600">
                      {doc?.hospital_clinic_name && (
                        <div className="flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span className="truncate">{doc.hospital_clinic_name}</span>
                        </div>
                      )}
                      {doc?.chamber_address && (
                        <div className="flex items-start gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{doc.chamber_address}</span>
                        </div>
                      )}
                    </div>

                    {/* Live Proximity Banner */}
                    <div className="mt-4 p-2.5 rounded-xl bg-gray-50 border border-gray-100 text-xs flex items-center justify-between">
                      <span className="text-gray-500">Distance to chamber:</span>
                      {hasCheckedIn ? (
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Verified ({checkinRecord?.distance_meters ?? 0}m)
                        </span>
                      ) : liveDist !== null ? (
                        <span
                          className={`font-semibold flex items-center gap-1 ${
                            inRange ? 'text-emerald-600 font-bold' : 'text-amber-600'
                          }`}
                        >
                          {inRange ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            <AlertTriangle className="w-3.5 h-3.5" />
                          )}
                          {formatDistance(liveDist)} ({inRange ? 'At Location' : 'Away'})
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">GPS not calibrated</span>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-gray-100">
                    {hasCheckedIn ? (
                      <div className="text-xs text-emerald-700 font-medium flex items-center justify-between">
                        <span>Attendance Recorded</span>
                        <span className="font-mono text-[11px]">
                          {new Date(checkinRecord!.checkin_time).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleOpenDoctorCheckIn(item)}
                        className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                          inRange
                            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md hover:from-emerald-700 hover:to-teal-700'
                            : 'bg-purple-600 text-white hover:bg-purple-700'
                        }`}
                      >
                        <MapPin className="w-4 h-4" />
                        <span>{inRange ? 'Verify & Check-In Here' : 'Check-In at Chamber'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Doctor Visit Check-In Modal */}
      {activeVisitSchedule && activeVisitSchedule.doctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative my-8">
            <h2 className="text-lg font-bold text-gray-900 mb-1">
              Visit Check-In: {activeVisitSchedule.doctor.name}
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              Your GPS coordinates will be verified against the doctor's chamber location.
            </p>

            {/* Proximity Card */}
            {currentCoords && (
              <div className="mb-4 p-3.5 bg-purple-50 rounded-xl border border-purple-100 flex items-center justify-between text-xs">
                <div>
                  <p className="text-gray-500">Your Current Accuracy</p>
                  <p className="font-semibold text-purple-900">
                    ±{Math.round(currentCoords.accuracy)} meters
                  </p>
                </div>
                {activeVisitSchedule.doctor.latitude != null && (
                  <div className="text-right">
                    <p className="text-gray-500">Target Geofence</p>
                    <p className="font-semibold text-purple-900">
                      {activeVisitSchedule.doctor.geofence_radius_meters || 180} meters
                    </p>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleSubmitDoctorCheckIn} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Products Discussed / Detailed
                </label>
                <input
                  type="text"
                  placeholder="e.g. Paracetamol 500mg, Ceftriaxone injection"
                  value={visitForm.products_discussed}
                  onChange={(e) =>
                    setVisitForm({ ...visitForm, products_discussed: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Samples / Promotional Material Provided
                </label>
                <input
                  type="text"
                  placeholder="e.g. 5x Sample strips, prescription pads"
                  value={visitForm.sample_given}
                  onChange={(e) =>
                    setVisitForm({ ...visitForm, sample_given: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Doctor Feedback / Prescribing Intent
                </label>
                <textarea
                  rows={2}
                  placeholder="Doctor's response, product inquiries, competition notes..."
                  value={visitForm.doctor_feedback}
                  onChange={(e) =>
                    setVisitForm({ ...visitForm, doctor_feedback: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setActiveVisitSchedule(null)}
                  className="px-4 py-2 border rounded-xl text-xs text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingVisit}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-xs font-bold hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50"
                >
                  {submittingVisit ? 'Verifying GPS...' : 'Confirm & Submit Check-In'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Check-Out Modal */}
      {checkoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Daily Work Check-Out</h2>
            <p className="text-xs text-gray-500 mb-4">
              Wrap up your work day and submit a quick end-of-day summary.
            </p>

            <form onSubmit={handleGeneralCheckOut} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Day Summary / Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Completed 8 doctor calls, 2 chemist orders collected..."
                  value={workSummary}
                  onChange={(e) => setWorkSummary(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setCheckoutModal(false)}
                  className="px-4 py-2 border rounded-xl text-xs text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingCheckout}
                  className="px-5 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 disabled:opacity-50"
                >
                  {submittingCheckout ? 'Checking Out...' : 'Complete Check-Out'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
