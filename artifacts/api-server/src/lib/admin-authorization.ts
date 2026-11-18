type Identity = {
  primaryEmailAddressId: string | null;
  emailAddresses: {
    id: string;
    emailAddress: string;
    verification: { status: string } | null;
  }[];
};

export function isSalesOwner(user: Identity, allowedEmail: string | undefined): boolean {
  if (!allowedEmail?.trim()) return false;
  const primary = user.emailAddresses.find(email => email.id === user.primaryEmailAddressId);
  return primary?.verification?.status === "verified"
    && primary.emailAddress.trim().toLowerCase() === allowedEmail.trim().toLowerCase();
}

export function isSameOriginWrite(origin: string | undefined, host: string | undefined): boolean {
  if (!origin || !host) return false;
  try {
    const parsed = new URL(origin);
    return ["https:", "http:"].includes(parsed.protocol) && parsed.host.toLowerCase() === host.toLowerCase();
  } catch {
    return false;
  }
}
