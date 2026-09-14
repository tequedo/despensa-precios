// HTTP 200 can mean recorded for the daily summary. It is not email delivery.
export async function notificationReceipt(response, kind, status) {
  if (!response.ok) throw new Error(`La aplicación rechazó el aviso: HTTP ${response.status}`);
  const value = await response.json();
  if (value.kind !== kind || value.status !== status || typeof value.recorded !== 'boolean' || typeof value.notified !== 'boolean') throw new Error('La respuesta del registro de avisos es inválida');
  return {
    accepted: true,
    recorded: value.recorded,
    notified: value.notified,
    notificationStatus: value.notified ? 'accepted_by_email_provider' : !value.recorded ? 'already_recorded' : status === 'success' ? 'recorded_for_daily_summary' : 'pending_retry',
    deliveryConfirmed: false,
  };
}
