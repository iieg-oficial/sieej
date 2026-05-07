import React, { useState } from 'react';
import Button from '@components/Button';

const SummaryPdfButton = ({ step, definicion, datos, catalogos, onError }) => {
    const [loading, setLoading] = useState(false);

    const handleClick = async () => {
        setLoading(true);
        try {
            if (step?.pdfTemplate === 'sieej-levantamiento') {
                const { downloadSieejLevantamientoPdf } = await import('./templates/sieej-levantamiento');
                await downloadSieejLevantamientoPdf(datos);
            } else {
                const { downloadGenericPdf } = await import('./genericPdf');
                await downloadGenericPdf(definicion, datos, catalogos);
            }
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
