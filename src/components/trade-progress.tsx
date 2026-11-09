export function TradeProgress({
  status,
  partner,
  mineConfirmed,
  otherConfirmed,
}: {
  status: string;
  partner: string;
  mineConfirmed: boolean;
  otherConfirmed: boolean;
}) {
  if (["cancelled", "rejected"].includes(status))
    return (
      <p className="trade-next">
        {status === "cancelled"
          ? "Cambio cancelado. Las reservas se han liberado."
          : "Propuesta rechazada. Tus cromos siguen en tu álbum."}
      </p>
    );
  const step = status === "completed" ? 3 : status === "accepted" ? 2 : 1;
  return (
    <div className="trade-journey">
      <ol aria-label="Pasos del intercambio">
        {["Reserva solicitada", "Cartas reservadas", "Cambio confirmado"].map(
          (label, index) => (
            <li
              key={label}
              className={
                index + 1 < step ? "done" : index + 1 === step ? "current" : ""
              }
              aria-current={index + 1 === step ? "step" : undefined}
            >
              <span>{index + 1 < step ? "✓" : index + 1}</span>
              {label}
            </li>
          ),
        )}
      </ol>
      <p className="trade-next" role="status">
        {status === "completed"
          ? "Cambio completado. Los dos álbumes ya están actualizados."
          : status === "proposed"
            ? "Reserva pendiente de aceptación. Las cartas quedarán reservadas cuando tu amigo acepte."
            : mineConfirmed
              ? `Tu cambio está confirmado. Esperando a ${partner}; los álbumes se actualizarán cuando confirme.`
              : otherConfirmed
                ? `${partner} ya ha confirmado. Confirma tú cuando hayas entregado y recibido los cromos.`
                : "Los cromos están reservados. Cuando hagáis el cambio en persona, cada uno debe confirmarlo aquí."}
      </p>
    </div>
  );
}
