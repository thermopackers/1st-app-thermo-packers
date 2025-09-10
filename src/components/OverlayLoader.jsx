// src/components/OverlayLoader.jsx
export default function OverlayLoader({ message = "Logging in..." }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white px-6 py-4 rounded-xl shadow-lg text-center text-black font-medium text-lg">
        <span className="loader mr-2"></span> {message}
      </div>

      <style>
        {`
        .loader {
          border: 3px solid #f3f3f3;
          border-top: 3px solid #3498db;
          border-radius: 50%;
          width: 18px;
          height: 18px;
          animation: spin 0.8s linear infinite;
          display: inline-block;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        `}
      </style>
    </div>
  );
}
