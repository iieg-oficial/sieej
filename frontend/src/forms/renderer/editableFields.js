export const camposEditables = (definicion) => (definicion?.steps || [])
    .filter((s) => s.type !== 'summary' && s.type !== 'repeater')
    .flatMap((s) => (s.fields || []).filter(
        (f) => f.editableAfterSubmit && f.type !== 'info' && f.type !== 'file',
    ));

export const tieneCamposEditables = (definicion) => camposEditables(definicion).length > 0;
