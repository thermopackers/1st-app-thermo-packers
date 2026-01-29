// components/YouTubeGuide.jsx
import { useState } from "react";

export default function YouTubeGuide({ videoId, title = "How to Add Data - Guide" }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Trigger Button */}
<div className="fixed bottom-4 right-4 z-40">
  <div className="relative group">
    {/* Arrow container with unified animation */}
    <div className="absolute -left-64 top-1/2 transform -translate-y-1/2 animate-bounce-unified">
      <div className="flex items-center">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-[10px] font-medium px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <span>How to take power factor readings?</span>
          <svg 
            className="w-5 h-5 animate-pulse" 
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
    </div>

    {/* Button with same animation and text */}
    <div className="animate-bounce-unified">
      <button
        onClick={() => setIsOpen(true)}
        className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center px-4 py-3 group-hover:scale-105"
        title="Power Factor Reading Guide"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M10 9.333l5.333 2.662-5.333 2.672v-5.334zm14-4.333v14c0 2.761-2.238 5-5 5h-14c-2.761 0-5-2.239-5-5v-14c0-2.761 2.239-5 5-5h14c2.762 0 5 2.239 5 5z" />
        </svg>
        <span className="ml-1 font-bold text-[10px]">Power Factor Video</span>
      </button>
    </div>
  </div>

  <style jsx>{`
    @keyframes bounce-unified {
      0%, 100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(-6px);
      }
    }
    
    .animate-bounce-unified {
      animation: bounce-unified 2s infinite ease-in-out;
    }
    
    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.7;
      }
    }
    
    .animate-pulse {
      animation: pulse 1.5s infinite ease-in-out;
    }
  `}</style>
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