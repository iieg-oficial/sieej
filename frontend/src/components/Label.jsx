// Se fuciono este componente con typography para ir quitando Label gradialemente
// <Typography as="label" text="Este es la nueva forma" tooltip="hola" />

import React from 'react';
import Tooltip from './Tooltip';

const Label = ({
    labelName, 
    tooltip, 
    className, 
    name
}) => {
    if (!labelName) return <React.Fragment></React.Fragment>;

    return (
        <Tooltip text={tooltip}>
            <label 
                htmlFor={name} 
                className={`
                    block text-sm font-garetmedium text-[#191919]
                    ${className}
                `}
            >
                {labelName}
            </label>
        </Tooltip>
    )
};

export default Label;