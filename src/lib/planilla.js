import { eur } from "./format.js";

const esc = (t) =>
  String(t ?? "").replace(
    /[&<>]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c],
  );

const fechaEmision = () =>
  new Date().toLocaleString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const documento = ({
  titulo,
  subtitulo,
  columnas,
  filas,
  total,
}) => {
  const emitido = fechaEmision();
  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><title>${esc(titulo)}</title>
<style>
  @page { size: A4; margin: 14mm; }
  * { box-sizing: border-box; }
  body { font: 12px/1.45 system-ui, -apple-system, "Segoe UI", sans-serif; color: #191B1A; margin: 0; }
  .membrete { display: flex; justify-content: space-between; align-items: baseline;
              padding-bottom: 8px; margin-bottom: 18px; border-bottom: 2px solid #191B1A; }
  .marca { font-weight: 700; font-size: 13px; letter-spacing: .24em; }
  .emitido { font-size: 10px; color: #6E7370; }
  h1 { font-size: 15px; letter-spacing: .18em; text-transform: uppercase; margin: 0 0 4px; }
  p.sub { margin: 0 0 16px; color: #6E7370; font-size: 12px; }
  table { width: 100%; border-collapse: collapse; border: 1px solid #191B1A; }
  th { text-align: left; font-size: 10px; letter-spacing: .08em; text-transform: uppercase;
       color: #6E7370; background: #F5F6F4; border-bottom: 1px solid #191B1A;
       border-right: 1px solid #D7DEE5; padding: 7px 8px; }
  th:last-child { border-right: none; }
  td { padding: 9px 8px; border-bottom: 1px solid #E3E4E1; border-right: 1px solid #E3E4E1; }
  td:last-child { border-right: none; }
  th.num, td.num { text-align: right; }
  td.firma { width: 34%; }
  tfoot td { font-weight: 600; border-top: 1px solid #191B1A; border-bottom: none; background: #F5F6F4; }
  tr { break-inside: avoid; }
  .pie { margin-top: 22px; padding-top: 8px; border-top: 1px solid #E3E4E1;
         font-size: 9px; color: #9DA19C; text-align: center; }
</style></head><body>
<div class="membrete">
  <span class="marca">ESTAJOS</span>
  <span class="emitido">Generado el ${esc(emitido)}</span>
</div>
<h1>${esc(titulo)}</h1>
<p class="sub">${esc(subtitulo)}</p>
<table>
  <thead><tr>${columnas
    .map(
      (c, i) =>
        `<th class="${i && c !== "Firma" ? "num" : ""}">${esc(c)}</th>`,
    )
    .join("")}</tr></thead>
  <tbody>${filas
    .map(
      (f) =>
        `<tr>${f
          .map((celda, i) =>
            columnas[i] === "Firma"
              ? `<td class="firma"></td>`
              : `<td class="${i ? "num" : ""}">${esc(celda)}</td>`,
          )
          .join("")}</tr>`,
    )
    .join("")}</tbody>
  <tfoot><tr>
    <td>Total (${filas.length})</td>
    <td class="num" colspan="${Math.max(1, columnas.length - (columnas.at(-1) === "Firma" ? 2 : 1))}">${esc(eur(total))}</td>
    ${columnas.at(-1) === "Firma" ? "<td></td>" : ""}
  </tr></tfoot>
</table>
<p class="pie">Documento generado automáticamente por Estajos Central · ${esc(emitido)}</p>
<script>window.onload = () => { window.focus(); window.print(); };</script>
</body></html>`;
};

/**
 * Genera el archivo de la planilla y lo manda a imprimir (de ahí sale el PDF).
 *
 * Lo que NO hace es `window.print()` sobre la pantalla: eso imprimía la app
 * entera —menús, botones y todo— en vez de la planilla, y en el navegador
 * del móvil directamente no hacía nada. El documento se construye aquí y se
 * imprime solo; si el navegador bloquea la ventana emergente, se descarga.
 */
export function abrirPlanilla({
  titulo,
  subtitulo = "",
  columnas,
  filas,
  total = 0,
}) {
  const html = documento({ titulo, subtitulo, columnas, filas, total });
  const ventana = window.open("", "_blank");

  if (ventana) {
    // El propio documento se manda a imprimir en su `onload`: hacerlo desde
    // aquí llega antes de que el navegador lo haya pintado.
    ventana.document.write(html);
    ventana.document.close();
    return;
  }

  // ponytail: sin ventana emergente se descarga el fichero y lo abre quien
  // quiera. Es el mismo documento, sólo cambia por dónde sale.
  const url = URL.createObjectURL(
    new Blob([html], { type: "text/html;charset=utf-8" }),
  );
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = `${titulo.replace(/[^\w\s-]/g, "").trim()}.html`;
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  URL.revokeObjectURL(url);
}
