# Componentes UI

Componentes reutilizables de interfaz para mantener consistencia visual y de comportamiento en la aplicación.

## Input

Componente basado en `TextInput` de React Native.

### Props principales

Además de todas las propiedades disponibles de `TextInputProps`, admite:

| Prop       | Tipo             | Descripción                                 |
| ---------- | ---------------- | ------------------------------------------- |
| `label`    | `string`         | Texto descriptivo mostrado sobre el campo.  |
| `error`    | `string \| null` | Mensaje de error mostrado debajo del campo. |
| `disabled` | `boolean`        | Deshabilita la edición del campo.           |

### Estado

El valor del `Input` debe mantenerse normalmente en la **Screen que lo utiliza**, utilizando un estado controlado:

```tsx
const [email, setEmail] = useState("");
```

Uso:

```tsx
<Input label="Email" value={email} onChangeText={setEmail} />
```

### Campo de contraseña

Para ocultar el contenido y mostrarlo como puntos, utilizar `secureTextEntry`:

```tsx
<Input label="Contraseña" value={password} onChangeText={setPassword} secureTextEntry />
```

`secureTextEntry` es una propiedad heredada de `TextInputProps`.

### Campo deshabilitado

El componente expone `disabled` como una API propia:

```tsx
<Input label="Email" disabled />
```

Internamente se traduce a:

```tsx
editable={!disabled}
```

### Errores

```tsx
<Input label="Email" value={email} onChangeText={setEmail} error="El email no es válido" />
```

---

## Select

`Select` es un componente de formulario que permite seleccionar una opción de una lista desplegable. Utiliza un `Modal` para mostrar las opciones disponibles.

### Props

| Prop            | Tipo                      | Default            | Descripción                                           |
| --------------- | ------------------------- | ------------------ | ----------------------------------------------------- |
| `label`         | `string`                  | —                  | Texto descriptivo mostrado sobre el campo.            |
| `options`       | `SelectOption[]`          | —                  | Lista de opciones disponibles.                        |
| `selectedValue` | `string \| null`          | —                  | Valor actualmente seleccionado.                       |
| `onSelect`      | `(value: string) => void` | —                  | Callback ejecutado al seleccionar una opción.         |
| `placeholder`   | `string`                  | `"Seleccionar..."` | Texto mostrado cuando no hay una opción seleccionada. |
| `error`         | `string \| null`          | —                  | Mensaje de error mostrado debajo del campo.           |
| `disabled`      | `boolean`                 | `false`            | Deshabilita la interacción con el selector.           |

### SelectOption

Cada opción debe tener la siguiente estructura:

```ts
interface SelectOption {
  label: string;
  value: string;
}
```

Por ejemplo:

```tsx
const opciones = [
  { label: "Alta", value: "alta" },
  { label: "Media", value: "media" },
  { label: "Baja", value: "baja" },
];
```

`label` es el texto que ve el usuario y `value` es el valor que utiliza la aplicación.

### Estado controlado

El valor seleccionado debe mantenerse en la **Screen o componente padre**, no dentro de `Select`.

```tsx
const [prioridad, setPrioridad] = useState<string | null>(null);
```

Uso:

```tsx
<Select label="Prioridad" options={opciones} selectedValue={prioridad} onSelect={setPrioridad} />
```

El flujo es:

```text
Usuario selecciona opción
        ↓
Select ejecuta onSelect(value)
        ↓
La Screen actualiza el estado
        ↓
selectedValue cambia
        ↓
Select muestra la nueva opción
```

### Placeholder

Cuando `selectedValue` es `null`, se muestra `placeholder`:

```tsx
<Select
  label="Categoría"
  options={categorias}
  selectedValue={categoria}
  onSelect={setCategoria}
  placeholder="Seleccione una categoría"
/>
```

Si no se especifica, utiliza:

```text
Seleccionar...
```

### Opción seleccionada

El componente busca automáticamente la opción correspondiente a `selectedValue`:

```ts
const selectedOption = options.find((opt) => opt.value === selectedValue);
```

Por lo tanto, `selectedValue` debe coincidir con el `value` de alguna opción.

### Errores

Puede mostrar un mensaje de validación:

```tsx
<Select
  label="Categoría"
  options={categorias}
  selectedValue={categoria}
  onSelect={setCategoria}
  error="Debe seleccionar una categoría"
/>
```

Cuando existe `error`, el borde del campo utiliza el color de error definido en `coloresOficiales`.

### Estado deshabilitado

Para impedir la interacción:

```tsx
<Select label="Categoría" options={categorias} selectedValue={categoria} onSelect={setCategoria} disabled />
```

El componente modifica visualmente el campo y evita abrir el `Modal`.

### Modal y selección

Al presionar el campo se abre un `Modal` que contiene las opciones:

```text
┌─────────────────────────────┐
│ Categoría              ×    │
├─────────────────────────────┤
│ Infraestructura             │
│ Seguridad              ✓    │
│ Iluminación                 │
│ Limpieza                    │
└─────────────────────────────┘
```

Al seleccionar una opción:

1. Se ejecuta `onSelect(item.value)`.
2. Se actualiza el estado de la Screen.
3. Se cierra automáticamente el `Modal`.

### Accesibilidad

El campo principal utiliza:

```tsx
accessibilityRole = "combobox";
```

y comunica:

```tsx
accessibilityState={{
  expanded: modalVisible,
  disabled,
}}
```

El botón para cerrar las opciones también tiene un `accessibilityLabel`:

```tsx
accessibilityLabel = "Cerrar opciones";
```

### Criterio de uso

Utilizar `Select` cuando el usuario deba elegir **una única opción de un conjunto conocido**.

Ejemplos:

- Categoría.
- Prioridad.
- Tipo de reporte.
- Estado.
- Localidad.
- Tipo de usuario.

Para pocas opciones que deban permanecer visibles simultáneamente, puede ser más apropiado utilizar `Chip`.

El `Select` debe permanecer como componente presentacional: la Screen es responsable del estado, las validaciones y la lógica asociada a la selección.

## Button

Componente basado en `Pressable` de React Native.

### Props principales

Además de las propiedades disponibles de `PressableProps`, admite:

| Prop       | Tipo            | Default      | Descripción                                                 |
| ---------- | --------------- | ------------ | ----------------------------------------------------------- |
| `title`    | `string`        | —            | Texto del botón.                                            |
| `variant`  | `ButtonVariant` | `"primario"` | Variante visual.                                            |
| `size`     | `ButtonSize`    | `"grande"`   | Tamaño del botón.                                           |
| `loading`  | `boolean`       | `false`      | Muestra un indicador de carga y deshabilita la interacción. |
| `disabled` | `boolean`       | —            | Deshabilita la interacción.                                 |

### Variantes

```ts
type ButtonVariant = "accion" | "primario" | "secundario" | "contorno" | "peligro" | "texto";
```

### Tamaños

```ts
type ButtonSize = "grande" | "mediano";
```

### Loading

Cuando `loading` es `true`, se muestra un `ActivityIndicator` y se bloquea la interacción:

```tsx
<Button title="Iniciar sesión" loading={isLoading} />
```

Internamente:

```tsx
disabled={disabled || loading}
```

### Estado del formulario

El estado debe permanecer en la **Screen**, no dentro del `Button`.

```tsx
const [email, setEmail] = useState("");

const handleSubmit = () => {
  console.log(email);
};

return (
  <>
    <Input label="Email" value={email} onChangeText={setEmail} />

    <Button title="Continuar" onPress={handleSubmit} disabled={!email.trim()} />
  </>
);
```

### Accesibilidad

El componente utiliza:

```tsx
accessibilityRole = "button";
```

y comunica los estados `disabled` y `loading` mediante `accessibilityState`.

### Estilos dinámicos

`Button` utiliza `pressed`, proporcionado por `Pressable`, para modificar el estilo mientras el usuario mantiene presionado el botón.

En React Native Web también se recibe `hovered`:

```tsx
style={({ pressed, hovered }) => [
  styles.base,
  getVariantStyles(pressed),
]}
```

Si se utiliza el `style` recibido por props como función, se debe pasar el estado completo:

```tsx
typeof style === "function" ? style({ pressed, hovered }) : style;
```

---

## StatusBadge

`StatusBadge` representa visualmente el **estado actual de un reporte** mediante una etiqueta, un símbolo y un color.

### Props

| Prop     | Tipo            | Descripción                |
| -------- | --------------- | -------------------------- |
| `status` | `EstadoReporte` | Estado actual del reporte. |

Ejemplo:

```tsx
<StatusBadge status="en_revision" />
```

### Estados disponibles

```ts
export type EstadoReporte = "recibido" | "en_revision" | "asignado" | "resuelto" | "rechazado";
```

### Configuración

La información visual se centraliza en `CONFIG_ESTADOS`:

```ts
const CONFIG_ESTADOS: Record<
  EstadoReporte,
  {
    label: string;
    simbolo: string;
    color: string;
  }
> = {
  recibido: {
    label: "Recibido",
    simbolo: "•",
    color: coloresOficiales.recibido,
  },
  en_revision: {
    label: "En revisión",
    simbolo: "◐",
    color: coloresOficiales.enRevision,
  },
  asignado: {
    label: "Asignado",
    simbolo: "◆",
    color: coloresOficiales.asignado,
  },
  resuelto: {
    label: "Resuelto",
    simbolo: "✔",
    color: coloresOficiales.resuelto,
  },
  rechazado: {
    label: "Rechazado",
    simbolo: "✖",
    color: coloresOficiales.rechazado,
  },
};
```

`Record<EstadoReporte, ...>` garantiza que todos los estados definidos en `EstadoReporte` tengan una configuración correspondiente.

### Uso

```tsx
<StatusBadge status={reporte.estado} />
```

No es necesario proporcionar manualmente el texto, símbolo o color.

---

## Card

`Card` es un componente contenedor basado en `View`. Proporciona un estilo visual común para agrupar contenido dentro de una superficie.

### Props

Utiliza `ViewProps`, por lo que admite las propiedades estándar de `View`.

| Prop       | Tipo                   | Descripción                     |
| ---------- | ---------------------- | ------------------------------- |
| `children` | `ReactNode`            | Contenido dentro de la tarjeta. |
| `style`    | `StyleProp<ViewStyle>` | Permite personalizar el estilo. |

### Uso

```tsx
<Card>
  <ThemedText>Información del reporte</ThemedText>
</Card>
```

Puede contener otros componentes:

```tsx
<Card>
  <ThemedText type="subtitle">Reporte #1234</ThemedText>

  <StatusBadge status="en_revision" />

  <Button title="Ver detalle" size="mediano" />
</Card>
```

### Tema

`Card` obtiene automáticamente sus colores mediante `useTheme()`:

```tsx
backgroundColor: theme.backgroundElement;
borderColor: theme.border;
```

No es necesario definir estos colores manualmente al utilizar el componente.

### Estilos personalizados

```tsx
<Card style={{ marginTop: 20 }}>
  <ThemedText>Contenido</ThemedText>
</Card>
```

El estilo recibido por `style` se aplica después del estilo base, permitiendo personalizar aspectos puntuales.

---

## Chip

`Chip` es un elemento compacto utilizado para representar una **opción seleccionable**, filtro o categoría.

### Props

| Prop       | Tipo         | Default | Descripción                              |
| ---------- | ------------ | ------- | ---------------------------------------- |
| `label`    | `string`     | —       | Texto mostrado en el chip.               |
| `selected` | `boolean`    | `false` | Indica si la opción está seleccionada.   |
| `onPress`  | `() => void` | —       | Callback ejecutado al presionar el chip. |

### Uso básico

```tsx
<Chip label="Todos" onPress={() => setFiltro("todos")} />
```

### Estado seleccionado

```tsx
<Chip label="Resueltos" selected={filtro === "resueltos"} onPress={() => setFiltro("resueltos")} />
```

Cuando `selected` es `true`:

- Utiliza `coloresOficiales.primario` como fondo.
- Utiliza el color blanco para el texto.
- Utiliza el color primario para el borde.

Cuando `selected` es `false`, utiliza los colores del tema actual.

### Uso como filtro

El estado de selección debe mantenerse en la Screen:

```tsx
const [filtro, setFiltro] = useState("todos");

return (
  <>
    <Chip label="Todos" selected={filtro === "todos"} onPress={() => setFiltro("todos")} />

    <Chip label="Pendientes" selected={filtro === "pendientes"} onPress={() => setFiltro("pendientes")} />

    <Chip label="Resueltos" selected={filtro === "resueltos"} onPress={() => setFiltro("resueltos")} />
  </>
);
```

`Chip` no mantiene internamente el estado de selección. La Screen es responsable de determinar qué opción está seleccionada.

---

## State Views

`state-views.tsx` contiene componentes reutilizables para representar los **estados principales de una pantalla que obtiene información de forma asíncrona**:

- `LoadingState`
- `ErrorState`
- `EmptyState`

Estos componentes permiten mantener una presentación consistente mientras una Screen está cargando datos, encuentra un error o no tiene información para mostrar.

### LoadingState

Representa un estado de carga.

#### Props

| Prop      | Tipo     | Default         | Descripción                                   |
| --------- | -------- | --------------- | --------------------------------------------- |
| `message` | `string` | `"Cargando..."` | Mensaje mostrado junto al indicador de carga. |

Uso:

```tsx
<LoadingState />
```

Con mensaje personalizado:

```tsx
<LoadingState message="Cargando reportes..." />
```

Debe utilizarse mientras se espera una operación asíncrona:

```tsx
if (loading) {
  return <LoadingState message="Cargando reportes..." />;
}
```

---

### ErrorState

Representa un error ocurrido durante la carga o procesamiento de información.

#### Props

| Prop      | Tipo         | Descripción                                     |
| --------- | ------------ | ----------------------------------------------- |
| `message` | `string`     | Descripción del error.                          |
| `onRetry` | `() => void` | Callback opcional para reintentar la operación. |

Uso:

```tsx
<ErrorState message="No se pudieron cargar los reportes." />
```

Con opción de reintentar:

```tsx
<ErrorState message="No se pudieron cargar los reportes." onRetry={cargarReportes} />
```

Si `onRetry` existe, el componente muestra automáticamente un botón `Reintentar`.

La acción concreta de reintento debe permanecer en la Screen:

```tsx
const cargarReportes = async () => {
  // llamada a la API
};
```

---

### EmptyState

Representa una situación en la que la operación fue correcta pero **no existen datos para mostrar**.

#### Props

| Prop          | Tipo                  | Descripción                                                          |
| ------------- | --------------------- | -------------------------------------------------------------------- |
| `message`     | `string`              | Mensaje mostrado al usuario.                                         |
| `icon`        | nombre de `Ionicons`  | Opcional. Ícono grande mostrado arriba del mensaje.                  |
| `actionLabel` | `string`              | Opcional. Texto del botón de acción (requiere `onAction`).           |
| `onAction`    | `() => void`          | Opcional. Callback del botón de acción, por ejemplo "Quitar filtros". |

Uso:

```tsx
<EmptyState message="No hay reportes registrados." />
```

Ejemplo dentro de una Screen:

```tsx
if (!reportes.length) {
  return <EmptyState message="No hay reportes para mostrar." />;
}
```

Con ícono y acción (por ejemplo, cuando hay filtros activos):

```tsx
<EmptyState
  icon="file-tray-outline"
  message="Ningún reporte coincide con los filtros."
  actionLabel="Quitar filtros"
  onAction={limpiarFiltros}
/>
```

### Diferencia entre estados

Los tres componentes representan situaciones diferentes:

```text
LoadingState
    ↓
La información todavía se está obteniendo.

ErrorState
    ↓
La operación terminó con un error.

EmptyState
    ↓
La operación fue exitosa, pero no existen datos.
```

La Screen debe determinar cuál de estos estados corresponde y renderizar el componente adecuado.

---

## FilterPill

`FilterPill` es un selector compacto en forma de píldora, pensado para **barras de filtros** (varias píldoras en una fila). Al presionarlo abre un `Modal` con las opciones y siempre incluye la opción **"Todos"** (sin filtro).

### Props

| Prop            | Tipo                                 | Descripción                                                    |
| --------------- | ------------------------------------ | -------------------------------------------------------------- |
| `label`         | `string`                             | Nombre del filtro; se muestra mientras no hay valor elegido.   |
| `options`       | `{ label: string; value: string }[]` | Opciones disponibles (sin incluir "Todos").                    |
| `selectedValue` | `string \| null`                     | Valor elegido. `null` = sin filtro.                            |
| `onSelect`      | `(value: string \| null) => void`    | Recibe el valor elegido, o `null` si se elige "Todos".         |

Uso:

```tsx
<FilterPill
  label="Estado"
  options={ESTADO_OPTIONS}
  selectedValue={filters.estado}
  onSelect={(value) => setFilter("estado", value)}
/>
```

Ocupa el ancho disponible (`flex: 1`), por lo que varias píldoras en una fila se reparten el espacio. Con un valor elegido se resalta con el color primario y muestra el texto de la opción.

Diferencia con `Select`: `Select` es un campo de formulario (con etiqueta, alto de 56 y placeholder); `FilterPill` es para filtrar listas y permite volver a "Todos".

---

## Criterio general

Los componentes de `components/ui` deben ser **reutilizables y principalmente presentacionales**.

La Screen o el componente contenedor debería encargarse de:

- Estado de formularios.
- Validaciones.
- Llamadas a APIs.
- Lógica de negocio.
- Manejo de estados de carga.
- Determinar qué estado visual mostrar.

Los componentes UI deberían encargarse principalmente de:

- Presentación.
- Estilos.
- Interacción visual.
- Exponer props reutilizables.
- Comunicar eventos mediante callbacks como `onPress` y `onChangeText`.

Cuando un componente dependa de un tipo de dominio existente, como `EstadoReporte`, debe reutilizar ese tipo en lugar de redefinirlo.
