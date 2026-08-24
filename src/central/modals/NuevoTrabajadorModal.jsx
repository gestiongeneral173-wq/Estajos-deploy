import { useState } from "react";
import { Button, Input, Sheet } from "../../components/ui/primitives.jsx";
import { colors } from "../../theme.js";

export function NuevoTrabajadorModal({ open, onClose, actions }) {
  const [form, setForm] = useState({
      nombre: "",
      apellido: "",
      telefono: "",
      cuenta: "",
      payment_period: "mensual",
      tarifa_hora: "",
    }),
    campo = (i) => (c) =>
      setForm({
        ...form,
        [i]: c.target.value,
      }),
    guardar = () => {
      actions.crearTrabajador({
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        telefono: form.telefono.trim(),
        cuenta: form.cuenta.trim(),
        payment_period: form.payment_period,
        tarifa_hora: parseFloat(form.tarifa_hora) || 0,
      });
      setForm({
        nombre: "",
        apellido: "",
        telefono: "",
        cuenta: "",
        payment_period: "mensual",
        tarifa_hora: "",
      });
      onClose();
    };
  return (
    <Sheet open={open} title="Nuevo Trabajador" onClose={onClose}>
      <div className="space-y-3">
        <Input label="Nombre" value={form.nombre} onChange={campo("nombre")} />
        <Input
          label="Apellido"
          value={form.apellido}
          onChange={campo("apellido")}
        />
        <Input
          label="Número (teléfono)"
          value={form.telefono}
          onChange={campo("telefono")}
        />
        <div>
          <label className="eyebrow text-gray-600">Ciclo *</label>
          <select
            value={form.payment_period}
            onChange={campo("payment_period")}
            className="w-full mt-1.5 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary transition-colors"
            style={{
              color: colors.navyDark,
            }}
          >
            <option value="mensual">Mensual</option>
            <option value="quincenal">Quincenal</option>
          </select>
        </div>
        <Input
          label="Cuenta bancaria"
          placeholder="ES00 0000 0000 0000 0000"
          value={form.cuenta}
          onChange={campo("cuenta")}
        />
        <Input
          label="Pago por hora (€) *"
          type="number"
          min="0"
          value={form.tarifa_hora}
          onChange={campo("tarifa_hora")}
        />
        <Button
          variant="primary"
          disabled={
            !form.nombre ||
            !form.apellido ||
            !(parseFloat(form.tarifa_hora) > 0)
          }
          onClick={guardar}
        >
          Guardar
        </Button>
      </div>
    </Sheet>
  );
}
