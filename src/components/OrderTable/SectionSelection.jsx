import React from 'react';

const SectionSelection = ({ order, sectionsList, localSections, handleSectionRadioChange }) => {
  return (
    <>
      {sectionsList.map((section) => {
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
          <label key={keyId} className="flex items-center gap-2">
            <input
              type="radio"
              name={`section-${order._id}`}
              value={section.key}
              checked={localSections[order._id]?.[section.key] || false}
              onChange={() => handleSectionRadioChange(order._id, section.key)}
            />
            <>
              {section.label}
              {isSectionSent && (
                <span className="ml-1 text-green-600 text-xs font-semibold">
                  ✅ Sent
                </span>
              )}
            </>
          </label>
        );
      })}
    </>
  );
};

export default SectionSelection;