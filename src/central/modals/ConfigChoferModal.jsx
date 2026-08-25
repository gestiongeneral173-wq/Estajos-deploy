import { useEffect, useState } from "react";
import { Button, Input, Sheet } from "../../components/ui/primitives.jsx";
import { colors } from "../../theme.js";

/**
 * La regla del chofer (0019, editable desde 0021).
 *
 * Conducir ya no sube la tarifa por hora: quien cobre MENOS del umbral se lleva
 * el plus fijo el día que conduce. El plus se congela en la jornada al
 * registrarla, así que cambiar estos números no reescribe lo ya fichado.
 */
export function ConfigChoferModal({ open, onClose, state, actions }) {
  const [umbral, setUmbral] = useState(String(state.umbralChofer)),
    [plus, setPlus] = useState(String(state.plusChofer)),
    [guardando, setGuardando] = useState(false),
    [error, setError] = useState(null),
    // 0 vale en los dos: umbral 0 = no le toca a nadie, plus 0 = apagado.
    // Negativo no, y la base lo rechaza igual.
    valido = parseFloat(umbral) >= 0 && parseFloat(plus) >= 0;

  // Al abrir se recargan del estado: entre apertura y apertura pueden haber
  // cambiado desde otro sitio.
  useEffect(() => {
    if (open) {
      setUmbral(String(state.umbralChofer));
      setPlus(String(state.plusChofer));
      setError(null);
    }
  }, [open, state.umbralChofer, state.plusChofer]);

  const guardar = async () => {
    setGuardando(true);
    setError(null);
    try {
      await actions.setReglaChofer(parseFloat(umbral), parseFloat(plus));
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Sheet open={open} title="Configurar chofer" onClose={onClose}>
      <div className="space-y-3">
        <p className="text-[11px] text-gray-500">
          Quien cobre <strong>menos</strong> del umbral por hora se lleva el
          plus entero el día que conduce. Quien ya cobre el umbral o más, no.
        </p>
        <Input
          label="Umbral: hasta cuánto por hora se cobra el plus (€/h)"
          type="number"
          min="0"
          step="0.01"
          value={umbral}
          onChange={(o) => setUmbral(o.target.value)}
        />
        <Input
          label="Plus por conducir, al día (€)"
          type="number"
          min="0"
          step="0.01"
          value={plus}
          onChange={(o) => setPlus(o.target.value)}
        />
        {!valido && (
          <p className="text-[11px]" style={{ color: colors.danger }}>
            Los dos tienen que ser 0 o más.
          </p>
        )}
        {error && (
          <p className="text-[11px]" style={{ color: colors.danger }}>
            {error}
          </p>
        )}
        <Button
          variant="primary"
          disabled={!valido || guardando}
          onClick={guardar}
        >
          {guardando ? "Guardando…" : "Guardar"}
        </Button>
        <p className="text-[11px] text-gray-500 text-center">
          Se aplica a partir de ahora — el plus se congela al registrar la
          jornada y lo ya fichado no se reescribe. Con el plus a 0 la regla
          queda apagada.
        </p>
      </div>
    </Sheet>
  );
}
