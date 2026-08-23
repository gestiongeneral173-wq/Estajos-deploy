import { useState } from "react";
import { Plus, Truck } from "lucide-react";
import { NuevoVehiculoModal } from "../modals/NuevoVehiculoModal.jsx";
import {
  Button,
  Card,
  IconBubble,
  SectionTitle,
} from "../../components/ui/primitives.jsx";
import { calcVehiculo } from "../../lib/calculos.js";
import { colors } from "../../theme.js";

export function VehiculoCard({ vehiculo, state, onViewDetails }) {
  const calc = calcVehiculo(state, vehiculo.id);
  return (
    <Card>
      <div className="flex items-center gap-3">
        <IconBubble icon={Truck} size="md" />
        <div className="flex-1 min-w-0 cursor-pointer" onClick={onViewDetails}>
          <p
            className="font-semibold text-sm hover:opacity-80 transition-opacity"
            style={{
              color: colors.navyDark,
            }}
          >
            {vehiculo.nombre}
          </p>
          <p className="text-gray-600 text-[11px]">
            {vehiculo.matricula ?? "—"}
            {" · "}
            {vehiculo.plazas_totales}
            {" plazas"}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1 mt-3 pt-3 border-t border-gray-100">
        <div className="bg-gray-50 rounded-lg px-3 py-1.5 text-center flex-1">
          <p className="eyebrow text-gray-500">Tarifa/plaza</p>
          <p
            className="font-semibold text-xs"
            style={{
              color: colors.navyDark,
            }}
          >
            €{vehiculo.tarifa_plaza}
          </p>
        </div>
        <div
          className="rounded-lg px-3 py-1.5 text-center flex-1"
          style={{
            background: "#FAF2F0",
          }}
        >
          <p className="eyebrow text-gray-500">Adelantos</p>
          <p
            className="font-semibold text-xs"
            style={{
              color: colors.danger,
            }}
          >
            €{calc.totalAdelantos.toFixed(0)}
          </p>
        </div>
      </div>
      <Button variant="dark" className="mt-3" onClick={onViewDetails}>
        Ver adelantos y detalle
      </Button>
    </Card>
  );
}

export function VehiculosTab({ state, actions, onVerFicha }) {
  const [modalNuevo, setModalNuevo] = useState(false);
  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8 pb-6 max-w-md sm:max-w-2xl lg:max-w-4xl mx-auto space-y-4 lg:space-y-5">
      <Card>
        <SectionTitle color="gold">Vehículos</SectionTitle>
        <p className="text-[11px] text-gray-500 mb-3">
          Todas las furgonetas cobran quincenal — ya no existe un tipo de pago a
          elegir.
        </p>
        <Button
          variant="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setModalNuevo(true)}
        >
          Añadir vehículo
        </Button>
      </Card>
      <div className="space-y-2">
        {state.vehiculos.length === 0 ? (
          <Card>
            <p className="text-gray-500 text-xs text-center py-6">
              No hay vehículos.
            </p>
          </Card>
        ) : (
          state.vehiculos.map((vehiculo) => (
            <VehiculoCard
              vehiculo={vehiculo}
              state={state}
              onViewDetails={() => onVerFicha(vehiculo.id)}
              key={vehiculo.id}
            />
          ))
        )}
      </div>
      <NuevoVehiculoModal
        open={modalNuevo}
        onClose={() => setModalNuevo(false)}
        onSave={actions.crearVehiculo}
      />
    </div>
  );
}
