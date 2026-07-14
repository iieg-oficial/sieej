import React from 'react';
import { useNavigate } from 'react-router';
import leftIcon from '@icons/ico_left_arrow.svg';

const BackLink = ({ to, label = 'Mis formularios', padding = 'p-0!', sizeText = 'text-xs!', sizeIcon = 'w-2 h-2' }) => {
    const navigate = useNavigate();

    return (
        <button
            type="button"
            onClick={() => navigate(to)}
            className={`
                group flex items-center gap-0 ${sizeText} text-[#465055] font-garetregular
                bg-transparent border-none m-0 cursor-pointer
                hover:text-[#5C2472]
                ${padding}
            `}
        >
            <img src={leftIcon} alt="" className={sizeIcon + ' mr-2'} />
            <span className="group-hover:underline underline-offset-4">
                {label}
            </span>
        </button>
    );
};

export default BackLink;
