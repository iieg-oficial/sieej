import React, { useEffect } from 'react';
import { useGlobal } from "../context/GlobalContext";
import { useHome } from '../context/HomeContext';
import icoX from '../assets/icons/ico_delete_predeterminada.svg';
import Button from "./Button";
import Loading from './Loading';

const Tabs = ({ show, vertical, onSave, className, customTabs }) => {
    const { 
        onTabs, activeTab, openModal, closeModal, visitedTabs, 
        onSizeTab, screenSize
    } = useGlobal();
    const { 
        fieldsDatabase: fields, onRemoveDatabase: onRemove, homeLoading
    } = useHome();

    const { sm } = screenSize;

    const onClickTabs = async (index) => {
        if (index === activeTab) return;
        onSave && await onSave(true);
        onTabs(index);
    };

    const handleDatabaseWarning = (item, index) => {
        if (vertical && (activeTab === index)) {
            openModal(
                'warn', 
                'Eliminar base de datos',
                '¿Está seguro de eliminar esta base de datos?', 
                [{
                    label: 'Eliminar',
                    variant: 'danger',
                    onClick: () => onRemove(item, index, true)
                        
                }, {
                    label: 'Cancelar',
                    variant: 'secondary',
                    onClick: closeModal
                }]
            );
        }
    }

    useEffect(() => {
        if (fields && Array.isArray(fields) && fields.length > 0) {
            onSizeTab(fields.length);
        }
    }, [fields, onSizeTab])

    if (!show) return <React.Fragment></React.Fragment>;
    if (homeLoading) return <Loading />;

    return (
        <div className={`flex felx-wrap bg-white ${className} ${vertical ? 'flex-col items-start' : 'w-full items-center'}`}>
            {(customTabs ? customTabs : fields).map((item, index) => (
                <Button
                    key={item._id || item.id}
                    variant="label"
                    label={sm ? index + 1 : `${index + 1}.  ${item.nombre_bd}`}
                    sufIcon={vertical && (activeTab === index) ? icoX : null}
                    sufIconButton={vertical && (activeTab === index) ? true : false}
                    onSufClick={() => handleDatabaseWarning(item, index)}
                    isActive={activeTab === index}
                    isVisited={visitedTabs?.has(index)} 
                    onClick={() => onClickTabs(index)}
                    className={`line-clamp-1 ${vertical ? 'mb-0' : 'mr-4'}`}
                />
            ))}
        </div>
    );
};

export default Tabs