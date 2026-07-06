import React, { useEffect } from 'react';
import { useFieldArray } from 'react-hook-form';
import Button from '@components/Button';
import Typography from '@components/Typography';
import Tabs from '@forms/components/wizard/Tabs';
import useWizard from '@forms/context/useWizard';
import useGlobal from '@context/useGlobal';
import FieldRenderer from './FieldRenderer';
import { evaluarShowWhen } from './conditional';
import { buildRepeaterItems, renderItemLabel } from './repeaterItems';

const RepeaterStep = ({ step, methods, catalogos, onUpload }) => {
    const { fields, append, remove } = useFieldArray({ control: methods.control, name: step.id });
    const { activeTab, visitedTabs, onActiveTab, onSizeTab } = useWizard();
    const { isMobile } = useGlobal();

    const minItems = step.minItems ?? 0;
    const maxItems = step.maxItems ?? null;
    const tabs = Array.isArray(step.tabs) ? step.tabs : null;
    const [activeSubTab, setActiveSubTab] = React.useState(tabs?.[0]?.id);

    useEffect(() => {
        onSizeTab?.(fields.length);
    }, [fields.length, onSizeTab]);

    useEffect(() => {
        if (fields.length > 0 && (activeTab >= fields.length || activeTab < 0)) {
            onActiveTab?.(0);
        }
    }, [fields.length, activeTab, onActiveTab]);

    const handleAdd = () => {
        append({});
        onActiveTab?.(fields.length);
    };

    const handleRemove = (index) => {
        remove(index);
        const newActive = Math.max(0, Math.min(activeTab, fields.length - 2));
        onActiveTab?.(newActive);
    };

    if (fields.length === 0) {
        const minMsg = minItems > 0
            ? ` Para poder enviar el formulario se requiere al menos ${minItems}.`
            : '';
        return (
            <div className="max-w-xl mx-auto text-center space-y-4 py-10">
                <Typography as="h2" titleName="Aún no hay elementos en esta sección" />
                <Typography as="p" titleName={`Esta sección se captura por elementos y puedes agregar los que necesites.${minMsg}`} />
                <div className="flex justify-center pt-2">
                    <Button
                        label="Agregar el primero"
                        variant="primary"
                        onClick={handleAdd}
                    />
                </div>
            </div>
        );
    }

    const currentIndex = Math.max(0, Math.min(activeTab, fields.length - 1));
    const itemValues = methods.watch(`${step.id}.${currentIndex}`) || {};
    const items = buildRepeaterItems(step, methods.watch(step.id) || []);

    const visibleFields = step.fields.filter((field) => {
        if (!evaluarShowWhen(field.showWhen, itemValues)) return false;
        if (tabs && field.tab && field.tab !== activeSubTab) return false;
        return true;
    });

    return (
        <div className="space-y-6">
            <Tabs
                show
                items={items}
                activeTab={currentIndex}
                visitedTabs={visitedTabs}
                onTabClick={onActiveTab}
                isMobile={isMobile}
                className="border-b border-neutral-200 pb-2"
            />

            <div className="flex items-center justify-between">
                <Typography
                    as="h3"
                    titleName={renderItemLabel(step.itemLabel, currentIndex)}
                />
                <div className="flex space-x-2">
                    {(maxItems === null || fields.length < maxItems) && (
                        <Button
                            label="Agregar"
                            variant="secondary"
                            onClick={handleAdd}
                            center
                        />
                    )}
                    <Button
                        label="Eliminar"
                        variant="link"
                        onClick={() => handleRemove(currentIndex)}
                        center
                    />
                </div>
            </div>

            {tabs && (
                <div className="flex gap-2 border-b border-neutral-200">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveSubTab(tab.id)}
                            className={`px-4 py-2 text-sm transition ${
                                activeSubTab === tab.id
                                    ? 'border-b-2 border-[#5C2473] text-[#5C2473] font-garetbold'
                                    : 'text-neutral-500 hover:text-neutral-700'
                            }`}
                        >
                            {tab.title}
                        </button>
                    ))}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {visibleFields.map((field) => {
                    const fullName = `${step.id}.${currentIndex}.${field.name}`;
                    return (
                        <FieldRenderer
                            key={fullName}
                            field={{ ...field, name: fullName }}
                            methods={methods}
                            catalogos={catalogos}
                            onUpload={(_n, file) => onUpload?.(`${step.id}[${currentIndex}].${field.name}`, file)}
                        />
                    );
                })}
            </div>
        </div>
    );
};

export default RepeaterStep;
