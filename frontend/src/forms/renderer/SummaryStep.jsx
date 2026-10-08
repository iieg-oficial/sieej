import React from 'react';
import { useWatch } from 'react-hook-form';
import Text from '@components/Text';
import Typography from '@components/Typography';
import Divide from '@components/Divide';
import FieldGrid from '@helpers/FieldLayout';
import { formatFieldValue } from './fieldValue';
import SummaryPdfButton from './pdf/SummaryPdfButton';
import UpdateFieldsButton from '@forms/components/UpdateFieldsButton';
import BadgeAutoria from '@forms/components/BadgeAutoria';

const LARGO_RESPUESTA = 80;
const TIPOS_LARGOS = [ 'textarea', 'select_multiple' ];

const colSpanDeRespuesta = (field, texto) => (
    TIPOS_LARGOS.includes(field.type) || texto.length > LARGO_RESPUESTA ? 4 : 2
);

const renderCampos = (fields, valores, catalogos, autoria, prefijo) => fields
    .filter((f) => f.type !== 'info')
    .map((field) => {
        const texto = formatFieldValue(field, valores?.[field.name], catalogos);
        return (
            <Text
                key={field.name}
                label={field.label}
                text={texto}
                badge={<BadgeAutoria autoria={autoria?.[`${prefijo}.${field.name}`]} />}
                colSpan={colSpanDeRespuesta(field, texto)}
            />
        );
    });

const renderFormStep = (step, datos, catalogos, autoria) => (
    <div className="w-full my-6 md:ml-12">
        <FieldGrid col={4} align="start">
            {renderCampos(step.fields, datos[step.id] || {}, catalogos, autoria, step.id)}
        </FieldGrid>
    </div>
);

const renderRepeaterStep = (step, datos, catalogos, autoria) => {
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
                    <FieldGrid col={4} align="start">
                        {renderCampos(
                            step.fields, item || {}, catalogos, autoria, `${step.id}[${idx}]`,
                        )}
                    </FieldGrid>
                    {idx < items.length - 1 && <Divide />}
                </React.Fragment>
            ))}
        </div>
    );
};

const SummaryStep = ({
    definicion, methods, catalogos, summaryStep,
    showPdfButton = true, envioId, puedeActualizar = false, autoria,
}) => {
    const datos = useWatch({ control: methods.control }) || {};
    const realSteps = (definicion.steps || []).filter((s) => s.type !== 'summary');
    const isMobile = false;
    const mostrarPdf = !!(
        showPdfButton && envioId && summaryStep
        && (summaryStep.exportPdf || summaryStep.pdfTemplate)
    );
    const mostrarActualizar = !!(puedeActualizar && envioId);

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
                        ? renderRepeaterStep(step, datos, catalogos, autoria)
                        : renderFormStep(step, datos, catalogos, autoria)}
                </React.Fragment>
            ))}

            {(mostrarActualizar || mostrarPdf) && (
                <div className="w-full mt-8 flex justify-end gap-2">
                    {mostrarActualizar && <UpdateFieldsButton envioId={envioId} labeled />}
                    {mostrarPdf && (
                        <SummaryPdfButton
                            step={summaryStep}
                            envioId={envioId}
                        />
                    )}
                </div>
            )}
        </React.Fragment>
    );
};

export default SummaryStep;
