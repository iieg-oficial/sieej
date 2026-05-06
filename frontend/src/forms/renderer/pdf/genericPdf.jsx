import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, pdf } from '@react-pdf/renderer';
import sieej from '@png/sieej.png';
import iieg from '@png/iieg.png';
import jal from '@png/jal.png';
import bold from '../../../assets/fonts/Garet-Bold.otf';
import medium from '../../../assets/fonts/Garet-Medium.otf';
import regular from '../../../assets/fonts/Garet-Regular.otf';
import { Image } from '@react-pdf/renderer';
import { resolveOptions } from '../catalogResolver';

Font.register({ family: 'GaretBold', src: bold, fontStyle: 'normal' });
Font.register({ family: 'GaretMedium', src: medium, fontStyle: 'normal' });
Font.register({ family: 'GaretRegular', src: regular, fontStyle: 'normal' });

const styles = StyleSheet.create({
    page: { flexDirection: 'column', paddingHorizontal: 30, paddingVertical: 30 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    logo: { height: 36, objectFit: 'contain' },
    h1: { fontSize: 18, marginVertical: 8, fontFamily: 'GaretBold', color: '#191919' },
    h2: { fontSize: 14, marginTop: 14, marginBottom: 4, fontFamily: 'GaretBold', color: '#5C2472' },
    h3: { fontSize: 12, marginTop: 8, marginBottom: 4, fontFamily: 'GaretBold', color: '#191919' },
    description: { fontSize: 10, fontFamily: 'GaretRegular', color: '#7C7C7C', marginBottom: 6 },
    fieldRow: { flexDirection: 'row', marginBottom: 6, paddingHorizontal: 8 },
    fieldLabel: { flex: 1, fontSize: 9, fontFamily: 'GaretRegular', color: '#191919' },
    fieldValue: { flex: 2, fontSize: 10, fontFamily: 'GaretMedium', color: '#5C2472' },
    fieldEmpty: { flex: 2, fontSize: 10, fontFamily: 'GaretMedium', color: '#8E8E8E' },
    repeaterItem: { borderTop: '1px solid #E2E2E2', paddingTop: 6, marginTop: 8 },
});

const formatValue = (field, value, catalogos) => {
    if (value === null || value === undefined || value === '') return null;
    if (field.type === 'checkbox') return value ? 'Sí' : 'No';
    if (field.type === 'radio' || field.type === 'select') {
        const opts = resolveOptions(field, catalogos);
        const opt = opts.find((o) => String(o.value) === String(value));
        return opt ? opt.label : String(value);
    }
    if (field.type === 'select_multiple') {
        if (!Array.isArray(value)) return null;
        const opts = resolveOptions(field, catalogos);
        return value
            .map((v) => opts.find((o) => String(o.value) === String(v))?.label || String(v))
            .join(', ');
    }
    if (field.type === 'file') {
        if (typeof value === 'object' && value !== null) {
            return value.filename_original || value.url_publica || null;
        }
        return String(value);
    }
    return String(value);
};

const renderField = (field, value, catalogos) => {
    if (field.type === 'info') return null;
    const formatted = formatValue(field, value, catalogos);
    return (
        <View key={field.name} style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>{field.label}</Text>
            <Text style={formatted == null ? styles.fieldEmpty : styles.fieldValue}>
                {formatted ?? 'Sin información'}
            </Text>
        </View>
    );
};

const GenericPdfDocument = ({ definicion, datos, catalogos }) => (
    <Document>
        <Page size="A4" style={styles.page}>
            <View style={styles.header}>
                <Image src={iieg} style={styles.logo} />
                <Image src={sieej} style={styles.logo} />
                <Image src={jal} style={styles.logo} />
            </View>
            <Text style={styles.h1}>{definicion.nombre || 'Formulario'}</Text>
            {definicion.descripcion && (
                <Text style={styles.description}>{definicion.descripcion}</Text>
            )}

            {(definicion.steps || []).map((step) => {
                if (step.type === 'summary') return null;
                const stepData = datos[step.id];

                if (step.type === 'repeater') {
                    const items = Array.isArray(stepData) ? stepData : [];
                    return (
                        <View key={step.id} wrap={false}>
                            <Text style={styles.h2}>{step.title}</Text>
                            {items.length === 0 ? (
                                <Text style={styles.fieldEmpty}>Sin elementos.</Text>
                            ) : (
                                items.map((item, idx) => (
                                    <View key={idx} style={idx > 0 ? styles.repeaterItem : null}>
                                        <Text style={styles.h3}>{`${idx + 1}. ${item?.nombre_bd || item?.nombres || `Item ${idx + 1}`}`}</Text>
                                        {step.fields.map((f) => renderField(f, item?.[f.name], catalogos))}
                                    </View>
                                ))
                            )}
                        </View>
                    );
                }

                return (
                    <View key={step.id}>
                        <Text style={styles.h2}>{step.title}</Text>
                        {step.fields.map((f) => renderField(f, stepData?.[f.name], catalogos))}
                    </View>
                );
            })}
        </Page>
    </Document>
);

export const downloadGenericPdf = async (definicion, datos, catalogos, filename) => {
    const blob = await pdf(
        <GenericPdfDocument definicion={definicion} datos={datos} catalogos={catalogos} />
    ).toBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `${definicion.nombre || 'formulario'}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};
