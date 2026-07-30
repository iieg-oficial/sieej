dist_listo() {
    row 'Dist' 'listo' "$C_GREEN" './frontend/dist'
    printf '\n  El gateway sirve este dist en /sieej/: recargalo con make -C ../gateway-hub deploy\n'
}

clean_artifacts() {
    docker run --rm -v "$(pwd)/frontend/dist":/dist alpine sh -c 'rm -rf /dist/*' 2>/dev/null || true
    rm -rf frontend/dist frontend/node_modules
    row 'Artefactos' 'eliminados' "$C_GREEN" 'dist/, node_modules/'
}
