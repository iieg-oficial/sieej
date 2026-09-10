import React, { useEffect, useMemo } from 'react';
import { useFieldArray } from 'react-hook-form';
import Button from '@components/Button';
import PlusIcon from '@components/icons/PlusIcon';
import Tooltip from '@components/Tooltip';
import Typography from '@components/Typography';
import Tabs from '@forms/components/wizard/Tabs';
import useWizard from '@forms/context/useWizard';
import useGlobal from '@context/useGlobal';
import FieldRenderer from './FieldRenderer';
import { evaluarShowWhen } from './conditional';
import {
    buildRepeaterItems, CLAVE_ETIQUETA, renderItemLabel, resolverTabDeCampo,
} from './repeaterItems';
import { layoutSlots, spacerClass } from '@helpers/gridLayout';

const RepeaterStep = ({ step, methods, catalogos, onUpload, cambiosStep = [], marcarVisto }) => {
    const { append, remove } = useFieldArray({ control: methods.control, name: step.id });
    const { activeTab, visitedTabs, onActiveTab, onSizeTab } = useWizard();
    const { isMobile } = useGlobal();

    const minItems = step.minItems ?? 0;
    const maxItems = step.maxItems ?? null;
    const tabs = Array.isArray(step.tabs) ? step.tabs : null;
    const [activeSubTab, setActiveSubTab] = React.useState(tabs?.[0]?.id);

    const list = methods.watch(step.id);
    const count = Array.isArray(list) ? list.length : 0;

    const cambioPorField = useMemo(() => {
        const map = new Map();
        cambiosStep.forEach((c) => {
            if (c.field_name) map.set(c.field_name, c);
        });
        return map;
    }, [cambiosStep]);

    const tabsConCambios = useMemo(() => {
        const set = new Set();
        if (!tabs) return set;
        step.fields.forEach((field) => {
            if (!cambioPorField.has(field.name)) return;
            const tabId = resolverTabDeCampo(field, tabs);
            if (tabId) set.add(tabId);
        });
        return set;
    }, [tabs, step.fields, cambioPorField]);

    const [subTabsVistas, setSubTabsVistas] = React.useState(
        () => new Set(tabs?.[0]?.id ? [tabs[0].id] : []),
    );

    const verSubTab = (id) => {
        setActiveSubTab(id);
        setSubTabsVistas((v) => new Set(v).add(id));
    };

    useEffect(() => {
        onSizeTab?.(count);
    }, [count, onSizeTab]);

    useEffect(() => {
        if (count > 0 && (activeTab >= count || activeTab < 0)) {
            onActiveTab?.(0);
        }
    }, [count, activeTab, onActiveTab]);

    useEffect(() => {
        onActiveTab?.(0);
        setActiveSubTab(tabs?.[0]?.id);
        setSubTabsVistas(new Set(tabs?.[0]?.id ? [tabs[0].id] : []));
    }, [step.id, tabs, onActiveTab]);

    const etiquetaAgregar = step.itemLabel
        ? `Agregar ${renderItemLabel(step.itemLabel, count)}`
        : step.title
            ? `Agregar otro elemento a «${step.title}»`
            : 'Agregar otro elemento';

    const handleAdd = () => {
        append({});
        onActiveTab?.(count);
        setActiveSubTab(tabs?.[0]?.id);
    };

    const handleRemove = (index) => {
        remove(index);
        const newActive = Math.max(0, Math.min(activeTab, count - 2));
        onActiveTab?.(newActive);
    };

    if (count === 0) {
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

    const currentIndex = Math.max(0, Math.min(activeTab, count - 1));
    const itemValues = methods.watch(`${step.id}.${currentIndex}`) || {};
    const items = buildRepeaterItems(step, list || []);

    const visibleFields = step.fields.filter((field) => {
        if (!evaluarShowWhen(field.showWhen, itemValues)) return false;
        if (tabs && resolverTabDeCampo(field, tabs) !== activeSubTab) return false;
        return true;
    });

    return (
        <div className="space-y-4 pt-1">
            <div className="flex items-center gap-2 mb-0">
                <div className="flex-1 min-w-0">
                    <Tabs
                        show
                        items={items}
                        activeTab={currentIndex}
                        visitedTabs={visitedTabs}
                        onTabClick={onActiveTab}
                        onTabRemove={(_item, idx) => handleRemove(idx)}
                        onTabRename={(idx, nombre) => methods.setValue(
                            `${step.id}.${idx}.${CLAVE_ETIQUETA}`, nombre || null, { shouldDirty: true },
                        )}
                        isMobile={isMobile}
                    />
                </div>
                {(maxItems === null || count < maxItems) && (
                    <Tooltip text={etiquetaAgregar} showIcon={false} size="small">
                        <button
                            type="button"
                            onClick={handleAdd}
                            aria-label={etiquetaAgregar}
                            className="
                                flex items-center justify-center shrink-0 w-[38px] h-[38px] rounded-full p-0!
                                bg-[#F8F8F8] border-none! text-[#5C2472]
                                hover:bg-white hover:shadow-[0px_8px_16px_#6E6E6E29]
                            "
                        >
                            <PlusIcon size={24} className="shrink-0" />
                        </button>
                    </Tooltip>
                )}
            </div>

            {tabs && (
                <div className="flex gap-2 mb-0">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => verSubTab(tab.id)}
                            className={`px-4 py-2 text-sm border-b-2! transition ${
                                activeSubTab === tab.id
                                    ? 'border-b-[#5C2472]! text-[#5C2472] font-garetbold!'
                                    : 'border-b-transparent! text-[#7C7C7C] font-garetregular! hover:text-[#5C2472]'
                            }`}
                        >
                            <span className="relative inline-block">
                                {tab.title}
                                {tabsConCambios.has(tab.id) && !subTabsVistas.has(tab.id) && (
                                    <span
                                        aria-label="Tiene cambios sin revisar"
                                        className="absolute -top-0.5 -right-2 w-1.5 h-1.5 rounded-full bg-[#FF8300]"
                                    />
                                )}
                            </span>
                        </button>
                    ))}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                {layoutSlots(visibleFields).map((slot, i) => {
                    if (slot.kind === 'spacer') {
                        return <div key={`spacer-${i}`} aria-hidden className={spacerClass(slot.units)} />;
                    }
                    const field = visibleFields[slot.idx];
                    const fullName = `${step.id}.${currentIndex}.${field.name}`;
                    const cambio = cambioPorField.get(field.name);
                    return (
                        <FieldRenderer
                            key={fullName}
                            field={{ ...field, name: fullName }}
                            placement={slot}
                            methods={methods}
                            catalogos={catalogos}
                            onUpload={(_n, file) => onUpload?.(`${step.id}[${currentIndex}].${field.name}`, file)}
                            cambioField={cambio}
                            onInteract={marcarVisto ? () => marcarVisto(`${step.id}.${field.name}`) : undefined}
                        />
                    );
                })}
            </div>
        </div>
    );
};

export default RepeaterStep;
