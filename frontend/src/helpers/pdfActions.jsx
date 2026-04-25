import { pdf } from '@react-pdf/renderer';
import PdfForm from '../components/PdfForm';

export const handleDownload = async (formData) => {
    if (!formData) throw new Error('No se encontro información para descargar el PDF');
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

export const handleView = async (formData) => {
    const blob = await pdf(<PdfForm formData={formData} />).toBlob();
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    URL.revokeObjectURL(url);
};
