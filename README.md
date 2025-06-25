## ¿Qué es esta herramienta?

Es una aplicación que combina datos de dos fuentes principales para evaluar el desempeño de los jugadores en raids:

- **WarcraftLogs:** Proporciona los porcentajes de parse basados únicamente en el daño realizado y el porcentaje de uptime. No toma en consideración las mecánicas; por ende, evitar realizar mecánicas puede inflar artificialmente este porcentaje.

- **Wipefest:** Proporciona una métrica basada exclusivamente en las mecánicas realizadas. El puntaje inicia en 100, y se reduce cada vez que un jugador no realiza una mecánica (por ejemplo, no hacer las bolas de basura en Stix, no descargar las torres en Rik, recibir daño del aceite en Vexie, etc.).

## ¿Por qué utilizamos ambos sitios?

Ambas métricas evalúan aspectos complementarios del desempeño. Considerar tanto el daño como la ejecución correcta de mecánicas permite recompensar correctamente a los jugadores que cumplen bien con ambos aspectos en cada encuentro.

## ¿Cómo sé que los números son reales?

- **WarcraftLogs:** La aplicación extrae datos directamente desde la API oficial. Puedes verificar la información en WarcraftLogs, ya que siempre debería coincidir.
- **Wipefest:** Debido a que Wipefest no hace públicos los datos completos sin la versión Premium, se desarrolló una extensión de Chrome para extraer estos datos desde un reporte. Aún sin la versión Premium, puedes verificar los puntajes promediando manualmente tus resultados individuales en cada encuentro.

## ¿Cómo se calculan los datos?

### 1. Porcentaje de Parse (WarcraftLogs)
- Solo se consideran los intentos en los que el jefe fue derrotado (kills).
- Si no existen kills, se toman los mejores intentos disponibles.
- Se combina el rendimiento de todas las especializaciones utilizadas por el jugador (no considera cambios de personaje, solo de especialización).
- Se calcula un promedio general de todos los intentos considerados.

### 2. Puntuación de Wipefest
- Se obtiene directamente desde la plataforma Wipefest mediante un archivo CSV extraído con la extensión desarrollada.

### 3. Puntuación Final (Avg Score)
- Se calcula como el promedio entre WarcraftLogs y Wipefest:

```
Puntuación Final = (Parse WarcraftLogs + Puntuación Wipefest) ÷ 2
```

## ¿Cómo interpretar los resultados?

La tabla muestra:
- **Rank:** Posición basada en la puntuación final.
- **Player:** Nombre del jugador.
- **Spec:** Especialización actual.
- **Attendance:** Asistencia (intentos presentes/total intentos).
- **Log Parse:** Porcentaje promedio obtenido de WarcraftLogs.
- **Wipefest Parse:** Puntaje promedio obtenido de Wipefest.
- **Avg Score:** Puntaje combinado final.

## ¿Qué sucede si muero justo en el intento que matamos al boss? ¿Pierdo loot?

¡No! El sistema considera el promedio general de todos los intentos realizados. Por lo tanto, tener un mal desempeño o morir en un intento específico no arruinará automáticamente tu puntuación final si tu desempeño fue bueno en otros intentos.

## Características adicionales

### Filtros y visualización
- Puedes alternar entre ver datos de un solo reporte o de múltiples reportes combinados.
- Puedes filtrar por rangos específicos de porcentaje o posiciones en el ranking.

### Comparación de reportes (NUEVO)
- **Comparar múltiples reportes:** Importa varios códigos de reporte y compara el desempeño entre ellos.
- **Seguimiento de mejoras:** Identifica qué jugadores han mejorado o empeorado entre diferentes raids.
- **Análisis de cambios:** Ve cambios específicos en parse percentiles, puntajes de mecánicas y promedio total.
- **Estados de jugadores:** Clasifica automáticamente a los jugadores como "Mejorado", "Empeorado", "Estable", "Nuevo" o "Ausente".
- **Filtros avanzados:** Filtra por cambios significativos o establece umbrales mínimos de cambio.
- **Estadísticas resumidas:** Ve un resumen visual de cuántos jugadores están en cada categoría.

### Asistencia
- Se calcula automáticamente según la presencia del jugador en cada intento.
- Permite evaluar la constancia en la participación de cada jugador.

## ¿Cómo acceder a los datos originales?

- **WarcraftLogs:**
  - Ingresa a [warcraftlogs.com](https://warcraftlogs.com)
  - Busca tu reporte utilizando el código proporcionado.
  - En la sección "Rankings" puedes ver los porcentajes por cada intento.

- **Wipefest:**
  - Ingresa a [wipefest.gg](https://wipefest.gg)
  - Localiza tu reporte para consultar puntuaciones detalladas y realizar comparativas.

## Tengo una sugerencia, ¿cómo la comunico?

Esta herramienta fue desarrollada específicamente para atender las necesidades de esta guild. Si tienes sugerencias, son bienvenidas y se evaluarán para implementarse.

Puedes enviarlas directamente mediante un mensaje a @gonzagalfre, o dentro del juego a **Jhinlikesart-Stormrage**.