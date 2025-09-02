import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const TOP_ARTISTS_ENDPOINT = `https://api.spotify.com/v1/me/top/artists`;

// Minimal type for Spotify Artist (only what we need here)
type SpotifyArtist = {
  genres: string[];
};

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token || !token.accessToken) {
    return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const timeRange = searchParams.get('time_range') || 'medium_term';

  try {
    const response = await fetch(`${TOP_ARTISTS_ENDPOINT}?limit=50&time_range=${timeRange}`, {
      headers: {
        Authorization: `Bearer ${token.accessToken}`,
      },
    });

    if (!response.ok) {
      console.error("Spotify API Error:", await response.text());
      return NextResponse.json({ error: 'Failed to fetch top artists from Spotify' }, { status: response.status });
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      return NextResponse.json([]);
    }

    const allGenres = (data.items as SpotifyArtist[]).flatMap((artist) => artist.genres);

    // counting genres
    const genreCounts = allGenres.reduce((acc: Record<string, number>, genre: string) => {
      acc[genre] = (acc[genre] || 0) + 1;
      return acc;
    }, {});

    // final sorted list
    const sortedGenres = (Object.entries(genreCounts) as [string, number][])
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    return NextResponse.json(sortedGenres);
  } catch (error) {
    console.error("Internal Server Error:", error);
    return NextResponse.json({ error: 'An internal error occurred' }, { status: 500 });
  }
}
