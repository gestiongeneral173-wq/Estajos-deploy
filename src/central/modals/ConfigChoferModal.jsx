import { useState } from "react";
import { Button, Input, Sheet } from "../../components/ui/primitives.jsx";
import { colors } from "../../theme.js";

export function ConfigChoferModal({ open, onClose, state, actions }) {
  const [tarifa, setTarifa] = useState(String(state.tarifaChofer)),
    // Misma regla que la tarifa de temporales: a 0 o en negativo conducir
    // dejaría de pagarse. La base lo rechaza igual (0015).
    valido = parseFloat(tarifa) > 0;
  return (
    <Sheet open={open} title="Configurar chofer" onClose={onClose}>
      <div className="space-y-3">
        <Input
          label="Tarifa por hora de chofer (€)"
          type="number"
          min="0.01"
          step="0.01"
          value={tarifa}
          onChange={(o) => setTarifa(o.target.value)}
        />
        {tarifa !== "" && !valido && (
          <p className="text-[11px]" style={{ color: colors.danger }}>
            Debe ser mayor a 0.
          </p>
        )}
        <Button
          variant="primary"
          disabled={!valido}
          onClick={() => {
            actions.setTarifaChofer(parseFloat(tarifa));
            onClose();
          }}
        >
          Guardar
        </Button>
        <p className="text-[11px] text-gray-500 text-center">
          Se copia a cada chofer del día al asignarlo — no afecta a los ya
          registrados.
        </p>
      </div>
    </Sheet>
  );
}
