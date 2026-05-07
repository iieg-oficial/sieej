import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
import sieej from '@png/sieej.png';
import iieg from '@png/iieg.png';
import jal from '@png/jal.png';
import extractFileName from '@helpers/extractFileName';
import bold from '@fonts/Garet-Bold.otf';
import medium from '@fonts/Garet-Medium.otf';
import regular from '@fonts/Garet-Regular.otf';

Font.register({ family: 'GaretBold', src: bold, fontStyle: 'normal' });
Font.register({ family: 'GaretMedium', src: medium, fontStyle: 'normal' });
Font.register({ family: 'GaretRegular', src: regular, fontStyle: 'normal' });

const styles = StyleSheet.create({
    page: { flexDirection: 'column', paddingHorizontal: 30, paddingVertical: 30 },
    section: { marginHorizontal: 10, marginVertical: 5, paddingHorizontal: 10, paddingVertical: 5, fontSize: 10, fontFamily: 'GaretRegular', color: '#191919' },
    h1: { fontSize: 18, marginHorizontal: 20, marginVertical: 5, textAlign: 'start', fontFamily: 'GaretBold', color: '#191919' },
    h2: { fontSize: 16, marginBottom: 8, fontFamily: 'GaretBold', color: '#5C2472' },
    h3: { fontSize: 14, marginVertical: 6, fontFamily: 'GaretBold' },
    h4: { fontSize: 12, marginBottom: 4, marginTop: 6, fontFamily: 'GaretMedium' },
    value: { fontSize: 11, fontFamily: 'GaretMedium', color: '#5C2472' },
    noValue: { color: '#8E8E8E', fontSize: 11, fontFamily: 'GaretMedium' },
    row: { flexDirection: 'row', marginBottom: 10 },
    col: { flex: 1, paddingRight: 10 },
    colLast: { flex: 1 },
    fieldLabel: { marginBottom: 2, fontSize: 10, fontFamily: 'GaretRegular', color: '#191919' },
});

const formatText = (value, label) => {
    if (typeof value === 'boolean') return value ? 'Si' : 'No';
    if (value === 'true') return 'Si';
    if (value === 'false') return 'No';
    if (!value && label && (label.startsWith('Descripcion') || label.startsWith('Descripción'))) {
        const parts = label.split(' ')[1] === 'del' ? label.split(' del ') : label.split(' de ');
        return <Text style={styles.noValue}>{`Sin ${parts.length > 1 ? parts[1].trim() : ''}`}</Text>;
    }

    const displayValue = (typeof value === 'string' && value.trim() !== '') || typeof value === 'number'
        ? value
        : value?.value;

    if (displayValue !== undefined && displayValue !== null && displayValue !== '') {
        return displayValue;
    } else {
        return <Text style={styles.noValue}>Sin datos</Text>;
    }
};

const renderField = (label, value) => (
    <>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Text style={styles.value}>
            {formatText(value, label)}
        </Text>
    </>
);

const Header = ({ date }) => (
    <View style={{ marginBottom: 20, flexDirection: 'row', justifyContent: 'space-between' }} fixed>
        <Image src={sieej} style={{ width: 192, height: 41}} />
        <Text style={{ fontSize: 7, fontFamily: 'GaretBold', color: '#465055', textAlign: 'right' }}>
            {date}
        </Text>
    </View>
);

const Footer = () => (
    <View style={{ marginTop: 20, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }} fixed>
        <Image src={iieg} style={{ width: 130, height: 40 }} />
        <Text
            style={{ fontSize: 7, fontFamily: 'GaretBold', color: '#465055', textAlign: 'center', marginBottom: 5 }}
            render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
        />
        <Image src={jal} style={{ width: 113, height: 38 }} />
    </View>
);

const PdfForm = ({ formData }) => {
    const general = formData?.informacion_general;
    const enlaces = formData?.informacion_enlaces;
    const basesDatos = formData?.informacion_basesdatos;
    const currentDate = new Date().toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <Header date={currentDate} />
                <Text style={styles.h1}>
                    Registro de enlaces para el Sistema de Información Estratégica del Estado de Jalisco
                </Text>
                <View style={styles.section}>
                    <Text style={styles.h2}>Información General</Text>
                    <View style={styles.row}>
                        <View style={styles.col}>
                            {renderField('Nombre del ente de Gobierno', general?.nombre_ente_gobierno)}
                        </View>
                        <View style={styles.colLast}>
                            {renderField('Unidad administrativa', general?.unidad_admin)}
                        </View>
                    </View>
                    <View style={styles.row}>
                        <View style={styles.col}>
                            {renderField('¿Dentro de tu dependencia cuentan con un área responsable en manejo y generación de los datos?', general?.hay_responsable)}
                        </View>
                        <View style={styles.colLast}>
                            {renderField('Descripción del área responsable', general?.descripcion_hay_responsable)}
                        </View>
                    </View>
                    <Text style={styles.h4}>Desafíos y oportunidades</Text>
                    <View style={styles.row}>
                        <View style={styles.colLast}>
                            {renderField('Desafíos y oportunidades', general?.desafios_oportunidades)}
                        </View>
                    </View>
                </View>
                <View style={styles.section}>
                    <Text style={styles.h2}>Información de Enlaces</Text>
                    {enlaces?.length > 0 ? (
                        enlaces?.map((enlace, index) => (
                            <View key={index} style={{ marginBottom: 15 }}>
                                <Text style={styles.h3}>{index === 0 ? 'Enlace Institucional' : `${enlaces.length > 1 ? `${index}.- ` : ''}Enlace Técnico`}</Text>
                                <View style={styles.row}>
                                    <View style={styles.col}>{renderField('Nombre', enlace.nombres)}</View>
                                    <View style={styles.col}>{renderField('Primer apellido', enlace.apellido1)}</View>
                                    <View style={styles.colLast}>{renderField('Segundo apellido', enlace.apellido2)}</View>
                                </View>
                                <View style={styles.row}>
                                    <View style={styles.col}>{renderField('Correo electrónico', enlace.email)}</View>
                                    <View style={styles.col}>{renderField('Teléfono', enlace.telefono)}</View>
                                    <View style={styles.colLast}>{renderField('Extensión', enlace.extension)}</View>
                                </View>
                                <View style={styles.row}>
                                    <View style={styles.col}>{renderField('Dirección o Área adscrita', enlace.direccion)}</View>
                                    <View style={styles.col}>{renderField('Puesto', enlace.puesto)}</View>
                                    <View style={styles.colLast}></View>
                                </View>

                                <Text style={styles.h4}>Jefe directo</Text>
                                <View style={styles.row}>
                                    <View style={styles.col}>{renderField('Nombre', enlace.nombres_jefe)}</View>
                                    <View style={styles.col}>{renderField('Primer apellido', enlace.apellido1_jefe)}</View>
                                    <View style={styles.colLast}>{renderField('Segundo apellido', enlace.apellido2_jefe)}</View>
                                </View>
                                <View style={styles.row}>
                                    <View style={styles.col}>{renderField('Correo electrónico', enlace.email_jefe)}</View>
                                    <View style={styles.col}>{renderField('Puesto', enlace.puesto_jefe)}</View>
                                    <View style={styles.colLast}></View>
                                </View>
                            </View>
                        ))
                    ) : (
                        <Text>No hay información de enlaces disponible.</Text>
                    )}
                </View>
                <View style={styles.section}>
                    <Text style={styles.h2}>Información de Bases de Datos</Text>
                    {basesDatos?.length > 0 ? (
                        basesDatos?.map((bd, index) => (
                            <View key={index} style={{ marginBottom: 15 }}>
                                <Text style={styles.h3}>{index + 1}.- {bd.nombre_bd}</Text>
                                <View style={styles.row}>
                                    <View style={styles.colLast}>{renderField('Descripción breve de la base de datos', bd.descripcion_bd)}</View>
                                </View>
                                <View style={styles.row}>
                                    <View style={styles.col}>{renderField('Categoría de los datos', bd.categoria_datos)}</View>
                                    <View style={styles.colLast}>{renderField('Herramienta utilizada para la gestión', bd.herramientas_gestion)}</View>
                                </View>
                                <View style={styles.row}>
                                    <View style={styles.col}>{renderField('¿Cómo se asegura la calidad de los datos?', bd.calidad_datos)}</View>
                                    <View style={styles.colLast}>{renderField('¿De dónde provienen las bases de datos que utilizan?', bd.proveedores_bd)}</View>
                                </View>
                                <View style={styles.row}>
                                    <View style={styles.col}>{renderField('¿Existen procesos de limpieza y validación de esta base de datos?', bd.limpieza_validacion)}</View>
                                    <View style={styles.colLast}>{renderField('Descripción de limpieza y validación', bd.desc_limpieza_validacion)}</View>
                                </View>
                                <View style={styles.row}>
                                    <View style={styles.col}>{renderField('Frecuencia de actualización', bd.periodicidad)}</View>
                                    <View style={styles.colLast}>{renderField('Descripción de frecuencia de actualización', bd.desc_periodicidad)}</View>
                                </View>
                                <View style={styles.row}>
                                    <View style={styles.col}>{renderField('¿La base de datos cuenta con un diccionario?', bd.tiene_diccionario)}</View>
                                    <View style={styles.colLast}>{renderField('Nombre de diccionario agregado', typeof bd.ruta_diccionario === 'string' ? extractFileName(bd.ruta_diccionario) : bd.ruta_diccionario?.name)}</View>
                                </View>

                                <Text style={styles.h4}>Uso y aplicación de datos</Text>
                                <View style={styles.row}>
                                    <View style={styles.col}>{renderField('Objetivos del uso de la base de datos', bd.objetivo_uso)}</View>
                                    <View style={styles.colLast}>{renderField('Usuarios de los datos', bd.usuarios_datos)}</View>
                                </View>
                                <View style={styles.row}>
                                    <View style={styles.colLast}>{renderField('En caso de ser proveedores externos, menciona la empresa', bd.quienes_son)}</View>
                                </View>

                                <Text style={styles.h4}>Historial y evolución de la base de datos</Text>
                                <View style={styles.row}>
                                    <View style={styles.col}>{renderField('¿Existen registros históricos de las bases de datos?', bd.historicos)}</View>
                                    <View style={styles.colLast}>{renderField('Descripción de históricos', bd.desc_historicos)}</View>
                                </View>
                                <View style={styles.row}>
                                    <View style={styles.col}>{renderField('¿Hubo migración o actualización de la base de datos con respecto a las versiones anteriores?', bd.migracion_actualizacion)}</View>
                                    <View style={styles.colLast}>{renderField('Descripción de migración y actualización', bd.desc_migracion_actualizacion)}</View>
                                </View>

                                <Text style={styles.h4}>Seguridad y Protección de los Datos</Text>
                                <View style={styles.row}>
                                    <View style={styles.col}>{renderField('¿Qué medidas de seguridad se han implementado para la protección y manejo de las bases de datos?', bd.medidas_seguridad)}</View>
                                    <View style={styles.colLast}>{renderField('Descripción de medidas de seguridad', bd.desc_medidas_seguridad)}</View>
                                </View>
                                <View style={styles.row}>
                                    <View style={styles.col}>{renderField('¿Dispone de normativas internas para el manejo y protección de las bases de datos?', bd.normativas_proteccion)}</View>
                                    <View style={styles.colLast}>{renderField('Descripción de normativas de protección', bd.desc_normativas_proteccion)}</View>
                                </View>
                                <View style={styles.row}>
                                    <View style={styles.col}>{renderField('¿Cuenta con una política o plan de contingencia para la seguridad de las bases de datos en caso de fallos o incidencias?', bd.plan_contingencia)}</View>
                                    <View style={styles.colLast}>{renderField('Descripción del plan de contingencia', bd.desc_plan_contingencia)}</View>
                                </View>
                                <Text style={styles.h4}>Interoperabilidad</Text>
                                <View style={styles.row}>
                                    <View style={styles.col}>{renderField('¿Se cuenta con interoperabilidad con otras bases de datos de otros entes de gobierno (municipales, estatales o federales)?', bd.interoperatividad)}</View>
                                    <View style={styles.colLast}>{renderField('Descripción de interoperatividad', bd.desc_interoperatividad)}</View>
                                </View>
                                <View style={styles.row}>
                                    <View style={styles.col}>{renderField('¿Existen plataformas destinadas para la difusión de información con la ciudadanía?', bd.plataforma_difusion)}</View>
                                    <View style={styles.colLast}>{renderField('Descripción del nombre', bd.nombre_plataforma_difusion)}</View>
                                </View>
                                <View style={styles.row}>
                                    <View style={styles.col}>{renderField('Descripción del URL', bd.url_plataforma_difusion)}</View>
                                    <View style={styles.colLast}></View>
                                </View>
                            </View>
                        ))
                    ) : (
                        <Text>No hay información de bases de datos disponible.</Text>
                    )}
                </View>
                <Footer />
            </Page>
        </Document>
    );
};

export default PdfForm;