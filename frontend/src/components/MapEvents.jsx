import { useMapEvents } from "react-leaflet";

export default function MapEvents({ onBoundsChange }) {
  useMapEvents({
    moveend: (evt) => {
      const map = evt.target;
      const b = map.getBounds();
      onBoundsChange([
        [
          b.getSouthWest().lat,
          b.getSouthWest().lng,
          b.getNorthEast().lat,
          b.getNorthEast().lng,
        ],
      ]);
    },
  });
  return null;
}
