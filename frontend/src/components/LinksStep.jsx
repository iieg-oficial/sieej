import React, { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import useGlobal from '../context/useGlobal';
import useHome from '../context/useHome';
import addMore from '../assets/icons/ico_agregar_nuevo.svg'
import addHover from '../assets/icons/ico_agregar_hover.svg'
import NavigateStep from './NavigateStep';
import Typography from './Typography';
import Input from './Input';
import Button from './Button';
import Divide from './Divide';
import Loading from './Loading';
import Message from './Message';

const NAME_TABLE = 'informacion_enlaces';

const defaultLink = {
    nombres: '',
    apellido1: '',
    apellido2: '',
    direccion: '',
    puesto: '',
    email: '',
    telefono: '',
    extension: '',
    nombres_jefe: '',
    apellido1_jefe: '',
    apellido2_jefe: '',
    email_jefe: '',
    puesto_jefe: ''
};

const LinksInformation = () => {
    const methods = useForm({
        defaultValues: {
            [NAME_TABLE]: [{ ...defaultLink, es_tecnico: false }]
        }
    });

    const { trigger, reset, handleSubmit } = methods;
    const { regexEmail, regexTel, regexExt, closeModal, openModal, onNext, onMessage } = useGlobal();
    const { formData, onUpdateForm, onLink, onPutLink, onFetchLink, onDeleteLink, homeLoading } = useHome();

    const { fields: technicalFields, append: appendTechnical, remove: removeTachnical } = useFieldArray({
        keyName: '_id',
        control: methods.control,
        name: NAME_TABLE
    });

    const sortedTechnicalFields = [
        ...technicalFields.filter(item => !item.es_tecnico), 
        ...technicalFields.filter(item => item.es_tecnico),
    ];

    const getFieldName = (index, fieldName) => `${NAME_TABLE}.[${index}].${fieldName}`;

    const handleFormSubmission = async (data, isSave = false) => {
        try {
            const isValid = await trigger();

            if (!isValid) return;

            const technical = data?.[NAME_TABLE] || [];

            const results = await Promise.allSettled(
                technical.map(tecnico =>
                    tecnico?.id ? onPutLink(tecnico, tecnico?.id) : onLink(tecnico)
                )
            );

            if (results?.[0]?.value?.detail) throw new Error('Con campos de información de enlace.');

            const errors = results.filter(({ status }) => status === 'rejected');

            if (errors.length > 0) throw new Error('Al guardar información de enlace.');
            if (errors.length === 0 && results && results?.[0]?.value?.id) {
                const resultValues = results.filter(({ status }) => status === 'fulfilled').map(({ value }) => value);
                openModal(isSave ? 'info' : 'success');
                onUpdateForm(resultValues);
                const sortedTechnicalFields = [
                    ...resultValues.filter(item => !item.es_tecnico), 
                    ...resultValues.filter(item => item.es_tecnico),
                ];
                reset({ [NAME_TABLE]: sortedTechnicalFields });
                onUpdateForm({ [NAME_TABLE]: sortedTechnicalFields });
                if (!isSave) onNext();
            }
        } catch (error) {
            openModal('error', null, error.message || 'Problemas con la información de enlaces.');
            throw new Error(error.message || 'Problemas con la información de enlaces.');
        }
    };

    const onSubmit = (data) => handleFormSubmission(data);

    const onSave = (data) => handleFormSubmission(data, true);

    const onError = (errors) => {
        const isError = Object.values(errors).some((error) => 
            error.some((nestedError) => 
                Object.values(nestedError).some((error) => 
                    error.type === 'required'
                )
            )
        );
        if (isError) onMessage(isError);
    };

    const onRemove = async(technical, index) => {
        try {
            technical?.id && await onDeleteLink(technical?.id);
            const updatedLinks = formData[NAME_TABLE]?.filter((_, i) => i !== index) || [];
            onUpdateForm({ [NAME_TABLE]: updatedLinks });
            removeTachnical(index);
            closeModal();
        } catch (error) {
            openModal('error', null, error.message || 'Problemas con la información del técnico.');
            throw new Error(error.message || 'Problemas con remover técnico.');
        }
    };

    const handleDatabaseWarning = (technical, index) => {
        openModal(
            'warn', 
            'Eliminar técnico',
            '¿Está seguro de eliminar a este técnico?', 
            [{
                label: 'Eliminar',
                variant: 'danger',
                onClick: () =>  onRemove(technical, index)
            }, {
                label: 'Cancelar',
                variant: 'secondary',
                onClick: closeModal
            }]
        );
    }

    useEffect(() => {
        (async () => {
            try {
                const prevData = await onFetchLink();

                const sortedTechnicalFields = prevData?.length
                    ? [
                        ...prevData.filter(item => !item.es_tecnico),
                        ...prevData.filter(item => item.es_tecnico),
                    ] : [
                        { ...defaultLink, es_tecnico: false },
                        { ...defaultLink, es_tecnico: true },
                    ];

                reset({ [NAME_TABLE]: sortedTechnicalFields });
                onUpdateForm({ [NAME_TABLE]: sortedTechnicalFields });
            } catch (error) {
                console.error('Error fetching links: ', error);
            }
        })();
        onMessage(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    if (homeLoading) return <Loading />;
    
    return (
        <form id={NAME_TABLE} className='w-full'>
            <NavigateStep onSubmit={handleSubmit(onSubmit, onError)} onSave={handleSubmit(onSave)}/>
            <Message type='error' message="Por favor completa los campos requeridos"/>
            <Typography as="h5" titleName="* Campos obligatorios" className='md:ml-12' style={{color: '#465055'}}/>
            {sortedTechnicalFields.map((item, index) => (
                <div key={item._id} className="flex flex-col md:grid md:grid-cols-4 md:gap-4 md:my-4 md:ml-12">
                    { index === 0 && 
                        <Typography 
                            as="p" 
                            titleName="Enlace Institucional" 
                            colSpan={4} 
                            style={{color: '#5C2472'}} 
                            tooltip="La persona designada podrá tomar decisiones ejecutivas sobre los proyectos estratégicos y los datos de la dependencia o tener acceso a autorización de decisiones ejecutivas por quien corresponda de manera expedita."
                            tooltipModal
                        /> 
                    }
                    { index > 0 && 
                        <Typography 
                            as="p" 
                            titleName="Enlace Técnico" 
                            colSpan={4} 
                            style={{color: '#5C2472'}} 
                            tooltip="La persona designada cuenta con habilidades avanzadas en gestión y visualización de datos (ejemplo: CSV, Excel Tableau), así como conocimientos básicos de programación y capacidad de adaptación a entornos tecnológicos. De manera ideal, se valorará que cuente con conocimientos en lenguajes de programación (Python, R), experiencia en el manejo de bases de datos relacionales y no relacionales (PostgreSQL, MongoDB), y habilidades para el desarrollo e integración mediante API-REST."
                            tooltipModal
                        /> 
                    }
                    <Input name={getFieldName(index, 'nombres')} label="Nombre (s)" colSpan={2} methods={methods} required />
                    <Input name={getFieldName(index, 'apellido1')} label="Primer Apellido" methods={methods} required />
                    <Input name={getFieldName(index, 'apellido2')} label="Segundo Apellido" methods={methods} required />
                    <Input name={getFieldName(index, 'direccion')} label="Dirección o Área adscrita" colSpan={2} methods={methods} required />
                    <Input name={getFieldName(index, 'puesto')} label="Puesto" colSpan={2} methods={methods} required />
                    <Input type="email" name={getFieldName(index, 'email')} label="Correo electrónico"  pattern={regexEmail} colSpan={2} methods={methods} normalize="lowercase" required />
                    <Input type="tel" name={getFieldName(index, 'telefono')} label="Teléfono" pattern={regexTel} maxLength={10} normalize="number" methods={methods} required />
                    <Input type="tel" name={getFieldName(index, 'extension')} label="Extensión" pattern={regexExt} maxLength={5} normalize="number" methods={methods} />
                    <Typography as="h3" titleName="Jefe directo" className='text-[#191919]' colSpan={4}/>
                    <Input name={getFieldName(index, 'nombres_jefe')} label="Nombre (s)" colSpan={2} methods={methods} required />
                    <Input name={getFieldName(index, 'apellido1_jefe')} label="Primer Apellido" methods={methods} required />
                    <Input name={getFieldName(index, 'apellido2_jefe')} label="Segundo Apellido" methods={methods} required />
                    <Input type="email" name={getFieldName(index, 'email_jefe')} label="Correo electrónico" pattern={regexEmail} colSpan={2} methods={methods} normalize="lowercase" required />
                    <Input name={getFieldName(index, 'puesto_jefe')} label="Puesto" colSpan={2} methods={methods} required />
                    {index > 0 && sortedTechnicalFields.length > 2 && (
                        <Button type="button" label="Eliminar enlace técnico" variant="delete" icon={null} onClick={() => handleDatabaseWarning(item, index)} />
                    )}
                    <Divide />
                </div>
            ))}
            <div className='justify-items-end'>
                {technicalFields.length < 4 && (
                    <Button type="button" label="Agregar enlace técnico" variant="inline" icon={addMore} onHoverIcon={addHover} onClick={() => appendTechnical({ ...defaultLink, es_tecnico: true })} />
                )}
            </div>
        </form>
    );
};

export default LinksInformation;