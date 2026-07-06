import React from 'react';
import { useWatch } from 'react-hook-form';
import Text from '@components/Text';
import Typography from '@components/Typography';
import Divide from '@components/Divide';
import { FieldGrid } from '@helpers/FieldLayout';
import { resolveOptions } from './catalogResolver';
import SummaryPdfButton from './pdf/SummaryPdfButton';

const formatValue = (field, value, catalogos) => {
    if (value === null || value === undefined || value === '') return '';
    if (field.type === 'checkbox') return value ? 'Sí' : 'No';
    if (field.type === 'radio' || field.type === 'select') {
        const opts = resolveOptions(field, catalogos);
        const opt = opts.find((o) => String(o.value) === String(value));
        return opt ? opt.label : String(value);
    }
    if (field.type === 'select_multiple') {
        if (!Array.isArray(value)) return '';
        const opts = resolveOptions(field, catalogos);
        return value
            .map((v) => opts.find((o) => String(o.value) === String(v))?.label || String(v))
            .join(', ');
    }
    if (field.type === 'file') {
        if (typeof value === 'object' && value !== null) {
            return value.filename_original || value.url_publica || '';
        }
        return String(value);
    }
    return String(value);
};

const renderFormStep = (step, datos, catalogos) => {
    const stepData = datos[step.id] || {};
    const visibleFields = step.fields.filter((f) => f.type !== 'info');

    return (
        <div className="w-full my-6 md:ml-12">
            <FieldGrid col={4}>
                {visibleFields.map((field) => (
                    <Text
                        key={field.name}
                        label={field.label}
                        text={formatValue(field, stepData[field.name], catalogos)}
                        colSpan={2}
                    />
                ))}
            </FieldGrid>
        </div>
    );
};

const renderRepeaterStep = (step, datos, catalogos) => {
    const items = Array.isArray(datos[step.id]) ? datos[step.id] : [];
    if (items.length === 0) {
        return (
            <div className="w-full my-6 md:ml-12">
                <Typography as="p" className="text-[#7C7C7C]" titleName="Sin elementos." />
            </div>
        );
    }

    return (
        <div className="w-full my-6 md:ml-12">
            {items.map((item, idx) => (
                <React.Fragment key={idx}>
                    <Typography
                        as="p"
                        titleName={`${idx + 1}. ${item?.nombre_bd || item?.nombres || `Item ${idx + 1}`}`}
                        style={{ color: '#5C2472' }}
                    />
                    <FieldGrid col={4}>
                        {step.fields.filter((f) => f.type !== 'info').map((field) => (
                            <Text
                                key={field.name}
                                label={field.label}
                                text={formatValue(field, item?.[field.name], catalogos)}
                                colSpan={2}
                            />
                        ))}
                    </FieldGrid>
                    {idx < items.length - 1 && <Divide />}
                </React.Fragment>
            ))}
        </div>
    );
};

const SummaryStep = ({ definicion, methods, catalogos, summaryStep, showPdfButton = true }) => {
    const datos = useWatch({ control: methods.control }) || {};
    const realSteps = (definicion.steps || []).filter((s) => s.type !== 'summary');
    const isMobile = false;

    return (
        <React.Fragment>
            {realSteps.map((step) => (
                <React.Fragment key={step.id}>
                    <Typography
                        as="h2"
                        titleName={step.title}
                        icon={!isMobile && step.icon}
                    />
                    {step.type === 'repeater'
                        ? renderRepeaterStep(step, datos, catalogos)
                        : renderFormStep(step, datos, catalogos)}
                </React.Fragment>
            ))}

            {showPdfButton && summaryStep && (summaryStep.exportPdf || summaryStep.pdfTemplate) && (
                <div className="w-full mt-8 flex justify-end">
                    <SummaryPdfButton
                        step={summaryStep}
                        definicion={definicion}
                        datos={datos}
                        catalogos={catalogos}
                    />
                </div>
            )}
        </React.Fragment>
    );
};

export default SummaryStep;
