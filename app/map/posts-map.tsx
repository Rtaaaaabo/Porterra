"use client";

import { useMemo } from "react";
import Link from "next/link";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import type { PostMapPoint } from "@/lib/types";

type Props = {
  points: PostMapPoint[];
};

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export default function PostsMap({ points }: Props) {
  const center: [number, number] = useMemo(() => {
    const lat = points.reduce((sum, p) => sum + p.lat, 0) / points.length;
    const lng = points.reduce((sum, p) => sum + p.lng, 0) / points.length;
    return [lat, lng];
  }, [points]);

  return (
    <div className="h-[70vh] min-h-[440px] w-full">
      <MapContainer center={center} zoom={4} className="h-full w-full rounded-lg">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MarkerClusterGroup chunkedLoading>
          {points.map((point) => (
            <Marker key={point.id} position={[point.lat, point.lng]} icon={markerIcon}>
              <Popup>
                <div className="space-y-1">
                  <p className="text-sm font-semibold">{point.title}</p>
                  <p className="text-xs text-slate-600">📍 {point.spotName}</p>
                  <p className="text-xs text-slate-600">投稿者: {point.authorName}</p>
                  <Link href={`/posts/${point.id}`} className="text-xs font-semibold text-sky-700 hover:text-sky-800">
                    投稿を見る
                  </Link>
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
}
