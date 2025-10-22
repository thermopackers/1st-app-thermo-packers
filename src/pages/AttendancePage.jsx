// Attendance Page Component
import AttendanceCapture from "./AttendanceCapture";
import InternalNavbar from "../components/InternalNavbar";

export default function AttendancePage() {
  return (
    <>
      <InternalNavbar />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center py-8 px-4">
        <div className="w-full max-w-4xl">
          <AttendanceCapture />
        </div>
      </div>
    </>
  );
}