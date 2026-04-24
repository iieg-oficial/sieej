import React from 'react';

const Spinner = ({ 
    size = 24, 
    className = '', 
    color = '#5C2472', 
    message,
}) => {
    return (
        <div className={`flex justify-center items-center ${className}`} role="status" aria-label="Loading">
            <svg
                className="animate-spin"
                style={{ color }}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                width={size}
                height={size}
            >
                <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                />
                <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
                />
            </svg>
            { message && <span>{message}</span>}
        </div>
    )
}

export default Spinner;