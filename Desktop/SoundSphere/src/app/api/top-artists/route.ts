// File: src/app/api/top-artists/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const TOP_ARTISTS_ENDPOINT = `https://api.spotify.com/v1/me/top/artists`;

// Minimal type for Spotify Artist
type SpotifyArtist = {
  id: string;
  name: string;
  images: { url: string }[];
  external_urls: { spotify: string };
};

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token || !token.accessToken) {
    return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const time_range = searchParams.get('time_range') || 'medium_term';

  try {
    const response = await fetch(`${TOP_ARTISTS_ENDPOINT}?time_range=${time_range}&limit=21`, {
      headers: {
        Authorization: `Bearer ${token.accessToken}`,
      },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      console.error("Spotify API Error:", await response.text());
      return NextResponse.json({ error: 'Failed to fetch artists from Spotify' }, { status: response.status });
    }

    const data = await response.json();

    const artists = (data.items as SpotifyArtist[]).map((item, index: number) => ({
      rank: index + 1,
      id: item.id,
      name: item.name,
      imageUrl: item.images[0]?.url,
      spotifyUrl: item.external_urls.spotify,
    }));

    return NextResponse.json(artists);
  } catch (error) {
    console.log("Internal Server Error: ", error);
    return NextResponse.json({ error: 'An internal error occurred' }, { status: 500 });
  }
}
