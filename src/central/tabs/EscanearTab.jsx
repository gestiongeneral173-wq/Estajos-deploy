import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CircleUser, Clock, Search, Wallet } from "lucide-react";
import { CodeBadge } from "../../components/ui/Badges.jsx";
import {
  Button,
  Card,
  IconBubble,
  Input,
  SectionTitle,
} from "../../components/ui/primitives.jsx";
import { calcEmpleado } from "../../lib/calculos.js";
import { diaSemana, eur, hoy } from "../../lib/format.js";
import { colors, hexToRgba } from "../../theme.js";

export function EscanearTab({ state, actions }) {
  const { trabajadores } = state,
    [seleccionado, setSeleccionado] = useState(null),
    [modo, setModo] = useState("menu"),
    [q, setQ] = useState(""),
    conSaldo = useMemo(
      () =>
        trabajadores.map((N) => {
          const I = calcEmpleado(state, N.id);
          return {
            ...N,
            ...I,
            pagado:
              I.totalPagar <= 0 &&
              I.jornadas.length === 0 &&
              I.adelantos.length === 0,
          };
        }),
      [trabajadores, state],
    ),
    lista = useMemo(() => {
      const N = q.trim().toLowerCase();
      return [
        ...(N
          ? conSaldo.filter((p) => {
              var d;
              return (
                `${p.nombre} ${p.apellido}`.toLowerCase().includes(N) ||
                ((d = p.telefono) == null
                  ? undefined
                  : d.toLowerCase().includes(N))
              );
            })
          : conSaldo),
      ].sort((p, d) => Number(p.pagado) - Number(d.pagado));
    }, [q, conSaldo]),
    trabajador = trabajadores.find((N) => N.id === seleccionado),
    pend = seleccionado ? calcEmpleado(state, seleccionado) : null,
    esPagado = pend
      ? pend.totalPagar <= 0 &&
        pend.jornadas.length === 0 &&
        pend.adelantos.length === 0
      : false,
    reset = () => {
      setSeleccionado(null);
      setModo("menu");
      setQ("");
    };
  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8 pb-6 max-w-md sm:max-w-2xl lg:max-w-4xl mx-auto space-y-4 lg:space-y-5">
      {!trabajador && (
        <Card>
          <SectionTitle color="green">Buscar trabajador</SectionTitle>
          <div className="flex flex-col items-center py-4">
            <IconBubble icon={Search} size="xl" shape="square" />
            <p className="text-gray-600 text-xs text-center mt-4">
              Busca por nombre o teléfono para ver las opciones del trabajador.
            </p>
          </div>
          <div className="relative mb-3">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              value={q}
              onChange={(N) => setQ(N.target.value)}
              placeholder="Nombre o teléfono del trabajador"
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="space-y-1 max-h-80 overflow-y-auto">
            {lista.length === 0 ? (
              <p className="text-gray-500 text-xs text-center py-4">
                Sin coincidencias.
              </p>
            ) : (
              lista.map((N) => (
                <button
                  onClick={() => setSeleccionado(N.id)}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-left transition-colors active:scale-95"
                  style={{
                    background: N.pagado ? "#F0F4F1" : "#F8F8F6",
                  }}
                  key={N.id}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p
                        className="text-sm font-semibold truncate"
                        style={{
                          color: colors.navyDark,
                        }}
                      >
                        {N.nombre} {N.apellido}
                      </p>
                      <CodeBadge
                        code={N.payment_period === "mensual" ? "M" : "Q"}
                        size={14}
                      />
                    </div>
                    <p className="text-[11px] text-gray-500">{N.telefono}</p>
                  </div>
                  {N.pagado && (
                    <span className="shrink-0 px-2 py-0.5 rounded-full text-[11px] font-medium bg-green-100 text-green-700">
                      Pagado
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </Card>
      )}
      {trabajador && (
        <>
          <Card>
            <div className="flex items-center gap-3">
              <IconBubble icon={CircleUser} size="lg" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p
                    className="font-semibold text-sm truncate"
                    style={{
                      color: colors.navyDark,
                    }}
                  >
                    {trabajador.nombre} {trabajador.apellido}
                  </p>
                  <CodeBadge
                    code={trabajador.payment_period === "mensual" ? "M" : "Q"}
                  />
                </div>
                <p className="text-gray-600 text-[11px]">
                  {trabajador.telefono}
                </p>
                <p className="text-gray-500 text-[11px]">
                  {"Ciclo: "}
                  {trabajador.payment_period === "mensual"
                    ? "Mensual"
                    : "Quincenal"}
                </p>
              </div>
            </div>
            {esPagado && (
              <div className="mt-3 p-2 bg-green-100 border border-green-300 rounded-lg text-center text-green-700 font-semibold text-xs">
                Pagado en este ciclo
              </div>
            )}
          </Card>
          {modo === "menu" && (
            <Card>
              <SectionTitle color="green">¿Qué deseas hacer?</SectionTitle>
              <div className="space-y-3">
                <Button variant="primary" onClick={() => setModo("adelanto")}>
                  Dar adelanto
                </Button>
                <Button
                  variant="dark"
                  icon={<Wallet className="w-4 h-4" />}
                  onClick={() => setModo("pagar")}
                >
                  Pagar empleado
                </Button>
                <Button
                  variant="outline"
                  icon={<Clock className="w-4 h-4" />}
                  onClick={() => setModo("horas")}
                >
                  Agregar horas
                </Button>
                <Button variant="outline" onClick={reset}>
                  Cancelar
                </Button>
              </div>
            </Card>
          )}
          {modo === "adelanto" && (
            <AdelantosView
              trabajadorId={trabajador.id}
              adelantos={pend.adelantos}
              pendiente={pend.totalPagar}
              inicioCiclo={
                state.periodos?.[trabajador.payment_period ?? "quincenal"]
                  ?.inicio || ""
              }
              actions={actions}
              onBack={() => setModo("menu")}
            />
          )}
          {modo === "pagar" && (
            <LiquidacionView
              trabajador={trabajador}
              pend={pend}
              esPagado={esPagado}
              actions={actions}
              onBack={() => setModo("menu")}
              onPaid={reset}
            />
          )}
          {modo === "horas" && (
            <AgregarHorasView
              trabajadorId={trabajador.id}
              actions={actions}
              onBack={() => setModo("menu")}
            />
          )}
        </>
      )}
    </div>
  );
}

export function AdelantosView({
  trabajadorId,
  adelantos,
  actions,
  onBack,
  pendiente = 0,
  inicioCiclo = "",
}) {
  const [monto, setMonto] = useState(""),
    // La fecha decide en qué ciclo se descuenta: un adelanto entregado el 28 y
    // anotado el 2 pertenece al ciclo del 28. El suelo es el inicio del ciclo
    // vigente — un ciclo ya cerrado no admite adelantos nuevos, y la base lo
    // rechaza igual (0015).
    [fecha, setFecha] = useState(hoy),
    total = adelantos.reduce((i, adelanto) => i + Number(adelanto.monto), 0),
    // Adelantar más de lo que lleva trabajado deja el ciclo en negativo: se
    // puede hacer, pero no por descuido.
    registrar = () => {
      const importe = parseFloat(monto) || 0;
      if (
        importe > pendiente &&
        !window.confirm(
          "El monto a pagar es mayor al trabajado, ¿Proceder con el pago?",
        )
      ) {
        return;
      }
      actions.registrarAdelanto(trabajadorId, importe, fecha);
      setMonto("");
      setFecha(hoy());
      onBack();
    };
  return (
    <Card>
      <SectionTitle color="gold">Dar adelanto</SectionTitle>
      <div className="border border-gray-200 rounded-xl overflow-hidden mb-4">
        <div className="grid grid-cols-2 bg-gray-50 p-2 eyebrow text-gray-600">
          <span>Fecha</span>
          <span className="text-right">Monto</span>
        </div>
        {adelantos.length === 0 ? (
          <p className="text-gray-500 text-xs text-center py-3">
            Sin adelantos en este ciclo.
          </p>
        ) : (
          adelantos.map((adelanto) => (
            <div
              className="grid grid-cols-2 p-2 border-t border-gray-100 text-xs"
              style={{
                color: colors.navyDark,
              }}
              key={adelanto.id}
            >
              <span>{adelanto.fecha}</span>
              <span className="text-right font-semibold">
                {eur(adelanto.monto)}
              </span>
            </div>
          ))
        )}
        {adelantos.length > 0 && (
          <div
            className="grid grid-cols-2 p-2 bg-gray-50 border-t border-gray-200 text-xs font-semibold"
            style={{
              color: colors.navyDark,
            }}
          >
            <span>Total</span>
            <span className="text-right">{eur(total)}</span>
          </div>
        )}
      </div>
      <div className="space-y-3">
        <Input
          label="Monto del adelanto (€)"
          type="number"
          min="0.01"
          step="0.01"
          value={monto}
          onChange={(i) => setMonto(i.target.value)}
        />
        <Input
          label="Fecha del adelanto"
          type="date"
          min={inicioCiclo || undefined}
          max={hoy()}
          value={fecha}
          onChange={(i) => setFecha(i.target.value)}
        />
        <p className="text-[11px] text-gray-500 text-center">
          La fecha decide en qué ciclo se descuenta. No se puede anotar en un
          ciclo ya cerrado.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            icon={<ArrowLeft className="w-4 h-4" />}
            onClick={onBack}
          >
            Volver
          </Button>
          <Button
            variant="primary"
            disabled={!monto || !(parseFloat(monto) > 0) || !fecha}
            onClick={registrar}
          >
            Registrar
          </Button>
        </div>
      </div>
    </Card>
  );
}

export function LiquidacionView({
  trabajador,
  pend,
  esPagado,
  actions,
  onBack,
  onPaid,
}) {
  return (
    <Card>
      <SectionTitle color="green">Liquidación · Ciclo activo</SectionTitle>
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="grid grid-cols-4 gap-2 bg-gray-50 p-2 eyebrow text-gray-600">
          <span>Fecha</span>
          <span>Horas</span>
          <span>Destajo</span>
          <span className="text-right">Total</span>
        </div>
        {pend.jornadas.length === 0 ? (
          <p className="text-gray-500 text-xs text-center py-3">
            Sin días pendientes en este ciclo.
          </p>
        ) : (
          pend.jornadas.map((jornada) => (
            <div
              className="grid grid-cols-4 gap-2 p-2 border-t border-gray-100 text-xs"
              style={{
                color: colors.navyDark,
              }}
              key={jornada.id}
            >
              <span>{jornada.fecha}</span>
              <span>{jornada.horas}</span>
              <span>€{jornada.destajo}</span>
              <span className="text-right font-semibold">
                €
                {(
                  jornada.horas * jornada.tarifa +
                  Number(jornada.destajo)
                ).toFixed(2)}
              </span>
            </div>
          ))
        )}
        <div
          className="grid grid-cols-4 gap-2 p-2 bg-gray-50 border-t border-gray-200 text-xs font-semibold"
          style={{
            color: colors.navyDark,
          }}
        >
          <span className="col-span-3 text-right">Días trabajados:</span>
          <span className="text-right">€{pend.totalDevengado.toFixed(2)}</span>
        </div>
        <div
          className="grid grid-cols-4 gap-2 p-2 border-t border-gray-100 text-xs"
          style={{
            color: colors.danger,
          }}
        >
          <span className="col-span-3 text-right">Adelantos del ciclo:</span>
          <span className="text-right">−€{pend.totalAdelantos.toFixed(2)}</span>
        </div>
        <div
          className="grid grid-cols-4 gap-2 p-2 border-t border-gray-200 text-xs font-semibold"
          style={{
            background: hexToRgba(colors.primary, 0.1),
            color: colors.primary,
          }}
        >
          <span className="col-span-3 text-right">Total a pagar:</span>
          <span className="text-right">€{pend.totalPagar.toFixed(2)}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 mt-4">
        <Button
          variant="outline"
          icon={<ArrowLeft className="w-4 h-4" />}
          onClick={onBack}
        >
          Volver
        </Button>
        <Button
          variant="primary"
          disabled={esPagado || pend.jornadas.length === 0}
          onClick={() => {
            actions.pagarEmpleado(trabajador.id);
            onPaid();
          }}
        >
          {esPagado ? "YA PAGADO" : "CONFIRMAR PAGO"}
        </Button>
      </div>
    </Card>
  );
}

export function AgregarHorasView({ trabajadorId, actions, onBack }) {
  const HOY = hoy();
  const [fecha, setFecha] = useState(HOY),
    // Qué tiene ya esa persona ese día. Se pregunta ANTES de que el admin
    // rellene nada: no tiene sentido dejarle escribir algo que va a rebotar.
    [estado, setEstado] = useState({ cargando: true }),
    [horas, setHoras] = useState(""),
    [destajo, setDestajo] = useState(""),
    [error, setError] = useState(null),
    [confirmando, setConfirmando] = useState(false),
    [guardando, setGuardando] = useState(false);

  // `actions` se recrea en cada render, así que fuera de las dependencias: lo
  // que dispara la consulta es cambiar de persona o de día.
  useEffect(() => {
    let vivo = true;
    setEstado({ cargando: true });
    setError(null);
    setConfirmando(false);
    setHoras("");
    setDestajo("");
    actions
      .estadoJornada(trabajadorId, fecha)
      .then((jornada) => vivo && setEstado({ cargando: false, jornada }))
      .catch((e) => {
        if (!vivo) return;
        setEstado({ cargando: false, jornada: null });
        setError(e.message);
      });
    return () => {
      vivo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trabajadorId, fecha]);

  const jornada = estado.jornada,
    esPasada = fecha !== HOY,
    dia = diaSemana(fecha),
    hayAlgo = (parseFloat(horas) || 0) > 0 || (parseFloat(destajo) || 0) > 0,
    negativo = parseFloat(horas) < 0 || parseFloat(destajo) < 0,
    puedeGuardar = hayAlgo && !negativo && !guardando && !estado.cargando;

  const guardar = async () => {
    // En un día pasado nadie confirmó en campo que esa persona estuviera ahí:
    // la única verificación es el criterio del admin, así que se le pide dos
    // veces a propósito.
    if (esPasada && !confirmando) {
      setConfirmando(true);
      return;
    }
    setError(null);
    setGuardando(true);
    try {
      await actions.registrarHorasCentral(
        trabajadorId,
        parseFloat(horas) || 0,
        parseFloat(destajo) || 0,
        fecha,
      );
      onBack();
    } catch (e) {
      setError(e.message);
      setConfirmando(false);
    } finally {
      setGuardando(false);
    }
  };

  const selectorFecha = (
    <Input
      label="Día trabajado"
      type="date"
      value={fecha}
      max={HOY}
      onChange={(i) => setFecha(i.target.value || HOY)}
      hint={
        dia ? `${dia.letra} · ${esPasada ? "día pasado" : "hoy"}` : undefined
      }
    />
  );

  const aviso = (texto, tono) => (
    <p
      className="text-[12px] rounded-lg px-3 py-2"
      style={{ color: tono, background: hexToRgba(tono, 0.09) }}
    >
      {texto}
    </p>
  );

  if (estado.cargando) {
    return (
      <Card>
        <SectionTitle color="gold">Agregar horas</SectionTitle>
        <div className="space-y-4">
          {selectorFecha}
          <p className="text-[13px]" style={{ color: colors.muted }}>
            Comprobando qué tiene ese día…
          </p>
          <Button variant="outline" onClick={onBack}>
            Cancelar
          </Button>
        </div>
      </Card>
    );
  }

  // Pagada: no se toca nada. Corregir un pago es anularlo, no editarlo.
  if (jornada?.liquidada) {
    return (
      <Card>
        <SectionTitle color="gold">Agregar horas</SectionTitle>
        <div className="space-y-4">
          {selectorFecha}
          <ResumenJornada jornada={jornada} />
          {aviso(
            "Esa jornada ya está pagada. No se le puede añadir nada ni corregirla desde aquí.",
            colors.danger,
          )}
          <Button variant="outline" onClick={onBack}>
            Volver
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <SectionTitle color="gold">
        {jornada ? "Añadir a la jornada" : "Agregar horas"}
      </SectionTitle>
      <div className="space-y-4">
        {selectorFecha}

        {jornada && <ResumenJornada jornada={jornada} />}

        {esPasada &&
          aviso(
            "Día pasado: nadie confirmó en campo que esa persona estuviera ahí. Queda a tu criterio.",
            colors.primary,
          )}

        <Input
          label={jornada ? "Horas a añadir" : "Horas trabajadas"}
          type="number"
          min="0"
          max="24"
          inputMode="decimal"
          value={horas}
          onChange={(i) => setHoras(i.target.value)}
        />
        <Input
          label={jornada ? "Destajo a añadir (€)" : "Destajo (€)"}
          type="number"
          min="0"
          inputMode="decimal"
          value={destajo}
          onChange={(i) => setDestajo(i.target.value)}
        />

        {negativo &&
          aviso(
            "Ni las horas ni el destajo pueden ser negativos.",
            colors.danger,
          )}
        {error && aviso(error, colors.danger)}

        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={() => (confirmando ? setConfirmando(false) : onBack())}
          >
            {confirmando ? "Volver atrás" : "Cancelar"}
          </Button>
          <Button
            variant={confirmando ? "danger" : "primary"}
            disabled={!puedeGuardar}
            onClick={guardar}
          >
            {confirmando ? "¿Confirmar?" : jornada ? "Añadir" : "Registrar"}
          </Button>
        </div>
      </div>
    </Card>
  );
}

/** Lo que esa persona ya tiene ese día, para decidir con la cifra delante. */
function ResumenJornada({ jornada }) {
  const horas = Number(jornada.horas) + Number(jornada.horas_central || 0),
    destajo = Number(jornada.destajo) + Number(jornada.destajo_central || 0);
  return (
    <div
      className="rounded-lg px-3 py-2.5"
      style={{ background: "#F5F6F4", border: `1px solid ${colors.line}` }}
    >
      <p className="eyebrow" style={{ color: colors.muted }}>
        Ya tiene ese día
      </p>
      <p
        className="text-[15px] font-semibold mt-0.5"
        style={{ color: colors.navyDark }}
      >
        <span className="cifra">{horas}</span>
        {" h · "}
        <span className="cifra">{eur(destajo)}</span>
      </p>
      <p className="text-[11px] mt-0.5" style={{ color: colors.muted }}>
        {jornada.vehiculo
          ? `Fichada en ${jornada.vehiculo}`
          : "Apuntada desde Central"}
      </p>
    </div>
  );
}
