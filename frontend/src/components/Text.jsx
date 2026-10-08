import React from 'react';
import formatText from '@helpers/formatText';
import Typography from './Typography';
import DynamicDiv from '@helpers/DynamicDiv';

const Text = ({ label, text, tooltip, badge, colSpan, wDiv, clean, ...rest }) => {
    const cleanText = formatText(text, label, clean);
    
    return (
        <DynamicDiv colSpan={colSpan} wDiv={wDiv}>
            <Typography as="label" titleName={label} tooltip={tooltip} badge={badge} />
            <p 
                className={`
                    font-garetmedium text-[13px] my-2 break-words whitespace-pre-line
                    ${text ? 'text-[#5C2472]' : 'text-[#6B6B6B]'}
                `}
                {...rest}
            >
                {cleanText}
            </p>
        </DynamicDiv>
    );
};

export default Text;