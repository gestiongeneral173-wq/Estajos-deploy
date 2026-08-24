import { useState } from "react";
import { Button, Input, Sheet } from "../../components/ui/primitives.jsx";
import { colors } from "../../theme.js";

export function NuevoVehiculoModal({ open, onClose, onSave }) {
  const [form, setForm] = useState({
      nombre: "",
      matricula: "",
      plazas_totales: "",
      tarifa_plaza: "",
    }),
    campo = (i) => (c) =>
      setForm({
        ...form,
        [i]: c.target.value,
      }),
    // La tarifa por plaza es lo que se le paga a la furgoneta por cada día:
    // a 0 la furgoneta trabaja gratis, y en negativo le cobra al dueño.
    tarifaValida = parseFloat(form.tarifa_plaza) > 0,
    guardar = () => {
      onSave({
        nombre: form.nombre.trim(),
        matricula: form.matricula.trim() || null,
        plazas_totales: parseInt(form.plazas_totales, 10) || 0,
        tarifa_plaza: parseFloat(form.tarifa_plaza) || 0,
      });
      setForm({
        nombre: "",
        matricula: "",
        plazas_totales: "",
        tarifa_plaza: "",
      });
      onClose();
    };
  return (
    <Sheet open={open} title="Nuevo Vehículo" onClose={onClose}>
      <div className="space-y-4">
        <Input
          label="Nombre *"
          value={form.nombre}
          onChange={campo("nombre")}
        />
        <Input
          label="Matrícula (opcional)"
          value={form.matricula}
          onChange={campo("matricula")}
        />
        <Input
          label="Plazas totales"
          type="number"
          min="0"
          value={form.plazas_totales}
          onChange={campo("plazas_totales")}
        />
        <Input
          label="Tarifa por plaza (€) *"
          type="number"
          min="0.01"
          step="0.01"
          value={form.tarifa_plaza}
          onChange={campo("tarifa_plaza")}
        />
        {form.tarifa_plaza !== "" && !tarifaValida && (
          <p className="text-[11px] -mt-2" style={{ color: colors.danger }}>
            Debe ser mayor a 0.
          </p>
        )}
        <p className="text-[11px] text-gray-500 -mt-2">
          Ciclo de pago: Quincenal (fijo, no editable).
        </p>
        <Button
          variant="primary"
          disabled={!form.nombre || !tarifaValida}
          onClick={guardar}
        >
          Guardar
        </Button>
      </div>
    </Sheet>
  );
}
