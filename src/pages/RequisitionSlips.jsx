import React, { useEffect, useState } from "react";
import axiosInstance from "../axiosInstance";
import { FaDownload } from "react-icons/fa";
import InternalNavbar from "../components/InternalNavbar";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

export default function RequisitionSlips() {
  const [slips, setSlips] = useState([]);

  useEffect(() => {
    axiosInstance
      .get("/requisitions/all")
      .then((res) => setSlips(res.data))
      .catch((err) => console.error("Failed to load slips", err));
  }, []);


const openPdfInSwal = (pdfUrl) => {
  Swal.fire({
    title: '📄 Material Requisition Slip',
    html: `
      <iframe
        src="https://docs.google.com/gview?url=${encodeURIComponent(pdfUrl)}&embedded=true"
        width="100%"
        height="500px"
        style="border:none"
      ></iframe>
    `,
    width: '80%',
    showConfirmButton: false,
    showCloseButton: true,
    customClass: {
      popup: 'rounded-xl',
    }
  });
};



  return (
    <>
      <InternalNavbar />
      <div className="p-6 max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">📄 Material Requisition Slips</h1>
        {slips.length === 0 ? (
          <p>No slips found.</p>
        ) : (
          <div className="grid gap-4">
            {slips.map((slip, index) => {
  console.log("PDF URL:", slip.pdfUrl); // ✅ Add this line
  console.log("PDF URL:", slip); // ✅ Add this line

  return (
    <div
      key={slip._id}
      className="bg-white p-4 rounded-xl shadow-md flex justify-between items-center"
    >
      <div>
<p><span className="font-semibold">Person:</span> {slip.createdBy}</p>
        <p><span className="font-semibold">Date:</span> {new Date(slip.date).toLocaleDateString()}</p>
        <p><span className="font-semibold">Items:</span> {slip.items.length}</p>
      </div>
      <div>
        <button
          onClick={() => openPdfInSwal(slip.pdfUrl)} // 👈 This line uses the value you're logging
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <FaDownload className="mr-2" /> View Slip
        </button>
      </div>
    </div>
  );
})}

          </div>
        )}
      </div>
    </>
  );
}
