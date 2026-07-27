export const camposEditables = (definicion) => (definicion?.steps || [])
    .filter((s) => s.type !== 'summary')
    .flatMap((s) => (s.fields || []).filter(
        (f) => f.editableAfterSubmit && f.type !== 'info',
    ));

export const tieneCamposEditables = (definicion) => camposEditables(definicion).length > 0;
