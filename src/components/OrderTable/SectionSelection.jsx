import React from 'react';

const SectionSelection = ({ order, sectionsList, localSections, handleSectionRadioChange }) => {
  return (
    <div className="flex flex-col space-y-4">
      {sectionsList.map((section, index) => {
        const keyId = `${order._id}-${section.key}`;
        const isSectionSent = (() => {
          const sentToProduction = order.sentTo?.production || [];
          const sentToDispatch = order.sentTo?.dispatch || [];
          const productionSections = ["preExpander", "danaBeads", "shapeMoulding", "cncSection"];
          const dispatchSections = ["sheetCutting", "shapePackaging"];

          if (productionSections.includes(section.key)) {
            return sentToProduction.includes(section.key);
          }

          if (dispatchSections.includes(section.key)) {
            return sentToDispatch.includes(section.key);
          }

          return false;
        })();

        return (
          <label 
            key={keyId} 
            className="flex items-start gap-3 mb-3 hover:bg-gray-50 rounded transition-colors"
          >
            <input
              type="radio"
              name={`section-${order._id}`}
              value={section.key}
              checked={localSections[order._id]?.[section.key] || false}
              onChange={() => handleSectionRadioChange(order._id, section.key)}
            />
            <span className="flex gap-1">
              <span className="font-bold">
                {index + 1}.
              </span>
               <span className="font-medium">
               {section.label}
              </span>
              {isSectionSent && (
                <span className="text-green-600 text-xs font-semibold">
                  ✅ Sent
                </span>
              )}
            </span>
          </label>
        );
      })}
    </div>
  );
};

export default SectionSelection;