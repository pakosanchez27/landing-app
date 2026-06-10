Proyecto portable de landings en PHP puro.

Estructura:
- usuarios/index.php
- comercios/index.php
- assets/css
- assets/js
- assets/img

Configuracion opcional por entorno:
- FRONTEND_URL=https://tu-app.com
- MAP_API_URL=https://tu-api.com/api/puntos-mapa

Si no defines MAP_API_URL, la landing de usuarios usara FRONTEND_URL + /api/puntos-mapa.