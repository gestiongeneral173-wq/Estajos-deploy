import { useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, Send, Trash2 } from "lucide-react";
import { JornadaModal } from "./JornadaModal.jsx";
import { PersonaPicker } from "./PersonaPicker.jsx";
import { TemporalModal } from "./TemporalModal.jsx";
import { CodeBadges } from "../components/ui/Badges.jsx";
import { Button, Card, Num, SectionTitle } from "../components/ui/primitives.jsx";
import { nombrePersona } from "./useCampo.js";
import { rosterToList } from "../lib/calculos.js";
import { formatFecha, hoy, idLocal } from "../lib/format.js";
import { colors, hexToRgba } from "../theme.js";

export function NuevoRegistroWizard({
  registrosCampo,
  vehiculos,
  personas,
  encargadoId,
  onFinalizar,
  onCompletar,
  onCancel,
}) {
  const fechaInputRef = useRef(null);
  // `abiertoEn` recuerda qué día era al abrir el asistente. Si se cruza la
  // medianoche con el parte a medias, la fecha elegida ya no es "hoy" y
  // enviarla sobreescribiría el parte del día anterior, mezclando dos
  // jornadas. En vez de mandarlo en silencio, se avisa.
  const [abiertoEn] = useState(hoy());
  const [fecha, setFecha] = useState(hoy()),
    [vehiculoId, setVehiculoId] = useState(null),
    [cerrado, setCerrado] = useState(false),
    [equipo, setEquipo] = useState([]),
    [pendiente, setPendiente] = useState(null),
    [enviado, setEnviado] = useState(false),
    [temporales, setTemporales] = useState([]),
    [modalTemporal, setModalTemporal] = useState(false),
    [error, setError] = useState(null),
    [enviando, setEnviando] = useState(false),
    // La fila del parte que se está acompletando, con lo que ya vale guardado.
    [acompletando, setAcompletando] = useState(null),
    registrosDelDia = registrosCampo[fecha] || {},
    // Un parte ya enviado no se rehace: si la furgoneta elegida ya tiene el
    // suyo, el asistente cambia de oficio y solo deja rellenar los ceros.
    parteExistente = vehiculoId ? registrosDelDia[vehiculoId] : null,
    filasDelParte = parteExistente
      ? rosterToList(parteExistente).filter((fila) => parteExistente.horasRoles?.[fila.id])
      : [],
    ocupados = useMemo(() => {
      const z = new Set();
      // Quien tiene jornada ese día ya está en una furgoneta. Antes se miraban
      // los roles por separado, y el encargado del parte contaba como ocupado
      // aunque no fuera a bordo — cosa que ahora pasa a menudo.
      Object.values(registrosDelDia).forEach((valu) => {
        Object.keys(valu.horasRoles || {}).forEach((te) => z.add(te));
      });
      return z;
    }, [registrosDelDia]),
    yaEnEquipo = new Set(equipo.map((z) => z.id)),
    disponibles = personas.filter(
      (persona) => !ocupados.has(persona.id) && !yaEnEquipo.has(persona.id),
    ),
    // Los dos roles se marcan al añadir a cada persona. El chofer es
    // obligatorio; el encargado a bordo puede no existir. Quien registra el
    // parte (la sesión del PIN) es otra cosa: va en `partes.registrado_por` y
    // la pone la base, no esta pantalla.
    encargado = equipo.find((z) => z.roles.includes("E")) || null,
    chofer = equipo.find((z) => z.roles.includes("C")) || null,
    rolesDe = (miembro) => miembro.roles;
  const elegirPersona = (z) =>
      setPendiente({
        id: z,
      }),
    confirmarJornada = (z, q, ie) => {
      setEquipo((te) => [
        ...te,
        {
          id: pendiente.id,
          horas: z,
          destajo: q,
          roles: ie,
        },
      ]);
      setPendiente(null);
    },
    quitarDelEquipo = (z) => setEquipo((q) => q.filter((te) => te.id !== z)),
    vehiculo = vehiculos.find((z) => z.id === vehiculoId),
    puedeEnviar = !!chofer,
    enviarParte = async () => {
      // Se vuelve a mirar el reloj al enviar, no al abrir.
      const hoyAhora = hoy();
      if (fecha === abiertoEn && abiertoEn !== hoyAhora) {
        setFecha(hoyAhora);
        window.alert(
          `Ha pasado la medianoche mientras rellenabas el parte. La fecha ha cambiado a ${formatFecha(hoyAhora)}. Revísala y vuelve a enviar.`,
        );
        return;
      }
      const z = equipo
          .filter((te) => te.roles.length === 0)
          .map((te) => ({
            id: te.id,
            horas: te.horas,
            destajo: te.destajo,
          })),
        q = {};
      equipo.forEach((te) => {
        q[te.id] = {
          horas: te.horas,
          destajo: te.destajo,
        };
      });
      // Antes esto no se esperaba ni se capturaba: la base podía rechazar el
      // parte y el encargado veía igualmente "Parte enviado", con el error
      // yéndose a la consola.
      setError(null);
      setEnviando(true);
      try {
        await onFinalizar(fecha, vehiculoId, {
          encargado: (encargado == null ? undefined : encargado.id) ?? null,
          chofer: (chofer == null ? undefined : chofer.id) ?? null,
          pasajeros: z,
          horasRoles: q,
          temporales: temporales.map((temporal) => ({
            nombre: temporal.nombre,
            destajo: temporal.destajo,
          })),
        });
        setEnviado(true);
      } catch (te) {
        setError(te.message);
      } finally {
        setEnviando(false);
      }
    },
    guardarAcompletado = async (z, q) => {
      if (enviando) return;
      setError(null);
      setEnviando(true);
      try {
        await onCompletar(fecha, vehiculoId, acompletando.id, z, q);
        setAcompletando(null);
      } catch (te) {
        setError(te.message);
        setAcompletando(null);
      } finally {
        setEnviando(false);
      }
    },
    nombrePendiente = pendiente ? nombrePersona(personas, pendiente.id) : "";
  if (enviado) {
    const z = equipo.reduce((q, te) => q + (te.horas || 0), 0);
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center mb-4"
          style={{
            background: hexToRgba(colors.primary, 0.12),
          }}
        >
          <Check
            className="w-7 h-7"
            style={{
              color: colors.primary,
            }}
            strokeWidth={2.5}
          />
        </div>
        <p
          className="text-lg font-semibold"
          style={{
            color: colors.navyDark,
          }}
        >
          Parte enviado
        </p>
        <p className="text-[13px] text-gray-600 mt-1 mb-1">
          {vehiculo == null ? undefined : vehiculo.nombre}
          {" · "}
          {formatFecha(fecha)}
        </p>
        <p className="text-[13px] text-gray-600 mb-7">
          <span className="cifra">{equipo.length}</span>
          {" personas · "}
          <span className="cifra">{z}</span>
          {" horas"}
        </p>
        <Button variant="dark" className="max-w-xs" onClick={onCancel}>
          Volver al inicio
        </Button>
      </div>
    );
  }
  const pasoAnterior = () => {
      paso === 2
        ? (setVehiculoId(null), setEquipo([]), setCerrado(false))
        : paso === 3 && setCerrado(false);
    },
    paso = vehiculoId ? (cerrado ? 3 : 2) : 1,
    pasos = ["Furgoneta", "Equipo", "Enviar"],
    totalHoras = equipo.reduce((z, q) => z + (q.horas || 0), 0),
    totalDestajo = equipo.reduce((z, q) => z + (q.destajo || 0), 0);
  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 space-y-3 max-w-md sm:max-w-xl mx-auto w-full">
      {!parteExistente && (
        <div className="flex items-end gap-2 pb-1">
          {pasos.map((z, q) => {
            const te = q + 1,
              se = te < paso,
              Fe = te === paso;
            return (
              <div className="flex-1" key={z}>
                <p
                  className="eyebrow mb-1.5 truncate"
                  style={{
                    color: Fe ? colors.navyDark : se ? colors.primary : colors.muted,
                    opacity: Fe || se ? 1 : 0.6,
                  }}
                >
                  {z}
                </p>
                <div
                  className="h-1 rounded-full transition-colors"
                  style={{
                    background: se ? colors.primary : Fe ? colors.navyDark : colors.line,
                  }}
                />
              </div>
            );
          })}
        </div>
      )}
      {paso > 1 && (
        <button
          onClick={pasoAnterior}
          className="flex items-center gap-1 text-[12px] font-medium -mt-1"
          style={{
            color: colors.muted,
          }}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {parteExistente ? "Elegir otra furgoneta" : "Paso anterior"}
        </button>
      )}
      {error && (
        <p
          className="text-[12px] rounded-lg px-3.5 py-2.5"
          style={{
            color: colors.danger,
            background: hexToRgba(colors.danger, 0.08),
          }}
        >
          {error}
        </p>
      )}
      <div className="relative">
        <Card
          className="flex items-center gap-3 !py-4 cursor-pointer"
          onClick={() => fechaInputRef.current?.showPicker?.()}
        >
          <div className="flex-1 min-w-0">
            <p
              className="eyebrow"
              style={{
                color: colors.muted,
              }}
            >
              Día del parte
            </p>
            <p
              className="font-semibold text-[15px] mt-0.5"
              style={{
                color: colors.navyDark,
              }}
            >
              {formatFecha(fecha)}
            </p>
          </div>
          <span
            className="text-[11px] flex-shrink-0"
            style={{
              color: colors.muted,
            }}
          >
            Cambiar
          </span>
        </Card>
        {/*
          `showPicker()` es la forma estándar de abrir el selector nativo
          desde cualquier punto de la tarjeta, en vez de estirar este input
          para que él mismo reciba el clic: eso dependía de que ningún otro
          elemento quedara por encima en ningún navegador/tamaño de
          pantalla, y en Chrome de escritorio real no abría nada al tocar
          "Cambiar" aunque el clic sí llegaba al input (verificado con
          Playwright). Con showPicker() el input no necesita recibir clics
          directos, así que puede quedar reducido a un punto invisible.
        */}
        <input
          ref={fechaInputRef}
          type="date"
          value={fecha}
          max={hoy()}
          aria-label="Día del parte"
          onChange={(z) => {
            setFecha(z.target.value);
            setError(null);
            setVehiculoId(null);
            setEquipo([]);
            setCerrado(false);
            setTemporales([]);
          }}
          className="absolute w-px h-px opacity-0 pointer-events-none"
        />
      </div>
      {!vehiculoId && (
        <Card>
          <SectionTitle color="green">Elige tu furgoneta</SectionTitle>
          <div className="grid grid-cols-2 gap-2">
            {vehiculos.map((z) => {
              // Tres estados, no dos: libre, registrada por mí (se puede
              // acompletar) y registrada por otro (no se toca).
              const parte = registrosDelDia[z.id],
                mia = !!parte && parte.registradoPor === encargadoId,
                q = !!parte && !mia,
                te = vehiculoId === z.id;
              return (
                <button
                  disabled={q}
                  onClick={() => {
                    setVehiculoId(z.id);
                    setEquipo([]);
                    setCerrado(false);
                    setTemporales([]);
                    setError(null);
                  }}
                  className="rounded-xl p-3 text-left transition-all active:scale-[0.98] disabled:cursor-not-allowed min-h-[76px] relative"
                  style={
                    q
                      ? {
                          border: `1px solid ${colors.line}`,
                          background: "#F8F8F6",
                        }
                      : te
                        ? {
                            border: `1px solid ${colors.primary}`,
                            background: "#fff",
                          }
                        : {
                            border: `1px solid ${colors.line}`,
                            background: "#fff",
                          }
                  }
                  key={z.id}
                >
                  {te && (
                    <span
                      className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{
                        background: colors.primary,
                      }}
                    >
                      <Check className="w-3 h-3 text-white" strokeWidth={3} />
                    </span>
                  )}
                  <p
                    className="text-[15px] font-semibold"
                    style={{
                      color: q ? colors.muted : colors.navyDark,
                    }}
                  >
                    {z.nombre}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    <span className="cifra">{z.plazas}</span>
                    {" plazas"}
                  </p>
                  <p
                    className="text-[11px] font-medium mt-1.5"
                    style={{
                      color: q ? colors.muted : colors.primary,
                    }}
                  >
                    {q
                      ? `Registrada por ${nombrePersona(personas, parte.registradoPor)}`
                      : mia
                        ? "Acompletar jornada"
                        : "Libre"}
                  </p>
                </button>
              );
            })}
          </div>
        </Card>
      )}
      {parteExistente && (
        <Card className="!p-0 overflow-hidden">
          <div className="flex items-baseline gap-2 px-5 pt-4 pb-1">
            <p
              className="text-[17px] font-semibold tracking-tight flex-1 truncate"
              style={{
                color: colors.navyDark,
              }}
            >
              {vehiculo == null ? undefined : vehiculo.nombre}
            </p>
            <span
              className="text-[11px]"
              style={{
                color: colors.muted,
              }}
            >
              <span className="cifra">{filasDelParte.length}</span>
              {" a bordo"}
            </span>
          </div>
          <p
            className="px-5 pb-3 text-[12px]"
            style={{
              color: colors.muted,
            }}
          >
            Este parte ya está enviado. No se puede rehacer: solo rellenar las horas o el destajo
            que se quedaron en cero.
          </p>
          <div
            className="px-5 divide-y"
            style={{
              borderColor: colors.line,
            }}
          >
            {filasDelParte.map((fila) => {
              const falta = (fila.horas ?? 0) === 0 || (fila.destajo ?? 0) === 0;
              return (
                <button
                  key={fila.id}
                  disabled={!falta}
                  onClick={() =>
                    setAcompletando({
                      id: fila.id,
                      horas: fila.horas ?? 0,
                      destajo: fila.destajo ?? 0,
                    })
                  }
                  className="w-full flex items-center gap-2 py-2.5 text-left disabled:cursor-default"
                >
                  <span className="min-w-0 flex-1 flex items-center gap-1.5">
                    <span
                      className="text-sm truncate"
                      style={{
                        color: falta ? colors.navyDark : colors.muted,
                      }}
                    >
                      {nombrePersona(personas, fila.id)}
                    </span>
                    <CodeBadges codes={fila.roles} size={15} />
                  </span>
                  <Num className="w-14 text-right">
                    {fila.horas ?? 0}h · €{fila.destajo ?? 0}
                  </Num>
                  <span
                    className="text-[11px] font-medium flex-shrink-0 w-16 text-right"
                    style={{
                      color: falta ? colors.primary : colors.muted,
                    }}
                  >
                    {falta ? "Acompletar" : "Completa"}
                  </span>
                </button>
              );
            })}
          </div>
        </Card>
      )}
      {vehiculoId && !cerrado && !parteExistente && (
        <Card>
          <SectionTitle color="green">Agregar personal</SectionTitle>
          <PersonaPicker personas={disponibles} buscador={true} onPick={elegirPersona} />
          <button
            type="button"
            onClick={() => setModalTemporal(true)}
            className="text-[12px] font-medium mt-2.5 flex items-center gap-1"
            style={{
              color: colors.primary,
            }}
          >
            + Agregar temporal
          </button>
          {temporales.length > 0 && (
            <div className="mt-2.5 space-y-1.5">
              {temporales.map((temporal) => (
                <div
                  className="flex items-center gap-2 rounded-lg px-3 py-2"
                  style={{
                    background: "#F5F6F4",
                  }}
                  key={temporal.id}
                >
                  <span
                    className="flex-1 min-w-0 text-[13px] truncate"
                    style={{
                      color: colors.navyDark,
                    }}
                  >
                    {temporal.nombre}{" "}
                    <span
                      className="text-[11px]"
                      style={{
                        color: colors.muted,
                      }}
                    >
                      · temporal
                    </span>
                  </span>
                  <span
                    className="text-[12px] cifra"
                    style={{
                      color: colors.muted,
                    }}
                  >
                    €{temporal.destajo}
                  </span>
                  <button
                    onClick={() => setTemporales((q) => q.filter((te) => te.id !== temporal.id))}
                    aria-label={`Quitar a ${temporal.nombre}`}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
          {equipo.length > 0 && !chofer && (
            <p
              className="text-[11px] mt-2"
              style={{
                color: colors.muted,
              }}
            >
              Falta asignar un chofer.
            </p>
          )}
          {equipo.length > 0 && (
            <Button variant="outline" className="mt-3" onClick={() => setCerrado(true)}>
              Ya están todos
            </Button>
          )}
        </Card>
      )}
      {equipo.length > 0 && (
        <Card className="!p-0 overflow-hidden">
          <div className="flex items-baseline gap-2 px-5 pt-4 pb-3">
            <p
              className="text-[17px] font-semibold tracking-tight flex-1 truncate"
              style={{
                color: colors.navyDark,
              }}
            >
              {vehiculo == null ? undefined : vehiculo.nombre}
            </p>
            <span
              className="text-[11px]"
              style={{
                color: colors.muted,
              }}
            >
              <span className="cifra">{equipo.length}</span>
              {" a bordo"}
            </span>
          </div>
          <div
            className="px-5 divide-y"
            style={{
              borderColor: colors.line,
            }}
          >
            {equipo.map((z) => (
              <div className="flex items-center gap-2 py-2.5" key={z.id}>
                <span className="min-w-0 flex-1 flex items-center gap-1.5">
                  <span
                    className="text-sm truncate"
                    style={{
                      color: colors.navyDark,
                    }}
                  >
                    {nombrePersona(personas, z.id)}
                  </span>
                  <CodeBadges codes={rolesDe(z)} size={15} />
                </span>
                <Num className="w-14 text-right">
                  {z.horas}h · €{z.destajo}
                </Num>
                <button
                  onClick={() => quitarDelEquipo(z.id)}
                  aria-label={`Quitar a ${nombrePersona(personas, z.id)}`}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 active:scale-90 transition-all flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <div
            className="flex items-center gap-2 px-5 py-3 border-t"
            style={{
              borderColor: colors.line,
            }}
          >
            <span
              className="eyebrow flex-1"
              style={{
                color: colors.muted,
              }}
            >
              Total
            </span>
            <Num tone="strong" className="font-semibold">
              {totalHoras}h · €{totalDestajo}
            </Num>
          </div>
          {cerrado && (
            <button
              onClick={() => setCerrado(false)}
              className="w-full min-h-[44px] text-[13px] font-medium border-t transition-colors"
              style={{
                borderColor: colors.line,
                color: colors.primary,
              }}
            >
              + Añadir otra persona
            </button>
          )}
        </Card>
      )}
      {cerrado && (
        <div className="pt-1">
          <Button
            variant="primary"
            icon={<Send className="w-4 h-4" />}
            onClick={enviarParte}
            disabled={!puedeEnviar || enviando}
          >
            Enviar parte
          </Button>
          {puedeEnviar ? (
            <p className="text-[11px] text-gray-500 text-center mt-2">
              {"Se guarda en el parte de "}
              {vehiculo == null ? undefined : vehiculo.nombre}
              {" para "}
              {formatFecha(fecha).toLowerCase()}.
            </p>
          ) : (
            <p
              className="text-[11px] text-center mt-2"
              style={{
                color: colors.danger,
              }}
            >
              Falta asignar un chofer antes de enviar.
            </p>
          )}
        </div>
      )}
      <JornadaModal
        open={!!pendiente}
        nombre={nombrePendiente}
        choferTomado={!!chofer}
        encargadoTomado={!!encargado}
        onCancel={() => setPendiente(null)}
        onConfirm={confirmarJornada}
      />
      <JornadaModal
        open={!!acompletando}
        nombre={acompletando ? nombrePersona(personas, acompletando.id) : ""}
        acompletar={acompletando}
        onCancel={() => setAcompletando(null)}
        onConfirm={guardarAcompletado}
      />
      <TemporalModal
        open={modalTemporal}
        onCancel={() => setModalTemporal(false)}
        onConfirm={(z, q) => {
          setTemporales((te) => [
            ...te,
            {
              id: idLocal(),
              nombre: z,
              destajo: q,
            },
          ]);
          setModalTemporal(false);
        }}
      />
    </div>
  );
}
