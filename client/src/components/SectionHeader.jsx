import React from 'react';

export const SectionHeader = ({ tag, title, subtitle }) => {
  return (
    <div className="section-header">
      {tag && <span className="section-tag">{tag}</span>}
      {title && <h2>{title}</h2>}
      {subtitle && <p>{subtitle}</p>}
    </div>
  );
};

export default SectionHeader;
