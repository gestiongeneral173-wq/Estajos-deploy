import { useMemo, useState } from "react";
import { ArrowLeft, CircleUser, Clock, Search, Wallet } from "lucide-react";
import { CodeBadge } from "../../components/ui/Badges.jsx";
import { Button, Card, IconBubble, Input, SectionTitle } from "../../components/ui/primitives.jsx";
import { calcEmpleado } from "../../lib/calculos.js";
import { eur, hoy } from "../../lib/format.js";
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
            pagado: I.totalPagar <= 0 && I.jornadas.length === 0 && I.adelantos.length === 0,
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
                ((d = p.telefono) == null ? undefined : d.toLowerCase().includes(N))
              );
            })
          : conSaldo),
      ].sort((p, d) => Number(p.pagado) - Number(d.pagado));
    }, [q, conSaldo]),
    trabajador = trabajadores.find((N) => N.id === seleccionado),
    pend = seleccionado ? calcEmpleado(state, seleccionado) : null,
    esPagado = pend
      ? pend.totalPagar <= 0 && pend.jornadas.length === 0 && pend.adelantos.length === 0
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
              <p className="text-gray-500 text-xs text-center py-4">Sin coincidencias.</p>
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
                      <CodeBadge code={N.payment_period === "mensual" ? "M" : "Q"} size={14} />
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
                  <CodeBadge code={trabajador.payment_period === "mensual" ? "M" : "Q"} />
                </div>
                <p className="text-gray-600 text-[11px]">{trabajador.telefono}</p>
                <p className="text-gray-500 text-[11px]">
                  {"Ciclo: "}
                  {trabajador.payment_period === "mensual" ? "Mensual" : "Quincenal"}
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
              inicioCiclo={state.periodos?.[trabajador.payment_period ?? "quincenal"]?.inicio || ""}
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
        !window.confirm("El monto a pagar es mayor al trabajado, ¿Proceder con el pago?")
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
          <p className="text-gray-500 text-xs text-center py-3">Sin adelantos en este ciclo.</p>
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
              <span className="text-right font-semibold">{eur(adelanto.monto)}</span>
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
          La fecha decide en qué ciclo se descuenta. No se puede anotar en un ciclo ya cerrado.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" icon={<ArrowLeft className="w-4 h-4" />} onClick={onBack}>
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

export function LiquidacionView({ trabajador, pend, esPagado, actions, onBack, onPaid }) {
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
                €{(jornada.horas * jornada.tarifa + Number(jornada.destajo)).toFixed(2)}
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
        <Button variant="outline" icon={<ArrowLeft className="w-4 h-4" />} onClick={onBack}>
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
  const [horas, setHoras] = useState(""),
    [destajo, setDestajo] = useState("");
  return (
    <Card>
      <SectionTitle color="gold">Agregar horas · Hoy</SectionTitle>
      <div className="space-y-4">
        <Input
          label="Horas trabajadas"
          type="number"
          value={horas}
          onChange={(i) => setHoras(i.target.value)}
        />
        <Input
          label="Destajo (€)"
          type="number"
          value={destajo}
          onChange={(i) => setDestajo(i.target.value)}
        />
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={onBack}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              actions.registrarHorasCentral(
                trabajadorId,
                parseFloat(horas) || 0,
                parseFloat(destajo) || 0,
              );
              onBack();
            }}
          >
            Registrar
          </Button>
        </div>
      </div>
    </Card>
  );
}
