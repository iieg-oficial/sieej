import React, { useEffect } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { useUser } from '../context/UserContext';
import { useHome } from '../context/HomeContext';
import { FieldGrid } from '../helpers/FieldLayout';
import { handleDownload } from './Pdf';
import extractFileName from '../helpers/extractFileName';
import cleanObject from '../helpers/cleanObject';
import NavigateStep from './NavigateStep';
import Text from './Text';
import Typography from './Typography';
import Divide from './Divide';
import Tabs from './Tabs';

const ResumeStep = () => {
    const { steps, openModal, closeModal, resetVisitedTabs, onActiveTab, activeTab, isMobile } = useGlobal();
    const { userForm } = useUser();
    const { formData, onAnalytics } = useHome();

    const general = cleanObject(formData.informacion_general);
    const enlaces = cleanObject(formData.informacion_enlaces);
    const basedatos = cleanObject(formData.informacion_basesdatos);

    const onSubmit = async () => {
        openModal('warn', null, null, [{
            label: 'No. Regresar',
            variant: 'secondary',
            onClick: closeModal
        }, {
            label: 'Sí. Confirmar y enviar',
            variant: 'primary',
            onClick: () => {
                closeModal();
                openModal(
                    'infoSuccess', 
                    'Gracias por completar tu registro', 
                    'Te estaremos informando las siguientes etapas vía correo electrónico', 
                    [{
                        label: 'Descargar PDF',
                        variant: 'inline',
                        onClick: async () => {
                            await handleDownload(formData);
                            onAnalytics('Descargar PDF', `Se le dio al boton de descargar PDF, usuario: ${userForm?.username}`);
                        }
                    },{
                        label: 'Aceptar',
                        variant: 'primary',
                        onClick: closeModal
                    }]
                );
            }
        }]);
    }

    useEffect(() => {
        resetVisitedTabs();
        onActiveTab(0);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <React.Fragment>
            <NavigateStep onSubmit={onSubmit}/>
            <Typography as="h2" titleName={steps[0].title} icon={!isMobile && steps[0].icon}/>
            <div className="w-full my-6 md:ml-12">
                <FieldGrid>
                    <Text label="Nombre del ente de Gobierno" text={general.nombre_ente_gobierno} colSpan={2}/>
                    <Text label="Unidad administrativa" text={general.unidad_admin} colSpan={2}/>
                </FieldGrid>
                <FieldGrid>
                    <Text label="¿Dentro de tu dependencia cuentan con un área responsable en manejo y generación de los datos?" text={general.hay_responsable} colSpan={2}/>
                    <Text label="Descripción del área responsable" text={general.descripcion_hay_responsable} colSpan={2}/>
                </FieldGrid>
                <Typography as="h3" titleName="Desafíos y oportunidades" />
                <Text label="Desafíos y oportunidades" text={general.desafios_oportunidades}/>
            </div>

            <Typography as="h2" titleName={steps[1].title} icon={!isMobile && steps[1].icon}/>
            <div className="w-full my-6 md:ml-12">
                <Typography as="p" titleName="Enlace Institucional" style={{color: '#5C2472'}}/>
                {enlaces.map((enlace, index) => (
                    <div key={enlace.id} className="py-2 my-2">
                        {index > 0 && <Typography as="p" titleName={`${enlaces.length > 1 ? `${index}.- ` : ''}Enlace Técnico`} style={{color: '#5C2472', marginBottom: 20 }}/> }
                        <FieldGrid align="end" col={3}>
                            <Text label="Nombre" text={enlace.nombres}/>
                            <Text label="Primer apellido" text={enlace.apellido1}/>
                            <Text label="Segundo apellido" text={enlace.apellido2}/>
                        </FieldGrid>
                        <FieldGrid align="end" col={3}>
                            <Text label="Dirección o Área adscrita" text={enlace.direccion}/>
                            <Text label="Puesto" text={enlace.puesto}/>
                        </FieldGrid>
                        <FieldGrid align="end" col={3}>
                            <Text label="Correo electronico" text={enlace.email}/>
                            <Text label="Teléfono" text={enlace.telefono}/>
                            <Text label="Extensión" text={enlace.extension}/>
                        </FieldGrid>
                        <Typography as="h3" titleName="Jefe directo" className='text-[#191919]'/>
                        <FieldGrid align="end" col={3}>
                            <Text label="Nombre" text={enlace.nombres_jefe}/>
                            <Text label="Primer apellido" text={enlace.apellido1_jefe}/>
                            <Text label="Segundo apellido" text={enlace.apellido2_jefe}/>
                        </FieldGrid>
                        <FieldGrid align="end" col={3}>
                            <Text label="Puesto" text={enlace.puesto_jefe}/>
                            <Text label="Correo electronico" text={enlace.email_jefe}/>
                        </FieldGrid>
                        <Divide />
                    </div>
                ))}
            </div>

            <Typography as="h2" titleName={steps[3].title} icon={!isMobile && steps[3].icon}/>
            <div className="w-full mt-6 md:ml-12">
                <Tabs customTabs={basedatos} show />
                {basedatos.map((bd, index) => (
                    activeTab === index && (
                        <div key={bd.id} className="pb-2 mb-2">
                            <Typography as="p" titleName={bd.nombre_bd} style={{color: '#5C2472', marginBottom: 20}}/>
                            <Text label="Descripción breve de la base de datos" text={bd.descripcion_bd}/>
                            <FieldGrid align="end" col={3}>
                                <Text label="Categoría de los datos" text={bd.categoria_datos}/>
                                <Text label="Herramienta utilizada para la gestión" text={bd.herramientas_gestion}/>
                                <Text label="¿Cómo se asegura la calidad de los datos?" text={bd.calidad_datos}/>
                            </FieldGrid>
                            <FieldGrid align="end" col={3}>
                                <Text label="¿Existen procesos de limpieza y validación de esta base de datos?" text={bd.limpieza_validacion}/>
                                <Text label="Descripción de limpieza y validación" text={bd.desc_limpieza_validacion}/>
                            </FieldGrid>
                            <FieldGrid align="end" col={3}>
                                <Text label="Frecuencia de actualización" text={bd.periodicidad}/>
                                <Text label="Descripción de frecuencia de actualización" text={bd.desc_periodicidad}/>
                            </FieldGrid>
                            <FieldGrid align="end" col={3}>
                                <Text label="¿De dónde provienen las bases de datos que utilizan?" text={bd.proveedores_bd}/>
                                {/* Se retiro temporalmente hasta revisión */}
                                {/* <div className="flex gap-2">
                                <Text
                                    label="Ejes estratégicos de esta base de datos"
                                    text={
                                    <span className="flex flex-wrap gap-2">
                                        {bd?.ejes_estrategicos?.map((eje) => (
                                            <span
                                                key={eje}
                                                className="
                                                    inline-flex items-center text-[13px] font-garetmedium rounded-lg
                                                    text-[#5C2472] bg-[#FBF1FF] gap-2 px-2 py-1
                                                "
                                            >
                                                {eje}
                                            </span>
                                        ))}
                                    </span>
                                    }
                                />
                            </div> */}
                                <Text label="¿La base de datos cuenta con un diccionario?" text={bd.tiene_diccionario}/>
                            </FieldGrid>
                            <Text 
                                label="Nombre de diccionario agregado" 
                                text={
                                    bd.ruta_diccionario ? (
                                        <span
                                            className="
                                            inline-flex items-center text-[13px] font-garetmedium rounded-lg
                                            text-[#32A752] bg-[#EAF6ED] gap-2 px-2 py-1
                                        "
                                        >{
                                                typeof bd.ruta_diccionario === 'string' ? extractFileName(bd.ruta_diccionario) : bd.ruta_diccionario?.name
                                            }</span>
                                    ) : (
                                        <span
                                            className="
                                            inline-flex items-center text-[13px] font-garetmedium rounded-lg
                                            text-[#FF0000] bg-[#FFECEC] gap-2 px-2 py-1
                                        "
                                        >
                                        Sin nombre
                                        </span>
                                    )
                                }
                            />
                            <Typography as="h3" titleName="Uso y aplicación de datos" />
                            <FieldGrid align="end" col={3}>
                                <Text label="Objetivos del uso de la base de datos" text={bd.objetivo_uso}/>
                                <Text label="Usuarios de los datos" text={bd.usuarios_datos}/>
                                <Text label="En caso de ser proveedores externos, menciona la empresa" text={bd.quienes_son}/>
                            </FieldGrid>
                            <Typography as="h3" titleName="Historial y evolución de la base de datos" />
                            <FieldGrid align="end" col={3}>
                                <Text label="¿Existen registros históricos de las bases de datos?" text={bd.historicos}/>
                                <Text label="Descripción de históricos" text={bd.desc_historicos}/>
                            </FieldGrid>
                            <FieldGrid align="end" col={3}>
                                <Text label="¿Hubo migración o actualización de la base de datos con respecto a las versiones anteriores?" text={bd.migracion_actualizacion}/>
                                <Text label="Descripción de migración y actualización" text={bd.desc_migracion_actualizacion}/>
                            </FieldGrid>
                            <Typography as="h3" titleName="Seguridad y Protección de los Datos" />
                            <FieldGrid align="end" col={3}>
                                <Text label="¿Qué medidas de seguridad se han implementado para la protección y manejo de las bases de datos?" text={bd.medidas_seguridad}/>
                                <Text label="Descripción de medidas de seguridad" text={bd.desc_medidas_seguridad}/>
                            </FieldGrid>
                            <FieldGrid align="end" col={3}>
                                <Text label="¿Dispone de normativas internas para el manejo y protección de las bases de datos?" text={bd.normativas_proteccion}/>
                                <Text label="Descripción de normativas de protección" text={bd.desc_normativas_proteccion}/>
                            </FieldGrid>
                            <FieldGrid align="end" col={3}>
                                <Text label="¿Cuenta con una política o plan de contingencia para la seguridad de las bases de datos en caso de fallos o incidencias?" text={bd.plan_contingencia}/>
                                <Text label="Descripción del plan de contingencia" text={bd.desc_plan_contingencia}/>
                            </FieldGrid>
                            <Typography as="h3" titleName="Interoperabilidad" />
                            <FieldGrid align="end" col={3}>
                                <Text label="¿Se cuenta con interoperabilidad con otras bases de datos de otros entes de gobierno (municipales, estatales o federales)?" text={bd.interoperatividad}/>
                                <Text label="Descripción de interoperatividad" text={bd.desc_interoperatividad}/>
                            </FieldGrid>
                            <FieldGrid align="end" col={3}>
                                <Text label="¿Existen plataformas destinadas para la difusión de información con la ciudadanía?" text={bd.plataforma_difusion}/>
                                <Text label="Descripción del nombre" text={bd.nombre_plataforma_difusion}/>
                                <Text label="Descripción del URL" text={bd.url_plataforma_difusion}/>
                            </FieldGrid>
                        </div>
                    )))}
            </div>
        </React.Fragment>
    );
};

export default ResumeStep;