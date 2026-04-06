import { useEffect, useState, useRef } from "react";
import Swal from "sweetalert2";
import toast from "react-hot-toast";
import InternalNavbar from "../components/InternalNavbar";
import axiosInstance from "../axiosInstance";
import { useUserContext } from "../context/UserContext";
import VehicleDocumentManager from "../components/VehicleDocumentManager";
import MaintenanceLogBook from '../components/MaintenanceLogBook';

export default function RegisteredVehicles() {
  const { user, token, loading } = useUserContext();
  // Helper function to parse roles properly
const parseUserRoles = (user) => {
  if (!user || !user.role) {
    return [];
  }
  
  // ✅ SIMPLIFIED: If role is already an array, return it directly
  if (Array.isArray(user.role)) {
    return user.role;
  }
  
  // ✅ Keep the old logic for backward compatibility with string formats
  let userRoles = [];
  if (typeof user.role === 'string' && user.role.startsWith('[')) {
    try {
      userRoles = JSON.parse(user.role);
    } catch (parseError) {
      userRoles = [user.role];
    }
  } else if (typeof user.role === 'string') {
    userRoles = [user.role];
  } else {
    userRoles = [user.role];
  }
  return userRoles;
};

  // ✅ Declare userRoles at component level
  const userRoles = user ? parseUserRoles(user) : [];
  
  const [registeredVehicles, setRegisteredVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedMaintenanceVehicle, setSelectedMaintenanceVehicle] = useState(null);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const docsRef = useRef(null);

  const [newVehicle, setNewVehicle] = useState({
    vehicleNumber: "",
    driverEmail: "",
    driverName: "",
    phone: "",
    gpsLink: "",
  });

const fetchRegisteredVehicles = async () => {
  try {
    setLoadingVehicles(true);
    const res = await axiosInstance.get("/vehicles/all", {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    // Fetch maintenance totals for each vehicle
    const vehiclesWithTotals = await Promise.all(
      res.data.map(async (vehicle) => {
        try {
          const maintRes = await axiosInstance.get(`/maintenance-log/${vehicle.vehicleNumber}`, {
            headers: { Authorization: `Bearer ${token}` },
            params: { limit: 1 } // We only need the total, so limit to 1 entry
          });
          return {
            ...vehicle,
            totalMaintenanceAmount: maintRes.data.totalAmount || 0
          };
        } catch (err) {
          console.warn(`Could not fetch maintenance for ${vehicle.vehicleNumber}:`, err);
          return {
            ...vehicle,
            totalMaintenanceAmount: 0
          };
        }
      })
    );
    
    setRegisteredVehicles(vehiclesWithTotals);
  } catch (err) {
    console.error("Failed to fetch registered vehicles:", err);
    toast.error("Failed to load vehicles");
  } finally {
    setLoadingVehicles(false);
  }
};

  useEffect(() => {
    if (token) fetchRegisteredVehicles();
  }, [token]);

  useEffect(() => {
    if (selectedVehicle && docsRef.current) {
      docsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [selectedVehicle]);

  const handleVehicleRegister = async () => {
    if (!newVehicle.vehicleNumber || !newVehicle.driverEmail) {
      toast.error("Vehicle number and email are required");
      return;
    }

    setSubmitting(true);
    try {
      await axiosInstance.post("/vehicles/register", newVehicle, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Vehicle registered successfully");
      setNewVehicle({
        vehicleNumber: "",
        driverEmail: "",
        driverName: "",
        phone: "",
        gpsLink: "",
      });
      fetchRegisteredVehicles();
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditVehicle = async (vehicle) => {
    const { value: updatedValues } = await Swal.fire({
      title: "Edit Vehicle Details",
      html: `
        <div class="text-left space-y-3">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Vehicle Number</label>
            <input type="text" id="vehicleNumber" class="swal2-input w-full" value="${vehicle.vehicleNumber}" disabled />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Driver Email *</label>
            <input type="email" id="driverEmail" class="swal2-input w-full" value="${vehicle.driverEmail}" required />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input type="tel" id="phone" class="swal2-input w-full" placeholder="Enter phone number" value="${vehicle.phone || ""}" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">GPS Tracking Link</label>
            <input type="url" id="gpsLink" class="swal2-input w-full" placeholder="https://..." value="${vehicle.gpsLink || ""}" />
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Update Vehicle',
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#6b7280',
      preConfirm: () => {
        const driverEmail = document.getElementById("driverEmail").value;
        const phone = document.getElementById("phone").value;
        const gpsLink = document.getElementById("gpsLink").value;

        if (!driverEmail) {
          Swal.showValidationMessage('Driver email is required');
          return false;
        }

        return { driverEmail, phone, gpsLink };
      },
    });

    if (!updatedValues) return;

    try {
      await axiosInstance.patch(`/vehicles/update/${vehicle._id}`, updatedValues, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Vehicle updated successfully");
      fetchRegisteredVehicles();
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    }
  };

  const handleDeleteVehicle = async (vehicle) => {
    const result = await Swal.fire({
      title: 'Delete Vehicle?',
      text: `Are you sure you want to delete ${vehicle.vehicleNumber}? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      background: '#fff',
      customClass: {
        popup: 'rounded-xl'
      }
    });

    if (result.isConfirmed) {
      try {
        await axiosInstance.delete(`/vehicles/delete/${vehicle._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Vehicle deleted successfully");
        fetchRegisteredVehicles();
      } catch (err) {
        toast.error(err.response?.data?.message || "Delete failed");
      }
    }
  };

  // Filter vehicles based on search and role
  const filteredVehicles = registeredVehicles.filter(vehicle => {
    const matchesSearch = vehicle.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vehicle.driverEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (vehicle.phone && vehicle.phone.includes(searchTerm));
    
    if (filterRole === "all") return matchesSearch;
    if (filterRole === "withDocs" && selectedVehicle) {
      return matchesSearch && vehicle.vehicleNumber === selectedVehicle.vehicleNumber;
    }
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600">User not found. Please log in again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <InternalNavbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Vehicle Management</h1>
          <p className="text-gray-600">Manage your fleet of registered vehicles and their documentation</p>
        </div>

    

        {/* Vehicles List Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-1">
                  Registered Vehicles
                </h3>
                <p className="text-gray-600">
                  {filteredVehicles.length} of {registeredVehicles.length} vehicles
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    placeholder="Search vehicles..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
                
                {selectedVehicle && (
                  <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                  >
                    <option value="all">All Vehicles</option>
                    <option value="withDocs">Currently Managing</option>
                  </select>
                )}
              </div>
            </div>
          </div>

          {loadingVehicles ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading vehicles...</p>
            </div>
          ) : filteredVehicles.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">🚗</div>
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                {searchTerm ? "No vehicles found" : "No vehicles registered yet"}
              </h3>
              <p className="text-gray-500">
                {searchTerm ? "Try adjusting your search term" : "Start by registering your first vehicle"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredVehicles.map((vehicle) => (
                <div
                  key={vehicle._id}
                  className="p-6 hover:bg-gray-50 transition-colors duration-150"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Vehicle Info */}
                    <div className="flex-1">
                      <div className="flex items-start gap-4">
                        <div className="bg-blue-100 p-3 rounded-lg">
                          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="text-lg font-semibold text-gray-900 truncate">
                            {vehicle.vehicleNumber}
                          </h4>
                          <p className="text-gray-600 truncate">{vehicle.driverEmail}</p>
                          
                          <div className="flex flex-wrap gap-4 mt-2">
                            {vehicle.phone && (
                              <span className="inline-flex items-center gap-1 text-sm text-gray-500">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                {vehicle.phone}
                              </span>
                            )}
                            
                            {vehicle.gpsLink && (
                              <a 
                                href={vehicle.gpsLink} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 transition-colors duration-200"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                Track Vehicle
                              </a>
                            )}
                             {/* Add this line - Maintenance Amount Display */}
    <span className="text-sm text-green-600 font-medium">
      (Total Maintenance: ₹{vehicle.totalMaintenanceAmount?.toLocaleString() || '0'})
    </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={() => handleEditVehicle(vehicle)}
                        className="inline-flex items-center gap-2 bg-yellow-50 text-yellow-700 px-4 py-2 rounded-lg font-medium hover:bg-yellow-100 transition-colors duration-200 text-sm"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </button>
                      
                      <button
  onClick={() => setSelectedVehicle(vehicle)}
  className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-2 rounded-lg font-medium hover:bg-blue-100 transition-colors duration-200 text-xs sm:text-sm break-words min-w-0 max-w-full"
>
  <svg className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
  <span className="text-left whitespace-normal break-words">
    Manage Docs (RC, Insurance, Vehicle Photos, Challan, National Permit, etc.)
  </span>
</button>
                      
{userRoles.includes("accounts") && (
                          <button
                          onClick={() => setSelectedMaintenanceVehicle(vehicle)}
                          className="inline-flex items-center gap-2 bg-purple-50 text-purple-700 px-4 py-2 rounded-lg font-medium hover:bg-purple-100 transition-colors duration-200 text-sm"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          Maintenance Log Book
                        </button>
                      )}
                      
{!userRoles.includes("driver") && (
  <button
    onClick={() => handleDeleteVehicle(vehicle)}
    className="inline-flex items-center justify-center w-6 h-6 bg-red-50 text-red-700 rounded-full hover:bg-red-100 transition-colors duration-200"
    title="Delete vehicle"
  >
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  </button>
)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

{/* Document Manager Section */}
{selectedVehicle && userRoles.includes("accounts") && (
    <div ref={docsRef} className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
    <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
      <h3 className="text-xl font-semibold text-gray-900">
        Managing Documents for: <span className="text-blue-600">{selectedVehicle.vehicleNumber}</span>
      </h3>
      <div className="mt-2 space-y-1">
        <p className="text-gray-600">Upload and manage vehicle documents and certificates</p>
        {selectedVehicle.phone && (
          <p className="text-sm text-gray-500 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            Driver Phone: {selectedVehicle.phone}
          </p>
        )}
        {selectedVehicle.driverEmail && (
          <p className="text-sm text-gray-500 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Email: {selectedVehicle.driverEmail}
          </p>
        )}
      </div>
    </div>
    <div className="p-6">
      <VehicleDocumentManager vehicleNumber={selectedVehicle.vehicleNumber} />
    </div>
  </div>
)}

            {/* Register New Vehicle Section - Only for non-drivers */}
{!userRoles.includes("driver") && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Register New Vehicle</h3>
              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                {registeredVehicles.length} vehicles registered
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">Format Example</h4>
                  <p className="text-blue-800 text-sm">
                    <code className="bg-blue-100 px-2 py-1 rounded text-blue-700 font-mono">
                      PB08 EL 9364 : pb08el9364@thermopackers.com
                    </code>
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
           <div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Vehicle Number *
  </label>
  <input
    type="text"
    placeholder="e.g., PB08 EL 9364"
    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
    value={newVehicle.vehicleNumber}
    onChange={(e) => {
      let value = e.target.value.toUpperCase();
      
      // Remove all spaces first
      let cleanValue = value.replace(/\s/g, '');
      
      // Format as PB08 AB 1234 (if long enough)
      let formattedValue = cleanValue;
      if (cleanValue.length > 4) {
        formattedValue = cleanValue.slice(0, 4) + ' ' + cleanValue.slice(4, 6) + ' ' + cleanValue.slice(6, 10);
      } else if (cleanValue.length > 2) {
        formattedValue = cleanValue.slice(0, 4) + ' ' + cleanValue.slice(4);
      }
      
      // Remove trailing spaces
      formattedValue = formattedValue.trim();
      
      setNewVehicle((v) => ({ ...v, vehicleNumber: formattedValue }));
    }}
  />
  <p className="text-xs text-gray-500 mt-1">
    Format: PB08 AB 1234 (automatically formatted)
  </p>
</div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vehicle Email *
                </label>
                <input
                  type="email"
                  placeholder="e.g., vehicle@company.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                  value={newVehicle.driverEmail}
                  onChange={(e) => setNewVehicle((v) => ({ ...v, driverEmail: e.target.value }))}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Driver Phone
                </label>
                <input
                  type="tel"
                  placeholder="e.g., 9876543210"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                  value={newVehicle.phone}
                  onChange={(e) => setNewVehicle((v) => ({ ...v, phone: e.target.value.replace(/\D/g, "") }))}
                />
              </div>
              
              <div className="md:col-span-2 lg:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  GPS Tracking Link
                </label>
                <input
                  type="url"
                  placeholder="https://gps-tracker.com/your-vehicle"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                  value={newVehicle.gpsLink}
                  onChange={(e) => setNewVehicle((v) => ({ ...v, gpsLink: e.target.value }))}
                />
              </div>
            </div>
            
            <button
              className="w-full md:w-auto bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 transition-colors duration-200 flex items-center justify-center gap-2"
              onClick={handleVehicleRegister}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Registering...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Register Vehicle
                </>
              )}
            </button>
          </div>
        )}
      </main>

      {/* Maintenance Log Book Modal */}
      {selectedMaintenanceVehicle && (
        <MaintenanceLogBook 
          vehicleNumber={selectedMaintenanceVehicle.vehicleNumber}
          onClose={() => setSelectedMaintenanceVehicle(null)}
        />
      )}
    </div>
  );
}