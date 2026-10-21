/**
 * Envío de correo detrás de una interfaz. Aún no hay proveedor contratado: `LogMailer` solo escribe
 * en el log del servidor (en producción NO imprime el contenido). Para conectar un proveedor,
 * implementa `Mailer` y devuélvelo en `getMailer()`.
 */
export interface Mail {
  to: string;
  subject: string;
  text: string;
}

export interface Mailer {
  send(mail: Mail): Promise<void>;
}

class LogMailer implements Mailer {
  async send(mail: Mail) {
    if (process.env.NODE_ENV === "production") console.warn(`[mail] sin proveedor configurado: no se envió "${mail.subject}" a ${mail.to}`);
    else console.info(`[mail] to=${mail.to} subject=${mail.subject}\n${mail.text}`);
  }
}

let mailer: Mailer = new LogMailer();
export const getMailer = () => mailer;
export const setMailer = (m: Mailer) => {
  mailer = m;
};
