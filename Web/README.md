# HemaBlocks · versión web

Página estática (sin instalación) con las misiones, las 6 pruebas tipo certamen, los casos por pistas,
el informe de frotis, el contador diferencial con células en 3D y la guía de LMA M0–M7.

- Funciona en Chrome/Safari de tablets y celulares (Galaxy Tab S6 Lite, iPad mini con iOS 12.5 o más nuevo).
- El 3D usa Three.js desde cdnjs; sin conexión o sin WebGL, el resto sigue funcionando.
- El progreso se guarda en el navegador de cada aparato (localStorage).
- Los datos salen de la app de Apple TV (`data/*.json`), exportados desde los archivos de contenido en Swift.

Para probar en el computador: `python3 -m http.server 8765` dentro de esta carpeta y abrir http://localhost:8765/
