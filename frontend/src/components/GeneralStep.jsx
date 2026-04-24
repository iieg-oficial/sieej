import React, { useEffect } from 'react';
import { useForm } from "react-hook-form";
import { useGlobal } from '../context/GlobalContext';
import { useCatalog } from '../context/CatalogContext';
import { useHome } from '../context/HomeContext';
import NavigateStep from './NavigateStep';
import Input from './Input';
import Select from './Select';
import Radio from './Radio';
import Typography from './Typography';
import Loading from './Loading';
import Message from './Message';

const NAME_TABLE="informacion_general";

const GeneralInformation = () => {
    const methods = useForm({ mode: "onBlur" });
    const { trigger, reset, handleSubmit, watch } = methods;
    const { openModal, onNext, onMessage } = useGlobal();
    const { formData, onUpdateForm, onGeneral, onFetchGeneral, onPutGeneral, homeLoading } = useHome();
    const { yesOrNot, unidadesAdministrativas } = useCatalog();

    const responsable = 'hay_responsable';
    const isResponsable = watch(responsable) === "true";

    const handleFormSubmission = async (data, isSave = false) => {
        try {
            const isValid = await trigger();
            if (!isValid) return;

            const id = formData?.[NAME_TABLE]?.id;
            const result = id ? await onPutGeneral(data, id) : await onGeneral(data);

            if (result?.detail) {
                throw new Error("Con campos de información general.");
            }

            if (result?.id) {
                openModal(isSave ? 'info' : 'success');
                onUpdateForm({ [NAME_TABLE]: data });
                if (!isSave) onNext();
            }
        } catch (error) {
            openModal('error', null, error.message || "Problemas con la información general.");
            throw new Error(error.message || "Problemas con la información general.");
        }
    };

    const onSubmit = (data) => handleFormSubmission(data);

    const onSave = (data) => handleFormSubmission(data, true);

    const onError = (errors) => {
        const isError = Object.values(errors).some((error) => error.type === "required");
        if (isError) onMessage(isError);
    };

    useEffect(() => {
        onFetchGeneral().then((prevData) => {
            reset(prevData);
            onUpdateForm({ [NAME_TABLE]: prevData });
        })
        onMessage(false);
    }, [  ]);

    if (homeLoading) return <Loading />;

    return (
        <form id={NAME_TABLE} className='w-full'>
            <NavigateStep onSubmit={handleSubmit(onSubmit, onError)} onSave={handleSubmit(onSave)}/>
            <Message type='error' message="Por favor completa los campos requeridos"/>
            <div className="md:ml-12">
                <Typography as="h5" titleName="* Campos obligatorios" className="mb-2" style={{color: "#465055"}}/>
                <Input 
                    name="nombre_ente_gobierno"
                    label="Nombre del ente de gobierno"
                    placeholder="Escribe un ente de Gobierno"
                    methods={methods}
                    required
                />
                <Select 
                    name="unidad_admin"
                    label="Unidad Administrativa"
                    options={unidadesAdministrativas}
                    placeholder="Selecciona una opción"
                    methods={methods}
                    enableSearch
                    required
                />
                <Radio
                    name={responsable}
                    label="¿Dentro de tu dependencia cuentan con un área responsable en manejo y generación de los datos?"
                    description="Ejemplo: Dirección de Ciencia de Datos, Dirección de estadísticas, Dirección y gestión de sistemas, etc."
                    options={yesOrNot}
                    methods={methods}
                    required
                />
                <Input
                    name={`descripcion_hay_responsable`}
                    label="¿Cuál es el área responsable de la información?"
                    placeholder="¿Cuál es el área responsable de la información?"
                    methods={methods}
                    colSpan={isResponsable ? 2 : 0}
                    required={isResponsable}
                    clean={!isResponsable}
                />
                <Typography as="h3" titleName="Desafíos y oportunidades" className="mt-5"/>
                <Input
                    name="desafios_oportunidades"
                    label="¿Cuáles son los principales retos que enfrenta tu organización o dependencia en la gestión de datos?"
                    tooltip="Ejemplo: infraestructura insuficiente, falta de personal capacitado, políticas inconsistentes, entre otros desafíos relacionados con la gestión de datos."
                    methods={methods}
                />
            </div>
        </form>
    )
}

export default GeneralInformation;