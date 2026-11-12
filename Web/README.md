# HemaBlocks · versión web (solo pruebas y certámenes)

Página estática con las 6 evaluaciones de la app: Pruebas 1 a 4, Certamen modelo y Certamen final.
Cada intento sortea preguntas, entrega nota (escala chilena, 60 % = 4,0) y explica cada error.

- Funciona en Chrome/Safari de tablets y celulares (Galaxy Tab S6 Lite, iPad mini con iOS 12.5 o más nuevo).
- El progreso se guarda en el navegador de cada aparato (localStorage).
- Solo usa `data/missions.json` y `data/exams.json`; el resto de la carpeta `data/`, `lab.js` y `frotis/` ya no se cargan y puedes no subirlos.

Para probar: `python3 -m http.server 8765` dentro de esta carpeta y abrir http://localhost:8765/
