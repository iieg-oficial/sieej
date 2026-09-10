# Changelog

Todas las notas relevantes del proyecto SIEEJ. Formato basado en
[Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y
[SemVer](https://semver.org/lang/es/).

## [No publicado]

## [1.59.1] - 2026-09-10

### Corregido: el lápiz de renombrar quedaba fuera de la pestaña

El lápiz se dibujaba como un botón al lado de la pestaña y no dentro, como la ✕. `Button` pintaba un
solo sufijo, así que ahora acepta uno extra (`sufExtra`) que las pestañas usan para el lápiz y la ✕
juntos; las demás pantallas que usan `Button` no cambian. Presionar el lápiz o la ✕ ya no cuenta
también como elegir la pestaña.

### Cambiado: la ✕ de la pestaña es naranja, como el lápiz

Era una imagen con el color fijo y el CSS no podía cambiarlo. Ahora es el `ClearIcon` en línea: toma
el naranja de la pestaña activa y tiene el mismo hover que el lápiz. Aplica también a la ✕ de la
captura, que usa las mismas pestañas.

## [1.59.0] - 2026-09-10

### Agregado: elegir, renombrar y agregar conjuntos al actualizar un envío

«Actualizar información» dejó de apilar los elementos de un repeater uno debajo de otro, cada uno
con el título del paso repetido. Ahora cada repeater muestra sus elementos en pestañas —las mismas
de la captura— y solo los campos actualizables del que esté elegido.

El botón **+** agrega un elemento al final. El nuevo abre **todas** las pestañas del paso, no solo
los campos actualizables: si solo abriera esos, el resto quedaría vacío para siempre. Se descarta
con la ✕ antes de guardar, y sus archivos se suben al guardar, justo después de crearlo.
Requiere mariachi 1.124.0.

### Agregado: renombrar la pestaña de un elemento

La pestaña activa tiene un lápiz, en la captura y en la actualización: Enter guarda, Esc cancela,
y un nombre vacío regresa a la etiqueta numerada. Se guarda en `__etiqueta` y `buildRepeaterItems`
lo pone por delante de `nombre_bd`, `nombres` y `nombre`. `Tabs` lo ofrece solo a quien le pase
`onTabRename`, así que las otras pantallas que usan pestañas no cambian. En móvil no aparece,
porque ahí las pestañas muestran solo el número.

## [1.58.1] - 2026-08-05

### Corregido: el aviso de privacidad respondía 404

`linkPrivacity` apuntaba a `www.iieg.gob.mx/.../2025/02/Aviso_Privacidad_Integral_IIEG_01_2025.pdf`,
el PDF de enero de 2025. El IIEG publicó la versión de junio en otra ruta y retiró la anterior, así
que el enlace llevaba meses respondiendo **404** — desde la pantalla de aceptación de términos,
donde se pide aceptar condiciones cuyo aviso no se podía leer, y desde el pie de `CardPage`.

Ahora apunta a `https://iieg.jalisco.gob.mx/aviso-de-privacidad`, servido desde
una ruta reservada del dominio que el gateway sirve desde acervo. **No lleva fecha a propósito**:
publicar una versión nueva es reemplazar el archivo en el bucket, sin tocar este repo ni los otros
cinco frontends que lo enlazan. La fecha incrustada en la URL es justo lo que causó esta falla.

## [1.58.0] - 2026-08-05

### Agregado: los campos de fecha respetan los límites de la definición

`Calendar` aceptaba `min`/`max` desde que sustituyó al `<input type=date>` nativo y
`DatePicker`/`DateRangePicker` los exponían como `minDate`/`maxDate`, pero nadie se los pasaba: el
renderer dinámico ignoraba por completo esa capacidad y todo campo `date` o `date_range` aceptaba
cualquier fecha, incluida mañana. Ahora `FieldRenderer` lee `validation.minDate` y
`validation.maxDate` de la definición y los traduce con `resolveDateLimit` (`helpers/dateFormat.js`),
que resuelve el literal `hoy` contra la fecha del navegador y descarta un límite mal formado en vez
de propagarlo al calendario.

El caso que motivó el cambio es «que no puedan capturar fechas futuras»: se configura desde el CMS
como límite máximo «Fecha de llenado» y llega aquí como `validation.maxDate: "hoy"`. En un
`date_range` el límite aplica a los dos extremos.

**Lo que queda fuera de rango no se puede alcanzar**, no solo elegir: los días salen
deshabilitados, los meses del selector rápido también, el selector de año ya recortaba su lista, y
las flechas de mes se apagan cuando todo el mes destino cae fuera —así no se navega a un febrero
entero en gris—. La lógica vive en `helpers/calendarRange.js` (`buildRangeGuards`, `saltoDeVista`),
separada del componente, que rebasaba las 300 líneas; el chevron salió a
`components/icons/ChevronIcon.jsx`.

**Aviso en vivo bajo el campo**, con el mismo mecanismo que ya usan los campos de texto para el
patrón y la longitud (`FieldHints`): al abrir el calendario aparece «No se aceptan fechas futuras»
—o «Hasta el 31/12/2025» si el límite es una fecha fija— en gris, y pasa a verde cuando la fecha
elegida cumple. Si el valor queda fuera de rango el aviso se pinta en rojo y **se queda visible
aunque el calendario esté cerrado**, porque ese es el caso que el usuario no puede provocar
haciendo clic pero sí existe: un valor capturado antes de que el admin pusiera el límite. El
`DatePicker` además valida el rango en react-hook-form, así que el envío se detiene con el mismo
texto en vez de esperar al error del servidor.

El calendario es la primera barrera, no la única: mariachi valida los mismos límites al guardar el
envío, así que un valor precargado o un `PUT` armado a mano tampoco pasa.

### Agregado: buscador en los campos de selección con catálogo largo

`Select` tenía el filtrado implementado tras la prop `enableSearch` desde hace varias versiones,
pero ningún llamador la encendía. Ahora `Select` y `SelectMultiple` deciden solos: a partir de 8
opciones el campo se vuelve escribible y filtra por etiqueta conforme se escribe, sin distinguir
mayúsculas ni acentos sobrantes, y muestra «No se encontraron opciones» cuando nada coincide. La
prop sigue existiendo para forzar o apagar el buscador en un caso puntual.

**El buscador es el campo, no una fila extra.** El control principal pasa a ser un `<input>`
(`components/SelectSearchInput.jsx`) en lugar de un `<span>` con la etiqueta, así que escribir no
roba una línea al desplegable. Al elegir una opción su etiqueta **sobrescribe** lo tecleado y el
filtro se suelta: la lista vuelve completa con la opción marcada, para no perder la referencia de
dónde quedó la selección. El foco entra solo al input al abrir, `Enter` toma la primera
coincidencia y `Escape` cierra; con menos de 8 opciones el control sigue siendo el `<span>` de
antes, con su manejo de `Enter`/espacio.

**Al reabrir, el campo se vacía y la etiqueta elegida pasa a ser el placeholder**, en morado. Así
se escribe la siguiente búsqueda de una vez, sin borrar a punta de retroceso lo que quedó escrito,
y la selección sigue a la vista. El estado distingue tres situaciones con un solo valor:
`searchTerm === null` es «no se está buscando» (el input muestra la etiqueta), `''` es «abierto sin
teclear» (input vacío, lista completa) y cualquier otro texto filtra.

**La opción seleccionada se resalta en morado** (`text-[#5C2472]` sobre `bg-[#FBF1FF]`, los mismos
tonos de las etiquetas del selector múltiple) en vez de solo ponerse en negrita.

**La lista se despegó del campo**: baja 8 px y ambos tienen esquinas redondeadas completas, así se
alcanza a ver la sombra del control. Antes iba pegada, con el campo en `rounded-t-lg` y la lista en
`rounded-b-lg` para simular una sola pieza.

En `SelectMultiple` el input va **junto a las etiquetas ya elegidas** y se vacía tras cada
selección sin cerrar la lista, que es como se encadenan varias.

De paso se corrigió que al elegir una opción el desplegable se quedaba abierto: el clic burbujeaba
del `[role=option]` al contenedor, que lo volvía a abrir en el mismo evento. Antes no se notaba
porque `handleSelect` no cerraba nada y el toggle del padre hacía las veces de cierre.

Aplica retroactivamente a los formularios ya publicados —el umbral se calcula sobre las opciones
que el campo termina resolviendo, vengan inline o de un catálogo— y no cambia el contrato de la
definición: nadie tiene que editar nada en el CMS. El umbral y el filtro viven en
`helpers/selectSearch.js` y el input en `components/SelectSearchInput.jsx`, compartido por ambos
componentes.

### Cambiado: el textarea se despliega al enfocarlo

Un campo `textarea` se dibujaba con una sola fila y había que pulsar el botón de expandir para ver
las ocho. Ahora se despliega solo al enfocarlo y vuelve a una fila al salir, que es el
comportamiento que ya insinuaba el botón. El botón sigue ahí y **gana mientras el campo está
enfocado**: sirve para contraer sin salir del campo. Los campos de una línea no cambian —su
expansión sigue siendo manual y solo aparece cuando el texto desborda.

### Corregido: el manifest y los favicons se pedían a la raíz del dominio

`index.html` enlazaba `/site.webmanifest`, `/favicon.svg`, `/favicon-96x96.png` y
`/apple-touch-icon.png` con rutas absolutas a la raíz. En producción el `dist` se sirve bajo
`/sieej/`, así que esas peticiones no llegaban a nuestros archivos sino a `location /` del gateway
—que desde el 2026-07-31 es **sitio2026**—: la consola mostraba un 404 y, para el manifest, un
`Manifest: Line: 1, column: 1, Syntax error`, porque el navegador recibía HTML donde esperaba JSON.

Los `href` pasan a `%BASE_URL%…`, el marcador que Vite sustituye por el `base` del build
(`VITE_BASE_PATH`), y los iconos declarados dentro de `site.webmanifest` pasan a rutas relativas
(`./web-app-manifest-192x192.png`), que el navegador resuelve contra la URL del propio manifest. En
dev (`base: /`) el resultado es idéntico al de antes.

## [1.57.0] - 2026-07-31

### Cambiado: el «+» de las listas repetibles y el botón de quitar archivo

El botón que agrega elementos —pestañas— en un step `repeater` (otra base de datos, otro enlace)
dibujaba el signo como un carácter tipográfico a `text-lg`: dentro de un círculo de 30 px el glifo
se leía diminuto y descentrado. Ahora es un SVG de 24 px con trazo de 3
(`components/icons/PlusIcon.jsx`, mismo patrón que `ClearIcon`) en un círculo de 38 px sin borde,
así que el ícono ocupa el botón y hereda el color en hover.

Su tooltip —y su `aria-label`— dejan de decir «Agregar» a secas y nombran lo que se va a crear,
reusando el `itemLabel` con que la definición ya etiqueta cada pestaña: «Agregar Base de datos 3»
para el siguiente elemento. Sin `itemLabel`, cae al título del paso («Agregar otro elemento a
"Bases de datos"»). `renderItemLabel` pasó a exportarse desde `repeaterItems.js`.

**Por qué lleva `p-0!` y `border-[#5C2472]!`:** `index.css` declara `button { padding: 0.6em 1.2em;
border: 1px solid transparent }` **fuera de toda capa**, y en la cascada las reglas sin capa ganan a
cualquier `@layer` — o sea, a todas las utilidades de Tailwind 4. Con ~19 px de padding por lado en
un botón de 38 px, el SVG (que sí encoge como flex item, a diferencia del glifo de texto que había
antes) quedaba aplastado hasta desaparecer, y el borde se pintaba transparente en vez de morado. Es
el mismo motivo por el que `FieldClearButton` ya usaba `border-none!` y `p-0!`. Los íconos llevan
además `shrink-0`. La regla global no se tocó: la usan todos los botones de `components/Button.jsx`.

El archivo ya cargado en un campo `file` se quitaba con un emoji ❌, que se veía distinto en cada
sistema operativo y no comunicaba «eliminar». Lo sustituye un bote de basura
(`components/icons/TrashIcon.jsx`, el mismo trazo de `ico_borrar.svg`) con `aria-label` y `title`.

### Corregido: el Dragger anunciaba formatos que no eran los del campo

El recuadro de subida decía siempre «(Formato permitido csv, xlsx y pdf)», un texto fijo heredado
del wizard original, aunque el campo aceptara otra cosa. Ahora la lista se arma con el `accept` que
manda la definición y desaparece cuando el campo no restringe extensiones. Sin esto, un campo
configurado para GeoPackage (mariachi 1.118.0) seguiría diciendo que solo acepta csv, xlsx y pdf.

También se quitó el `accept = 'image/*'` que el componente aplicaba por omisión: un campo `file`
sin `accept` en la definición abría el diálogo del navegador filtrando imágenes, cuando el CMS
promete —y el backend valida— que vacío acepta todos los formatos.

## [1.56.0] - 2026-07-30

### Eliminado: Sentry, con un ErrorBoundary propio en su lugar

Sentry se retiró del ecosistema el 2026-07-22 por costo y en MapaLab se eliminó en su 1.97.0, pero
SIEEJ seguía cargando `@sentry/react` 10 en el bundle. Se van la dependencia, el `Sentry.init()`
de `main.jsx`, la variable `VITE_SENTRY_DSN` (del `.env.example`, los dos compose, el `Dockerfile`
y los `.env` locales) y sus menciones en README y `docs/frontend.md`.

Lo que sí hacía falta conservar era el `Sentry.ErrorBoundary` que envolvía la aplicación: sin él,
un error de render deja pantalla blanca. Su lugar lo toma `components/RootErrorBoundary.jsx`,
mismo patrón que el de MapaLab —`getDerivedStateFromError` + `componentDidCatch` que loguea a
consola—, renderizando el `ErrorPage` que ya existía. Cubierto por dos tests nuevos.

### Corregido: `ErrorPage` reventaba fuera de un data router

`ErrorPage` llamaba a `useRouteError()`, que hace `invariant` sobre el contexto del data router y
**lanza** cuando no lo hay. SIEEJ usa `BrowserRouter` con `<Routes>`, no `createBrowserRouter`, así
que el hook fallaba siempre: tanto en la ruta `/error` como en el fallback del ErrorBoundary, que
era justo el camino que debía atrapar el fallo. El error se veía como pantalla blanca en vez de la
pantalla de error.

El hook se retiró: el error llega por prop desde el boundary, que es como ya lo esperaba el
componente (`error ?? routeError`, donde la prop tenía precedencia).

### Cambiado: React Router 8 por el advisory GHSA-qwww-vcr4-c8h2

El advisory (bypass de CSRF que permite ejecutar acciones antes de un 400) cubre `>=7.12.0 <8.3.0`:
no hay corrección dentro de la línea 7. Sube a 8.3.0. El agujero está en el modo RSC, que SIEEJ no
usa; la migración no tocó imports, porque el repo ya tenía prohibido `react-router-dom` por regla
de ESLint y ese es el paquete que desaparece en la v8.

## [1.55.0] - 2026-07-30

### Cambiado: Vite 6 a Vite 8 con Rolldown, y React 19.2.8

SIEEJ era el repo más rezagado del ecosistema: seguía en Vite 6 y `@vitejs/plugin-react` 4 cuando
el resto ya estaba en 7 y 5. Sube directo a **Vite 8**, que reemplaza esbuild y Rollup por
**Rolldown** (bundler en Rust) y **Oxc**. El build pasa de **1.36 s a 193 ms** y el dev server
arranca en 155 ms. Suben con él `@vitejs/plugin-react` a 6.0.5, React y React-DOM a 19.2.8,
Vitest a 4.1.10 y Tailwind a 4.3.3.

De los dos majors saltados, el único cambio con efecto real es el piso de navegadores: el
`build.target` por defecto sube a Chrome 111, Edge 111, Firefox 114 y Safari 16.4. El plugin
`sieej-ontoy` no necesitó cambios —`generateBundle` y `emitFile` funcionan igual en Rolldown— y
`dist/ontoy.json` se sigue emitiendo con la versión del `package.json`.

El chunking se migró de `manualChunks` a `build.rolldownOptions.output.codeSplitting.groups`, con
`vendor-react` en la prioridad más alta: los grupos de Rolldown arrastran las dependencias de lo
que capturan, así que con el orden anterior React habría terminado dentro de `vendor-form`. Los
tres chunks quedan como estaban (`vendor-react` 190 kB, `vendor-router` 34 kB, `vendor-form`
32 kB).

El CSS ahora lo minifica Lightning CSS en vez de esbuild y sale **10 kB más pequeño**. Los 94
tests siguen pasando.

Requiere reconstruir la imagen del frontend. El cambio de bundler cambia todos los hashes de los
assets: conviene desplegar fuera de horario pico.

## [1.54.0] - 2026-07-30

### Cambiado: Makefile homologado con el resto del ecosistema

La interfaz de comandos es ahora la misma en los nueve repos: `up` levanta desarrollo sin
reconstruir y `deploy` hace produccion completa (`git pull` + `down` + `build` + `up`). Se
retiraron todas las banderas: el entorno se detecta por el nombre de proyecto de Compose y lo que
antes era un argumento ahora es un selector interactivo. Lo transversal vive en `make/common.mk` y
`make/lib.sh`, copiados en cada repo. Convencion completa en `ecosistema/makefiles.md` del repo de
contexto.

### Cambiado: `dev` pasa a `up`, y `build` a `deploy`

`deploy` sigue sin levantar servicios: construye el `dist` que sirve gateway-hub, y ahora recuerda
al terminar que hay que recargar el gateway. `ensure-env` pasa a llamarse `setup`.

---

## [1.53.3] - 2026-07-30

### Se va la documentacion de un staging que nunca existio

`docs/CONTRIBUTING.md` documentaba `make staging` y `make down-staging`, y el `.env.example`
sugeria copiarse a `.env.staging`. Ninguno de esos targets existio nunca en el Makefile de este
repo, y el entorno staging se retiro de todo el ecosistema.

#### Eliminado

- El bloque de comandos `make staging` / `make down-staging` de la guia de contribucion.
- `.env.staging` del `.gitignore` y de las instrucciones de copia del `.env.example`.

#### Cambiado

- Los encabezados y notas que decian «staging/produccion» ahora dicen solo «produccion», que es
  donde el `dist/` lo sirve gateway-hub en `/sieej/`.

---

## [1.53.2] - 2026-07-30

### Alturas parejas en la reja de campos

#### Cambiado

- **Todos los campos miden lo mismo.** El hueco del mensaje bajo el control se reserva siempre, no
  solo en los campos con reglas, asi que una reja de campos ya no mezcla dos alturas segun quien
  tenga algo que decir. Como el hueco suma altura, el margen inferior de la celda baja de 16 a
  8 px. La reserva vive en `ErrorsRequired`, que ya usaban los ocho componentes de campo, de modo
  que ninguno necesito tocarse.
- En escritorio la barra del titulo conserva el aire necesario para que el titulo del paso quede a
  la altura del titulo del panel lateral, descontando los 2 px que el centrado vertical con los
  botones desplaza al titulo.

#### Corregido

- El titulo del paso no quedaba centrado con los botones: `space-y-4` seguia aplicando cuando la
  barra pasa a fila en pantallas medianas, y empujaba los botones 16 px hacia abajo. La separacion
  vertical ahora se limita a movil y en fila se usa `gap`.

---

## [1.53.1] - 2026-07-30

### Los campos de texto largo se comportan como los demas

Ajustes sobre la 1.53.0 tras probarla: el area de texto desentonaba con el resto de campos y sus
botones se peleaban con el contenido.

#### Cambiado

- En reposo un campo de texto largo ocupa lo mismo que uno normal (40 px, una sola linea); crece
  solo cuando el usuario lo pide.
- La barra del titulo del paso pierde el aire de mas: pasa de 40 px arriba y 20 abajo a 24 px
  simetricos.
- El asterisco de campo obligatorio pasa a rojo, el mismo de los mensajes de error.

#### Corregido

- **El texto del area de texto se metia debajo de los botones.** El espacio reservado a la derecha
  se daba con `padding`, pero un `<textarea>` con `overflow: hidden` recorta en el borde del
  *padding box*, no del content box, asi que el texto se dibujaba encima de la equis y del boton de
  expandir (el `<input>` se salvaba porque su elipsis corta antes). Ahora la caja de una sola linea
  hace que el texto respete la reserva y la segunda linea quede fuera. Los botones ganan realce al
  pasar el cursor para distinguirlos del contenido.
- **El boton de expandir parpadeaba sin parar** al dejar el cursor sobre el. El borde solo existia
  en `:hover` y, al ser `border-box`, restaba 2 px a la caja de contenido: con la linea ocupando
  el alto completo eso fingia un desbordamiento. El ciclo se realimentaba solo — cursor sobre el
  campo, aparece el boton bajo el cursor, el campo pierde el `:hover`, se va el borde, ya no
  desborda, desaparece el boton. Ahora el borde existe siempre en transparente y solo cambia de
  color, la linea deja libres esos 2 px, y la medicion tiene banda muerta. De paso desaparece el
  salto de 2 px que daban todos los campos al pasar el cursor.

---

## [1.53.0] - 2026-07-30

### Capturar formularios largos deja de estorbar

Nueve ajustes sobre el llenado de formularios. El hilo comun: los campos de texto largo eran
ilegibles, no habia forma de retirar una respuesta ya dada, y las senales de «esto cambio» usaban
el morado primario y hablaban en identificadores internos.

#### Agregado

- **Campos de texto expandibles.** Cuando el contenido no cabe aparece un boton que expande el
  campo a un area de texto multilinea editable, y vuelve a contraerlo. Sin foco, un campo
  desbordado muestra el inicio del texto con puntos suspensivos en vez de dejar el final a la
  vista.
- **Limpiar campo.** Los campos con respuesta muestran una equis al pasar el cursor (o al llegar
  con el tabulador) que los deja sin respuesta. Vive en `FieldClearButton` y el hook
  `useFieldClear`, asi que aparece en cualquier lugar donde se reutilicen los componentes de campo,
  incluido «Actualizar informacion». Radio y checkbox no llevan equis: se deseleccionan volviendo
  a elegir la opcion activa.
- El diff de definiciones de mariachi ahora viaja con `step_title` y `field_label`, y el aviso de
  actualizacion los usa. Los campos y pasos eliminados solo se pueden nombrar en el momento del
  diff, porque el snapshot del envio ya fue reescrito con la definicion vigente.

#### Cambiado

- **Las reglas del campo solo se ven mientras se edita.** El formato exigido, el minimo y el
  contador aparecen al enfocar; los errores siguen visibles siempre que existan, incluidos los de
  formato al salir del campo, que antes quedaban ocultos.
- Las marcas de cambio pasan al naranja institucional: punto pulsante del aviso, punto de los pasos
  y de las sub-pestanas, y distintivo de cada campo. En los campos queda solo la etiqueta de texto.
- El boton «Entendido» del aviso usa el boton primario en vez del verde plano.
- El distintivo «Actualizado» se movio de encima de la reja de campos a la misma fila del titulo
  del paso; en movil cae a su propia fila. Los pasos repetidores tambien lo muestran.
- Titulo y descripcion se alinean arriba en las tarjetas de «Mis formularios».
- El area de contenido gana el mismo margen inferior que hay entre la pagina y el encabezado, para
  que al llegar al final del scroll no quede pegada al borde.

#### Corregido

- **El placeholder salia como `[object Object]`.** `FieldRenderer` pasaba el distintivo de cambio
  incrustado en la etiqueta, y `Input` usa la etiqueta como placeholder de respaldo cuando la
  definicion no trae uno; React serializaba el elemento al atributo. El distintivo viaja ahora en
  su propia prop (`badge` en `Typography`) y la etiqueta vuelve a ser siempre texto. Se veia, entre
  otros, en «Nombre del ente de gobierno».
- **Los campos de tipo `textarea` nunca fueron multilinea.** Se renderizaban como
  `<input type="textarea">`, un tipo que no existe en HTML y que el navegador degrada a una sola
  linea. Ahora son un `<textarea>` real.

---

## [1.52.3] - 2026-07-29

### Una sola fuente de verdad para la version, y el contexto al repo central

Solo documentacion y metadatos; sin cambios en el frontend.

#### Corregido

- **Dos fuentes de verdad para la version.** `docs/CONTRIBUTING.md` declaraba que el `VERSION` de
  la raiz era la autoritativa y que `frontend/package.json` debia «mantenerse sincronizado», pero
  el `/ontoy` que consume huachicol lo genera el plugin de Vite **desde `package.json`**, y nada
  leia `VERSION` (ni el CI, ni el Makefile, ni scripts). El resultado era drift recurrente: hoy
  `VERSION` decia 1.52.1 con `package.json` en 1.52.2, y ya habia pasado antes (ver 1.12.1). Se
  elimina el archivo `VERSION`, `package.json` queda como unica fuente y CONTRIBUTING lo refleja.
- El README fijaba la version en el texto; ahora apunta a `frontend/package.json`.

#### Eliminado

- `docs/context.md`, `plataforma-formularios.md`, `taiga.md` y `gateway.md`. Viven ahora en el
  repositorio central de contexto (`iieg-oficial/context-ame-esta`): el contexto y la plataforma de
  formularios en `repos/sieej/`, el contrato de enrutamiento en `ecosistema/contratos.md`, y la
  guia de Taiga —unica, con las credenciales fuera de git— en `ecosistema/taiga.md`.

---

## [1.52.2] - 2026-07-29

### Corregido: problema con los campos condicionados

`FormStep.jsx` se cambio el hook para poder refrescar conforme a los estados que
se necesitan.

---

## [1.52.1] - 2026-07-28

### Documentación: el constructor visual gana líneas y relaciones entre campos

`plataforma-formularios.md` describe el constructor del CMS, así que suma lo que
llegó del lado de mariachi (1.98.0–1.99.0) sin tocar el renderer: manejar líneas
como unidad —subir, bajar, unir con la de arriba y partir por un campo— y la
relación navegable entre un campo con `showWhen` y su disparador, con aviso
cuando la condición queda rota. Lo que se guarda en la definición no cambia:
sigue siendo `layout.newRow`, `layout.col` y `showWhen`. Sin cambios de código.

---

## [1.52.0] - 2026-07-28

### Cambiado: la línea de un campo la declara la definición, ya no se deduce

`layout.newRow` pasa a ser la **marca de inicio de línea**: un campo con la marca
abre línea aunque su columna quepa a la derecha del anterior. Antes la marca solo
valía en la columna 1 y se ignoraba en el resto, así que la línea era implícita —
se deducía comparando la columna pedida contra la ya ocupada, y el orden de los
campos, no la definición, decidía dónde cortaba cada línea.

Eso hacía que un cambio en un campo re-particionara todo lo que venía después: en
el CMS, mover o ensanchar uno desplazaba líneas enteras que nadie había tocado.
Con la línea declarada, el renderer reproduce exactamente el acomodo del editor
también en esos casos.

Las definiciones anteriores se ven igual: sin la marca, un campo cuya columna
quedó atrás del cursor abre línea como siempre. El contrato del backend no cambia
—`newRow` ya era un booleano válido—, así que no hay migración.

Tres casos nuevos en `test/fixtures/layoutContract.js`, verificados también del
lado del CMS. Va de la mano de mariachi **1.96.0+**.

---

## [1.51.1] - 2026-07-28

### Documentación: el acomodo explícito del constructor visual

`plataforma-formularios.md` describía el constructor del CMS sin el modelo de
acomodo que ahora comparten los dos repos: que el editor fija la columna de todos
los campos visibles antes de cada cambio (así cambiar un ancho no mueve a los
demás, a costa de que la definición guarde `layout.col` en todo el paso) y que
los espacios libres son zonas soltables durante el arrastre, salvo los que no
alcanzan para el campo más angosto. Sin cambios de código.

---

## [1.51.0] - 2026-07-28

### Corregido: el acomodo que se elige en el CMS es el que se ve al capturar

Un campo marcado «reservar la línea solo para este campo» seguía compartiendo
línea con el anterior. La marca se traducía a `md:col-end-7`, que impide vecinos
por la derecha pero no por la izquierda: si el campo previo dejaba hueco, el
navegador metía ahí el campo que tenía la línea reservada. En una batería de 10
acomodos que el propio editor genera, **6 se veían distintos** de como los
mostraba el CMS.

La causa de fondo es que el renderer emitía las clases de cada campo y le dejaba
**el corte de líneas al auto-placement del navegador**, mientras el editor lo
decidía con su propio modelo. Coincidían mientras todo fluyera y divergían en
cuanto había posición explícita.

- `helpers/gridLayout.js` agrupa los campos en líneas con el **mismo algoritmo
  que el editor** (`groupIntoRows`) y `layoutSlots` emite la secuencia a
  renderizar: cada campo con su columna y, entre ellos, rellenos que cierran los
  huecos y completan la línea. El acomodo se calcula, ya no se deduce.
- Los rellenos son `<div aria-hidden>` con `hidden md:block`, así que no existen
  en mobile, donde el grid sigue siendo de una columna.
- Se retira el `md:max-w-[…]` con que se recortaba el ancho de los campos de
  línea reservada: con la línea completa por rellenos, el ancho es exactamente
  el declarado. Antes, una posición no alineada al ancho lo dejaba más ancho de
  lo elegido.
- El agrupamiento corre sobre los campos **visibles**, así que un campo oculto
  por `showWhen` no deja hueco: la línea se recompone.
- `test/fixtures/layoutContract.js` fija el contrato con 15 acomodos y lo
  verifican los dos repos contra su propia implementación.

Va de la mano de mariachi **1.95.0**; conviene desplegarlo junto con él.

### Corregido: `/sieej/ontoy` reportaba una versión de hace dos meses

`public/ontoy.json` estaba escrito a mano con `1.14.0` (2026-05-28) y nadie lo
regeneraba, así que el endpoint que consulta el dashboard de plataformas de
Mariachi mentía sobre lo desplegado — justo el dato que hace falta para saber si
un arreglo ya está arriba. Ahora lo emite el build desde la versión del
`package.json`, con la fecha del build.

### Cambiado: un componente sin `colSpan` ocupa la fila completa

`DynamicDiv` tomaba `colSpan = 1` por defecto, que en su escala son 1/6 de la
línea, mientras que en la definición de un formulario `colSpan: 1` significa
línea completa: el mismo nombre con dos significados opuestos. El default pasa a
las 6 columnas. Se retiran también las props `newRow`/`alone` de los nueve
componentes de campo (la posición ya llega resuelta) y el `colSpanCondicional`,
que no lo usaba nadie.

---

## [1.50.2] - 2026-07-28

### Documentación: la arquitectura de la plataforma vuelve a coincidir con el código

`docs/plataforma-formularios.md` seguía fechado en 1.9.0 / mariachi 0.40.2 y
documentaba cosas que ya no existen. Lo corregido:

- **Endpoint inexistente.** Listaba `GET /formularios/mis-envios` (listado
  paginado), eliminado en mariachi 1.47+ junto con la pantalla «Mis envíos».
  Solo sobrevive el detalle individual.
- **Ruta de los archivos en Acervo.** Describía `{slug}/envio{id}/{uuid}.{ext}`;
  desde mariachi 1.91.1 la clave es legible, con un directorio por campo y sus
  versiones dentro, más el respaldo `envio.json` y el bucket marcado
  `protegido`.
- **Prefijo del API.** `VITE_BACKEND_API_HOST` es `/api/mariachi`, no
  `/api/administrador`.
- **Modelo de datos.** De 8 a 14 tablas: versiones archivadas, periodos,
  historial de valores, bitácora de avisos y los dos índices únicos parciales
  que conviven desde los formularios periódicos.
- **Contrato de la definición.** Se documentan `editableAfterSubmit`,
  `openStart`/`openEnd`/`openCatalog`, `incompleteNotice`, `layout.col` y
  `layout.alone`, y que `email`/`tel` desaparecieron como tipos.
- **Sin documentar hasta ahora.** Tres secciones nuevas — versionado de
  definiciones (`menor`/`rompe`), actualización ligera post-envío y capa de
  compatibilidad de definiciones legadas — más la renovación de sesión, la
  edición concurrente del CMS y la página de catálogos.

`docs/context.md` pasa a 1.50.2 y suma las decisiones de 1.40.0–1.50.0, que no
se habían recogido: renovación de sesión serializada entre pestañas, historial
por campo, acomodo manual, condiciones del campo en vivo y la actualización
post-envío ya sin la limitación a pasos `form`.

Sin cambios de código.

---

## [1.50.1] - 2026-07-28

### Cambiado: el botón «Actualizar información» del resumen aprieta menos su ícono

Con `px-6` a cada lado, la flecha de 18 px quedaba encogida junto a la etiqueta.
El relleno horizontal baja a `px-5`, el ícono sube a 20 px en la variante con
etiqueta y lleva `shrink-0`, así que no se deforma si el contenedor se angosta.

---

## [1.50.0] - 2026-07-27

### Agregado: las reglas del campo se leen y se evalúan mientras se escribe

Un campo con `pattern` o con límites de longitud solo decía algo al fallar la
validación, y el mínimo ni siquiera se validaba en el navegador: el respondent
llenaba a ciegas y se enteraba del formato al intentar avanzar.

- Debajo del input aparece una línea discreta con **las condiciones del campo**:
  el `patternMessage` de la definición, «Mínimo N caracteres» y el conteo
  `escritos/máximo`. Sin valor van en gris; conforme se escribe, cada condición
  se pinta verde al cumplirse y roja mientras no, y el conteo avisa en naranja
  al tocar el tope.
- `validation.minLength` **se registra** en el formulario, así que ya bloquea el
  avance igual que `maxLength` y que el backend.
- El formulario valida en `onTouched` y revalida en cada tecla, así el estado de
  las condiciones es el del dato que se está capturando.
- El error deja de duplicarse: cuando el mensaje ya está dicho por una
  condición, no se repite abajo en rojo.

### Corregido: los campos obligatorios no dejan pasar de paso

- El salto directo a otro paso desde el índice lateral **ya no brinca los
  obligatorios** del paso actual; al intentarlo se avisa qué falta. Regresar a
  un paso anterior sigue siendo libre.
- El **envío** revisa todos los pasos, no solo el visible: si algún paso tiene
  obligatorios vacíos, «Confirmar y enviar» queda deshabilitado y el tooltip
  nombra las secciones pendientes, en vez de mandar el envío al rechazo del
  backend.
- El **borde rojo** del campo con error volvió a pintarse en los formularios
  dinámicos: se leía `errors[name]` con nombres anidados (`paso.campo`), donde
  siempre daba indefinido. Aplica a input, select, select múltiple y radio.

### Corregido: el historial de un campo traduce lo que muestra

El historial imprimía el valor crudo guardado —`true`, `2`, `si_no_aplica`—, que
no es lo que el respondent eligió en pantalla. Ahora formatea con la misma
función que el resumen: resuelve la etiqueta de la opción contra el catálogo o
las opciones del campo, y traduce a «Sí»/«No» las booleanas, incluidas las que
llegan como texto.

### Corregido: el resumen ya no aprieta las respuestas largas

Toda respuesta ocupaba media rejilla, así que una observación de párrafo se
enrollaba en una columna angosta y descuadraba su fila. Un `textarea`, una
selección múltiple o cualquier respuesta de más de 80 caracteres **toma la
línea completa**, las filas se alinean por arriba y el texto respeta los saltos
de línea sin desbordar.

### Corregido: el ícono de actualizar información faltaba en el resumen del envío

En el detalle de un envío enviado, el resumen no recibía la marca de campos
editables, así que el botón «Actualizar» solo salía en el encabezado. Ahora
también cierra el resumen, como en el paso Resumen del formulario.

---

## [1.49.0] - 2026-07-27

### Agregado: el renderizador respeta la posición y la línea reservada de un campo

El editor de formularios de Mariachi (1.94.0) deja colocar un campo en cualquier
parte de su línea —un tercio pegado a la derecha, por ejemplo— y reservarle la
línea entera aunque sea angosto. `DynamicDiv` solo sabía traducir `colSpan` y
`newRow`, así que ese acomodo se perdía al renderizar: el campo salía pegado al
hueco de la izquierda.

- **`layout.col`** se traduce a `md:col-start-{n}`, con `newRow` como su caso
  particular (`col: 1`). Una `col` donde el ancho declarado no cabría se ignora,
  en vez de desbordar la cuadrícula creando una columna implícita.
- **`layout.alone`** extiende el campo hasta el final de la fila
  (`md:col-end-7`) para que nada más quepa, y limita su contenido con
  `md:max-w-[…]` al ancho elegido, así que se sigue viendo angosto. No aplica a
  un campo que ya ocupa la fila completa.
- El cálculo de clases sale a **`helpers/gridLayout.js`**, compartido por
  `DynamicDiv` y `FieldRenderer`, que lo tenían duplicado. Los nueve componentes
  de campo propagan `col` y `alone` hasta `DynamicDiv`.

Va de la mano de mariachi **1.94.0**; conviene desplegarlo antes o junto con él.

---

## [1.48.0] - 2026-07-27

### Corregido: la flecha del botón «Actualizar información» sobre el fondo morado

`UpdateIcon` pintaba con `currentColor` heredado; ahora acepta `className` y el
botón le pasa `text-white!` explícito, así que la flecha es blanca sobre el
morado sin depender de la herencia. Aplica a las dos variantes —la redonda del
detalle del envío y la del paso Resumen con etiqueta—; el ícono de la tarjeta
de la lista conserva su gris.

El resumen también tolera la forma vieja del valor de archivo (`filename`
además de `filename_original`), que es la que quedó en los envíos guardados
antes de homogeneizar el contrato (mariachi api 1.90.0).

---

## [1.47.2] - 2026-07-27

### Documentación: cómo renueva la sesión el frontend

`docs/frontend.md` describía el `AuthContext` con «401 → redirect a
`/inicio-sesion`», que era justo el comportamiento corregido en 1.47.1. Se
actualiza la sección de Auth y se agrega **«Renovación de sesión»**: vidas del
`access_token` (30 min) y del `refresh_token` (8 h deslizantes), que renovar es
responsabilidad del cliente, `postRefresh` + `runExclusiveRefresh`, por qué se
serializa entre pestañas —SIEEJ y Mariachi comparten origen y cookie— y la regla
de que toda petición autenticada pasa por `onFetch`, con `downloadEnvioPdf` como
el caso que la incumplía.

---

## [1.47.1] - 2026-07-27

### Corregido: pedía la contraseña otra vez a la media hora, aunque la sesión dure 8 h

El `access_token` vive 30 min y se renueva con el `refresh_token` (8 h
deslizantes) llamando a `POST /autenticacion/refrescar`. SIEEJ nunca hacía esa
llamada: ante cualquier 401, `handleFetchWithAuth` borraba el CSRF y mandaba a
`/inicio-sesion`. En los accesos del gateway se ve el contraste — desde
`/mariachi/...` un 401 va seguido de `refrescar` 200 y la petición se reintenta;
desde `/sieej/...` el 401 iba seguido de `iniciar-sesion`.

- Ante un 401 se intenta renovar una vez y se reintenta la petición original;
  sólo si la renovación falla se limpia la sesión y se va al login. Los propios
  endpoints de auth quedan excluidos para no ciclar.
- `handleCheckAuth` hace lo mismo al arrancar la app, que era el caso de
  «recargo la pestaña y me pide contraseña».
- `runExclusiveRefresh` (`helpers/sessionRefresh.js`) serializa la renovación
  entre pestañas con `navigator.locks` y una marca en `localStorage`: SIEEJ y
  Mariachi comparten origen y cookie, y si ambas rotan el mismo token a la vez
  la detección de reúso del backend revoca la familia y las saca a las dos.
- `downloadEnvioPdf` usaba `fetch` directo, fuera del interceptor: la descarga
  del PDF fallaba con la sesión expirada en lugar de renovar. Ahora pasa por
  `onFetch` como el resto de los servicios.

---

## [1.47.0] - 2026-07-27

### Cambiado: historial más pegado a su campo

La separación entre el campo y su historial baja a la mitad (`mt-3` → `mt-1.5`)
y se retira el separador entre campos: la sangría del historial ya deja claro de
qué campo cuelga.

---

## [1.46.0] - 2026-07-27

### Cambiado: acabado visual del historial por campo

- Se retira la barra vertical de la izquierda; cada entrada abre con un guion
  naranja (`#FF8300`) como viñeta.
- El botón de historial toma la paleta naranja (`#FF8300` con fondo `#FEDAB2`
  al abrir o al pasar el cursor), la misma de los distintivos de cambio.
- El separador deja de ir entre entradas y pasa a ir **entre campos**, visible
  solo mientras ese historial está abierto.
- La flecha `→` se sustituye por el chevron `ico_rigth_arrow_dark` que ya usa el
  wizard.
- Encabezado discreto «Historial» antes de las entradas.

---

## [1.45.0] - 2026-07-27

### Corregido: el ícono del botón de historial era invisible por el CSS global de `button`

`index.css` aplica `padding: .6em 1.2em` y `border: 1px solid transparent` a
**todo** `button`, fuera de `@layer`, así que gana a las utilidades de Tailwind
(que sí están en capas). Con `w-7 h-7` fijos, ese padding no dejaba caja para el
SVG y el ícono no se veía. Va con `p-0!` y `border-0!`, como el resto de los
botones-ícono del proyecto. Los tests en jsdom no lo detectaban porque no
aplican layout: `test/campoConHistorial.test.jsx` cubre ahora que el botón y su
`<svg>` existen y que el historial se despliega al pulsarlo.

### Cambiado: historial más compacto y encabezado más limpio

- Cada entrada del historial es **una fila**: `valor anterior → valor nuevo` a la
  izquierda y la fecha a la derecha. Se retira el nombre del campo de cada
  entrada (ya no hace falta: el historial cuelga de su propio campo) y el
  bloque de fecha que iba arriba. En mobile la fila se apila en columna.
- Se retira el botón «Listo»: cuando lo único editable son archivos no hay nada
  que guardar (se aplican al subirlos), así que el botón no aparece. «Guardar
  cambios» sigue para los campos de valor.
- El ícono del tooltip del título usa el soporte nativo de `Typography`
  (`tooltip=`), que lo alinea verticalmente con el título y lo separa más.

---

## [1.44.0] - 2026-07-27

### Cambiado: historial por campo, tooltip en portal y ajustes de mobile

- **Historial por campo**: en vez de una lista al final de la pantalla, cada
  campo con cambios previos muestra un botón de reloj a su izquierda que
  despliega **su** historial justo debajo. El botón solo aparece si ese campo
  tiene cambios.
- **Tooltip**: el panel se renderiza en un portal a `document.body` con posición
  fija calculada contra el rect del disparador y acotada al viewport (`z-[999]`).
  Antes era `absolute` dentro del contenedor `sticky` del título, así que
  quedaba recortado y podía salirse por arriba de la pantalla. El ancho pasa a
  `min(406px, 100vw-16px)` y el panel voltea abajo si no cabe arriba. Aplica a
  todos los tooltips de la app, incluidos los de los campos.
- La pantalla de actualización se renderiza **siempre en lista**: ignora el
  `colSpan` de la definición y da a cada campo el ancho completo.
- En mobile se retira el botón de guardado del encabezado (el enlace de volver
  basta) y se agrega separación entre «Mis formularios» y el header en las
  pantallas de formulario, detalle y actualización.

---

## [1.43.0] - 2026-07-27

### Agregado: historial visible para el respondent + encabezado sticky en «Actualizar información»

El endpoint `GET /formularios/mis-envios/:id/historial` existía desde 1.33.0 pero
solo lo consumía el admin: quien captura no tenía forma de ver qué había
cambiado ni cuándo. Ahora la pantalla de actualización cierra con **Historial de
cambios** (`HistorialCampos`), de solo lectura: campo, valor anterior tachado →
valor nuevo y fecha. Se recarga al reemplazar un archivo, que es el cambio que
se aplica sin pasar por el botón.

- El párrafo de ayuda pasa a ser **tooltip del título**, que deja de robar
  espacio en la parte fija de la pantalla.
- El botón de guardado sube al encabezado, alineado a la derecha del título, y
  queda **sticky** junto con él. Se retira «Cancelar»: el `BackLink` de arriba
  ya vuelve al detalle del envío.

---

## [1.42.0] - 2026-07-27

### Agregado: la pantalla de actualizar acepta archivos y campos de listas repetibles

`EnvioActualizar` solo listaba campos de valor de pasos `form`: los marcados como
editables que fueran archivos o vivieran en una lista repetible no aparecian, y
la pantalla decia «No hay campos actualizables» aunque el formulario los tuviera.

- Los campos de un **repeater** se listan por elemento, con el titulo del paso y
  la etiqueta del item (`Bases de datos · Elemento 2`), y el nombre del campo es
  el path con indice que espera el backend.
- Los campos de **archivo** se rendean con el mismo Dragger del formulario y se
  reemplazan al soltarlos (`actualizarArchivoEnvio`), sin esperar al boton: el
  resto de los campos si se guardan con «Guardar cambios». Cuando lo unico
  editable son archivos, el boton dice «Listo».
- `editableFields.js` se alinea con el backend: excluye solo `info` y los pasos
  de resumen.

Requiere mariachi api >= 1.88.0.

---

## [1.41.0] - 2026-07-27

### Agregado: acceso a «Actualizar información» desde la lista y desde el resumen

Cuando un formulario enviado tiene campos marcados como editables tras el
envio, el acceso a `/mis-envios/:id/actualizar` solo existia en el detalle del
envio. Ahora aparece tambien:

- en la **tarjeta de la lista**, a la izquierda del icono de descargar PDF
  (usa `tiene_campos_editables` del listado — requiere mariachi api >= 1.87.0);
- en el **paso Resumen**, a la izquierda de «Descargar PDF», cuando el envio ya
  fue enviado.

El boton vive en `UpdateFieldsButton` (variante icono y variante con etiqueta) y
la deteccion de campos editables en `editableFields.js`, que reemplaza la copia
local que tenia `EnvioDetalle`. De paso, el paso Resumen ya recibe el `envioId`
del envio enviado, asi que el boton de PDF que estaba condicionado a ese dato
tambien aparece ahi.

---

## [1.40.0] - 2026-07-27

### Corregido: un tipo de campo desconocido ya no rompe el formulario

`FieldRenderer` pintaba «Tipo no soportado: X» ante cualquier tipo que no
estuviera en su `switch`. Un formulario en produccion con tipos historicos
(`email`, `tel`) o con un snapshot anterior a un cambio de contrato perdia el
campo: no se podia capturar ni corregir.

Ahora `email` y `tel` se renderean como texto (que es lo que son desde que se
absorbieron en `text` + `validation.pattern`) y cualquier otro tipo desconocido
cae al mismo input en vez de a un mensaje de error. El backend normaliza las
definiciones antes de servirlas (mariachi api >= 1.86.0), asi que esto es la
segunda linea de defensa: el formulario se sigue pudiendo llenar aunque llegue
una definicion sin normalizar.

---

## [1.39.0] - 2026-07-24

### Cambiado: en una lista repetible con pestañas, cada campo vive en una sola

Los campos que no declaraban `tab` se pintaban **repetidos en todas las
pestañas** del elemento, mezclados con los de la pestaña activa. `RepeaterStep`
ahora resuelve la pestaña de cada campo con un fallback a la primera cuando el
`tab` falta o apunta a una pestaña que ya no existe, así que:

- cada campo aparece una sola vez, en una sola pestaña;
- un `tab` inexistente deja de hacer que el campo **desaparezca por completo**
  del formulario (antes no coincidía con ninguna pestaña y no se renderizaba
  nunca, aunque fuera obligatorio);
- los envíos con `definicion_snapshot` histórico se siguen viendo completos sin
  migrarlos.

El indicador de cambios sin revisar en las pestañas usa la misma resolución, de
modo que un campo modificado siempre marca la pestaña donde realmente está.

Del lado del CMS (mariachi 1.83.0) desaparece la pestaña «Comunes» del
constructor y `tab` pasa a ser obligatorio en los pasos con pestañas.

---

## [1.38.0] - 2026-07-24

### Ordenamiento del grid: fin de `grid-flow-row-dense` + `layout.newRow`

El grid de 6 columnas dejaba de respetar el orden de la definicion por usar
`grid-flow-row-dense`, que reacomodaba campos hacia atras para rellenar huecos y
rompia tanto el orden visual como el del tab. Se retiro de `FormStep`,
`RepeaterStep` y `EnvioActualizar`; los campos se colocan en orden estricto (si
uno no cabe en la fila, baja y deja el hueco).

Nuevo `layout.newRow`: cuando es `true`, el campo abre una fila nueva
(`md:col-start-1`). Sustituye al hack de campos `info` con label vacio usados
como espaciadores. Requiere mariachi api >= 1.84.0.

---

## [1.35.0] - 2026-07-24

### Apertura periódica de formularios

Un formulario puede abrir una ventana de captura recurrente (mensual,
trimestral, semestral o anual) en lugar de tener una vigencia única, y **cada
periodo genera un envío nuevo**, así que el histórico de cada periodo deja de
sobrescribirse.

En la lista, `FormCard` distingue los formularios periódicos: muestra
«Abierto hasta {fecha}» mientras la ventana está abierta y el distintivo
«Cerrado · próxima apertura {fecha}» cuando no lo está. Los periódicos siguen
visibles con la ventana cerrada, precisamente para poder anunciar cuándo vuelven
a abrir. Consume los campos nuevos `periodico`, `abierto`, `ventana_apertura`,
`ventana_cierre` y `proxima_apertura` de `GET /formularios/`.

El aviso al respondent es esa visibilidad in-app: no hay correo porque el stack
no tiene SMTP. Los avisos de apertura y el reporte de faltantes al cierre van al
creador del formulario y a los administradores por webhook, con bitácora
exportable a CSV/XLSX desde el CMS.

Requiere el backend con apertura periódica (migración `f9a0b1c2d3e4` de
mariachi).

---

## [1.34.0] - 2026-07-24

### Tipos de campo `email` y `tel` absorbidos en `text` + regex

El renderer deja de tratar `email` y `tel` como tipos propios: ahora se definen
como `text` con `validation.pattern`, elegido desde el catálogo de regex del CMS
(correo, teléfono de 10 dígitos, CURP, RFC, código postal, CLABE, etc.) o escrito
a mano. Se eliminaron los `case 'email'` y `case 'tel'` de `FieldRenderer`.

A cambio de tener un solo tipo de texto validado por patrón se pierden dos
detalles menores del input nativo: el filtrado de dígitos en vivo del teléfono
(`normalize="number"`) y el teclado optimizado de correo en móvil
(`type="email"`).

Los formularios existentes se migran del lado backend (migración
`a5b6c7d8e9f1`), que reescribe los campos `email`/`tel` a `text` + `pattern` en
la definición, los snapshots de envío y el historial de versiones. Requiere
mariachi api >= 1.79.0.

---

## [1.33.0] - 2026-07-23

### Actualizacion ligera de campos post-envio

Los campos marcados como **editables tras el envio** (`editableAfterSubmit` en la
definicion, configurable desde el CMS) pueden corregirse sin reabrir todo el
formulario ni pasar por la solicitud de reapertura via Colibri. El envio
permanece en estado `enviado`. Cada cambio queda registrado en un historial de
auditoria (valor anterior/nuevo, quien y cuando) que el admin exporta. Requiere
mariachi api >= 1.75.0.

#### Agregado

- **`pages/EnvioActualizar.jsx`** (nuevo) + ruta `/mis-envios/:id/actualizar`:
  pantalla dedicada que muestra solo los campos editables del envio,
  precargados, y hace `PUT /formularios/mis-envios/:id/actualizar-campos`. Solo
  campos de pasos `form` (repeaters y `file` quedan fuera en esta version).
- **`pages/EnvioDetalle.jsx`**: boton "Actualizar informacion" en el header,
  visible solo si el envio esta `enviado` y su snapshot tiene campos editables.
- **`services/formulariosServices.js`**: `actualizarCamposEnvio` y
  `getMiEnvioHistorial`.

---

## [1.32.0] - 2026-07-20

### Fechas abiertas en el campo date_range

Cuando la definicion marca un extremo como abierto (`openStart` / `openEnd`, configurable desde el CMS), ese extremo acepta una opcion de catalogo en vez de una fecha: `10/02/1992 – NO DETERMINADO`. Requiere mariachi api 1.60.0.

#### Agregado

- **`components/CalendarOptions.jsx`** (nuevo): selector de estatus **dentro** del panel del calendario. Trigger de una linea al pie que despliega la lista hacia arriba, superpuesta sobre la grilla de dias — hacia arriba a proposito, porque el panel ya puede estar cerca del borde inferior de la pantalla. Cuando hay una opcion activa el menu ofrece "Usar una fecha del calendario", que la quita y deja el panel abierto para elegir el dia enseguida.

- **`components/DatePicker.jsx`**: props `options` / `optionValue` / `onSelectOption`. El trigger muestra el texto de la opcion elegida (en morado, como valor seleccionado); elegir un dia limpia la opcion y elegir una opcion limpia la fecha, de modo que el campo siempre tiene una cosa u otra.

- **`forms/renderer/catalogResolver.js`**: `openRangeOptions(field, catalogos)` resuelve las opciones desde `field.openCatalog`, con fallback al catalogo del sistema `estatus_fecha`. Reutiliza `resolveOptions`.

#### Cambiado

- **`components/DateRangePicker.jsx`**: el extremo abierto ya no monta un `Select` aparte debajo del campo — todo ocurre en el calendario. El valor se persiste en `${name}.startOption` / `${name}.endOption` mediante un `<input type="hidden">` registrado, para que react-hook-form lo incluya en el envio sin depender de un componente visible. La obligatoriedad la resuelve el `validate` del campo (que da por satisfecho el extremo si hay opcion), no el `required` de react-hook-form.

- **`forms/renderer/SummaryStep.jsx`**, **`completeness.js`**: el resumen muestra la opcion en lugar de la fecha, y un extremo resuelto con opcion cuenta como capturado para el calculo de completitud del paso.

#### Corregido

- **`components/Calendar.jsx`**: en desktop el panel se abria siempre hacia abajo (`top-full`), asi que cerca del borde inferior de la pantalla quedaba cortado y habia que hacer scroll para verlo completo. Ahora mide el espacio disponible y se ancla hacia arriba (`bottom-full`) cuando no cabe abajo, re-midiendo en `scroll`, `resize` y al cambiar entre vista de dias/meses/años.

- **`index.css`**: los botones perdian la fuente Garet y caian a Inter. El reset `button { font-family: inherit }` vive **fuera** de las cascade layers, y en CSS las reglas sin capa ganan sobre cualquier `@layer` sin importar la especificidad, de modo que le ganaba a las utilidades `font-garet*` (que Tailwind 4 emite en `@layer utilities`). Afectaba a todos los botones de la app; se notaba sobre todo en los numeros y letras del calendario. Se movio **solo** esa declaracion a `@layer base`: el resto del reset (`padding`, `border`, `font-size`, `font-weight`) permanece fuera de capas con la prioridad que tenia, para no alterar el tamaño de los botones en el resto de la aplicacion.

---

## [1.31.0] - 2026-07-17

### Campo date_range con calendario propio

#### Agregado

- **`components/Calendar.jsx`**: componente de calendario 100% propio que reemplaza `<input type=date>` nativo. Panel desplegable en desktop (absoluto bajo el input) y bottom-sheet de ancho completo en mobile (<768px). Selector rapido de mes/año mediante chips, navegacion por flechas (chevrons SVG con color fijo `#5C2472`), y scroll automático al año actual en la vista de años. Respeta `min`/`max`, marca el dia actual con borde morado, y dias seleccionados con fondo morado sólido.

- **`components/DateRangePicker.jsx`**: campo compuesto `date_range` que renderiza dos `DatePicker` en grilla de 1 o 2 columnas (segun viewport). Los sub-inputs no llevan label: usan placeholders fijos `Fecha inicial` / `Fecha final`. Validacion cruzada: si el rango es `required`, ambos extremos son obligatorios; si la fecha final ya tiene valor, la inicial tambien se exige.

- **`helpers/dateFormat.js`**: funciones puras `toISO`, `parseISO`, `formatDisplay`, `todayISO`, `buildDays` para manejo de fechas en YYYY-MM-DD. Calendario empieza en lunes (semana ISO).

- **`helpers/formErrors.js`**: `getErrorMessage` centraliza la resolucion de mensajes de error para campos anidados (incluye soporte para paths con punto como `rango.start` / `rango.end`), reemplazando logica dispersa en `ErrorsRequired.jsx`.

#### Corregido

- **`components/DatePicker.jsx`**, **`components/Calendar.jsx`**: el reset global `button { padding: 0.6em 1.2em }` en `index.css` aplastaba los iconos SVG dentro de botones del calendario (chevrons, cierre). Se fuerza `!p-0` en los botones del calendario para anular el reset del navegador.

---

## [1.30.0] - 2026-07-17

### Visibilidad condicional con varios valores disparadores

#### Cambiado

- **`frontend/src/forms/renderer/conditional.js`**: `evaluarShowWhen` acepta `showWhen.equals` como lista además de string. Un campo condicional se muestra cuando el campo del que depende coincide con **cualquiera** de los valores (OR); si el disparador es de multiselección, el cruce es por intersección. Retrocompatible con las condiciones de un solo valor ya guardadas. El editor que produce estas listas vive en el admin (mariachi).

---

## [1.29.0] - 2026-07-17

### Tooltips de ayuda en los pasos del wizard

#### Agregado

- **`components/Tooltip.jsx`, `components/Typography.jsx`, `forms/components/wizard/NavigateStep.jsx`**: cada paso del wizard puede definir un `tooltip` que se muestra como icono de ayuda junto al título, igual que en los campos. `Tooltip` acepta `placement` ('top' por defecto; 'bottom' en el header del paso para que el mensaje caiga hacia abajo y no lo tape el header sticky ni la barra superior) y `Typography` lo propaga vía `tooltipPlacement`. El popup sube a `z-50`.

#### Corregido

- **`components/Tooltip.jsx`**: el icono de ayuda no se renderizaba con Tailwind v4. El reset global `button {}` de `index.css` vive fuera de `@layer`, así que ganaba sobre las utilities (`p-0`, `border-0`) que en v4 están en `@layer utilities`; el botón tomaba el padding del reset y aplastaba el `<img>` a ancho 0. Se fuerza `!p-0 !border-0` en los botones del Tooltip.

---

## [1.28.0] - 2026-07-16

### La actualización de formularios se aplica sola

El botón **Actualizar formulario** desaparece: cuando el admin publica un cambio que rompe, el respondent ya no decide si migra — al abrir el formulario el frontend aplica la actualización automáticamente y solo se le avisa qué cambió. Las respuestas capturadas se conservan (el backend nunca poda `datos`).

### Cambiado

- **`frontend/src/forms/context/SubmissionContext.jsx`**: al cargar el formulario, si el envío trae `actualizacion_disponible`, se llama `POST /formularios/{slug}/envio/actualizar-version` y se continúa con el envío ya migrado. Lo mismo si la respuesta de un guardado detecta que el admin publicó a media sesión (se aplica y se recarga la definición vigente). Se retira `actualizarVersion` del contexto.
- **`frontend/src/forms/components/wizard/UpdateBanner.jsx`**: pasa de acción a aviso colapsable homologado al diseño de SIEEJ: contenedor pill (`rounded-[20px]`, borde morado 1px, sin sombra) cuyo header completo es clickeable — chevron (`ico_down_arrow`, rota al abrir) + "El formulario se actualizó" en garetbold `#5C2472` + punto pulsante morado (animación `pulse-soft` en `index.css`: se apaga lento, prende rápido). La lista despliega agrupada por paso sobre un bloque gris tipo input (`bg-[#F8F8F8]`, campos indentados, eliminados con tachado, `max-h` con scroll; ahora sobre `cambios_aplicados` en lugar de `cambios_preview`). Al pie, **Entendido** en texto verde `#34A853` sin fondo: marca todos los cambios como vistos mandando los `step_id` como `cambios_vistos` en un guardado silencioso y retira el aviso completo.
- **`frontend/src/pages/FormPage.jsx`**: el aviso se muestra mientras el envío `en_proceso` tenga `cambios_aplicados` sin revisar (antes dependía de `actualizacion_disponible`, que ahora se resuelve solo). Los badges por paso/campo siguen apagándose al interactuar con cada campo.

### Dependencias del backend

- Sin cambios de contrato: mismos endpoints de mariachi-api ≥1.55.0. Desde mariachi-api 1.57.0, cada cambio `rompe` archiva además la definición previa en `sieej.formulario_version` (historial para interpretar los valores de campos eliminados que permanecen en `datos`).

---

## [1.27.1] - 2026-07-14

### Corregido

- **`frontend/src/forms/components/wizard/StepIndicator.jsx`**: el sider marcaba como **Completada** cualquier etapa anterior a la actual (`idx < currentStep`), sin mirar los datos. Al saltar del paso 1 al 5, los pasos intermedios aparecían con palomita verde aunque estuvieran vacíos. El estado ahora sale siempre del `stepsCompleteness` real: **Completada** / **Datos incompletos** / **No iniciada**, y solo el paso actual es **En proceso**.

---

## [1.27.0] - 2026-07-14

### Agregado

- **`frontend/src/components/BackLink.jsx`**: enlace "Mis formularios" con flecha, reutilizado por `FormPage` (sider y encabezado compacto) y `EnvioDetalle`, que antes traía su propio botón.
- **`frontend/src/components/icons/DownloadIcon.jsx`**: ícono compartido por `FormList` y `SummaryPdfButton`.
- **`frontend/src/pages/FormPage.jsx`**: el paso actual se refleja en la URL (`?paso=N`) y se restaura al recargar o al abrir un enlace compartido. `WizardProvider` acepta `initialStep` y marca como visitados los pasos previos.
- **`frontend/src/pages/FormList.jsx`**: etiqueta **Actualización** en las tarjetas con `actualizacion_disponible`, y el botón de contactar al administrador queda disponible en cualquier estado (antes solo en los enviados).
- **`frontend/src/forms/components/wizard/StepIndicator.jsx`**: punto morado en los pasos con cambios que aún no se revisan; se apaga al visitar el paso.

### Cambiado

- **`frontend/src/Routes.jsx`**: `ProtectedRoute` espera a que `AuthContext` resuelva la sesión (`isAuthLoading`) antes de decidir; antes parpadeaba hacia `/inicio-sesion` en cada recarga.
- **`frontend/src/helpers/DynamicDiv.jsx`** y **`FieldRenderer.jsx`**: el `colSpan` de los campos aplica desde `md:`. En móvil todos los campos ocupan el ancho completo en vez de partirse en columnas ilegibles.
- **`frontend/src/forms/renderer/pdf/SummaryPdfButton.jsx`**: botón icónico (solo ícono en móvil, ícono + texto en escritorio) con spinner mientras genera.
- **`frontend/src/components/Dragger.jsx`**: la etiqueta usa `Typography as="label"`, con soporte de `required` y `tooltip` como el resto de los campos.
- **`frontend/src/forms/renderer/RepeaterStep.jsx`**: al cambiar de paso se vuelve al primer item y al primer tab; estilos de las pestañas internas homologados.

### Corregido

- **`frontend/src/forms/renderer/conditional.js`**: `showWhen` sobre un campo `select_multiple` ahora se cumple si el valor seleccionado **está incluido** en el arreglo. Antes se comparaba el arreglo completo como string, así que la condición nunca se cumplía y el campo dependiente no aparecía.

---

## [1.26.1] - 2026-07-13

### Agregado

- **`frontend/knip.json`**: detección de dead code con knip 6. Scripts `check:dead-code` y `check:dead-code:strict` en `package.json`.
- **`frontend/eslint.config.js`**: plugin `eslint-plugin-jsx-a11y` con reglas recomendadas. Reglas `react-hooks` (exhaustive-deps warn, set-state-in-effect/refs/immutability/preserve-manual-memoization off). Bloqueo de imports PNG. Globals Node para archivos de test.

### Cambiado

- **`frontend/src/components/Modal.jsx`**: backdrop con `role="presentation"`; dialog con `onKeyDown`.
- **`frontend/src/components/SelectMultiple.jsx`**: dropdown con `role="combobox"` + `aria-controls`/`aria-expanded` + `onKeyDown`. Tag de remove con `role="button"` + `aria-label` + `onKeyDown`.
- **`frontend/src/components/Tooltip.jsx`**: iconos convertidos en `<button>` accesibles. Overlay full con `role="presentation"` + `onKeyDown`.

### Eliminado

- 6 helpers binarios sin uso: `booleanToString`, `cleanObject`, `compareObjects`, `objectsToStrings`, `objectToFormData`, `stringToBoolean`.
- Constante `yesOrNot` en `CatalogosContext.jsx`.
- Componente `FieldWidth` en `FieldLayout.jsx`.
- Función `getFormularioSchema` en `formulariosServices.js`.
- Dependencias `@testing-library/react` y `@testing-library/user-event` (sin uso con vitest globals).

---

## [1.26.0] - 2026-07-13

### Agregado

- **`frontend/src/services/formulariosServices.js`**: `actualizarVersionEnvio(slug)` → `POST /formularios/{slug}/envio/actualizar-version`. `putEnvio` acepta `cambios_vistos` y lo envía al backend.
- **`frontend/src/forms/context/SubmissionContext.jsx`**: expone `actualizarVersion()` (llama al endpoint y recarga envio) y `marcarVisto(key)` (acumula claves en ref para el siguiente guardado). `guardar` y `enviar` mandan `cambios_vistos` acumulados al backend antes de limpiarlos.
- **`frontend/src/forms/components/wizard/UpdateBanner.jsx`**: banner informativo cuando `envio.actualizacion_disponible`. Muestra "El formulario se actualizó", botón **Ver qué cambió** (lista de cambios por paso/campo con tipo nuevo/eliminado/modificado, resolviendo títulos desde la definición) y botón **Actualizar**.
- **`frontend/src/forms/renderer/FormRenderer.jsx`**: monta `UpdateBanner` arriba del wizard si `envio.actualizacion_disponible`. Calcula `cambiosPorStep` y `labelMap` para propagar a StepRenderer.
- **`frontend/src/forms/components/wizard/StepIndicator.jsx`**: recibe `cambiosAplicados` y muestra un badge naranja con el conteo de cambios por paso en el sider.
- **`frontend/src/forms/renderer/FormStep.jsx`**: chip "Actualizado" en el encabezado si el step tiene cambios. Pasa `cambioField` y `onInteract` a `FieldRenderer` para marcar visto.
- **`frontend/src/forms/renderer/FieldRenderer.jsx`**: recibe `cambioField` y muestra badge "Nuevo"/"Cambió" junto al label. Al enfocar/editar llama a `onInteract` que registra el campo como visto.
- **`frontend/src/forms/renderer/RepeaterStep.jsx`**: mismas marcas visuales que FormStep (chip + badges en campos).

### Dependencias del backend

- Requiere mariachi-api ≥1.55.0 (endpoint `actualizar-version`, campos `actualizacion_disponible`/`cambios_preview`/`cambios_aplicados` en `EnvioResponse`).

---

## [1.25.2] - 2026-07-13

### Corregido

- **`frontend/src/pages/FormPage.jsx`**: se reduce el espacio entre el nombre del formulario y el `StepIndicator` en el sider de ~24px a ~8px. El `space-y-4` del contenedor baja a `space-y-2` y el `Typography as="h1"` recibe `!mb-0` para neutralizar el `mb-4` de la variante.

---

## [1.25.1] - 2026-07-13

### Cambiado

- **`frontend/src/pages/FormPage.jsx`**: se elimina el rótulo genérico «Formulario» del eyebrow en el sider (≥1280px) y en el encabezado compacto (<1280px). El nombre del formulario queda como único título sin texto redundante.

---

## [1.25.0] - 2026-07-13

### Agregado

- **`frontend/src/forms/context/SubmissionContext.jsx`**: ahora expone `nombre` y `descripcion` del detalle del formulario (columnas `formulario.nombre` / `formulario.descripcion`), no solo del `definicion` JSON.
- **`frontend/src/pages/FormPage.jsx`**: el sider (≥1280px) y un encabezado compacto (<1280px con `border-b`) muestran el nombre del formulario como título principal, consultándolo del contexto en lugar del `definicion.nombre`.

---

## [1.24.0] - 2026-07-13

### Agregado

- **`frontend/src/forms/components/wizard/NavigateStep.jsx`**: navegación responsiva con 3 breakpoints usando `screenSize`. Título de sección escala 22→26→30px. Labels completos («Anterior sección»/«Siguiente sección») solo en ≥1536px, cortos en 768–1535px. En <768px los labels van en fila centrada propia.
- **`frontend/src/components/Button.jsx`**: nuevo prop `fit` para ancho según contenido con `px-6` sin `grow`.
- **`frontend/src/helpers/DynamicDiv.jsx`**: modo inline (wrapper que abraza el botón sin grid, preservando el ocultado por `colSpan={0}`).

---

## [1.24.0] - 2026-07-13

### wizard: grid de columnas homologado, encabezado con nombre/descripción y botonera responsive

Ronda de mejoras al wizard de captura. Homologa el ancho de los campos en pasos formulario y repeater, agrega el nombre y descripción del formulario en el encabezado (desktop y móvil), y moderniza la botonera de navegación con labels adaptativos según viewport.

#### Corregido

- **`frontend/src/forms/renderer/FieldRenderer.jsx`**: elimina el envoltorio del badge "Condicionado" del renderer del respondent (ese badge es solo del editor admin de mariachi); los campos condicionales ya no pierden su `col-span`.
- **`frontend/src/forms/renderer/FormStep.jsx`**: el grid de pasos `form` usa `grid-flow-row-dense` para rellenar huecos interiores cuando los `colSpan` de una fila no suman 6.
- **`frontend/src/forms/renderer/RepeaterStep.jsx`**: mismo `grid-flow-row-dense` en el grid del repeater (+ ajuste menor `pt-1`).
- **`frontend/src/components/Radio.jsx`**: elimina la lógica legacy que auto-expandía el `colSpan` a 2 al seleccionar "true"/"Otro" y manipulaba campos `desc_`/`archivo_`/`nombre_`/`url_`; ahora respeta el `colSpan` configurado.

#### Agregado

- **`frontend/src/forms/context/SubmissionContext.jsx`**: expone `nombre` y `descripcion` del detalle del formulario en el contexto.
- **`frontend/src/pages/FormPage.jsx`**: usa `nombre`/`descripcion` del contexto, agrega la etiqueta "Formulario" en el panel lateral (desktop) y un encabezado equivalente en móvil (`xl:hidden`).

#### Cambiado

- **`frontend/src/forms/components/wizard/NavigateStep.jsx`**: reemplaza el flag `isMobile` por `screenSize` de `useGlobal` (`isSmall`/`isFull`); labels adaptativos ("Anterior"/"Anterior sección", "Enviar"/"Confirmar y enviar", "Siguiente"/"Siguiente sección").
- **`frontend/src/components/Button.jsx`**: nueva prop `fit` (ancho según contenido con `w-auto px-6` en vez de ancho fijo).
- **`frontend/src/helpers/DynamicDiv.jsx`**: soporta prop `inline` (usada por `Button fit`): devuelve un `div` sin clases de grid.

#### Por qué bump minor

- Agrega comportamiento visible nuevo (encabezado con nombre/descripción, botonera responsive con labels adaptativos) y corrige el layout de columnas del grid. Compatible hacia atrás. Los envíos ya iniciados renderizan su `definicion_snapshot` congelado (no se ven afectados hasta que mariachi refresque el snapshot).

---

## [1.23.4] - 2026-07-13

### Corregido

- **`frontend/src/forms/renderer/FormStep.jsx`**: agrega `grid-flow-row-dense` al grid de 6 columnas para rellenar huecos que dejaban los campos con `colSpan` mayor a 1, mejorando el acomodo visual.
- **`frontend/src/forms/renderer/RepeaterStep.jsx`**: agrega `grid-flow-row-dense` al grid del repeater y `pt-1` al contenedor para que el header sticky no solape el ring de la pestaña activa.

---

## [1.23.3] - 2026-07-13

### Cambiado

- **`frontend/src/forms/renderer/FieldRenderer.jsx`**: se elimina el envoltorio del badge "Condicionado" en la vista de contestación. Los campos condicionales ahora renderizan directamente como cualquier otro campo, conservando su `col-span` vía `DynamicDiv`. El badge solo aplicaba en el preview del admin (mariachi).

---

## [1.23.2] - 2026-07-13

### Corregido

- **`frontend/src/components/Radio.jsx`**: el radio ahora respeta su `colSpan` configurado. Antes, cuando el valor seleccionado era `'true'`, `additionalInputType` forzaba `col-span-2` ignorando el layout definido, y además escribía campos fantasma `desc_`/`archivo_`/`nombre_`/`url_` en los datos del envío. Se eliminó esa maquinaria.

---

## [1.23.1] - 2026-07-10

## [1.23.1] - 2026-07-10

### forms: correcciones de layout del ancho por columnas

Corrige el render del ancho por columnas (`layout.colSpan`) introducido en 1.23.0 sobre el grid de 6 columnas. En escritorio los campos "Grande" (la mayoría) se veían a 1/6 de ancho; en móvil (`grid-cols-1`) no se notaba.

#### Corregido

- **`frontend/src/helpers/DynamicDiv.jsx`**: agrega `col-span-5`/`col-span-6` al mapa de clases. Los campos "Grande" (`colSpan` 1 → `span 6`) vuelven a ancho completo; antes quedaban sin clase `col-span` (1/6) porque el mapa sólo llegaba a 4.
- **`frontend/src/forms/renderer/FieldRenderer.jsx`**: los campos condicionales conservan su ancho de columna (el envoltorio del badge "Condicionado" ahora lleva el `col-span`, antes lo perdía al meter un `div` extra en el grid). Homologa el ancho de los campos `info` con el resto (mismo mapeo vía `SPAN_CLASS`, elimina la clase dinámica `col-span-${...}`).

#### Cambiado

- **`frontend/src/pages/FormPage.jsx`**: elimina el cálculo y la prop `stepsWithData` que el `StepIndicator` no consumía (un recorrido menos de `steps` por render).
- **`frontend/src/forms/renderer/FormRenderer.jsx`**: quita el envoltorio con padding vertical redundante alrededor del paso.

---

## [1.20.0] - 2026-07-09

### wizard: validación de teléfono/email, navegación en el sider y mejoras de repeater/móvil

Ronda de mejoras de UX del wizard de captura. Cierra el caso del enlace técnico con teléfono inválido que reventaba al guardar/avanzar con un error genérico, hace navegable el indicador de pasos y moderniza el paso lista repetible y la botonera en móvil.

#### Corregido

- **`frontend/src/forms/renderer/FieldRenderer.jsx`**: el campo `tel` valida en cliente (10 dígitos por defecto) y `email` con formato estándar; ambos overridables por `validation.pattern`. Además ahora sí propaga `validation.pattern`/`patternMessage` al `Input` para todos los tipos de texto (antes se ignoraban). Esto bloquea el avance con valores inválidos y evita el 422 del backend al guardar borrador.
- **`frontend/src/pages/FormPage.jsx`**: traduce los mensajes crudos del backend (`telefono invalido`, `email invalido`, `formato invalido`, `requerido`, `fecha invalida`) a textos legibles por campo.

#### Agregado

- **`frontend/src/forms/components/wizard/StepIndicator.jsx`** + **`FormPage.jsx`**: el indicador de pasos es clickeable hacia pasos ya visitados (solo cursor en hover, sin fondo). Rediseñado como timeline: la línea de continuidad se estira a la altura del contenido (abarca los items del repeater) y el título queda centrado verticalmente con el nodo.
- **`frontend/src/forms/renderer/RepeaterStep.jsx`** + **`Tabs.jsx`**: eliminar item pasa a una "X" en la pestaña activa (Tabs habilita el remove en horizontal) y agregar a un botón "+" circular con borde morado pegado a la derecha; se quita el divisor y el título redundante.
- **`frontend/src/forms/components/wizard/NavigateStep.jsx`** + **`assets/icons/ico_rigth_arrow_dark.svg`**: en móvil los 3 botones de navegación son círculos icon-only en una fila; la flecha de "Siguiente" usa una variante oscura solo cuando está deshabilitada.

#### Por qué bump minor

- Agrega comportamiento visible nuevo (navegación en el sider, validación en cliente, botonera móvil) manteniendo compatibilidad. La validación de patrón se homologa con el backend de mariachi (`api 1.49.0`).

---

## [1.17.0] - 2026-06-15

### auth: sesión estable tras cambio de contraseña y acceso denegado legible

Cierra el flujo de primer ingreso de usuarios nuevos (con contraseña temporal) y el caso de usuarios autenticados sin acceso al proyecto SIEEJ. Antes, al actualizar la contraseña la sesión quedaba inválida (401 en `/perfil`) y un usuario sin acceso veía un crudo "Error al cargar formularios / HTTP 403".

#### Corregido

- **`frontend/src/pages/ChangePassword.jsx`** + **`frontend/src/context/AuthContext.jsx`**: tras cambiar la contraseña el backend rota la cookie JWT (su `iat` quedaba anterior a `password_changed_at`, invalidando la sesión). El frontend ahora persiste el `csrf_token` fresco que devuelve el endpoint, reutilizando la constante exportada `CSRF_KEY`. El cambio de backend vive en mariachi (`api 1.40.0`).

#### Agregado

- **`frontend/src/components/AccessDenied.jsx`**: pantalla amable para usuarios autenticados sin acceso al proyecto SIEEJ, con botón de cerrar sesión.
- **`frontend/src/forms/context/FormsContext.jsx`**: expone `errorStatus` además de `error`.
- **`frontend/src/pages/FormList.jsx`**: ante un 403 al listar formularios muestra `AccessDenied` en lugar del error genérico.

#### Por qué bump minor

- Agrega comportamiento visible nuevo (pantalla de acceso denegado) y estabiliza el flujo de cambio de contraseña. Compatible hacia atrás.

---

## [1.16.0] - 2026-06-05

### forms: errores de validación legibles por campo y repeaters con `minItems` sembrados

Mejora la experiencia al responder formularios. Antes, un envío inválido devolvía 422 y el frontend mostraba un "HTTP 422" genérico; además los repeaters con `minItems` quedaban vacíos y provocaban ese mismo 422 sin contexto.

#### Corregido

- **`frontend/src/forms/renderer/RepeaterStep.jsx`**: al montar el repeater siembra los `minItems` ítems vacíos cuando vienen menos. Evita repeaters vacíos que rompían el envío con HTTP 422.

#### Agregado

- **`frontend/src/pages/FormPage.jsx`**: `formatearErrores` traduce el arreglo `detail.errores` del backend a líneas legibles por campo (`Paso › Campo: mensaje`, con índice en repeaters) y las muestra en un modal al guardar, enviar o subir archivo. Tope de 12 líneas con resumen "(+N más)".
- **`frontend/src/services/formulariosServices.js`**: `resolveErrorMessage` arma el mensaje desde `detail.errores` cuando el `detail` no es string, en lugar del genérico "HTTP {status}".

#### Por qué bump minor

- Cambia el comportamiento visible al usuario final (mensajes de error y siembra de repeaters). Compatible hacia atrás.

---

## [1.15.0] - 2026-06-04

### forms: subida de archivos por campo confiable y bucket `sieej` homologado

Cierra el flujo de subida de archivos de los formularios (diccionarios CSV/XLSX/PDF). El campo `type=file` subía el archivo a Acervo pero el frontend descartaba la respuesta del backend y guardaba el `File` local, que se perdía al serializar el envío. Además las definiciones apuntaban a buckets inexistentes (`sieej-uploads`/`sieej-diccionarios`), por lo que el upload respondía 500.

#### Corregido

- **`frontend/src/components/Dragger.jsx`**: captura el retorno de `onFile` (la respuesta del backend con `url_publica`/`filename_original`) y lo guarda como valor del campo en lugar del `File` local. El render del nombre soporta los tres shapes (`filename_original`, `filename`, `name`).
- **`docker-compose.yml`**: elimina los defaults inline `${VAR:-valor}`; el compose ahora falla explícitamente si falta una variable. `.env.example` declara `MARIACHI_DEV_TARGET`.

#### Documentación

- `docs/arquitectura.md`: gateway-hub sirve el `dist` directo via `alias` (no via mariachi-nginx). Bucket canónico `sieej`.
- `docs/plataforma-formularios.md`: documenta el flujo de subida por campo (`POST /formularios/:slug/envio/upload`) y a dónde va a parar el archivo (Acervo, bucket `sieej`, ruta `{slug}/envio{id}/{uuid}.{ext}`).

#### UX

- **`components/Input.jsx` + `pages/Login.jsx`**: el campo de usuario/correo del login elimina todos los espacios (nueva normalización `identifier`), no solo los de los extremos. Atiende el hallazgo del tester.

#### Por qué bump minor

- El flujo de subida pasa de roto (500 / referencia perdida) a funcional end-to-end; cambio visible para el usuario que sube diccionarios. Compatible hacia atrás.
- Mariachi se libera en paralelo como `1.31.0`: ruta de archivos por encuesta, homologación del bucket `sieej` (migración `c2d3e4f5a6b7`) y comparación de vigencia tz-safe. Ver `mariachi/docs/CHANGELOG.md` §[api 1.31.0 / admin 1.31.0].

---

## [1.14.0] - 2026-05-28

### auth + forms: auto-recovery del CSRF y empty state mejorado en "Mis formularios"

Atiende los hallazgos del documento de pruebas del tester. La causa raíz del U9 (externo no podía cambiar contraseña) era que la cookie HttpOnly persistía al cruzar de mariachi-admin a SIEEJ pero el token CSRF se quedaba atrás (mariachi guarda en `sessionStorage['csrf_token']`, SIEEJ usa `sessionStorage['sieej_csrf_token']`). El `handleFetchWithAuth` mandaba el POST sin header `X-CSRF-Token` y el backend respondía 403.

#### Agregado

- **`frontend/src/context/AuthContext.jsx::refreshCsrfToken`**: helper con dedup vía `csrfRefreshPromiseRef` (evita N llamadas concurrentes si varias mutaciones disparan recovery al mismo tiempo). Hace `GET ${hostBackend}/autenticacion/csrf` con `credentials: 'include'` y guarda el token en `sessionStorage['sieej_csrf_token']`.
- **Auto-recovery reactivo** en `handleFetchWithAuth`: si una mutación (`POST/PUT/PATCH/DELETE`) recibe 403 y el `detail` del response incluye "csrf" (case-insensitive), llama `refreshCsrfToken()` y reintenta el request UNA vez con flag `__csrfRetried` (evita loop infinito). Usa `response.clone()` para leer el body sin consumir la response original.
- **Pre-fetch** en `handleCheckAuth`: cuando el `getProfile()` sale OK pero `sessionStorage[CSRF_KEY]` está vacío, llama `refreshCsrfToken()` antes de soltar el control. Cubre el escenario del externo que llega redirigido desde mariachi-admin (caso U9 documentado) y el de pestañas nuevas con sesión activa pre-existente.
- **Empty state visual en "Mis formularios"** (`frontend/src/pages/FormList.jsx`): antes era una línea pequeña "No tienes formularios asignados por el momento." que el tester documentó como confusa cuando la causa real era un formulario en `borrador`. Ahora es un card centrado con icono de documento, título "No hay formularios disponibles" y texto explicativo que sugiere las dos causas reales (sin asignación todavía, o asignados pero en preparación) y dirige al usuario a contactar al enlace IIEG.

#### Por qué bump minor

- Auto-recovery + pre-fetch del CSRF cierra un caso de fallo previamente sin manejo en el cliente. Compatible hacia atrás (solo agrega comportamiento).
- Empty state mejorado es cambio visible al usuario final pero no rompe nada (sustituye un mensaje, no agrega ruta).
- Mariachi se libera en paralelo como `1.21.0` para alinear el patrón de auto-recovery del CSRF y unificar la política de contraseñas. Ver `mariachi/docs/CHANGELOG.md` §[1.21.0].

---

## [1.13.1] - 2026-05-21

### ontoy: schema homologado del endpoint `/sieej/ontoy`

El JSON servido en `frontend/public/ontoy.json` (consumido vía `/sieej/ontoy` por Mariachi) se alinea con el formato del resto del ecosistema: `{version, service, released_at}`.

#### Cambiado

- **`frontend/public/ontoy.json`**: se eliminan los campos `slug` y `label` (información que Mariachi ya tiene hardcoded en `platforms_config.py`); se añaden `service: "sieej"` y `released_at`. Se actualiza `version` para reflejar el `VERSION` actual del repo.

#### Por qué bump patch

Cambio puramente de formato del manifesto de versión expuesto en `/sieej/ontoy`. No afecta build, runtime ni features del frontend.

---

## [1.13.0] - 2026-05-18

### frontend-build: ownership portable sin variables UID/GID

#### Cambiado

- **`docker-compose.yml`** (servicio `frontend-build`):
  - Se eliminan `HOST_UID: ${UID:-1000}` y `HOST_GID: ${GID:-1000}` del bloque `environment` (defaults inline prohibidos por convencion del proyecto y origen del error "grupo desconocido" en maquinas donde `UID`/`GID` no estan exportadas).
  - El `entrypoint` ahora deriva `uid:gid` del directorio montado `/output` via `stat -c %u/%g` antes del `chown -R`, adoptando el dueño real del host sin depender del shell.

---

## [1.12.1] - 2026-05-15

### Docs de arquitectura alineados: MinIO se engloba como Acervo

#### Cambiado

- **`docs/arquitectura.md`** (3 ocurrencias):
  - `MinIO bucket sieej-diccionarios` → `SeaweedFS bucket sieej-diccionarios`.
  - `mariachi-api → AcervoClient.upload_file() → MinIO bucket sieej-diccionarios` → `mariachi-api → AcervoClient.upload_file() → Acervo bucket sieej-diccionarios (SeaweedFS S3)`.
  - `Acervo: MinIO con bucket dedicado sieej-diccionarios` → `Acervo: SeaweedFS (S3-compatible) con bucket dedicado sieej-diccionarios`.

#### Nota

- `VERSION` venia en `1.11.0` mientras el CHANGELOG ya tenia `1.12.0` (drift detectado en la auditoria). Se sube directamente a `1.12.1` para realinear.

---

## [1.12.0] - 2026-05-08

### Reportes: integrar widget Colibri como FAB en bottom-right

Integra el widget embebible de Colibri (`@iieg/colibri-widget`) en SIEEJ. Los usuarios autenticados ven un boton flotante en la esquina inferior derecha que abre el panel de reportes centralizado del IIEG, con el usuario ya identificado y la ruta actual como contexto.

#### Frontend

**Componente nuevo:**
- `src/components/ColibriReportButton.jsx`: FAB con el patron estandar IIEG (bg blanco, text gris hover morado, w-7 h-7 md:w-6 md:h-6, rounded-full, shadow sutil) en `fixed bottom-4 right-4 z-50`. Incluye `style={{ padding: 0, border: 0 }}` inline para evitar que el reset CSS global de SIEEJ (`button { padding: 0.6em 1.2em; border: 1px solid }` en `index.css`) lo deforme en pildora — este reset gana specificity sobre las utilities Tailwind via selector de tipo. Al click llama `window.colibri.identify()` con datos del usuario logueado (id, email, name, role) y `setContext()` con `auto` (UA, viewport, lang, timestamp), `sourceRoute` (pathname actual). Despues abre el panel via `window.colibri.openPanel({ sourceApp, apiKey })`.

**Integracion:**
- `src/layout/MainLayout.jsx`: monta `<ColibriReportButton />` como hermano del `<Body />`. Solo aparece en rutas autenticadas (Login, Disclaimer y Cambio de contrasena no lo tienen porque no usan `MainLayout`).

#### Infraestructura

- `frontend/index.html`: `<script src="/colibri/widget/colibri-widget.v1.js" defer>` antes de `</head>`.
- `frontend/vite.config.js`: ya tenia (commit anterior) proxy `/colibri` y `/api/public` -> `MARIACHI_DEV_TARGET`.
- `frontend/Dockerfile` + `docker-compose.yml`: ARGs y env vars `VITE_COLIBRI_SOURCE_APP=sieej` y `VITE_COLIBRI_API_KEY` (en frontend dev y frontend-build args).
- `.env.example`: documenta las dos vars con nota de generar la key desde `/colibri/source-apps` del panel admin de Colibri.

#### Patron estandar

Este es el segundo huesped (despues de mapalab) que usa el patron React documentado en `/colibri/docs/#patron-react`. Los proximos integradores pueden copiar el snippet de ahi.

## [1.11.0] - 2026-05-08

Vista dedicada de "Mis envíos" — v1 del histórico, con detalle por
envío, timeline de eventos y adjuntos descargables. Consume los dos
endpoints respondent nuevos en `mariachi/api`
(`GET /formularios/mis-envios` y `GET /formularios/mis-envios/:id`).

### Added

- **`pages/MisEnvios.jsx`** (ruta `/mis-envios`): listado paginado del
  histórico del usuario con búsqueda por nombre/slug, filtro por estado
  (`en_proceso/enviado/expirado`) y ordenamiento
  (`-actualizado_en/-enviado_en/nombre`). 12 items por página, paginación
  Anterior/Siguiente. Empty state distinto para "sin envíos" vs.
  "sin resultados con filtros". Cada card abre `/mis-envios/:id`.
- **`pages/EnvioDetalle.jsx`** (ruta `/mis-envios/:id`): vista de
  revisión del envío.
  - Reusa `SummaryStep` con `useForm({ defaultValues: envio.datos })`
    apuntando a `definicion_snapshot` (la del momento del envío, no la
    actual del formulario) para fidelidad histórica.
  - Banner morado clarifica "vista de solo lectura".
  - Sidebar (xl: derecha; mobile: abajo) con `EventTimeline` y
    `EnvioAdjuntos`.
  - Maneja 403/404 con un mensaje genérico ("este envío no existe o no
    te pertenece") sin filtrar la diferencia.
- **`forms/components/EventTimeline.jsx`**: timeline vertical con
  bullets por tipo (`iniciado/guardado/enviado/expirado/reabierto`).
  Copy en primera persona cuando aplica
  ("Iniciaste el formulario", "Enviaste el formulario", etc.).
- **`forms/components/EnvioAdjuntos.jsx`**: lista de adjuntos con link
  `target="_blank"`, MIME y tamaño formateado (B/KB/MB).
- **`services/formulariosServices.js`**: `listMisEnvios(onFetch, params)`
  y `getMiEnvioDetalle(onFetch, envioId)`. Tests en
  `test/misEnviosServices.test.js` (9 cases — URL params, parseo, 403,
  404).
- **`Routes.jsx`**: rutas `mis-envios` y `mis-envios/:id` declaradas
  ANTES de `:slug` para que React Router no las trate como path param.
- **`MainLayout.jsx`** dropdown del avatar: nuevo item "Mis envíos"
  entre "Mis formularios" y "Cerrar sesión", deshabilitado cuando ya
  estás en esa sección.

### Changed / Reverted

- **`pages/FormList.jsx`** revertido al estado pre-1.10.0 (sin tabs ni
  búsqueda). El histórico ahora vive en su propia página dedicada
  (`/mis-envios`); `/` queda como lista de formularios asignados activa.
  Decisión: separar flujos en lugar de mezclarlos en tabs.
- **Removido** `helpers/filterForms.js` y su test (eran del MVP de tabs
  en `FormList`; el filtrado ahora es server-side via los endpoints
  nuevos).

### Bump

- **`VERSION`** -> 1.11.0.
- **`frontend/package.json`** -> 1.11.0.
- **`frontend/public/ontoy.json`** -> 1.11.0.

### Dependencias

Requiere `mariachi/api` con commit
`feat(sieej-formularios): endpoints respondent /mis-envios` ya
desplegado. Antes de eso, `/mis-envios` muestra el error de carga
gracefully (catch del 404).

---

## [1.10.0] - 2026-05-07

UX de cambio de contraseña + MVP de "Mis envíos" + bug fixes visuales.

### Added

- **`pages/ChangePassword.jsx`** reescrito en flujo de dos pasos
  (`WelcomeStep` + `FormStep`). Cuando `user.must_change_password=true`
  arranca con una pantalla de bienvenida (icono escudo, saludo
  personalizado, lista de requisitos) antes del formulario; cuando es
  cambio voluntario va directo al form. El formulario incluye barra de
  fuerza de 4 segmentos y checklist en vivo de los 4 requisitos
  (longitud, mayús+minús, número, carácter especial). Botón "Actualizar"
  deshabilitado hasta `score >= 3`.
- **`helpers/passwordStrength.js`** + tests
  (`computePasswordStrength`, `isStrongEnough`).
- **`pages/FormList.jsx`** ahora muestra **3 tabs**
  (Pendientes / Enviados / Expirados) con count por tab persistido en
  `localStorage.sieej_form_list_tab`, **búsqueda local** sobre nombre y
  descripción, contador `X de Y` y empty states distintos por tab.
  Card de "Enviado" muestra `Enviado el <fecha>` en lugar de
  `Vigencia hasta`. Accesibilidad: `role="tablist"/"tab"` con
  `aria-selected` y `tabIndex` roving.
- **`helpers/filterForms.js`** + tests (`filterByTab`, `filterBySearch`,
  `countByTab`, `TAB_KEYS`, `TAB_LABELS`).

### Fixed

- **`Routes.jsx` `ProtectedRoute`**: si `user.must_change_password=true`
  y el path no es `/cambiar-contrasena`, redirige forzadamente. Antes
  solo `handleLogin` respetaba el flag — recargas, sesiones recuperadas
  y navegación directa a `/<slug>` se saltaban el reset.
- **`pages/Login.jsx` `useEffect`**: respeta `must_change_password`
  antes de redirigir a `originPage`.
- **`layout/MainLayout.jsx`**:
  - Quitado `w-screen` de `<header>` y `<main>`. Eran `100vw + m-5` =
    desbordaban el viewport siempre. El bug pasaba desapercibido en
    1.8.x porque el typo `w-sceen` (clase inválida) era ignorado por
    Tailwind; en 1.9.0 al corregir el typo se hizo visible. Se notaba
    más con el `IncompleteBadge` porque el badge se proyecta hacia la
    derecha del avatar al borde derecho del header desbordado.
    `<main>` además recibe `min-w-0` (permite shrinking en flex),
    `<header>` recibe `shrink-0`.
  - Avatar fijo `w-12 h-12 + aspect-square + shrink-0` para que sea
    siempre circular (antes el ancho dependía de las iniciales y se
    ovalaba con "MM" o similares).
- **`h-screen` → `h-dvh`** (dynamic viewport height) en MainLayout,
  CardPage, ErrorPage, NoMatch, Routes fallback y Tooltip full-screen.
  En mobile se ajusta correctamente al área visible cuando aparece o
  desaparece la barra de URL.

### Bump

- **`VERSION`** -> 1.10.0.
- **`frontend/package.json`** -> 1.10.0.
- **`frontend/public/ontoy.json`** -> 1.10.0.

### Pendiente (v1 — requiere mariachi/api)

- Detalle dedicado de envío histórico con timeline de eventos y descarga
  de adjuntos. Necesita 2 endpoints respondent nuevos en `mariachi/api`:
  - `GET /formularios/mis-envios?estado=&q=&page=&sort=` — listado
    paginado del usuario (filtrado por `usuario_id` desde la sesión).
  - `GET /formularios/mis-envios/:id` — detalle con `definicion_snapshot`,
    `datos`, `archivos[]` y `eventos[]`.
  - Gateados por `Depends(require_project_access('sieej'))` (no por
    `require_staff` — el respondent debe consumirlos desde SIEEJ; el rol
    externo nunca toca `mariachi/admin` por T#208).
- Frontend SIEEJ: ruta `/mis-envios/:id` con `EnvioDetalle` que reusa
  `FormRenderer` en modo histórico apuntando a `definicion_snapshot`,
  más `EventTimeline` y `EnvioAdjuntos`.

---

## [1.9.0] - 2026-05-07

Auditoria profunda del frontend (arquitectura + seguridad + performance +
accesibilidad + estandares + tests). Se aplicaron 37 de 40 hallazgos. Los
3 restantes (CSP estricta en gateway-hub, migracion a TypeScript,
Storybook/i18n) requieren sprints o tocar otros repos y se dejaron como
seguimiento.

### Fixed (P0 — bugs reales)

- **`forms/context/CatalogosContext.jsx`** (nuevo, reemplaza al viejo
  `context/CatalogContext.jsx`): expone `catalogos` como objeto plano
  con las **mismas keys que devuelve el backend** (`unidades_admin`,
  `categoria_datos`, `ejes_estrategicos`, `periodicidad`,
  `herramientas_gestion`, `calidad_datos`, `usuarios_datos`,
  `objetivo_uso`). El context anterior remapeaba a aliases en ingles
  (`unidadesAdministrativas`, ...) que ningun consumidor del renderer
  dinamico usaba; resultado: los `field.catalog` del JSONB caian en
  `if (field.catalog && catalogos)` con `catalogos === undefined` y
  los selects/radios dinamicos quedaban sin opciones. Ahora
  `catalogResolver(field, catalogos[field.catalog])` resuelve.
- **`components/Checkbox.jsx`** y **`components/DatePicker.jsx`**
  (renombrado desde `DatePicket.jsx`): reescritos para recibir
  `methods` por props como Input/Select/Radio. Antes usaban
  `useFormContext()` pero `FieldRenderer` no monta `<FormProvider>` —
  hubieran tirado TypeError al desestructurar `register/errors` la
  primera vez que un schema dinamico declarara un `type:checkbox` o
  `type:date`.
- **`pages/Register.jsx`**: eliminado. El componente invocaba
  `useAuth().onRegister` que no existe en `AuthContext`. La ruta
  condicional `regisño` (solo dev) tambien se elimino de
  `Routes.jsx`.

### Security / UX

- **`context/GlobalContext.jsx`**: removido `regexPass` (rechazaba
  palabras como `SELECT`, `DROP`, `--` con la pretension de bloquear
  SQLi en el frontend — falso sentido de seguridad y bloqueaba
  contrasenas legitimas que contuvieran esas palabras). Backend
  parametriza queries; la validacion de complejidad real vive ahi.
- **`components/Input.jsx`**: `normalize` default cambia de
  `'capitalize'` a `'normal'` (capitalize destruia datos como
  `iPhone`, RFCs, URLs, correos no marcados como `type:email`); cap
  implicito `maxLength=100` removido (rompia textareas largas — los
  schemas que necesiten un cap lo declaran via `validation.maxLength`).
  Toggle de password convertido en `<button>` accesible con
  `aria-label`/`aria-pressed`.
- **`components/Dragger.jsx`**: reemplazado `alert()` bloqueante por
  `openModal('error', ...)` para los archivos que exceden tamano.
- **`context/AuthContext.jsx`**: `onFetch` ya no muta `options.body`
  recibido; soporta `Blob` ademas de `FormData`/`URLSearchParams`/
  `string`; cleanup con `mountedRef` para evitar setState en
  componente desmontado.
- **`services/{auth,formularios}Services.js`**: `parseJson` resiliente
  a respuestas no JSON (502 con HTML ya no lanza desde dentro del
  parser); el `Error` lleva `status` y `data` adjuntos para que el
  caller decida.

### Performance

- **`forms/renderer/SummaryStep.jsx`**: usa `useWatch` sobre el
  `control` en lugar de recibir `datos={methods.watch()}` calculado
  desde `FormRenderer`. Antes cualquier keystroke en cualquier campo
  re-renderizaba la jerarquia entera (FormRenderer → StepRenderer →
  cada FieldRenderer); ahora solo el SummaryStep re-renderiza, y solo
  cuando esta montado.
- **`forms/renderer/pdf/SummaryPdfButton.jsx`**: pasa de imports
  estaticos a `await import(...)` dentro del handler para
  `genericPdf` y `templates/sieej-levantamiento`. **Reduccion del
  initial bundle ~1.4 MB** (`vendor-pdf` ahora es chunk on-demand).
- **`context/GlobalContext.jsx`**: el listener de `resize` se envuelve
  en `requestAnimationFrame` para no propagar re-render de
  `screenSize` en cada pixel; corregido `screenSize.sm` para empezar
  desde 0 (antes `>= 100` dejaba viewports muy angostos sin
  breakpoint).
- **`components/Tooltip.jsx`**: `hoverTimeout` migrado a `useRef` +
  cleanup al desmontar; antes se reinicializaba en cada render y
  podia dejar timers huerfanos.

### Architecture

- **Provider tree aplanado** de 4 niveles globales a 2:
  ```
  <BrowserRouter>
    <GlobalProvider>
      <AuthProvider>
        <Routes>
          <ProtectedRoute>
            <MainLayout>
              <CatalogosProvider>
                <FormsProvider>
                  ...
  ```
  El antiguo `CatalogProvider`/`UserProvider` colgaba del root incluso
  para usuarios no autenticados. Ahora `CatalogosProvider` y
  `FormsProvider` solo se montan dentro de `MainLayout` (que solo
  renderiza tras `ProtectedRoute`), y `UserContext` desaparece — el
  layout consume `useAuth().user` directo, con un helper
  `helpers/normalizeUser.js` que deriva `nombre`/`apellido` desde
  `user.name` cuando el backend solo lo manda como string.
- **`forms/renderer/pdf/templates/sieej-levantamiento/`**: PDF custom
  (`PdfForm.jsx` 245 LOC + `index.jsx` con el adapter de datos) movido
  desde `components/` y `forms/renderer/pdf/` a su carpeta de plantilla
  para dejar claro que es la unica excepcion documentada al
  `genericPdf`.

### Removed (dead code)

- `components/Pdf.jsx` (PDFViewer/PDFDownload sin imports).
- `components/Upload.jsx` (reemplazado por `Dragger.jsx`, sin imports).
- `components/PdfForm.jsx` (movido a templates).
- `pages/Register.jsx` (ver P0).
- `context/UserContext.jsx`, `context/useUser.js`,
  `context/CatalogContext.jsx`, `context/useCatalog.js` (ver
  Architecture).

### Standards / Tooling

- **Imports**: pasada masiva de imports relativos `../components/...`
  → alias `@components/...` (idem `@helpers`, `@context`, `@services`,
  `@pages`, `@forms`, `@layout`, `@assets`, `@svg`, `@png`, `@icons`,
  `@fonts`) en todo `src/`.
- **`react-router` unico**: reemplazo `react-router-dom` por
  `react-router` (RR v7) en todos los imports y removida la dep de
  `package.json`. Regla ESLint `no-restricted-imports` bloquea el
  regreso.
- **ESLint**: cargado `eslint-plugin-react` con `jsx-no-target-blank` y
  `display-name`. Removidos overrides muertos (`DataBaseStep`,
  `ResumeStep`). Solo quedan overrides para `SummaryStep` y
  `PdfForm` legacy (max-lines 500).
- **`index.css`**: paleta SIEEJ centralizada en `@theme` (Tailwind v4
  custom properties: `--color-sieej-primary`, `--color-sieej-bg`,
  `--color-sieej-error`, etc.); removido `color: rgba(255,255,255,0.87)`
  del `:root` que dejaba texto casi-blanco sobre fondo gris claro.
- **Typos**: `DatePicket` → `DatePicker`; `w-sceen` → `w-screen` en
  `MainLayout`; `coursor-pointer` → `cursor-pointer` en `Radio`;
  `felx-wrap` → `flex-wrap` en `Tabs`.

### Accessibility

- **`Modal`**: `role="dialog"` + `aria-modal` + `aria-labelledby`/
  `describedby`, focus trap con `Tab`/`Shift+Tab`, cierre con `Esc` y
  click en backdrop, restaura el foco al disparador al cerrar.
- **`Select`**: `role="combobox"` + `aria-expanded`/`haspopup`/
  `controls`, `<listbox>` y `<option>` con roles + `aria-selected`,
  soporte teclado (Enter/Espacio/Esc).
- **`Tabs` (wizard)**: `role="tablist"`/`tab` + `aria-selected` +
  `tabIndex` roving para navegacion por teclado.
- **Avatar (`MainLayout`)**: span clickable convertido en `<button>`
  con `aria-haspopup="menu"`/`aria-expanded`; dropdown con
  `role="menu"`/`menuitem` y cierre por `Escape`.
- **Password toggle (`Input`)**: `<span>` con prop invalido convertido
  en `<button>` con `aria-label`/`aria-pressed`.

### Testing

- **`vitest`** + **`@testing-library/react`** + `jest-dom` + `jsdom`.
  Configuracion en `vite.config.js` (`test: { environment: 'jsdom' }`).
- Suite inicial sobre logica pura (los contratos JSONB que mas duelen
  si rompen):
  - `test/conditional.test.js` — `evaluarShowWhen` (bool/string,
    campos faltantes, sin condicion).
  - `test/catalogResolver.test.js` — `resolveOptions` (options
    inline, catalog string array, catalog object array, prioridad
    options sobre catalog).
  - `test/normalizeUser.test.js` — derivacion de `nombre`/`apellido`
    desde `user.name`.
- **14 tests verdes**. Scripts: `npm run test` (run-once para CI),
  `npm run test:watch`.

### Build / Env

- **`Dockerfile`**: `VITE_BACKEND_API_HOST` default `'/api/administrador'`
  (antes `'/sieej/api'` — un build sin args producia un dist que
  apuntaba a un endpoint inexistente). Removido
  `VITE_GOOGLE_RECAPTCHA_SITE_KEY` (declarado pero sin uso en codigo).
  Agregado `VITE_SENTRY_DSN` al pipeline.
- **`Makefile`**: target `ensure-env` que copia `.env.development`
  desde `.env.example` si falta. `make dev` y `make build` dependen de
  el — antes el primer `make dev` fallaba con
  `--env-file .env.development` no encontrado.
- **`docker-compose.yml`** y **`.env.example`** alineados.

### Bump

- **`VERSION`** -> 1.9.0.
- **`frontend/package.json`** -> 1.9.0.
- **`frontend/public/ontoy.json`** -> 1.9.0.

### Pendiente (sprints fuera de esta entrega)

- **CSP estricta en gateway-hub** (#8 de la auditoria): requiere
  inventario de origenes externos en prod (Sentry DSN, GTM/GA, etc.)
  y editar `gateway.conf.template` en otro repo.
- **Migracion a TypeScript** (#28): sprint dedicado; afecta 50+
  archivos. Recomendacion: encarar despues con generacion de tipos
  desde el OpenAPI de `mariachi/api`.
- **Storybook + i18n**: proyectos enteros, no incluidos.

---

## [1.8.5] - 2026-05-06

Reorganizacion de la documentacion del proyecto:

### Added

- **`docs/plataforma-formularios.md`**: arquitectura final de la
  plataforma (descriptivo del estado actual, no prescriptivo del
  futuro). Modelo de datos, schema JSONB, endpoints respondent +
  admin, frontend structure, PDF custom vs generico, decisiones
  cerradas, referencias a migrations y commits.

### Removed

- **`docs/planes/plataforma-formularios.md`**: el plan completo (el
  trabajo ya esta hecho; mantenerlo como "plan" sugeriria
  pendientes que no existen). La carpeta `docs/planes/` queda vacia
  y se elimina.

### Changed

- **`docs/context.md`**: bumped a v1.8.4. Quitado el aviso del plan;
  ahora apunta a `plataforma-formularios.md` para detalles.
- **`docs/arquitectura.md`** y **`docs/frontend.md`**: avisos
  reemplazados por nota directa que apunta a
  `plataforma-formularios.md`.

### Bump

- **`VERSION`** -> 1.8.5.
- **`frontend/package.json`** -> 1.8.5.
- **`frontend/public/ontoy.json`** -> 1.8.5.

---

## [1.8.4] - 2026-05-06

Tipografia y centrado del header:

### Changed

- **`components/Typography.jsx`**: `h1` sube de `text-[21px]/[31px]`
  a `text-[28px]/[36px]`. Antes h1 era mas chico que h2 (21 vs 22),
  jerarquia invertida que se notaba en cada page con titulo h1
  (FormList, Login, ChangePassword, etc.). Ahora h1 > h2 > h3 segun
  lo esperado.
- **`layout/MainLayout.jsx`**: el `<button>` que envuelve el logo
  SIEEJ ahora es `inline-flex items-center justify-center align-middle`
  para que el `<img>` quede centrado verticalmente respecto a los
  otros logos (IIEG, Jal). El `EnvBadge` se restaura sobre el logo
  (no era el causante del desplazamiento; el logo ahora queda
  enderezado correctamente).

### Bump

- **`VERSION`** -> 1.8.4.
- **`frontend/package.json`** -> 1.8.4.
- **`frontend/public/ontoy.json`** -> 1.8.4.

---

## [1.8.3] - 2026-05-06

Iteracion del header y la lista:

### Changed

- **`layout/MainLayout.jsx`**: removido el `EnvBadge` del logo SIEEJ
  para evitar empuje vertical del logo. El indicador de entorno solo
  vivira en el avatar (badge naranja con corner=bottom-right) o en
  ningun lado si no hay incompletos.
- **`layout/MainLayout.jsx`**: el item "Mis formularios" del dropdown
  se muestra siempre. Cuando estas en `/` queda `disabled` con
  opacity-50 y cursor-default (en vez de ocultarse) — asi siempre
  ves la opcion y el contador de incompletos.
- **`pages/FormList.jsx`**: titulo "Sistema de Información..."
  reemplazado por **"Mis formularios"**. Subtitulo h3 reemplazado por
  parrafo descriptivo "Aquí encuentras los formularios asignados a tu
  dependencia. Da click en uno para empezar o continuar tu captura."
  con estilo `text-[#7C7C7C] font-garetregular`.
- **`pages/FormList.jsx`**: `FormCard` ahora tiene
  `shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition
  duration-200` para feedback elevado en hover (consistente con
  cards de admin AntD).

### Bump

- **`VERSION`** -> 1.8.3.
- **`frontend/package.json`** -> 1.8.3.
- **`frontend/public/ontoy.json`** -> 1.8.3.

---

## [1.8.2] - 2026-05-06

Fixes del header introducidos por 1.8.0/1.8.1:

### Fixed

- **Menú dropdown del avatar no era visible**: el wrapper del
  `MainLayout` tenia `overflow-hidden` lo cual recortaba el menu
  `absolute` que cae fuera del header (h-[100px]). Cambiado a
  `overflow-x-hidden` para que el menu pueda desplegar
  verticalmente sin recorte. Ademas el `z-index` del menu se subio
  de `z-10` a `z-50`.
- **Logo SIEEJ se desplazaba hacia abajo**: al envolver el `<img>`
  en `<button>` (1.8.0), los estilos default del navegador (padding,
  border, line-height) empujaban la imagen. Agregado
  `p-0 m-0 border-0 bg-transparent` al boton + `block` al `<img>`
  para resetear esos estilos.

### Changed

- **`components/IncompleteBadge.jsx`**: nuevo prop `corner` con
  valores `top-right` (default), `bottom-right`, `top-left`,
  `bottom-left`. Se posiciona absolute sin afectar dimensiones del
  contenedor padre.
- **`layout/MainLayout.jsx`**: el badge en el avatar ahora se
  posiciona en `corner="bottom-right"`.

### Bump

- **`VERSION`** -> 1.8.2.
- **`frontend/package.json`** -> 1.8.2.
- **`frontend/public/ontoy.json`** -> 1.8.2.

---

## [1.8.1] - 2026-05-06

Reubica el badge de incompletos al avatar y agrega item "Mis
formularios" al dropdown del header.

### Changed

- **`layout/MainLayout.jsx`**: el `IncompleteBadge` se mueve del logo
  SIEEJ al circulo del avatar (top-right). El logo conserva
  `EnvBadge` y la nav a `/`.
- **`layout/MainLayout.jsx`**: dropdown del avatar agrega item
  "Mis formularios" arriba de "Cerrar sesión" con divider sutil.
  Si `incompleteCount > 0` muestra debajo "{n} por completar" en
  naranja menor (font-garetbold, 11px). Si estas en `/` ya, el item
  se oculta para no ofrecer nav redundante (`location.pathname === '/'`).
  Ancho del menu ajustado de `w-48` a `w-56` para acomodar dos
  lineas comodamente.

### Bump

- **`VERSION`** -> 1.8.1.
- **`frontend/package.json`** -> 1.8.1.
- **`frontend/public/ontoy.json`** -> 1.8.1.

---

## [1.8.0] - 2026-05-06

UX del header y de la lista de formularios:
- Logo SIEEJ del header ahora es boton que navega a `/` (lista).
- Badge de "formularios incompletos" sobre el logo (count de envios
  en estado `en_proceso`).
- FormList con toggle grid/lista; default grid; preferencia
  persistida en localStorage.

### Added

- **`components/IncompleteBadge.jsx`**: badge naranja absoluto al
  estilo de `EnvBadge`. Muestra count si > 0, "9+" si > 9. Recibe
  `count` y `className` por props.
- **`pages/FormList.jsx`**: toggle visual con dos botones
  (`GridIcon` y `ListIcon` SVG inline) + `FormCard` que se adapta
  al modo. Grid: `grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4`.
  Lista: `space-y-4`. Preferencia guardada en
  `localStorage.sieej_form_list_view`.

### Changed

- **`layout/MainLayout.jsx`**: el contenedor del logo SIEEJ se
  convierte en `<button>` con `onClick={() => navigate('/')}`,
  `aria-label="Ir al inicio"`, focus visible. Mantiene `EnvBadge` y
  agrega `IncompleteBadge` con el count desde
  `useForms().formularios.filter(f => f.estado_envio === 'en_proceso').length`.
- **`layout/MainLayout.jsx`**: `<FormsProvider>` envuelve todo el
  layout para que el header pueda leer la lista. `FormList` ya no
  monta su propio provider (lo eliminamos del page).

### Bump

- **`VERSION`** -> 1.8.0.
- **`frontend/package.json`** -> 1.8.0.
- **`frontend/public/ontoy.json`** -> 1.8.0.

---

## [1.7.0] - 2026-05-06

PDF de resumen — custom para sieej-levantamiento + generico para los
demas. Cierre del item pendiente del cleanup.

### Added

- **`forms/renderer/pdf/sieejLevantamiento.jsx`**: descarga el PDF
  custom usando el `PdfForm` existente (245 lineas, totalmente
  custom SIEEJ con logos, fonts Garet, layout especifico). Adapter
  `adaptDatosToFormData` mapea las claves del modelo dinamico
  (general/enlaces/bases_datos) a las del wizard original
  (informacion_general/_enlaces/_basesdatos) y convierte boolean
  strings ("true"/"false") a boolean reales.
- **`forms/renderer/pdf/genericPdf.jsx`**: PDF generico que itera
  cualquier definicion + datos. Header con logos institucionales
  (sieej, iieg, jal), titulo desde `definicion.nombre`, descripcion,
  una seccion por step (resumen omitido), repeaters listados con
  separadores. Resuelve labels de catalogos/options.
- **`forms/renderer/pdf/SummaryPdfButton.jsx`**: el boton decide
  cual PDF generar. Si `step.pdfTemplate === 'sieej-levantamiento'`
  → custom. Si `step.exportPdf === true` (sin pdfTemplate) →
  generico. Manejo de loading + error.

### Changed

- **`forms/renderer/SummaryStep.jsx`**: agrega el `SummaryPdfButton`
  al pie del resumen cuando el step tiene `exportPdf` o
  `pdfTemplate`.
- **`forms/renderer/StepRenderer.jsx`** y **`FormRenderer.jsx`**:
  pasan `formNombre`/`formDescripcion` al SummaryStep para que el
  PDF generico tenga ambos en el header.

### Bump

- **`VERSION`** -> 1.7.0.
- **`frontend/package.json`** -> 1.7.0.
- **`frontend/public/ontoy.json`** -> 1.7.0.

---

## [1.6.0] - 2026-05-06

Restaurado el look & feel del wizard SIEEJ original sobre el renderer
dinamico. La home ahora es lista directa en `/`, formularios en
`/:slug` (sin subruta `/formularios` redundante).

### Added

- **`forms/components/wizard/StepIndicator.jsx`**: progreso vertical
  con bullets numerados, ✓ verde al completar, separadores entre
  steps. Cuando el step actual es repeater con items, muestra los
  items como tabs anidados (con borrar via icono X). Recibe
  `steps`, `currentStep`, `repeaterItems`, `activeTab`, `visitedTabs`,
  `sizeTabs`, `onTabClick`, `onTabRemove` por props (no acoplado a
  ningun contexto).
- **`forms/components/wizard/NavigateStep.jsx`**: header sticky con
  titulo del step + 3 botones (Anterior / Siguiente o Confirmar y
  enviar / Guardar avance icon-only). Recibe `step`, `isFirst`,
  `isLast`, `isLastTab`, `isMobile`, `onPrev`, `onSubmit`, `onSave`
  por props.
- **`forms/components/wizard/Tabs.jsx`**: tabs verticales/horizontales
  para items de repeaters. Soporta `vertical`, `items`, `activeTab`,
  `visitedTabs`, `onTabClick`, `onTabRemove`.

### Changed

- **`pages/FormPage.jsx`**: layout 2 columnas como el wizard
  original — panel izquierdo sticky (con titulo del formulario,
  descripcion del formulario, StepIndicator) + panel derecho
  rounded-[20px] con NavigateStep arriba + step actual abajo. El
  panel izquierdo solo se muestra si `definicion.steps.length > 1`.
  Header (titulo + descripcion) lee de `definicion.nombre` y
  `definicion.descripcion`.
- **`pages/FormList.jsx`**: rediseñada en panel rounded blanco con
  Typography h1/h3 institucionales. Tarjetas con border morado al
  hover, badges de estado con colores semanticos, redirige a
  `/<slug>` directo (no `/formularios/<slug>`).
- **`Routes.jsx`**: `/` muestra FormList directo (sin redirect).
  `/:slug` muestra FormPage. Las rutas literales reservadas
  (`inicio-sesion`, `exencion`, `cambiar-contrasena`, `error`) se
  declaran antes para que ganen sobre el dynamic `:slug`.
- **`forms/renderer/FormRenderer.jsx`**: ahora usa NavigateStep
  para el header de step + nav. Los 3 botones tienen el
  comportamiento del wizard (Guardar = silencioso si esta dentro de
  Anterior, explicito si se da click directo). Read-only cuando
  `envio.estado in ('enviado','expirado')`.
- **`forms/renderer/RepeaterStep.jsx`**: muestra UN item a la vez
  navegable por `activeTab` (no todos los items uno encima del otro).
  Boton Agregar arriba a la derecha + Eliminar (si fields > minItems).
  Sub-tabs internos cuando `step.tabs` esta definido.
- **`forms/renderer/SummaryStep.jsx`**: itera la definicion + datos
  para reproducir el resumen estilo wizard original. Usa `Text`,
  `Typography`, `Divide`, `FieldGrid` existentes. Resuelve labels de
  catalogos/options en lugar de mostrar values raw.
- **`forms/context/WizardContext.jsx`**: extendido con `activeTab`,
  `visitedTabs`, `sizeTabs`, `onActiveTab`, `onSizeTab`,
  `resetVisitedTabs` para soportar tabs de repeaters (estado que
  vivia en GlobalContext del wizard original; ahora vive scoped al
  formulario activo).

### Bump

- **`VERSION`** -> 1.6.0.
- **`frontend/package.json`** -> 1.6.0.
- **`frontend/public/ontoy.json`** -> 1.6.0.

---

## [1.5.0] - 2026-05-06

Cleanup post-cutover. El wizard hardcodeado se elimina por completo.
SIEEJ ahora es 100% renderer dinamico que consume las definiciones
de mariachi.

### Removed

- **`pages/Home.jsx`**: la home de wizard hardcodeado.
- **`context/HomeContext.jsx`** y **`context/useHome.js`**: el state
  del wizard se reemplazo por `WizardContext` por formulario activo.
- **Helpers wizard**: `helpers/initDatabase.js` (default de la BD del
  wizard), `helpers/pdfActions.jsx` (PDF hardcodeado), `helpers/textLarge.jsx`
  (tooltips estaticos).
- **Componentes wizard**: `components/Tabs.jsx` (reemplazado por la
  implementacion local de `RepeaterStep`), `GeneralStep.jsx`,
  `LinksStep.jsx`, `ListDatabaseStep.jsx`, `DataBaseStep.jsx`,
  `ResumeStep.jsx` (los 5 steps especificos del wizard),
  `NavigateStep.jsx` y `StepIndicator.jsx` (la navegacion vive ahora
  en `forms/renderer/FormRenderer`).
- **Ruta `/legacy-wizard`** y `HomeProvider` del provider tree en
  `main.jsx`.

### Changed

- **`context/GlobalContext.jsx`**: limpiado del wizard. Removidos
  `STEPS` array, state de navegacion (`currentStep`, `activeTab`,
  `visitedTabs`, `sizeTabs`, `tabLoading`), handlers
  (`handleNext`/`handlePrev`/`handleActiveTab`/`handleVisitedTabs`/
  `handleTabChange`/`handleSizeTab`/`handleTabLoading`/
  `updateStepStatus`/`resetVisitedTabs`) e iconos del wizard.
  Lo que queda: `hostBackend`, `screenSize`, `regex*`,
  `linkPrivacity`, `isDisabledEdition`, `isMessageOpen`/`onMessage`,
  `isModalOpen`/`openModal`/`closeModal`, `onAnalytics`.
- **`components/Dragger.jsx`**: ya no depende de `useHome()`. Recibe
  `onFile` como prop. El renderer dinamico lo pasa via
  `FieldRenderer` cuando `field.type === 'file'`.
- **`forms/renderer/FieldRenderer.jsx`**: adapta la signatura de
  `Dragger.onFile(filesArray, idItem)` para tomar el primer archivo
  y pasarlo al `onUpload(fieldPath, file)` del SubmissionContext.

### Bump

- **`VERSION`** -> 1.5.0.
- **`frontend/package.json`** -> 1.5.0.
- **`frontend/public/ontoy.json`** -> 1.5.0.

---

## [1.4.0] - 2026-05-06

Plataforma de formularios SIEEJ — Fase 5 cutover frontend. La home (`/`)
ahora redirige al listado dinamico (`/formularios`); la version del
wizard hardcodeado queda accesible temporalmente en `/legacy-wizard`
hasta que el backfill se valide en prod con datos reales.

### Changed

- **`Routes.jsx`**: `/` ahora hace `<Navigate to="/formularios" replace />`.
  El wizard original (Home.jsx) se mueve a `/legacy-wizard` como
  fallback durante la transicion de Fase 5.
- El frontend dinamico ahora consume el formulario seed
  `sieej-levantamiento` que mariachi 0.37.0 inyectó en la BD.

### Bump

- **`VERSION`** -> 1.4.0.
- **`frontend/package.json`** -> 1.4.0.
- **`frontend/public/ontoy.json`** -> 1.4.0.

### Pendiente (cleanup post-validacion)

- Eliminar `pages/Home.jsx`, ruta `/legacy-wizard`, contextos
  `HomeContext` + helpers `initDatabase`/`pdfActions`/`textLarge`
  + componentes `GeneralStep` / `LinksStep` / `ListDatabaseStep` /
  `DataBaseStep` / `ResumeStep` cuando el backfill confirme datos
  migrados correctamente.

---

## [1.3.0] - 2026-05-06

Plataforma de formularios dinamicos en SIEEJ — Fase 3 (frontend).
Aterriza el renderer generico que consume definiciones JSON desde
`mariachi/api`. El wizard SIEEJ existente sigue intacto en `/`; el
sistema dinamico convive en `/formularios` y `/formularios/:slug`. La
union/desmantelamiento del wizard sucede en Fase 5.

### Added

- **`src/services/formulariosServices.js`**: cliente del API respondent
  (`/formularios/...`) usando `onFetch` del `AuthContext` para heredar
  cookie + CSRF.
- **`src/forms/renderer/`** (motor generico): `FormRenderer` con
  react-hook-form, `StepRenderer` (despacha por step.type),
  `FormStep`, `RepeaterStep` (con `useFieldArray` y soporte de tabs
  internas), `SummaryStep`, `FieldRenderer` (mapea field.type a las
  primitivas existentes — Input, Select, SelectMultiple, Radio,
  Checkbox, DatePicket, Dragger, Typography). Helpers
  `conditional.js` (showWhen) y `catalogResolver.js`.
- **`src/forms/context/`**: `FormsContext` (lista de formularios
  visibles + cache), `SubmissionContext` (envio activo: cargar,
  guardar borrador, enviar, subir archivo), `WizardContext`
  (currentStep + visited + navegacion). Hooks en archivos separados
  (`useForms.js`, `useSubmission.js`, `useWizard.js`).
- **`src/pages/FormList.jsx`** (ruta `/formularios`): tarjetas
  clickeables con estado del envio (no_iniciado / en_proceso /
  enviado / expirado).
- **`src/pages/FormPage.jsx`** (ruta `/formularios/:slug`): monta
  `SubmissionProvider + WizardProvider + FormRenderer`. Usa los
  catalogos del `CatalogProvider` existente.
- **`vite.config.js`**: alias `@forms` → `src/forms/`.

### Changed

- **`src/Routes.jsx`**: rutas nuevas `formularios` y
  `formularios/:slug` dentro del `ProtectedRoute`. El wizard SIEEJ
  sigue en `/` sin cambios. Cuando aterrice Fase 5, `/` redirige a
  `/formularios` o sirve la lista directo.

### Bump

- **`VERSION`** -> 1.3.0.
- **`frontend/package.json`** -> 1.3.0.
- **`frontend/public/ontoy.json`** -> 1.3.0.

---

## [1.2.3] - 2026-05-06

Plan de plataforma de formularios: cierre de Fase 1 (backend respondent)
y Fase 2 (backend admin) en `mariachi/api`. Ajuste de namespace en el
plan tras descubrir el `sieej_admin.router` existente. Sin cambios
funcionales en el frontend.

### Changed

- **`docs/planes/plataforma-formularios.md`**: seccion 5.2 corregida —
  el prefix de admin es `/sieej` (no `/admin/sieej`), alineado con el
  router existente que ya expone `/sieej/stats`. Listado de endpoints
  admin actualizado para reflejar lo implementado en mariachi 0.35.0
  (CRUD formularios + publicar/cerrar + asignaciones + listar envios +
  CRUD grupos + miembros + GET miembros).
- **`docs/planes/plataforma-formularios.md`**: seccion "Estado de
  implementacion" actualizada — Fase 1 y Fase 2 marcadas como
  completas, con referencias a la migration `a4b5c6d7e8f9` y al
  conteo de tests (47 + 19 = 66 nuevos en mariachi).

### Bump

- **`VERSION`** -> 1.2.3.
- **`frontend/package.json`** -> 1.2.3.
- **`frontend/public/ontoy.json`** -> 1.2.3.

---

## [1.2.2] - 2026-05-06

Audit del plan de plataforma de formularios contra el estado real de los repos vecinos. Cierre de decisiones que la version original del plan dejo abiertas y reflejo del avance de implementacion. Sin cambios funcionales en el frontend.

### Changed

- **`docs/planes/plataforma-formularios.md`**: agregada seccion "Estado de implementacion (2026-05-06)" con el avance real por capa (backend, admin, frontend, gateway, docs). Corregida la referencia de Alembic head — la cadena en mariachi es lineal, head real es `d3e4f5a6b7c8_scope_media_folders_to_bucket.py`. Documentado el conflicto de namespace que tenia el esqueleto `mariachi/admin/src/features/sieej-formularios/`. Versiones del stack frontend SIEEJ aterrizadas (Vite 6.2, RHF 7.54, RR 7.2).
- **`docs/planes/plataforma-formularios.md`**: nueva seccion "Decisiones cerradas en este audit" con cierre de pendientes — auditoria via `envio_evento`, estado `expirado` para envios vencidos, PDF en frontend con `@react-pdf/renderer`, validacion compartida via endpoint `/formularios/:slug/schema` con reglas declarativas, preview separado en AntD para el constructor, politica de archivos en Acervo (limites por campo, buckets via `MediaBucket`, MIME validation, job de limpieza de huerfanos).
- **`docs/planes/plataforma-formularios.md`**: actualizada seccion 3.1 (modelo de datos) con tabla `envio_evento` (auditoria liviana del ciclo de vida de los envios) y campo `expirado_en` mas estado `expirado` en `envio_formulario`. Actualizada seccion 4.3 con notas de bucket existente, MIME y cap de 100 MB.
- **`docs/planes/plataforma-formularios.md`**: agregadas secciones 14-18 — estrategia de tests (matriz pytest backend + vitest frontend), generacion de PDF (decision opcion a), validacion compartida (decision endpoint con `validation_rules` planos), preview en el constructor (decision duplicar logica con lint sync), politica de archivos en Acervo (limites + huerfanos).
- **`docs/context.md`** (v1.1.4 -> v1.1.5): callout al inicio apuntando al plan en marcha. Quitado el pendiente "mover frontend al repo iieg-oficial/sieej" (ya esta hecho — este es ese repo).
- **`docs/arquitectura.md`** y **`docs/frontend.md`**: disclaimer al inicio aclarando que describen el estado pre-plataforma; apuntan al plan para el estado futuro.

### Bump

- **`VERSION`** -> 1.2.2.
- **`frontend/package.json`** -> 1.2.2.
- **`frontend/public/ontoy.json`** -> 1.2.2.

---

## [1.2.1] - 2026-04-29

Documentacion actualizada para reflejar que el dist de SIEEJ ahora se sirve directamente desde `gateway-hub` (>= v1.24.0), no desde `mariachi-nginx`. Sin cambios funcionales en el frontend.

### Changed

- **`README.md`**: nota de despliegue, comandos `make`, variables de entorno y diagrama de staging/produccion ahora apuntan a `gateway-hub` como origen del dist. Removida la mencion de `react-ga4` y `VITE_GOOGLE_ANALYTICS_ID` de la lista de stack/variables (sieej no los usa desde 1.2.0; estaban como deuda en el README).
- **`docs/gateway.md`**: reescrito el diagrama de enrutamiento. Antes mostraba `gateway-hub -> proxy_pass portal -> mariachi-nginx -> alias /sieej`. Ahora describe el flujo correcto: `gateway-hub -> alias /usr/share/nginx/html/sieej` con `try_files` y `bind mount` desde `../sieej/frontend/dist`. Snippet del `gateway.conf.template` actualizado y troubleshooting hace referencia a `gateway-hub-nginx-1` en lugar de `mariachi-nginx`.
- **`docs/context.md`**: la decision "Sin nginx propio" ahora explica que SIEEJ es 100% estatico y `gateway-hub` lo sirve con `alias`. Diagrama de staging/produccion actualizado al nuevo flujo.
- **`docs/frontend.md`**: la nota del `make build` ahora indica que `gateway-hub` consume el dist (no `mariachi-nginx`).
- **`docs/analytics.md`**: el modelo del flujo de GTM aclara que `gateway-hub` aplica el `sub_filter` directo sobre el `index.html` que sirve, sin intermediarios.
- **`Makefile`**: `make help` y la nota final mencionan a `gateway-hub` como consumidor del dist.

### Bump

- **`VERSION`** -> 1.2.1.
- **`frontend/package.json`** -> 1.2.1.
- **`frontend/public/ontoy.json`** creado (antes solo existia en `dist/`, lo que provocaba que se borrara en cada `make build`). Ahora vive en `public/` y Vite lo copia al dist en cada build.
- **`frontend/dist/ontoy.json`** actualizado a 1.2.1 (regenerable con `make build`).

---

## [1.2.0] - 2026-04-25

Homologacion del sistema de analytics al patron mapalab: GA4 se inyecta exclusivamente via GTM en el `gateway-hub`. SIEEJ ya no inicializa `react-ga4` ni depende de `VITE_GOOGLE_ANALYTICS_ID`. Los eventos custom siguen disponibles a traves de `window.dataLayer.push(...)` cuando GTM esta presente.

### Removed

- Dependencia `react-ga4` del `package.json`.
- `ReactGA.initialize(...)` en `src/main.jsx`.
- `import ReactGA from 'react-ga4'` y `ReactGA.event(...)` en `AuthContext`, `GlobalContext`, `UserContext` y `HomeContext`.

### Added

- `src/helpers/analytics.js` con `pushAnalyticsEvent(category, action, label)`. Es no-op si `window.dataLayer` no existe (e.g. dev sin GTM, build sin gateway por encima). En dev sin GTM imprime un `console.debug` para ayudar a depurar.
- Documentacion en `docs/analytics.md` describiendo el patron, el formato del evento (`event: 'sieej_event'`, `category`, `action`, `label`) y como configurar GTM/GA4 en el lado del gateway.

### Changed

- `package.json` bumped a 1.2.0 (minor por cambio de pipeline de analytics).
- `VERSION` -> 1.2.0.

### Notes

- El gateway-hub inyecta el snippet de GTM en `</head>` y `</body>` via `nginx/includes/gtm.inc.template` con la variable `GTM_ID`. Cualquier producto servido detras del gateway hereda esa configuracion sin instalar SDK.
- Para dev local sin gateway, `dataLayer` no existe; los eventos se pierden silenciosamente (es lo deseado para que el dev no tenga que tocar configuracion).
- Si en algun momento se necesita un tracking distinto al de GTM (medicion privada, debugging), se puede inyectar `window.dataLayer = []` y un consumer manual antes de cargar el bundle.

---

## [1.1.4] - 2026-04-24 (unreleased - refactor de infra)

### Changed
- Estructura del repo alineada con mapalab:
  - Raiz unificada con `backend/`, `frontend/`, `nginx/` hermanos.
  - `docker-compose.yml` unico con profiles (`dev` / `build` / `staging`) +
    `docker-compose.override.yml` para desarrollo con `network_mode: host`.
  - `.env.development`, `.env.staging`, `.env.production` separados.
  - `Makefile` orquestador (`make dev|staging|prod|down|clean|status`).
  - `VERSION=1.1.4` en la raiz como fuente unica de versionado.
- Backend:
  - `main.py` -> `server.py` (alineado a mapalab).
  - `config.py` migrado de dict + Configuration base a
    `pydantic-settings.BaseSettings`, con validador de `CORS_ORIGINS`.
    Se conservan wrappers `DatabaseConfig` y `JwtConfig` por
    retrocompatibilidad.
  - Routers sin `prefix="/api/v0.1"`; el prefijo `/api/` lo gestiona
    nginx (staging/gateway) y el proxy de Vite (dev).
  - `Dockerfile` multi-stage (development/production) con
    `gunicorn + UvicornWorker` en prod.
  - Endpoint `/health` agregado (usado por healthcheck Docker y
    gateway).
  - Swagger/ReDoc expuestos solo cuando `ENVIRONMENT != production`.
- Frontend:
  - `BrowserRouter basename` parametrizado via `VITE_BASE_PATH` (antes
    hardcodeado a `/enlaces`). Nuevo default: `/` en dev, `/sieej/` en
    staging/prod.
  - `vite.config.js` con aliases de import (`@components`, `@context`,
    `@helpers`, `@services`, `@assets`, ...) y proxy de dev
    `/api -> BACKEND_DEV_TARGET` con `rewrite`.
  - `Dockerfile.dev` (Vite) + `Dockerfile` (builder multi-stage).
- Nginx:
  - Un unico `nginx/` en la raiz para staging; sirve `dist/` y hace
    `proxy_pass /api/ -> http://backend/` (strip del prefijo).

### Added
- `docs/` con documentacion consolidada:
  `context.md`, `arquitectura.md`, `backend.md`, `frontend.md`,
  `gateway.md`, `CHANGELOG.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`.
- Integracion con `gateway-hub`:
  - `SIEEJ_HOST` agregado en `.env.example`, `.env` y `docker-compose.yml`.
  - `upstream sieej` + `location ^~ /sieej/` + `location ^~ /sieej/api/`
    en `gateway.conf.template`.
  - Readme del gateway-hub actualizado (tabla de enrutamiento +
    variables).

### Removed
- Contenedor `db: postgres:17` del compose (Postgres queda externo,
  igual que mapalab).
- `forms-page-backend/` como sub-directorio (se aplana a `backend/`).
- Docker-compose legados: `docker-compose.override.yml`,
  `docker-compose.production.yml`, `docker-compose.testing.yml`
  anteriores.
- READMEs duplicados (`backend/README.md`, `frontend/README.md`,
  `backend/ARCHITECTURE.md`, etc.) consolidados en `docs/`.
- Archivos `CHANGELOG` antiguos (backend y frontend) migrados a
  `docs/CHANGELOG.md`.
- `nginx/mapamuestra/` y `nginx/certs/` (recursos obsoletos).

## [1.1.4] - 2025-08-27 (historico backend)

### Added
- Documentacion del modulo license.
- Actualizacion de guias de contribucion.
- Logica de validacion de formularios.
- Endpoints de autenticacion.

### Changed
- Refactor del manejo de conexion a base de datos.
- Actualizacion del formato de respuestas del API.
- Mejor manejo de errores en el envio de formularios.

### Fixed
- Corregidos problemas de CORS en endpoints.
- Bugs de validacion de tokens.
- Formato de documentacion.

## [1.1.4] - 2025-05-15 (historico frontend)

### Added
- Documentacion completa del API en Swagger.
- Guia de usuario en Markdown.
- Documentacion tecnica para desarrolladores.
- Funcionalidad de exportacion de datos de tablas.
- Sistema avanzado de filtros para tablas.
- Control de acceso basado en roles (RBAC).
- Gestion del perfil de usuario.
- Sistema de recuperacion de contrasena.
- Servicio de notificaciones por email.
- Optimizaciones de rendimiento.

### Fixed
- Problemas de paginacion en tablas.
- Mecanismo de refresco del token de autenticacion.
- Errores de validacion de formularios.
- Bugs de layout responsivo en mobile.

## [0.9.1] - 2025-04-20

### Added
- Configuracion de autenticacion JWT.
- Endpoints del API para autenticacion (GET, POST, PUT).
- Endpoints del API para la tabla general (GET, POST, PUT).
- Theme color para navegadores.
- Setup de Docker y docker compose.
- Sistema de layout para tablas.
- Sistema de catalogos para selects y multiselects.
- Providers de contexto (autenticacion, home, global, catalogs, users).
- Estructura de layout principal (header, body, footer).
- Paginas nuevas: About us, Home, Login, Register, Terms, 404.
- Componentes: Button, CardPage, Checkbox, Input, Radio, Select,
  MultiSelect, Spinner, Typography, Tooltip, etc.
- Funciones helpers.

### Removed
- Servicio de Supabase.

## [0.1.0] - 2025-01-20

### Added
- Setup inicial del repositorio en GitLab.
- Package.json + TailwindCSS + React Router + Vite.
- Mockups de Login y Home.
- Configuracion inicial de Supabase (removido en 0.9.1).
