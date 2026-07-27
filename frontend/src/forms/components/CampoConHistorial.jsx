import React, { useState } from 'react';
import FieldRenderer from '@forms/renderer/FieldRenderer';
import HistorialCampos from '@forms/components/HistorialCampos';
import HistoryIcon from '@components/icons/HistoryIcon';
import Tooltip from '@components/Tooltip';

const CampoConHistorial = ({ field, fullName, methods, catalogos, onUpload, historial = [] }) => {
    const [abierto, setAbierto] = useState(false);

    return (
        <div>
            <div className="flex items-start gap-2">
                <div className="w-6 shrink-0 pt-7">
                    {historial.length > 0 && (
                        <Tooltip text="Ver historial de este campo" showIcon={false} size="small">
                            <button
                                type="button"
                                onClick={() => setAbierto((v) => !v)}
                                aria-label="Ver historial de este campo"
                                aria-expanded={abierto}
                                className={[
                                    'inline-flex items-center justify-center w-7 h-7 rounded-full',
                                    'transition cursor-pointer bg-transparent border-0! p-0!',
                                    'text-[#FF8300] hover:bg-[#FEDAB2]!',
                                    abierto ? 'bg-[#FEDAB2]!' : '',
                                ].join(' ')}
                            >
                                <HistoryIcon />
                            </button>
                        </Tooltip>
                    )}
                </div>
                <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-6">
                    <FieldRenderer
                        field={{ ...field, name: fullName, layout: { colSpan: 1 } }}
                        methods={methods}
                        catalogos={catalogos}
                        onUpload={onUpload}
                    />
                </div>
            </div>
            {abierto && (
                <div className="ml-9 mt-1.5">
                    <HistorialCampos items={historial} field={field} catalogos={catalogos} />
                </div>
            )}
        </div>
    );
};

export default CampoConHistorial;
