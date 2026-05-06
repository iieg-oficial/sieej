import React, { useState } from 'react';
import { useFieldArray } from 'react-hook-form';
import Button from '@components/Button';
import Typography from '@components/Typography';
import FieldRenderer from './FieldRenderer';
import { evaluarShowWhen } from './conditional';

const renderItemLabel = (template, index) => {
    if (!template) return `Item ${index + 1}`;
    return template.replace('{{index}}', String(index + 1));
};

const RepeaterStep = ({ step, methods, catalogos, onUpload }) => {
    const { fields, append, remove } = useFieldArray({ control: methods.control, name: step.id });
    const [activeTabByItem, setActiveTabByItem] = useState({});

    const minItems = step.minItems ?? 0;
    const maxItems = step.maxItems ?? null;
    const tabs = Array.isArray(step.tabs) ? step.tabs : null;

    return (
        <div className="space-y-6">
            {fields.map((item, index) => {
                const itemValues = methods.watch(`${step.id}.${index}`) || {};
                const activeTab = activeTabByItem[index] ?? tabs?.[0]?.id;

                const visibleFields = step.fields.filter((field) => {
                    if (!evaluarShowWhen(field.showWhen, itemValues)) return false;
                    if (tabs && field.tab && field.tab !== activeTab) return false;
                    return true;
                });

                return (
                    <div key={item.id} className="rounded border border-neutral-200 p-4 space-y-4">
                        <div className="flex items-center justify-between">
                            <Typography variant="body">{renderItemLabel(step.itemLabel, index)}</Typography>
                            {fields.length > minItems && (
                                <Button type="button" variant="link" onClick={() => remove(index)}>
                                    Quitar
                                </Button>
                            )}
                        </div>

                        {tabs && (
                            <div className="flex gap-2 border-b">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => setActiveTabByItem((p) => ({ ...p, [index]: tab.id }))}
                                        className={`px-3 py-2 text-sm ${
                                            activeTab === tab.id
                                                ? 'border-b-2 border-primary font-medium'
                                                : 'text-neutral-500'
                                        }`}
                                    >
                                        {tab.title}
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {visibleFields.map((field) => {
                                const fullName = `${step.id}.${index}.${field.name}`;
                                return (
                                    <FieldRenderer
                                        key={fullName}
                                        field={{ ...field, name: fullName }}
                                        methods={methods}
                                        catalogos={catalogos}
                                        onUpload={(_n, file) => onUpload?.(`${step.id}[${index}].${field.name}`, file)}
                                    />
                                );
                            })}
                        </div>
                    </div>
                );
            })}

            {(maxItems === null || fields.length < maxItems) && (
                <Button type="button" variant="secondary" onClick={() => append({})}>
                    Agregar
                </Button>
            )}
        </div>
    );
};

export default RepeaterStep;
