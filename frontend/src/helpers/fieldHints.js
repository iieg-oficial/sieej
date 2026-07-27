export const HINT_TYPES = [ 'pattern', 'minLength', 'maxLength' ];

const valorTexto = (valor) => (
    valor === undefined || valor === null ? '' : String(valor)
);

const cumplePattern = (pattern, texto) => {
    try {
        pattern.lastIndex = 0;
        return pattern.test(texto);
    } catch {
        return true;
    }
};

export const buildFieldHints = ({
    pattern, patternMessage, minLength, maxLength, value,
} = {}) => {
    const texto = valorTexto(value);
    const escrito = texto.length;
    const hints = [];

    if (pattern) {
        hints.push({
            id: 'pattern',
            text: patternMessage || 'Revisa el formato del dato',
            state: escrito === 0
                ? 'neutral'
                : (cumplePattern(pattern, texto) ? 'ok' : 'error'),
        });
    }

    if (minLength > 0) {
        hints.push({
            id: 'minLength',
            text: `Mínimo ${minLength} caracteres`,
            state: escrito === 0
                ? 'neutral'
                : (escrito >= minLength ? 'ok' : 'error'),
        });
    }

    if (maxLength > 0) {
        hints.push({
            id: 'maxLength',
            text: `${escrito}/${maxLength} caracteres`,
            state: escrito >= maxLength ? 'limite' : 'neutral',
        });
    }

    return hints;
};
