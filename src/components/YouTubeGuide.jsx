// components/YouTubeGuide.jsx
import { useState } from "react";

export default function YouTubeGuide({ videoId, title = "How to Add Data - Guide" }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Trigger Button */}
      <div className="fixed bottom-4 right-4 z-40">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-red-600 hover:bg-red-700 text-white rounded-full p-3 shadow-lg flex items-center justify-center transition-all hover:scale-110"
          title="Watch Tutorial Video"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M10 9.333l5.333 2.662-5.333 2.672v-5.334zm14-4.333v14c0 2.761-2.238 5-5 5h-14c-2.761 0-5-2.239-5-5v-14c0-2.761 2.239-5 5-5h14c2.762 0 5 2.239 5 5z" />
          </svg>
          <span className="ml-2 font-medium sm:inline">Watch Guide</span>
        </button>
      </div>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center bg-gray-800 text-white p-4">
              <h3 className="text-lg font-semibold">{title}</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-gray-300 text-2xl"
              >
                ×
              </button>
            </div>

            {/* YouTube Video */}
            <div className="relative pt-[56.25%]"> {/* 16:9 Aspect Ratio */}
              <iframe
                className="absolute top-0 left-0 w-full h-full"
                src={`https://www.youtube.com/embed/${videoId}`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            {/* Instructions */}
            <div className="p-4 bg-gray-50 border-t">
              <h4 className="font-semibold text-gray-800 mb-2">Quick Steps:</h4>
              <ol className="list-decimal list-inside space-y-1 text-gray-600">
                <li>Click "+ Add New Row" to add a new entry</li>
                <li>Enter KWH and KVAH readings from the meter</li>
                <li>Upload photo evidence of the meter reading</li>
                <li>Click "Save" to store the data</li>
                <li>Power Factor will be automatically calculated</li>
              </ol>
              <div className="mt-3 text-sm text-gray-500">
                <p>🎯 <strong>Target:</strong> Maintain Power Factor above 0.95</p>
                <p>⚠️ <strong>Note:</strong> Upload clear photos of both KWH and KVAH meters</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}