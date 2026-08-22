export function profileFieldsFromAuthDisplayName(displayName: string | null | undefined) {
  const name = displayName?.trim();
  return name ? { name, preferredName: name } : null;
}
