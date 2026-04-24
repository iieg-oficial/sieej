import React, { useEffect, useState } from 'react';
import { PDFViewer, pdf, usePDF } from '@react-pdf/renderer';
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

const handleDownload = async (formData) => {
    if (!formData) throw Error('No se encontro información para descargar el PDF');
    const blob = await pdf(<PdfForm formData={formData} />).toBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Registro de enlaces SIEEJ.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

const handleView = async (formData) => {
    const blob = await pdf(<PdfForm formData={formData} />).toBlob();
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    URL.revokeObjectURL(url);
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
}

export { PdfComponent, PdfDownload, handleDownload, handleView };

