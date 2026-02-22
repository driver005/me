import { json } from "@sveltejs/kit";
import { getRecentlyPlayed } from "$lib/spotify";

export async function GET() {
  const response = await getRecentlyPlayed();
  const { items } = await response.json();

  const tracks = items.map((item: any) => ({
    title: item.track.name,
    artist: item.track.artists.map((_artist: any) => _artist.name).join(", "),
    albumImageUrl: item.track.album.images[0].url,
    songUrl: item.track.external_urls.spotify,
    playedAt: item.played_at,
  }));

  return json(tracks);
}
