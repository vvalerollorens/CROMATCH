"use client";
import Image from "next/image";
import { X } from "lucide-react";
import { AlbumIcon as Album, CardsIcon as Copy } from "./app-icons";
import { Dialog } from "./dialog";
export function Empty({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="empty">
      <Album size={36} />
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}
export function Logo() {
  return (
    <span className="brand brand-image">
      <Image
        src="/brand/cromatch.png"
        alt="CROMATCH"
        width={2172}
        height={724}
        sizes="(max-width: 600px) 190px, 220px"
        priority
      />
    </span>
  );
}
export function Legal({ close }: { close: () => void }) {
  return (
    <Dialog titleId="legal-title" close={close} className="legal">
      <button className="icon-button close" onClick={close} aria-label="Cerrar">
        <X />
      </button>
      <h2 id="legal-title">Privacidad y uso responsable</h2>
      <p>
        CROMATCH es un proyecto independiente, sin afiliación con LaLiga ni
        Panini. Las marcas mencionadas identifican las colecciones. Los escudos
        de clubes y los retratos de jugadores proceden de FootyLogos y
        pertenecen a sus respectivos titulares.
      </p>
      <h3>Tus datos</h3>
      <p>
        El servicio utiliza Supabase para autenticar tu cuenta y almacenar tu
        perfil, inventario e intercambios. Tu colección es privada por defecto.
        Puedes cambiar su visibilidad, exportar tus datos y eliminar tu cuenta
        desde Perfil.
      </p>
      <p>
        Al compartir una lista, cualquier usuario registrado que tenga el enlace
        puede consultarla hasta su revocación o caducidad. El historial de
        operaciones se conserva de forma seudonimizada para proteger la
        integridad de los intercambios.
      </p>
      <h3>Antes de abrir el servicio al público</h3>
      <p>
        El operador debe completar la identidad y contacto del responsable, base
        jurídica, plazos de conservación, destinatarios, transferencias
        internacionales y procedimiento de derechos. Debe verificar los
        contratos con proveedores, la edad mínima aplicable y el canal de
        reclamaciones. Este texto es provisional y requiere revisión jurídica y
        operativa.
      </p>
      <p>
        Se almacena la sesión necesaria para autenticarte; no se incluyen
        herramientas de publicidad ni analítica de terceros.
      </p>
      <button onClick={close}>Entendido</button>
    </Dialog>
  );
}
