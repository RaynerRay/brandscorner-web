import { NextRequest, NextResponse } from "next/server";

const NOMINATIM = "https://nominatim.openstreetmap.org/search";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length > 240) {
    return NextResponse.json({ error: "invalid query" }, { status: 400 });
  }

  const url = `${NOMINATIM}?format=json&limit=1&q=${encodeURIComponent(q)}`;

  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "BrandsForLess-user-ui/1.0 (checkout delivery estimate)",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "geocoder unavailable" },
        { status: 502 },
      );
    }

    const data = (await res.json()) as { lat?: string; lon?: string }[];
    const hit = data[0];
    if (!hit?.lat || !hit?.lon) {
      return NextResponse.json({ lat: null, lon: null });
    }

    return NextResponse.json({
      lat: parseFloat(hit.lat),
      lon: parseFloat(hit.lon),
    });
  } catch {
    return NextResponse.json({ error: "geocoder failed" }, { status: 502 });
  }
}
