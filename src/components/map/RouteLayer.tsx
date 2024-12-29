import React, { useEffect, useState } from 'react';
import { Polyline, Popup } from 'react-leaflet';
import { LatLng } from '../../types';
import { ORS_API_KEY } from '../../config';

interface RouteLayerProps {
  start: LatLng;
  end: LatLng;
  alternateEnd?: LatLng;
  isRestrictedZone?: boolean;
}

const RouteLayer: React.FC<RouteLayerProps> = ({ start, end, alternateEnd, isRestrictedZone }) => {
  const [mainRoutePoints, setMainRoutePoints] = useState<[number, number][]>([]);
  const [alternateRoutePoints, setAlternateRoutePoints] = useState<[number, number][]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRoute = async (startPoint: LatLng, endPoint: LatLng) => {
      try {
        const response = await fetch('https://api.openrouteservice.org/v2/directions/driving-car/geojson', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${ORS_API_KEY}`,
            'Content-Type': 'application/json; charset=utf-8',
            'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8'
          },
          body: JSON.stringify({
            coordinates: [
              [startPoint.lng, startPoint.lat],
              [endPoint.lng, endPoint.lat]
            ],
            preference: 'recommended',
            units: 'km',
            geometry: true,
            instructions: false
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Route API error:', errorData);
          throw new Error(errorData.error?.message || 'Failed to fetch route');
        }

        const data = await response.json();
        if (data.features && data.features.length > 0) {
          return data.features[0].geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
        }
        throw new Error('No route found');
      } catch (err) {
        console.error('Error fetching route:', err);
        // Fallback to direct line if API fails
        return [
          [startPoint.lat, startPoint.lng],
          [endPoint.lat, endPoint.lng]
        ];
      }
    };

    const loadRoutes = async () => {
      try {
        // Fetch main route
        const mainRoute = await fetchRoute(
          start,
          alternateEnd || end
        );
        setMainRoutePoints(mainRoute);

        // Fetch alternate route if needed
        if (alternateEnd) {
          const secondRoute = await fetchRoute(end, alternateEnd);
          setAlternateRoutePoints(secondRoute);
        } else {
          setAlternateRoutePoints([]);
        }
      } catch (err) {
        console.error('Error loading routes:', err);
        setError('Failed to load route');
      }
    };

    loadRoutes();
  }, [start, end, alternateEnd]);

  return (
    <>
      {error && (
        <Popup position={[start.lat, start.lng]}>
          {error}
        </Popup>
      )}
      {mainRoutePoints.length > 0 && (
        <Polyline
          positions={mainRoutePoints}
          pathOptions={{ color: 'blue', weight: 4 }}
        />
      )}
      {alternateRoutePoints.length > 0 && (
        <>
          <Polyline
            positions={alternateRoutePoints}
            pathOptions={{ color: 'orange', weight: 4, dashArray: '10, 10' }}
          />
          {isRestrictedZone && (
            <Popup position={[end.lat, end.lng]}>
              Destination is in a restricted zone. Route to nearest parking lot shown in orange.
            </Popup>
          )}
        </>
      )}
    </>
  );
};

export default RouteLayer; 