import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function applyContactMergeTags(
  template: string,
  contact: { firstName?: string; lastName?: string; email?: string; name?: string },
) {
  const firstName = (contact.firstName || "").trim();
  const lastName = (contact.lastName || "").trim();
  const fullName = [firstName, lastName].filter(Boolean).join(" ") || (contact.name || "").trim();

  return template
    .replace(/\{\{\s*contact\.first_name\s*\}\}/gi, firstName)
    .replace(/\{\{\s*contact\.last_name\s*\}\}/gi, lastName)
    .replace(/\{\{\s*contact\.name\s*\}\}/gi, fullName)
    .replace(/\{\{\s*contact\.email\s*\}\}/gi, (contact.email || "").trim());
}