import React, { useEffect, useCallback } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { useHome } from '../context/HomeContext';
import { useCatalog } from '../context/CatalogContext';
import { FieldGrid } from '../helpers/FieldLayout';
import { TextTooltipCategoryData } from '../helpers/textLarge';
import NavigateStep from './NavigateStep';
import Tabs from './Tabs';
import Typography from './Typography';
import Select from './Select';
import SelectMultiple from './SelectMultiple';
import Radio from './Radio';
import Input from './Input';
import Dragger from './Dragger';
import Loading from './Loading';
import Text from './Text';
import Message from './Message';

const DatabaseInformation = () => {
    const { 
        activeTab, openModal, closeModal, isLastTab, currentStep, 
        onTabs, onNext, onStep, onMessage
    } = useGlobal();
    const { 
        onUpdateForm, onPutDatabase, onFetchDatabase, nameTableDatabase: NAME_TABLE,
        methodsDatabase: methods, fieldsDatabase: fields, formData, homeLoading
    } = useHome();
    const { 
        informationCategories, periodicity, managementSystem, yesOrNot, verificationMethods,
        generationSources, usesInformation
    } = useCatalog();
    const { trigger, handleSubmit, reset, watch, getValues } = methods;

    const getFieldName = useCallback((index, fieldName) => `${NAME_TABLE}.[${index}].${fieldName}`, [NAME_TABLE]);

    const isLimpiezaVisible = watch(getFieldName(activeTab, 'limpieza_validacion')) === 'true';
    const isPeriodicidadVisible = watch(getFieldName(activeTab, 'periodicidad')) === 'Otro';
    const isFileVisible = watch(getFieldName(activeTab, 'tiene_diccionario')) === 'true';
    const isHistoricosVisible = watch(getFieldName(activeTab, 'historicos')) === 'true';
    const isMigracionVisible = watch(getFieldName(activeTab, 'migracion_actualizacion')) === 'true';
    const isMedidasVisible = watch(getFieldName(activeTab, 'medidas_seguridad')) === 'true';
    const isNormativasVisible = watch(getFieldName(activeTab, 'normativas_proteccion')) === 'true';
    const isContingenciaVisible = watch(getFieldName(activeTab, 'plan_contingencia')) === 'true';
    const isInteroperatividadVisible = watch(getFieldName(activeTab, 'interoperatividad')) === 'true';
    const isDifusionVisible = watch(getFieldName(activeTab, 'plataforma_difusion')) === 'true';

    const handleFormSubmission = async (data, isSave = false, modaless = false) => {
        const updateItem = data[NAME_TABLE]?.[activeTab];
        try {
            const isValid = await trigger();
            if (!isValid) return ;
            if (!updateItem) throw new Error('No se encontro la base de datos.');
            closeModal();
            const result = await onPutDatabase(updateItem, updateItem?.id);
            if (result?.detail) throw new Error('Con campos en información de la base de datos.');
            if (result && data) {
                onUpdateForm({
                    [NAME_TABLE]: [
                        ...formData[NAME_TABLE].slice(0, activeTab),
                        result,
                        ...formData[NAME_TABLE].slice(activeTab + 1)
                    ]
                });    
                reset((prevState) => ({
                    [NAME_TABLE]: [
                        ...prevState[NAME_TABLE].slice(0, activeTab),
                        result,
                        ...prevState[NAME_TABLE].slice(activeTab + 1)
                    ]
                }));    
            };
            if (isSave) return !modaless && openModal('info');
            if (!isLastTab && result && result?.id) onTabs();
            if (isLastTab && result && result?.id) {
                openModal(
                    'infoSuccess', 
                    'Sección bases de datos completada', 
                    '¿Qué deseas hacer?', 
                    [{
                        label: 'Agregar base de datos',
                        variant: 'inline',
                        onClick: () => {
                            closeModal();
                            onStep(2);
                        }
                    }, {
                        label: 'Finalizar el formulario',
                        variant: 'primary',
                        onClick: () => {
                            closeModal();
                            onNext();
                        }
                    }]
                );
            }
        } catch (error) {
            openModal('error', null, error.message || error, [{
                label: 'Cerrar',
                variant: 'secondary',
                onClick: closeModal
            }]);
        }
    };

    const onSubmit = (data) => handleFormSubmission(data);

    const onSave = (data, modaless) => handleFormSubmission(data, true, modaless);

    const onError = (errors) => {
        const isError = Object.values(errors).some((error) => error.length > 0);
        if (isError) onMessage(isError);
    };

    useEffect(() => {
        const currentData = formData[NAME_TABLE]?.[activeTab]?.id;
        if (currentData) {
            onFetchDatabase(currentData).then((prevData) => {
                reset((prevState) => ({
                    [NAME_TABLE]: [
                        ...prevState[NAME_TABLE].slice(0, activeTab),
                        prevData,
                        ...prevState[NAME_TABLE].slice(activeTab + 1)
                    ]
                })); 
                onUpdateForm({
                    [NAME_TABLE]: [
                        ...formData[NAME_TABLE].slice(0, activeTab),
                        prevData,
                        ...formData[NAME_TABLE].slice(activeTab + 1)
                    ]
                });
            });
        }
        onMessage(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    
    return (
        <React.Fragment>
            <NavigateStep onSubmit={handleSubmit(onSubmit, onError)} onSave={handleSubmit(onSave)}/>
            <Tabs show={currentStep === 3} onSave={handleSubmit(onSave)} className="sticky pt-2 top-[217px] md:pl-12 md:top-[174px] lg:top-[142px] xl:top-[174px] 2xl:top-27 z-11"/>
            <Message type='error' message="Por favor completa los campos requeridos" className='sticky top-10 w-full z-12'/>
            <form id={NAME_TABLE} className='w-full h-full'>
                {fields.map((item, index) => (
                    activeTab === index && (
                        homeLoading ? <Loading key={item._id}/> : (
                            <div key={item._id} className="md:ml-12">
                                <FieldGrid>
                                    <Text
                                        label="Nombre de la base de datos estratégica"
                                        text={getValues(getFieldName(index, `nombre_bd`))}
                                        colSpan={2}
                                        methods={methods}
                                    />
                                    <Text
                                        label="Descripción breve de la base de datos"
                                        text={getValues(getFieldName(index, `descripcion_bd`))}
                                        colSpan={2}
                                        methods={methods}
                                    />
                                </FieldGrid>

                                <FieldGrid col={3} align="end">
                                    <Select
                                        name={getFieldName(index, `categoria_datos`)}
                                        label="Categoría de los datos"
                                        tooltip={TextTooltipCategoryData}
                                        tooltipModal
                                        options={informationCategories}
                                        colSpan={'1/3'}
                                        methods={methods}
                                    />
                                    <Select
                                        name={getFieldName(index, `herramientas_gestion`)}
                                        label="Herramienta utilizada para la gestión"
                                        options={managementSystem}
                                        colSpan={'1/3'}
                                        methods={methods}
                                    />
                                    <Select
                                        name={getFieldName(index, `calidad_datos`)}
                                        label="¿Cómo se asegura la calidad de los datos?"
                                        tooltip="La calidad de los datos mide qué tan bien un conjunto de datos cumple con criterios como precisión, integridad y consistencia, siendo esencial para la toma de decisiones."
                                        tooltipModal
                                        options={verificationMethods}
                                        colSpan={'1/3'}
                                        methods={methods}
                                    />
                                </FieldGrid>

                                <FieldGrid align="end">
                                    <Radio
                                        name={getFieldName(index, `limpieza_validacion`)}
                                        label="¿Existen procesos de limpieza y validación de esta base de datos?"
                                        options={yesOrNot}
                                        colSpan={isLimpiezaVisible ? 2 : 4}
                                        methods={methods}
                                    />
                                    <Input
                                        name={getFieldName(index, `desc_limpieza_validacion`)}
                                        label="Describe el proceso"
                                        placeholder="Describe el proceso"
                                        methods={methods}
                                        colSpan={isLimpiezaVisible ? 2 : 0}
                                        required={isLimpiezaVisible}
                                        clean={!isLimpiezaVisible}
                                    />
                                    <Select
                                        name={getFieldName(index, `proveedores_bd`)} 
                                        label="¿De dónde provienen las bases de datos que utilizan?"
                                        options={generationSources}
                                        colSpan={4}
                                        methods={methods}
                                    />
                                    {/* Se retiro temporalmente hasta revisión */}
                                    {/* <SelectMultiple
                                        name={getFieldName(index, `ejes_estrategicos`)}
                                        label="Selecciona el o los ejes estratégicos de esta base de datos"
                                        options={jaliscoAreas}
                                        colSpan={2}
                                        methods={methods}
                                    /> */}
                                    <Radio
                                        name={getFieldName(index, `periodicidad`)} 
                                        label="Frecuencia de actualización"
                                        methods={methods}
                                        colSpan={4}
                                        options={periodicity}
                                    />
                                    <Input
                                        name={getFieldName(index, `desc_periodicidad`)}
                                        label="Frecuencia de actualización"
                                        placeholder="Frecuencia de actualización"
                                        methods={methods}
                                        colSpan={isPeriodicidadVisible ? 4 : 0}
                                        required={isPeriodicidadVisible}
                                        clean={!isPeriodicidadVisible}
                                    />
                                    <Radio
                                        name={getFieldName(index, `tiene_diccionario`)} 
                                        label="¿La base de datos cuenta con diccionario?"
                                        labelInput="Sube el archivo de tu diccionario de datos"
                                        methods={methods}
                                        colSpan={4}
                                        options={yesOrNot}
                                    />
                                    <Dragger
                                        idItem={item.id}
                                        name={getFieldName(index, `ruta_diccionario`)}
                                        methods={methods}
                                        colSpan={isFileVisible ? 4 : 0}
                                        required={isFileVisible}
                                        clean={!isFileVisible}
                                        accept='application/pdf,.csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel'
                                        maxSizeMB={100}
                                    />
                                </FieldGrid>

                                <FieldGrid col={3} align="end">
                                    <Typography as="h3" titleName="Uso y aplicación de datos" className="mt-5" colSpan={4}/>
                                    <Select
                                        name={getFieldName(index, `objetivo_uso`)}
                                        label="Objetivos del uso de la base de datos"
                                        options={usesInformation}
                                        colSpan={1}
                                        methods={methods}
                                    />
                                    <Select
                                        name={getFieldName(index, `usuarios_datos`)}
                                        label="Usuarios de los datos"
                                        options={generationSources}
                                        colSpan={1}
                                        methods={methods}
                                    />
                                    <Input
                                        name={getFieldName(index, `quienes_son`)}
                                        label="En caso de ser proveedores externos, menciona la empresa"
                                        placeholder="Menciona la empresa"
                                        colSpan={1}
                                        methods={methods}
                                    />
                                </FieldGrid>

                                <FieldGrid align="end">
                                    <Typography as="h3" titleName="Historial y evolución de la base de datos" className="mt-5" colSpan={4}/>
                                    <Radio
                                        name={getFieldName(index, `historicos`)}
                                        label="¿Existen registros históricos de la base de datos? De ser así, describe el histórico"
                                        options={yesOrNot}
                                        colSpan={isHistoricosVisible ? 2 : 4}
                                        methods={methods}
                                    />
                                    <Input
                                        name={getFieldName(index, `desc_historicos`)}
                                        label="Describe tu histórico"
                                        tooltip="Describe tu histórico (especifica a partir de cuándo (año) tienes datos, o cualquier otra característica de tus datos históricos.)"
                                        placeholder="Describe tu histórico"
                                        methods={methods}
                                        colSpan={isHistoricosVisible ? 2 : 0}
                                        required={isHistoricosVisible}
                                        clean={!isHistoricosVisible}
                                    />
                                    <Radio
                                        name={getFieldName(index, `migracion_actualizacion`)}
                                        label="¿Hubo migración o actualización de los sistemas que modificaran la recopilación e integración de la base de datos?"
                                        options={yesOrNot}
                                        colSpan={isMigracionVisible ? 2 : 4}
                                        methods={methods}
                                    />
                                    <Input
                                        name={getFieldName(index, `desc_migracion_actualizacion`)}
                                        label="Describe el proceso de la migración o actualización"
                                        tooltip="Ejemplo: pasamos de usar Excel a una base de datos SQL."
                                        placeholder="Describe el proceso de la migración o actualización"
                                        methods={methods}
                                        colSpan={isMigracionVisible ? 2 : 0}
                                        required={isMigracionVisible}
                                        clean={!isMigracionVisible}
                                    />
                                    <Typography as="h3" titleName="Seguridad y Protección de los Datos" className="mt-5" colSpan={4}/>
                                    <Radio
                                        name={getFieldName(index, `medidas_seguridad`)} 
                                        label="¿Se han implementado medidas de seguridad en las bases de datos?"
                                        options={yesOrNot}
                                        colSpan={isMedidasVisible ? 2 : 4}
                                        methods={methods}
                                    />
                                    <Input
                                        name={getFieldName(index, `desc_medidas_seguridad`)}
                                        label="Describe las medidas de seguridad"
                                        tooltip="Encriptación, backup regular, protección contra accesos no autorizados, otros."
                                        methods={methods}
                                        colSpan={isMedidasVisible ? 2 : 0}
                                        required={isMedidasVisible}
                                        clean={!isMedidasVisible}

                                    />
                                    <Radio
                                        name={getFieldName(index, `normativas_proteccion`)}
                                        label="¿Dispone de normativas internas para el manejo y protección de las bases de datos?"
                                        options={yesOrNot}
                                        colSpan={isNormativasVisible ? 2 : 4}
                                        methods={methods}
                                    />
                                    <Input
                                        name={getFieldName(index, `desc_normativas_proteccion`)}
                                        label="Describe las normativas internas y/o externas"
                                        placeholder="Describe las normativas internas y/o externas"
                                        methods={methods}
                                        colSpan={isNormativasVisible ? 2 : 0}
                                        required={isNormativasVisible}
                                        clean={!isNormativasVisible}

                                    />
                                    <Radio
                                        name={getFieldName(index, `plan_contingencia`)} 
                                        label="¿Cuenta con una política o plan de contingencia?"
                                        options={yesOrNot}
                                        colSpan={isContingenciaVisible ? 2 : 4}
                                        methods={methods}
                                    />
                                    <Input
                                        name={getFieldName(index, `desc_plan_contingencia`)}
                                        label="Describe los planes o la política de contingencia y recuperación"
                                        placeholder="Describe los planes o la política de contingencia y recuperación"
                                        methods={methods}
                                        colSpan={isContingenciaVisible ? 2 : 0}
                                        required={isContingenciaVisible}
                                        clean={!isContingenciaVisible}

                                    />
                                    <Typography as="h3" titleName="Interoperatividad" className="mt-5" colSpan={4}/>
                                    <Radio
                                        name={getFieldName(index, `interoperatividad`)}
                                        label="¿Se cuenta con interoperatividad con otras bases de datos?"
                                        labelInput="Enumera las dependencias"
                                        options={yesOrNot}
                                        colSpan={isInteroperatividadVisible ? 2 : 4}
                                        methods={methods}
                                    />
                                    <Input
                                        name={getFieldName(index, `desc_interoperatividad`)}
                                        label="Enumera las dependencias"
                                        placeholder="Enumera las dependencias"
                                        methods={methods}
                                        colSpan={isInteroperatividadVisible ? 2 : 0}
                                        required={isInteroperatividadVisible}
                                        clean={!isInteroperatividadVisible}
                                    />
                                    <Radio
                                        name={getFieldName(index, `plataforma_difusion`)}
                                        label="¿Existen plataformas destinadas para la difusión de información?"
                                        options={yesOrNot}
                                        colSpan={isDifusionVisible ? 1 : 4}
                                        methods={methods}
                                    />
                                    <Input
                                        name={getFieldName(index, `nombre_plataforma_difusion`)}
                                        label="Nombre"
                                        placeholder="Ingrese el nombre"
                                        methods={methods}
                                        colSpan={isDifusionVisible ? 1 : 0}
                                        required={isDifusionVisible}
                                        clean={!isDifusionVisible}
                                    />
                                    <Input
                                        name={getFieldName(index, `url_plataforma_difusion`)}
                                        label="URL"
                                        type="url"
                                        placeholder="Ingrese la URL"
                                        methods={methods}
                                        colSpan={isDifusionVisible ? 1 : 0}
                                        required={isDifusionVisible}
                                        clean={!isDifusionVisible}
                                    />
                                </FieldGrid>
                            </div>
                        )
                    )
                ))}
            </form>
        </React.Fragment>
    )
}

export default DatabaseInformation;