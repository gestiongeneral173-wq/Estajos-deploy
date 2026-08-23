/**
 * Descarga `filas` (array de arrays) como CSV. Lleva BOM para que Excel en
 * Windows respete los acentos.
 */
export function descargarCSV(nombreArchivo, filas) {
  const csv = filas
    .map((fila) =>
      fila.map((celda) => `"${String(celda).replace(/"/g, '""')}"`).join(","),
    )
    .join("\n");

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");

  enlace.href = url;
  enlace.download = nombreArchivo;
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  URL.revokeObjectURL(url);
}
