import os from "node:os";

/** First non-internal IPv4 address (typical LAN IP). */
export function getLanIp() {
  const nets = os.networkInterfaces();
  for (const iface of Object.values(nets)) {
    for (const net of iface ?? []) {
      const family = net.family;
      const isV4 = family === "IPv4" || family === 4;
      if (isV4 && !net.internal) {
        return net.address;
      }
    }
  }
  return null;
}
