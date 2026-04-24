import React from 'react';
import icoError from '../assets/icons/ico_error.svg';

const parseNameToFields = (name) => {
    const regex = /([^[.\]]+)|\[(\d+)\]/g;
    const fields = [];
    let match;

    while ((match = regex.exec(name)) !== null) {
        if (match[1] !== undefined) {
            fields.push(match[1]); 
        } else if (match[2] !== undefined) {
            fields.push(Number(match[2])); 
        }
    }

    return fields;
};

const getErrorMessage = (errors, name) => {
    const fields = parseNameToFields(name);
    let errorObj = errors;

    for (let i = 0; i < fields.length; i++) {
        const field = fields[i];

        if (
            errorObj === undefined ||
            errorObj === null ||
            !(field in errorObj)
        ) {
            return null;
        }

        errorObj = errorObj[field];
    }

    return errorObj?.message || null;
};

const ErrorsRequired = ({ name, errors }) => {
    const errorMessage = getErrorMessage(errors, name);

    if (!errorMessage) return null;

    return (
        <div className="flex items-center mt-1">
            <img src={icoError} alt="error" className="mr-2"/>
            <span role="alert" className="text-[#EA4336] text-[11px] font-garetmedium">
                {errorMessage}
            </span>
        </div>
    );
};

export default ErrorsRequired;