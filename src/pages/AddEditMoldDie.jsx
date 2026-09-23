import { useNavigate } from "react-router-dom";
import MoldDieForm from "../components/MoldDieForm";
import InternalNavbar from "../components/InternalNavbar";

const AddEditMoldDie = () => {
  const navigate = useNavigate();

  return (
    <>
      <InternalNavbar />
      <div
        className="min-h-screen py-8 pt-20"
        style={{
          background:
            "linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(255, 255, 255, 0.4) 40%, rgba(139, 92, 246, 0.08) 100%)",
        }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate(-1)}
            className="glass-btn mb-6 inline-flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 font-medium"
          >
            ← Back
          </button>
          <MoldDieForm onClose={() => navigate("/mold-die-list")} />
        </div>
      </div>
    </>
  );
};

export default AddEditMoldDie;