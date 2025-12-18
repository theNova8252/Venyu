// client/src/api/spotifySync.js
export function makeSpotifyWs(roomId) {
  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  const host = import.meta.env.DEV ? "127.0.0.1:5000" : window.location.host;
  const wsUrl = `${protocol}://${host}/ws/spotify?roomId=${encodeURIComponent(roomId)}`;
  return new WebSocket(wsUrl);
}

export async function measureServerOffset(ws) {
  return new Promise((resolve) => {
    const clientSentAt = Date.now();

    const handler = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type !== "time_pong") return;

        const now = Date.now();
        const rtt = now - data.clientSentAt;
        const serverAtNow = data.serverNow + rtt / 2;
        const offsetMs = serverAtNow - now;

        ws.removeEventListener("message", handler);
        resolve(offsetMs);
      } catch {}
    };

    ws.addEventListener("message", handler);
    ws.send(JSON.stringify({ type: "time_ping", clientSentAt }));
  });
}

export async function spotifyPlay(trackUri) {
  const res = await fetch("/api/spotify/player/play", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ trackUri }),
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(t || "spotify play failed");
  }
  return res.json();
}
