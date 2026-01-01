// CharacterCounter.jsx - IMPROVED VERSION
import React from 'react';

export default function CharacterCounter({ 
  text, 
  maxLength, 
  isMediaCampaign = false,
  customerName = '',
  longMessageWithMedia = false
}) {
  const currentLength = text?.length || 0;

  // Calculate the actual max length based on mode
  const actualMaxLength = longMessageWithMedia ? 1000 : maxLength;
  const remaining = actualMaxLength - currentLength;
  
  // Only calculate effective length for regular media campaigns
  const effectiveLength = isMediaCampaign && !longMessageWithMedia
    ? (customerName?.length || 0) + 2 + currentLength // Name + ": " + message
    : currentLength;
  
  const getColor = () => {
    if (remaining < 0) return 'text-red-600';
    if (remaining < 20) return 'text-yellow-600';
    if (remaining < 50) return 'text-blue-600';
    return 'text-gray-500';
  };
  
  const getBgColor = () => {
    if (remaining < 0) return 'bg-red-100 text-red-800';
    if (remaining < 10) return 'bg-yellow-100 text-yellow-800';
    if (remaining < 30) return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
  };
  
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-center">
        <div className="text-sm">
          <span className="text-gray-500">Characters: </span>
          <span className={getColor()}>
            {currentLength} / {actualMaxLength}
          </span>
          
          {/* Only show name+message calculation for regular media campaigns */}
          {isMediaCampaign && !longMessageWithMedia && (
            <span className="ml-2 text-sm text-gray-500">
              (with name: {effectiveLength} chars)
            </span>
          )}
        </div>
        
        <span className={`px-2 py-0.5 rounded text-xs ${getBgColor()}`}>
          {remaining >= 0 ? `${remaining} left` : `${-remaining} over`}
        </span>
      </div>
      
      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-1.5">
        <div 
          className={`h-1.5 rounded-full ${
            remaining < 0 ? 'bg-red-500' :
            remaining < 20 ? 'bg-yellow-500' :
            remaining < 50 ? 'bg-blue-500' :
            'bg-green-500'
          }`}
          style={{ 
            width: `${Math.min(100, (currentLength / actualMaxLength) * 100)}%` 
          }}
        ></div>
      </div>
      
      {/* NEW: Special info for long messages with media */}
      {longMessageWithMedia && isMediaCampaign && (
        <div className="mt-2 p-2 bg-purple-50 border border-purple-200 rounded text-sm text-purple-700">
          💡 <strong>Long message with media enabled:</strong> Media will be sent first, then your long message as separate text.
        </div>
      )}
      
      {/* OLD WARNING - Only show for regular media campaigns */}
      {isMediaCampaign && !longMessageWithMedia && effectiveLength > 90 && (
        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-700">
          ⚠️ <strong>Media Campaign Warning:</strong> Combined name + message is getting long ({effectiveLength}/100 chars)
          <div className="mt-1 text-xs">
            • Maximum <strong>75 characters</strong> for message<br/>
            • Combined with customer name like: "<span className="font-medium">{customerName || 'Customer'}: [Your Message]</span>"<br/>
            • Total should stay under 100 characters
          </div>
        </div>
      )}
      
      {/* NEW: Different warning for long messages with media */}
      {longMessageWithMedia && isMediaCampaign && currentLength > 900 && (
        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
          ℹ️ <strong>Long Message Info:</strong> Your message is {currentLength} characters. 
          Media will be sent first, then this full message as separate text.
        </div>
      )}
      
      {/* Error message */}
      {remaining < 0 && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          ⚠️ Message is too long! Reduce by {-remaining} characters.
        </div>
      )}
    </div>
  );
}