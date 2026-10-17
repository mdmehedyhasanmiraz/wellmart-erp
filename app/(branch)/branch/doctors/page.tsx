'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AttendanceService } from '@/lib/attendanceService';
import { Doctor } from '@/types/user';
import { Stethoscope, Plus, Search, MapPin, Phone, Mail, Building, Edit3, Trash2, CheckCircle2, X } from 'lucide-react';

export default function BranchDoctorsPage() {
  const { userProfile } = useAuth();
  const branchId = userProfile?.branch_id;

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Partial<Doctor> | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [gettingLocation, setGettingLocation] = useState(false);

  useEffect(() => {
    loadDoctors();
  }, [branchId]);

  const loadDoctors = async () => {
    if (!branchId) return;
    try {
      setLoading(true);
      const data = await AttendanceService.getDoctors(branchId);
      setDoctors(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingDoctor({
      branch_id: branchId,
      name: '',
      degrees: '',
      specialty: '',
      hospital_clinic_name: '',
      chamber_address: '',
      phone: '',
      email: '',
      latitude: null,
      longitude: null,
      geofence_radius_meters: 180,
      visiting_hours: '',
      is_active: true,
    });
    setErrorMsg('');
    setModalOpen(true);
  };

  const handleOpenEdit = (doc: Doctor) => {
    setEditingDoctor({ ...doc });
    setErrorMsg('');
    setModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove Dr. ${name}?`)) return;
    const ok = await AttendanceService.deleteDoctor(id);
    if (ok) {
      setDoctors((prev) => prev.filter((d) => d.id !== id));
    }
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setEditingDoctor((prev) => ({
          ...prev,
          latitude: Number(pos.coords.latitude.toFixed(7)),
          longitude: Number(pos.coords.longitude.toFixed(7)),
        }));
        setGettingLocation(false);
      },
      (err) => {
        alert('Could not fetch GPS coordinates: ' + err.message);
        setGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoctor?.name) {
      setErrorMsg('Doctor name is required');
      return;
    }
    try {
      setSaving(true);
      setErrorMsg('');
      const saved = await AttendanceService.saveDoctor({
        ...editingDoctor,
        branch_id: branchId,
      });
      if (saved) {
        setModalOpen(false);
        loadDoctors();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save doctor');
    } finally {
      setSaving(false);
    }
  };

  const filteredDoctors = doctors.filter((doc) => {
    const q = search.toLowerCase();
    return (
      doc.name.toLowerCase().includes(q) ||
      (doc.specialty || '').toLowerCase().includes(q) ||
      (doc.hospital_clinic_name || '').toLowerCase().includes(q) ||
      (doc.chamber_address || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-100 text-purple-700 rounded-xl">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Doctor Directory</h1>
              <p className="text-sm text-gray-500">
                Register doctors & hospital chambers with GPS coordinates for geofenced visits
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium rounded-xl shadow-sm transition"
        >
          <Plus className="w-5 h-5" />
          <span>Add New Doctor</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
        <Search className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by doctor name, specialty, hospital, or address..."
          className="flex-1 border-none focus:outline-none text-sm text-gray-800 placeholder-gray-400"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            Clear
          </button>
        )}
      </div>

      {/* Doctor Cards Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-purple-500 border-t-transparent"></div>
        </div>
      ) : filteredDoctors.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
          <Stethoscope className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-800">No Doctors Found</h3>
          <p className="text-gray-500 text-sm mt-1 max-w-sm mx-auto">
            {search
              ? 'No doctors match your search query.'
              : 'Start by registering doctors and clinic locations for your field reps to visit.'}
          </p>
          {!search && (
            <button
              onClick={handleOpenAdd}
              className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700"
            >
              Add First Doctor
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDoctors.map((doc) => {
            const hasCoords = doc.latitude != null && doc.longitude != null;
            return (
              <div
                key={doc.id}
                className="bg-white rounded-2xl p-5 border border-gray-100 hover:border-purple-200 hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-base">{doc.name}</h3>
                      {doc.degrees && (
                        <p className="text-xs text-purple-600 font-medium">{doc.degrees}</p>
                      )}
                    </div>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        doc.is_active
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {doc.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {doc.specialty && (
                    <div className="mt-2 inline-block px-2.5 py-1 bg-purple-50 text-purple-700 text-xs rounded-lg font-medium">
                      {doc.specialty}
                    </div>
                  )}

                  <div className="mt-4 space-y-2 text-xs text-gray-600">
                    {doc.hospital_clinic_name && (
                      <div className="flex items-center gap-2">
                        <Building className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="truncate">{doc.hospital_clinic_name}</span>
                      </div>
                    )}
                    {doc.chamber_address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{doc.chamber_address}</span>
                      </div>
                    )}
                    {doc.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span>{doc.phone}</span>
                      </div>
                    )}
                    {doc.visiting_hours && (
                      <div className="text-gray-500 italic">
                        Hours: {doc.visiting_hours}
                      </div>
                    )}
                  </div>

                  {/* Geofence Status Badge */}
                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                    <span className="text-gray-500">Location GPS:</span>
                    {hasCoords ? (
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-mono font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        {doc.latitude?.toFixed(4)}, {doc.longitude?.toFixed(4)} (±{doc.geofence_radius_meters}m)
                      </span>
                    ) : (
                      <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-medium">
                        Coordinates missing
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleOpenEdit(doc)}
                    className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition"
                    title="Edit Doctor"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(doc.id, doc.name)}
                    className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Delete Doctor"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Doctor Modal */}
      {modalOpen && editingDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl relative my-8">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold text-gray-900 mb-1">
              {editingDoctor.id ? 'Edit Doctor Information' : 'Register New Doctor'}
            </h2>
            <p className="text-xs text-gray-500 mb-5">
              Fill in the doctor profile and chamber coordinates for verified visits.
            </p>

            {errorMsg && (
              <div className="p-3 mb-4 bg-red-50 text-red-700 text-xs rounded-xl">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Doctor Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Rafiqul Islam"
                    value={editingDoctor.name || ''}
                    onChange={(e) =>
                      setEditingDoctor({ ...editingDoctor, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Degrees / Qualifications
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. MBBS, FCPS (Medicine)"
                    value={editingDoctor.degrees || ''}
                    onChange={(e) =>
                      setEditingDoctor({ ...editingDoctor, degrees: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Specialty
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Cardiologist, General Physician"
                    value={editingDoctor.specialty || ''}
                    onChange={(e) =>
                      setEditingDoctor({ ...editingDoctor, specialty: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Hospital / Clinic Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Popular Diagnostic Center"
                    value={editingDoctor.hospital_clinic_name || ''}
                    onChange={(e) =>
                      setEditingDoctor({
                        ...editingDoctor,
                        hospital_clinic_name: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Chamber / Hospital Address
                </label>
                <textarea
                  rows={2}
                  placeholder="Detailed address of chamber, room number, road/area..."
                  value={editingDoctor.chamber_address || ''}
                  onChange={(e) =>
                    setEditingDoctor({ ...editingDoctor, chamber_address: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* GPS Coordinates & Geofence Section */}
              <div className="p-4 bg-purple-50/70 border border-purple-100 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-semibold text-purple-900">
                      Geofence & Chamber GPS Coordinates
                    </h4>
                    <p className="text-[11px] text-purple-600">
                      Required for location-based attendance check-in verification
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleGetCurrentLocation}
                    disabled={gettingLocation}
                    className="px-3 py-1.5 bg-white border border-purple-200 text-purple-700 rounded-lg text-xs font-medium hover:bg-purple-100 flex items-center gap-1.5 shadow-xs"
                  >
                    <MapPin className="w-3.5 h-3.5 text-purple-600" />
                    <span>{gettingLocation ? 'Fetching...' : 'Use My GPS'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] text-gray-600 mb-0.5">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="e.g. 23.8103"
                      value={editingDoctor.latitude ?? ''}
                      onChange={(e) =>
                        setEditingDoctor({
                          ...editingDoctor,
                          latitude: e.target.value ? parseFloat(e.target.value) : null,
                        })
                      }
                      className="w-full px-2.5 py-1.5 bg-white border rounded-lg text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-600 mb-0.5">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="e.g. 90.4125"
                      value={editingDoctor.longitude ?? ''}
                      onChange={(e) =>
                        setEditingDoctor({
                          ...editingDoctor,
                          longitude: e.target.value ? parseFloat(e.target.value) : null,
                        })
                      }
                      className="w-full px-2.5 py-1.5 bg-white border rounded-lg text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-600 mb-0.5">
                      Radius (meters)
                    </label>
                    <input
                      type="number"
                      min={50}
                      max={1000}
                      value={editingDoctor.geofence_radius_meters ?? 180}
                      onChange={(e) =>
                        setEditingDoctor({
                          ...editingDoctor,
                          geofence_radius_meters: parseInt(e.target.value) || 180,
                        })
                      }
                      className="w-full px-2.5 py-1.5 bg-white border rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. +8801700000000"
                    value={editingDoctor.phone || ''}
                    onChange={(e) =>
                      setEditingDoctor({ ...editingDoctor, phone: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Visiting Hours
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 5:00 PM - 9:00 PM (Sat-Thu)"
                    value={editingDoctor.visiting_hours || ''}
                    onChange={(e) =>
                      setEditingDoctor({ ...editingDoctor, visiting_hours: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="doc_active"
                  checked={editingDoctor.is_active ?? true}
                  onChange={(e) =>
                    setEditingDoctor({ ...editingDoctor, is_active: e.target.checked })
                  }
                  className="rounded text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="doc_active" className="text-xs text-gray-700 font-medium">
                  Active Doctor (available for scheduling)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-sm text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-sm font-medium hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingDoctor.id ? 'Save Changes' : 'Create Doctor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
