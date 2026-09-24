# Comunicador AAC

Aplicación de comunicación asistida para Android. Permite crear frases grandes desde cero, tocarlas para mostrarlas y leerlas en voz alta, y conservarlas en el dispositivo sin conexión.

## Qué incluye

- Inicio completamente vacío: no hay frases de ejemplo predefinidas.
- Frases grandes y de alto contraste, pensadas para tocarse con precisión.
- Crear y editar frases con color opcional.
- Toque para mostrar la frase y reproducirla en español.
- Mantener presionada una frase para abrir editar o borrar.
- Guardado local con `localStorage` en navegador y soporte para Capacitor Preferences en Android.
- Voz nativa de Capacitor cuando está disponible y respaldo con `speechSynthesis` para la vista web.
- Modo de organizar para reordenar frases.
- Borrado total con confirmación.
- Funcionamiento sin servidores ni conexión después de instalarla.

## Generar el APK de Android

Requisitos: Node.js, pnpm, Android Studio o un Android SDK con Java/Gradle configurados.

Desde esta carpeta:

```bash
pnpm install
pnpm run cap:add:android
pnpm run cap:sync
```

Para abrir el proyecto nativo en Android Studio:

```bash
pnpm run cap:open:android
```

En Android Studio, espera a que termine la sincronización de Gradle y usa **Build > Build Bundle(s) / APK(s) > Build APK(s)**. El APK de depuración queda normalmente en:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

También se puede compilar desde consola:

```bash
pnpm run cap:build:debug
```

## Compilar desde Google Colab

Puedes clonar este repositorio en una celda de Colab y ejecutar el script preparado:

```bash
git clone https://github.com/DburgosA/pahablar.git
cd pahablar
bash build-apk-colab.sh
```

El APK se generará en:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

En Colab puedes descargarlo desde el panel de archivos o con:

```python
from google.colab import files
files.download("android/app/build/outputs/apk/debug/app-debug.apk")
```

El mismo flujo sirve para volver a sincronizar cambios de la interfaz:

```bash
pnpm run cap:sync
```

Para una versión firmada de distribución, configura un keystore en Android Studio y usa **Build > Generate Signed App Bundle / APK**.

## Permisos y voz

La aplicación no necesita internet ni permisos de red. El texto a voz usa el motor de voz instalado en Android y selecciona español (`es-ES`) cuando el plugin nativo está disponible. Si se abre como web durante el desarrollo, usa la voz del navegador.