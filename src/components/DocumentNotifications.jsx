import { useEffect, useState } from "react";
import { useUserContext } from "../context/UserContext";
import axiosInstance from "../axiosInstance";

const DOCUMENT_TYPES = {
  insurance_renewal: "Insurance Renewal",
  registration_tax_renewal: "Registration Tax Renewal",
  pollution_renewal: "Pollution Renewal",
  fitness_renewal: "Fitness Renewal",
  all_india_permit_renewal: "All India Permit Renewal",
  gps_renewal: "GPS Renewal",
};
export default function DocumentNotifications({ setDocNotifCount }) {
  const { token, user } = useUserContext();
  const [expiringDocuments, setExpiringDocuments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.role === "accounts") {
      fetchExpiringDocuments();
    }
  }, [user]);

  const fetchExpiringDocuments = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(
        "/vehicle-documents/notifications/expiring",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setExpiringDocuments(res.data);
      if (setDocNotifCount) setDocNotifCount(res.data.length); // ✅ pass count to dashboard
    } catch (err) {
      console.error("Error fetching expiring documents:", err);
    } finally {
      setLoading(false);
    }
  };

  const getDaysUntilExpiry = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-6">
        <div className="w-8 h-8 border-4 border-rose-400 border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-3 text-slate-600">Loading notifications...</span>
      </div>
    );
  }

  if (expiringDocuments.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-4 text-center">
        ✅ No documents expiring in the next 7 days.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl shadow bg-white">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-100">
          <tr>
            <th className="px-3 py-2 text-left text-sm font-semibold text-slate-700">Vehicle</th>
            <th className="px-3 py-2 text-left text-sm font-semibold text-slate-700">Type</th>
            <th className="px-3 py-2 text-left text-sm font-semibold text-slate-700">Expiry</th>
            <th className="px-3 py-2 text-left text-sm font-semibold text-slate-700">Days Left</th>
            {/* <th className="px-3 py-2 text-left text-sm font-semibold text-slate-700">Action</th> */}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {expiringDocuments.map((doc) => {
            const daysLeft = getDaysUntilExpiry(doc.expiryDate);
            let urgencyClass =
              daysLeft <= 3
                ? "bg-red-100 text-red-700"
                : "bg-yellow-100 text-yellow-700";

            return (
              <tr key={doc._id}>
                <td className="px-3 py-2 text-sm">{doc.vehicleNumber}</td>
                <td className="px-3 py-2 text-sm font-medium">
                  {DOCUMENT_TYPES[doc.documentType]}
                </td>
                <td className="px-3 py-2 text-sm">
                  {new Date(doc.expiryDate).toLocaleDateString()}
                </td>
                <td className="px-3 py-2 text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs ${urgencyClass}`}>
                    {daysLeft} day{daysLeft !== 1 ? "s" : ""}
                  </span>
                </td>
                {/* <td className="px-3 py-2">
                  {doc.documentUrls?.length > 0 ? (
                    <a
                      href={doc.documentUrls[0]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block rounded bg-indigo-600 px-3 py-1 text-xs text-white hover:bg-indigo-700"
                    >
                      View
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400">No File</span>
                  )}
                </td> */}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
