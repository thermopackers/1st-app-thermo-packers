import { useEffect, useState, useRef } from "react";
import Swal from "sweetalert2";
import toast from "react-hot-toast";
import InternalNavbar from "../components/InternalNavbar";
import axiosInstance from "../axiosInstance";
import { useUserContext } from "../context/UserContext";
import VehicleDocumentManager from "../components/VehicleDocumentManager";

export default function RegisteredVehicles() {
  const { user, token, loading } = useUserContext();
  const [registeredVehicles, setRegisteredVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
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
      const res = await axiosInstance.get("/vehicles/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRegisteredVehicles(res.data);
    } catch (err) {
      console.error("Failed to fetch registered vehicles:", err);
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
    try {
      await axiosInstance.post("/vehicles/register", newVehicle, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Vehicle registered");
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
    }
  };

  const handleEditVehicle = async (vehicle) => {
    const { value: updatedValues } = await Swal.fire({
      title: "Edit Vehicle",
      html: `
        <input type="text" id="vehicleNumber" class="swal2-input" value="${vehicle.vehicleNumber}" disabled />
        <input type="email" id="driverEmail" class="swal2-input" value="${vehicle.driverEmail}" />
        <input type="tel" id="phone" class="swal2-input" placeholder="Phone" value="${vehicle.phone || ""}" />
        <input type="url" id="gpsLink" class="swal2-input" placeholder="GPS Link" value="${vehicle.gpsLink || ""}" />
      `,
      showCancelButton: true,
      preConfirm: () => {
        return {
          driverEmail: document.getElementById("driverEmail").value,
          phone: document.getElementById("phone").value,
          gpsLink: document.getElementById("gpsLink").value,
        };
      },
    });

    if (!updatedValues) return;

    try {
      await axiosInstance.patch(`/vehicles/update/${vehicle._id}`, updatedValues, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Vehicle updated");
      fetchRegisteredVehicles();
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    }
  };

  if (loading) return <div className="p-6 text-center">Loading...</div>;
  if (!user) return <div className="p-6 text-center text-red-500">User not found</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <InternalNavbar />
      <main className="max-w-5xl mx-auto px-4 py-6">
        {user.role !== "driver" && (
          <div className="bg-white shadow p-4 rounded mb-6">
            <h3 className="font-bold text-lg mb-2">Register New Vehicle</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Vehicle Number"
                className="border p-2 rounded"
                value={newVehicle.vehicleNumber.toUpperCase()}
                onChange={(e) => setNewVehicle((v) => ({ ...v, vehicleNumber: e.target.value }))}
              />
              <input
                type="email"
                placeholder="Vehicle Email"
                className="border p-2 rounded"
                value={newVehicle.driverEmail}
                onChange={(e) => setNewVehicle((v) => ({ ...v, driverEmail: e.target.value }))}
              />
              <input
                type="url"
                placeholder="GPS Link"
                className="border p-2 rounded"
                value={newVehicle.gpsLink}
                onChange={(e) => setNewVehicle((v) => ({ ...v, gpsLink: e.target.value }))}
              />
              <input
                type="tel"
                placeholder="Driver Phone"
                className="border p-2 rounded"
                value={newVehicle.phone}
                onChange={(e) => setNewVehicle((v) => ({ ...v, phone: e.target.value.replace(/\D/g, "") }))}
              />
            </div>
            <button
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
              onClick={handleVehicleRegister}
            >
              Register Vehicle
            </button>
          </div>
        )}

        <h4 className="font-semibold text-md mb-2">Registered Vehicles</h4>
        <ul className="space-y-2">
          {registeredVehicles.map((vehicle) => (
            <li
              key={vehicle._id}
              className="flex flex-col sm:flex-row sm:justify-between sm:items-center border p-3 rounded shadow-sm gap-3"
            >
              <div>
                <p className="font-medium">{vehicle.vehicleNumber}</p>
                <p className="text-sm text-gray-600">{vehicle.driverEmail}</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  className="bg-blue-50 hover:bg-blue-100 text-blue-600 text-sm px-3 py-1 rounded-md"
                  onClick={() => handleEditVehicle(vehicle)}
                >
                  ✏️ Edit
                </button>
                <button
                  className="bg-green-50 hover:bg-green-100 text-green-600 text-sm px-3 py-1 rounded-md"
                  onClick={() => setSelectedVehicle(vehicle)}
                >
                  📄 Manage Docs
                </button>
              </div>
            </li>
          ))}
        </ul>

        {selectedVehicle && user.role === "accounts" && (
          <div ref={docsRef} className="mt-6 p-4 border rounded bg-white shadow">
            <h3 className="font-semibold mb-2">
              Managing Documents for: {selectedVehicle.vehicleNumber}
            </h3>
            <VehicleDocumentManager vehicleNumber={selectedVehicle.vehicleNumber} />
          </div>
        )}
      </main>
    </div>
  );
}
