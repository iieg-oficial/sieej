import React from 'react';
import icoError from '@assets/icons/ico_error.svg';
import { getErrorMessage } from '@helpers/formErrors';

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
