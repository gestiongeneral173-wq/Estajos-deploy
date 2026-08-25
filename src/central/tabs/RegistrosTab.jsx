import { useMemo, useState } from "react";
import { Eye, KeyRound, Plus, Search, Settings } from "lucide-react";
import { WorkerRow } from "../WorkerRow.jsx";
import { ConfigChoferModal } from "../modals/ConfigChoferModal.jsx";
import { GenerarPinesModal } from "../modals/GenerarPinesModal.jsx";
import { NuevoTrabajadorModal } from "../modals/NuevoTrabajadorModal.jsx";
import { TemporalesModal } from "../modals/TemporalesModal.jsx";
import {
  Button,
  Card,
  Input,
  SectionTitle,
} from "../../components/ui/primitives.jsx";
import { saldoEmpleado } from "../../lib/calculos.js";

export const FILTROS_REGISTROS = [
  {
    key: "todos",
    label: "Todos",
  },
  {
    key: "mensual",
    label: "Mensual",
  },
  {
    key: "quincenal",
    label: "Quincenal",
  },
  {
    key: "encargados",
    label: "Encargados",
  },
];

export function RegistrosTab({ state, actions, onVerFicha }) {
  const { trabajadores, pinesEncargado } = state,
    [filtro, setFiltro] = useState("todos"),
    [q, setQ] = useState(""),
    [modalTrabajador, setModalTrabajador] = useState(false),
    [modalTemporales, setModalTemporales] = useState(false),
    [modalChofer, setModalChofer] = useState(false),
    [modalPines, setModalPines] = useState(false),
    lista = useMemo(() => {
      const d = q.trim().toLowerCase();
      return trabajadores
        .filter((trabajador) =>
          filtro === "todos"
            ? true
            : filtro === "encargados"
              ? trabajador.es_encargado
              : trabajador.payment_period === filtro,
        )
        .filter(
          (m) => !d || `${m.nombre} ${m.apellido}`.toLowerCase().includes(d),
        )
        .map((m) => {
          const pin = pinesEncargado.find((p) => p.empleado_id === m.id);
          return {
            ...m,
            nombre: `${m.nombre} ${m.apellido}`,
            paymentPeriod: m.payment_period,
            balance: saldoEmpleado(state, m.id),
            pin: pin?.pin ?? null,
          };
        });
    }, [trabajadores, filtro, q, state, pinesEncargado]);
  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8 pb-6 max-w-md sm:max-w-2xl lg:max-w-4xl mx-auto space-y-4 lg:space-y-5">
      <Card>
        <SectionTitle color="green">Registros</SectionTitle>
        <Button
          variant="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setModalTrabajador(true)}
        >
          Añadir trabajador
        </Button>
        <Button
          variant="dark"
          icon={<Eye className="w-4 h-4" />}
          className="mt-2"
          onClick={() => setModalTemporales(true)}
        >
          Ver temporales
        </Button>
        <Button
          variant="dark"
          icon={<Settings className="w-4 h-4" />}
          className="mt-2"
          onClick={() => setModalChofer(true)}
        >
          Configurar chofer
        </Button>
        <Button
          variant="dark"
          icon={<KeyRound className="w-4 h-4" />}
          className="mt-2"
          onClick={() => setModalPines(true)}
        >
          Generar PIN de encargados
        </Button>
      </Card>
      <Card>
        <div className="flex gap-2 overflow-x-auto -mx-1 px-1">
          {FILTROS_REGISTROS.map((d) => (
            <Button
              variant="pill"
              active={filtro === d.key}
              onClick={() => setFiltro(d.key)}
              key={d.key}
            >
              {d.label}
            </Button>
          ))}
        </div>
        <div className="mt-4 relative">
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <Input
            placeholder="Buscar..."
            value={q}
            onChange={(d) => setQ(d.target.value)}
            className="pl-9"
          />
        </div>
      </Card>
      <div className="space-y-2">
        {lista.length === 0 ? (
          <Card>
            <p className="text-gray-500 text-xs text-center py-6">
              No hay registros.
            </p>
          </Card>
        ) : (
          lista.map((d) => (
            <WorkerRow
              worker={d}
              onClick={() => onVerFicha(d.id)}
              modoEncargados={filtro === "encargados"}
              key={d.id}
            />
          ))
        )}
      </div>
      <NuevoTrabajadorModal
        open={modalTrabajador}
        onClose={() => setModalTrabajador(false)}
        actions={actions}
      />
      <TemporalesModal
        open={modalTemporales}
        onClose={() => setModalTemporales(false)}
        state={state}
        actions={actions}
      />
      <ConfigChoferModal
        open={modalChofer}
        onClose={() => setModalChofer(false)}
        state={state}
        actions={actions}
      />
      <GenerarPinesModal
        open={modalPines}
        onClose={() => setModalPines(false)}
        state={state}
        actions={actions}
      />
    </div>
  );
}
