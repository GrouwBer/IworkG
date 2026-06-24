// ── Location helpers ──
const LOCATION_CACHE_KEY = 'iworkg_location';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export function getCachedLocation(): { lat: number; lng: number } | null {
  try {
    const raw = localStorage.getItem(LOCATION_CACHE_KEY);
    if (!raw) return null;
    const { lat, lng, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL_MS) {
      localStorage.removeItem(LOCATION_CACHE_KEY);
      return null;
    }
    return { lat, lng };
  } catch {
    return null;
  }
}

export function cacheLocation(lat: number, lng: number) {
  localStorage.setItem(
    LOCATION_CACHE_KEY,
    JSON.stringify({ lat, lng, ts: Date.now() })
  );
}

export async function lookupCep(
  cep: string
): Promise<{ lat: number; lng: number; city: string; state: string } | null> {
  const clean = cep.replace(/\D/g, '');
  if (clean.length !== 8) return null;
  try {
    const resp = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
    const data = await resp.json();
    if (data.erro) return null;

    // Nominatim (OpenStreetMap) geocoding: address → lat/lng
    const addr = `${data.logradouro}, ${data.localidade}, ${data.uf}`;
    const geo = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(addr)}`
    );
    const geoData = await geo.json();
    if (!geoData.length) return null;

    return {
      lat: parseFloat(geoData[0].lat),
      lng: parseFloat(geoData[0].lon),
      city: data.localidade,
      state: data.uf,
    };
  } catch {
    return null;
  }
}
