const loginNamePattern = /^[a-z0-9](?:[a-z0-9-]{1,22}[a-z0-9])?$/;

export function loginNameToEmail(loginName: string): string {
  const normalized = loginName.trim().toLowerCase();
  if (!loginNamePattern.test(normalized)) {
    throw new Error("Use 3–24 letters, numbers, or hyphens for your KopiKaki name.");
  }
  return `${normalized}@users.kopikaki.invalid`;
}
