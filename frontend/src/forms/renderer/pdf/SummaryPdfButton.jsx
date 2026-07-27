import React, { useState } from 'react';
import Spinner from '@components/Spinner';
import DownloadIcon from '@components/icons/DownloadIcon';
import { downloadEnvioPdf } from '@services/formulariosServices';
import useAuth from '@context/useAuth';

const SummaryPdfButton = ({ step, envioId, onError }) => {
    const [loading, setLoading] = useState(false);
    const { onFetch } = useAuth();

    const handleClick = async () => {
        setLoading(true);
        try {
            await downloadEnvioPdf(onFetch, envioId);
        } catch (e) {
            onError?.(e.message || 'Error al generar PDF');
        } finally {
            setLoading(false);
        }
    };

    if (!step?.exportPdf && step?.pdfTemplate !== 'sieej-levantamiento') return null;

    return (
        <button
            type="button"
            onClick={handleClick}
            disabled={loading}
            aria-label="Descargar PDF"
            title="Descargar PDF"
            className="inline-flex shrink-0 items-center justify-center gap-2 h-10 rounded-full transition
                bg-[#E2E2E2] text-[#465055] hover:bg-[#CECDCD] hover:shadow-[0px_8px_16px_#6E6E6E29]
                w-10 p-0! md:w-auto md:px-6!
                disabled:bg-[#CBCBCB] disabled:text-[#5B6670] disabled:cursor-not-allowed"
        >
            {loading ? <Spinner size={16} /> : <DownloadIcon />}
            <span className="hidden md:inline font-garetbold text-sm">
                {loading ? 'Generando...' : 'Descargar PDF'}
            </span>
        </button>
    );
};

export default SummaryPdfButton;
