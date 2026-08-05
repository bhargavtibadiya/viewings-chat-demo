interface ClientEnv {
  apiUrl: string;
}

export function getClientEnv(): ClientEnv {
  const apiUrl = import.meta.env.VITE_API_URL;

  if (typeof apiUrl !== 'string' || apiUrl.length === 0) {
    return { apiUrl: 'http://localhost:3000' };
  }

  return { apiUrl };
}
