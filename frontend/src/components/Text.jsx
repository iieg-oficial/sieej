import React from 'react';
import formatText from '@helpers/formatText';
import Typography from './Typography';
import DynamicDiv from '@helpers/DynamicDiv';

const Text = ({ label, text, tooltip, colSpan, wDiv, clean, ...rest }) => {
    const cleanText = formatText(text, label, clean);
    
    return (
        <DynamicDiv colSpan={colSpan} wDiv={wDiv}>
            <Typography as="label" titleName={label} tooltip={tooltip} />
            <p 
                className={`
                    font-garetmedium text-[13px] my-2
                    ${text ? 'text-[#5C2472]' : 'text-[#8E8E8E]'}
                `}
                {...rest}
            >
                {cleanText}
            </p>
        </DynamicDiv>
    );
};

export default Text;