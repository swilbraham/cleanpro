import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { address } = body;

    if (!address) {
      return NextResponse.json(
        { error: "address is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Google Maps API key is not configured" },
        { status: 503 }
      );
    }

    const encodedAddress = encodeURIComponent(address);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`;

    const response = await fetch(url);

    if (!response.ok) {
      console.error("Geocoding API error:", response.status);
      return NextResponse.json(
        { error: "Geocoding request failed" },
        { status: 502 }
      );
    }

    const data = await response.json();

    if (data.status !== "OK" || !data.results?.length) {
      return NextResponse.json(
        { error: "No results found for the given address", status: data.status },
        { status: 404 }
      );
    }

    const location = data.results[0].geometry.location;

    return NextResponse.json({
      lat: location.lat,
      lng: location.lng,
      formattedAddress: data.results[0].formatted_address,
    });
  } catch (error) {
    console.error("Failed to geocode address:", error);
    return NextResponse.json(
      { error: "Failed to geocode address" },
      { status: 500 }
    );
  }
}
