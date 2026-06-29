/** Host port for the debt_tracker Postgres container (5432 is often taken locally). */
export const DB_HOST_PORT = 5433;

/** Your PC's LAN IPv4 — used for phone/tablet access via dev.ps1 */
export const LAN_IP = "192.168.0.166";

export const DATABASE_URL = `postgresql://debt_tracker:debt_tracker@localhost:${DB_HOST_PORT}/debt_tracker`;
