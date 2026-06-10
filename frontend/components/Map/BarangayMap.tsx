"use client"

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"
import { useEffect } from "react"

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
})

const ROSARIO_BOUNDS: L.LatLngBoundsExpression = [
  [16.15, 120.40],
  [16.60, 120.55],
]

const ROSARIO_CENTER: [number, number] = [16.38, 120.478]

function RecenterMap({ lat, lng, zoom }: { lat: number; lng: number; zoom: number }) {
  const map = useMap()
  useEffect(() => {
    map.setView([lat, lng], zoom)
  }, [lat, lng, zoom])
  return null
}

type Props = {
  latitude?: number
  longitude?: number
  label?: string
  zoom?: number
}

export default function BarangayMap({ latitude, longitude, label, zoom = 14 }: Props) {
  const hasCoords = !!latitude && !!longitude
  const center: [number, number] = hasCoords ? [latitude, longitude] : ROSARIO_CENTER

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      maxBounds={ROSARIO_BOUNDS}
      maxBoundsViscosity={1.0}
      minZoom={13}
      style={{ height: "100%", width: "100%" }}
      className="rounded-lg z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {hasCoords && (
        <RecenterMap lat={latitude} lng={longitude} zoom={zoom} />
      )}

      {hasCoords && (
        <Marker position={[latitude, longitude]}>
          <Popup>{label ?? "Barangay"}</Popup>
        </Marker>
      )}
    </MapContainer>
  )
}