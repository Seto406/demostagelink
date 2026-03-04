export const TEST_ACCOUNTS = [
  { email: "dev.audience@test.com", password: "audience123", role: "audience" as const },
  { email: "dev.producer@test.com", password: "producer123", role: "producer" as const },
] as const;

export const findMatchingTestAccount = (email: string, password: string) => {
  const normalizedEmail = email.trim().toLowerCase();
  return TEST_ACCOUNTS.find(
    (account) => account.email.toLowerCase() === normalizedEmail && account.password === password,
  );
};
