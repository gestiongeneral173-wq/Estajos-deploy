import { useState } from "react";
import { Button, Input, Sheet } from "../../components/ui/primitives.jsx";

export function ConfigChoferModal({ open, onClose, state, actions }) {
  const [tarifa, setTarifa] = useState(String(state.tarifaChofer));
  return (
    <Sheet open={open} title="Configurar chofer" onClose={onClose}>
      <div className="space-y-3">
        <Input
          label="Tarifa por hora de chofer (€)"
          type="number"
          value={tarifa}
          onChange={(o) => setTarifa(o.target.value)}
        />
        <Button
          variant="primary"
          onClick={() => {
            actions.setTarifaChofer(parseFloat(tarifa) || 0);
            onClose();
          }}
        >
          Guardar
        </Button>
        <p className="text-[11px] text-gray-500 text-center">
          Se copia a cada chofer del día al asignarlo — no afecta a los ya registrados.
        </p>
      </div>
    </Sheet>
  );
}
