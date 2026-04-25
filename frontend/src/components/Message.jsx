import React, {  } from 'react';
import warning from '../assets/icons/ico_importante.svg';
import Typography from './Typography';
import useGlobal from '../context/useGlobal';

const messageStyles = {
    error: {
        bgColor: 'bg-[#FFD0CCFC]',
        textColor: {color: '#EA4335'},
        borderColor: 'border-[#EA4336]',
    },
    warning: {
        bgColor: 'bg-yellow-100',
        textColor: {color: 'yellow'},
        borderColor: 'border-yellow-500',
    },
    info: {
        bgColor: 'bg-blue-100',
        textColor: {color: 'blue'},
        borderColor: 'border-blue-500',
    },
    default: {
        bgColor: 'bg-gray-100',
        textColor: {color: 'gray'},
        borderColor: 'border-gray-500',
    },
};

const Message = ({ _show, message, type = 'error', className = '', onClose }) => {
    const { isMessageOpen, onMessage } = useGlobal();
    const { bgColor, textColor, borderColor } = messageStyles[type] || messageStyles.default;

    const handleClose = () => {
        if (onClose) {
            onClose();
        } else {
            onMessage(false);
        }
    };

    if (!isMessageOpen) return <React.Fragment></React.Fragment>;
    
    return (
        <div
            className={`
                flex items-center justify-between p-4 mb-4 border-1 
                ${className} ${bgColor} ${borderColor} rounded-lg gap-4
            `}
        >
            <div className="flex items-center gap-4">
                <img src={warning} alt="signo admiracion" className="w-6 h-6"/>
                <Typography as="span" className="font-garetmedium" style={{...textColor}} titleName={message}/>
            </div>
            <span className="cursor-pointer">
                <svg 
                    className="fill-current h-4 w-4" 
                    aria-label="Cerrar mensaje" 
                    role="button" 
                    onClick={handleClose} 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 20 20"
                >
                    <title>Cerrar</title>
                    <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/>
                </svg>
            </span>
        </div>
    );
};

export default Message;
