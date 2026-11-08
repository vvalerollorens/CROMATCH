// Internal Auth identifiers, never mailboxes. No personal email is collected.
export const ACCOUNT_DOMAIN = "accounts.nexo.invalid";
export function usernameEmail(value: string) {
  const username = value.trim().toLowerCase();
  if (!/^[a-z0-9_]{3,24}$/.test(username))
    throw new Error(
      "Usa entre 3 y 24 caracteres: letras sin acentos, números y guion bajo.",
    );
  return `${username}@${ACCOUNT_DOMAIN}`;
}
export function loginEmail(value: string) {
  const input = value.trim();
  // Keep access for accounts created with personal email before this change.
  return input.includes("@") ? input : usernameEmail(input);
}
export function accountUsername(email?: string) {
  return email?.endsWith(`@${ACCOUNT_DOMAIN}`)
    ? email.slice(0, -ACCOUNT_DOMAIN.length - 1)
    : null;
}
