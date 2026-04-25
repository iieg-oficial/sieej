import React, { useEffect, useState } from 'react';
import { PDFViewer, usePDF } from '@react-pdf/renderer';
import PdfForm from './PdfForm';
import Loading from './Loading';

const PdfComponent = ({ formData }) => {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 1000);
        return () => clearTimeout(timer);
    }, []);

    if (loading) return <Loading />;

    return (
        <div style={{ height: '100vh' }}>
            <PDFViewer style={{ width: '100%', height: '100%' }}>
                <PdfForm formData={formData} />
            </PDFViewer>
        </div>
    );
};

const PdfDownload = ({ formData }) => {
    const [ instance, _updateInstance ] = usePDF({ document: <PdfForm formData={formData} /> });
    const { loading, error } = instance;

    if (loading) return <Loading />;
    if (error) return <div>Error: {error.message}</div>;

    return (
        <a href={instance.url} download="Registro de enlaces SIEEJ.pdf">
            Descargar PDF
        </a>
    );
};

export { PdfComponent, PdfDownload };
