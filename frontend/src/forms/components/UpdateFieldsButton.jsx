import React from 'react';
import { useNavigate } from 'react-router';
import Tooltip from '@components/Tooltip';
import UpdateIcon from '@components/icons/UpdateIcon';

const ICON_CLASS = `inline-flex shrink-0 items-center justify-center w-10 h-10 rounded-full transition
    bg-[#5C2472] text-white hover:shadow-[0px_8px_16px_#4615524D]`;

const LABELED_CLASS = `inline-flex shrink-0 items-center justify-center gap-2 h-10 rounded-full transition
    bg-[#5C2472] text-white hover:shadow-[0px_8px_16px_#4615524D]
    w-10 p-0! md:w-auto md:px-6!`;

const LABEL = 'Actualizar información';

const UpdateFieldsButton = ({ envioId, labeled = false }) => {
    const navigate = useNavigate();

    if (!envioId) return null;

    const button = (
        <button
            type="button"
            onClick={() => navigate(`/mis-envios/${envioId}/actualizar`)}
            aria-label={LABEL}
            title={LABEL}
            className={labeled ? LABELED_CLASS : ICON_CLASS}
        >
            <UpdateIcon className="text-white!" />
            {labeled && <span className="hidden md:inline font-garetbold text-sm">Actualizar</span>}
        </button>
    );

    if (labeled) return button;

    return (
        <Tooltip text={LABEL} showIcon={false} size="small">
            {button}
        </Tooltip>
    );
};

export default UpdateFieldsButton;
