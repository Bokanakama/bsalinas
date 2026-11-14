/** Translate legacy payment wording for display only; persisted game state stays intact. */
export function paymentText(text: string): string {
  return text.replace(/faz um Pix/gi, "envia Borós").replace(/fazer um Pix/gi, "enviar Borós").replace(/\bPix\b/gi, "Transferência");
}