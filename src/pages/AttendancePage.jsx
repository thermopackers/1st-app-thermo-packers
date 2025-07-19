import AttendanceCapture from "./AttendanceCapture";
import InternalNavbar from "../components/InternalNavbar";

export default function AttendancePage() {
  return (
    <>
      <InternalNavbar />
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="w-full max-w-2xl p-6 bg-white rounded-xl shadow-lg">
          <AttendanceCapture />
        </div>
      </div>
    </>
  );
}
