/** Labels fallback quando /specialties ainda não carregou ou falhou */
export const QUEUE_LABELS: Record<string, string> = {
  '01': 'Suporte Hardware',
  '02': 'Técnico de Redes',
};

export function getQueueLabel(queueId: string | null, specialtyName?: string): string {
  if (!queueId) return 'QUADRO DE DEMANDAS';
  if (specialtyName) return specialtyName.toUpperCase();
  return (QUEUE_LABELS[queueId] ?? `FILA ${queueId}`).toUpperCase();
}

export function resolveQueueCode(
  queueId: string,
  specialties: { code: string; name: string }[],
): string {
  const matched = specialties.find(
    (s) => s.code === queueId || s.name.toLowerCase() === queueId.toLowerCase(),
  );
  return matched?.code ?? queueId;
}
