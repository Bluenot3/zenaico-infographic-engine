export function redactError(error: unknown, secrets: (string | undefined)[] = []) {
  let message = error instanceof Error ? error.message : 'Operation failed.';
  for (const secret of secrets) if (secret) message = message.split(secret).join('[REDACTED]');
  return message.replace(/(?:sk-[\w-]{10,}|AIza[\w-]{20,})/g, '[REDACTED]').slice(0, 2000);
}
