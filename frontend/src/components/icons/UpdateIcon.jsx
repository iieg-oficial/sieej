import React from 'react';

const UpdateIcon = ({ size = 18, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <line x1="12" y1="20" x2="12" y2="6" />
        <polyline points="6 12 12 6 18 12" />
    </svg>
);

export default UpdateIcon;
