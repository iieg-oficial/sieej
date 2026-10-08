import React from 'react';
import icoError from '@assets/icons/ico_error.svg';
import { getErrorMessage } from '@helpers/formErrors';

const ErrorsRequired = ({ name, errors, mostrar = true, children }) => {
    const errorMessage = getErrorMessage(errors, name);

    return (
        <div className="min-h-[17px] mt-1">
            {mostrar && errorMessage && (
                <div className="flex items-center">
                    <img src={icoError} alt="error" className="mr-2"/>
                    <span role="alert" className="text-[#B3261E] text-[11px] font-garetmedium">
                        {errorMessage}
                    </span>
                </div>
            )}
            {children}
        </div>
    );
};

export default ErrorsRequired;
