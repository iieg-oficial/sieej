import React, { useState } from 'react';
import Button from '@components/Button';
import { downloadEnvioPdf } from '@services/formulariosServices';

const SummaryPdfButton = ({ step, envioId, onError }) => {
    const [loading, setLoading] = useState(false);

    const handleClick = async () => {
        setLoading(true);
        try {
            await downloadEnvioPdf(envioId);
        } catch (e) {
            onError?.(e.message || 'Error al generar PDF');
        } finally {
            setLoading(false);
        }
    };

    if (!step?.exportPdf && step?.pdfTemplate !== 'sieej-levantamiento') return null;

    return (
        <Button
            label={loading ? 'Generando...' : 'Descargar PDF'}
            variant="secondary"
            onClick={handleClick}
            disabled={loading}
            center
        />
    );
};

export default SummaryPdfButton;
