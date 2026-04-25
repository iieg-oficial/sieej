import React, { useEffect } from 'react';
import useGlobal from '../context/useGlobal';
import useHome from '../context/useHome';
import addMore from '../assets/icons/ico_agregar_nuevo.svg'
import addHover from '../assets/icons/ico_agregar_hover.svg'
import removeIcon from '../assets/icons/ico_borrar.svg'
import removeHoverIcon from '../assets/icons/ico_borrar_hover.svg'
import NavigateStep from './NavigateStep';
import Input from './Input';
import Button from './Button';
import Divide from './Divide';
import defaultDatabase from '../helpers/initDatabase';
import Typography from './Typography';
import Loading from './Loading';
import Message from './Message';

const ListDatabase = () => {
    const { resetVisitedTabs, onActiveTab, openModal, closeModal, onNext, onMessage } = useGlobal();
    const { 
        onUpdateForm, onDatabase, onPutDatabase, onFetchDatabase, 
        homeLoading, methodsDatabase: methods, fieldsDatabase: fields, 
        nameTableDatabase: NAME_TABLE, onRemoveDatabase: onRemove, appendDatabase: append
    } = useHome();

    const { trigger, reset, handleSubmit } = methods;

    const handleFormSubmission = async (data, isSave = false) => {
        try {
            const isValid = await trigger();

            if (!isValid) return;

            const databases = data?.[NAME_TABLE] || [];

            const results = await Promise.allSettled(
                databases.map(db => db?.id ? onPutDatabase(db, db?.id) : onDatabase(db))
            );

            if (results?.[0]?.value?.detail) throw new Error('Con campos de información de la base de datos.');

            const errors = results.filter(({ status }) => status === 'rejected');

            if (errors.length > 0) throw new Error('Al guardar información de la base de datos.');
            if (errors.length === 0 && results && results?.[0]?.value?.id) {
                const resultValues = results.filter(({ status }) => status === 'fulfilled').map(({ value }) => value);
                openModal(isSave ? 'info' : 'success');
                reset({ [NAME_TABLE]: resultValues })
                onUpdateForm({ [NAME_TABLE]: resultValues });
                if (!isSave) onNext();
            }
        } catch (error) {
            openModal('error', null, error.message || 'Problemas con la información de base de datos.');
            throw new Error(error.message || 'Problemas con la información de base de datos.');
        }
    };
    
    const onSubmit = (data) => handleFormSubmission(data);

    const onSave = (data) => handleFormSubmission(data, true);

    const onError = (errors) => {
        const isError = Object.values(errors).some((error) => error.length > 0);
        if (isError) onMessage(isError);
    };

    const handleDatabaseWarning = (item, index) => {
        openModal(
            'warn', 
            'Eliminar base de datos',
            '¿Está seguro de eliminar esta base de datos?', 
            [{
                label: 'Eliminar',
                variant: 'danger',
                onClick: () =>  onRemove(item, index)
            }, {
                label: 'Cancelar',
                variant: 'secondary',
                onClick: closeModal
            }]
        );
    }

    useEffect(() => {
        onFetchDatabase().then((prevData) => {
            if ( prevData && Array.isArray(prevData) && prevData.length > 0 ) {
                reset({ [NAME_TABLE]: prevData })
                onUpdateForm({ [NAME_TABLE]: prevData });
            } else {
                reset({ [NAME_TABLE]: [defaultDatabase] })
            }
        });
        resetVisitedTabs();
        onActiveTab(0);
        onMessage(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (homeLoading) return <Loading />

    return (
        <form id={NAME_TABLE} className="w-full">
            <NavigateStep onSubmit={handleSubmit(onSubmit, onError)} onSave={handleSubmit(onSave)} />
            <Message type='error' message="Por favor completa los campos requeridos"/>
            <Typography as="h5" titleName="* Campos obligatorios" className="mb-2 md:ml-12" style={{ color: '#465055' }} />
            <Typography
                as="h3"
                titleName="Agrega la cantidad de bases de datos estratégicas con las que trabajen en tu ente de gobierno."
                tooltip="Las bases de datos estratégicas son aquellas que contienen información clave para la toma de decisiones públicas y el funcionamiento institucional."
                className="md:ml-12 font-garetregular"
                style={{ color: '#191919' }}
            />
            {fields.map((item, index) => (
                <div key={item._id}>
                    <div className="relative h-full">
                        <div
                            className={`
                                absolute top-4 flex items-center justify-center w-6 h-6 p-1 rounded-full 
                                text-sm font-garetbold bg-[#F0E2F5] text-[#5C2472] mr-6
                            `}
                        >
                            {index + 1}
                        </div>
                    </div>
                    <div className="flex items-center">
                        <div className="w-full ml-12 flex flex-col md:grid md:grid-cols-4 md:gap-4">
                            <Input
                                name={`${NAME_TABLE}[${index}].nombre_bd`}
                                label="Nombre de la base de datos estratégica"
                                placeholder="Nombre de la base de datos estratégica"
                                colSpan={2}
                                methods={methods}
                                required
                            />
                            <Input
                                name={`${NAME_TABLE}[${index}].descripcion_bd`}
                                label="Descripción breve de la base de datos"
                                placeholder="Descripción breve de la base de datos"
                                colSpan={2}
                                methods={methods}
                                required
                            />
                        </div>
                        {fields.length > 1 && (
                            <Button
                                type="button"
                                iconButton={removeIcon}
                                onHoverIcon={removeHoverIcon}
                                tooltip="Eliminar"
                                variant="link"
                                className="ml-5"
                                iconButtonStyle="w-9 h-9"
                                icon={null}
                                onClick={() => handleDatabaseWarning(item, index)}
                            />
                        )}
                    </div>
                    <Divide />
                </div>
            ))}
            <div className="justify-items-end">
                <Button
                    type="button"
                    label="Añadir base de datos"
                    variant="inline"
                    icon={addMore}
                    onHoverIcon={addHover}
                    onClick={() => append(defaultDatabase)}
                />
            </div>
        </form>
    );
};

export default ListDatabase;