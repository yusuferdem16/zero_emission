import React from 'react';
import { Circle, Marker, Polygon } from 'react-leaflet';
import { Zone } from '../../types';
import { VertexIcon, ResizeIcon, AddVertexIcon } from './MapIcons';

interface ZoneMarkersProps {
  zones: Zone[];
  editingComponent: { type: 'car' | 'zone' | 'parking'; id: string; } | null;
  mode: 'addCar' | 'addZone' | 'addParking' | 'directions' | 'edit' | null;
  onZoneSelect: (zone: Zone) => void;
  onZoneEdit: (id: string, updates: Partial<Zone>) => void;
  onZoneResize: (id: string, radius: number) => void;
  onZoneAddVertex: (id: string, point: { lat: number; lng: number }) => void;
  onZoneRemoveVertex: (id: string, index: number) => void;
  addingVertex: boolean;
  removingVertex: boolean;
  rotating: boolean;
}

const ZoneMarkers: React.FC<ZoneMarkersProps> = ({
  zones,
  editingComponent,
  mode,
  onZoneSelect,
  onZoneEdit,
  onZoneResize,
  onZoneAddVertex,
  onZoneRemoveVertex,
  addingVertex,
  removingVertex,
  rotating
}) => {
  return (
    <>
      {zones.map((zone) => {
        const isEditing = editingComponent?.type === 'zone' && editingComponent.id === zone.id;

        if (zone.shape === 'circle') {
          return (
            <React.Fragment key={zone.id}>
              <Circle
                center={[zone.center.lat, zone.center.lng]}
                radius={zone.radius}
                pathOptions={{
                  color: isEditing ? '#1565c0' : 'red',
                  fillColor: isEditing ? '#1565c0' : 'red',
                  fillOpacity: 0.2
                }}
                eventHandlers={{
                  click: (e) => {
                    e.originalEvent.stopPropagation();
                    if (mode === 'edit') {
                      onZoneSelect(zone);
                    }
                  }
                }}
              />
              {isEditing && (
                <>
                  <Marker
                    position={[zone.center.lat, zone.center.lng]}
                    icon={VertexIcon}
                    draggable={true}
                    eventHandlers={{
                      dragend: (e) => {
                        const marker = e.target;
                        const position = marker.getLatLng();
                        onZoneEdit(zone.id, { center: { lat: position.lat, lng: position.lng } });
                      }
                    }}
                  />
                  <Marker
                    position={[
                      zone.center.lat + (zone.radius / 111000),
                      zone.center.lng
                    ]}
                    icon={ResizeIcon}
                    draggable={true}
                    eventHandlers={{
                      dragend: (e) => {
                        const marker = e.target;
                        const position = marker.getLatLng();
                        const newRadius = Math.sqrt(
                          Math.pow(position.lat - zone.center.lat, 2) +
                          Math.pow(position.lng - zone.center.lng, 2)
                        ) * 111000;
                        onZoneResize(zone.id, newRadius);
                      }
                    }}
                  />
                </>
              )}
            </React.Fragment>
          );
        } else {
          return (
            <React.Fragment key={zone.id}>
              <Polygon
                positions={zone.points.map(p => [p.lat, p.lng])}
                pathOptions={{
                  color: isEditing ? '#1565c0' : 'red',
                  fillColor: isEditing ? '#1565c0' : 'red',
                  fillOpacity: 0.2
                }}
                eventHandlers={{
                  click: (e) => {
                    e.originalEvent.stopPropagation();
                    if (mode === 'edit') {
                      if (addingVertex) {
                        const point = e.latlng;
                        onZoneAddVertex(zone.id, { lat: point.lat, lng: point.lng });
                      } else {
                        onZoneSelect(zone);
                      }
                    }
                  }
                }}
              />
              {isEditing && (
                <>
                  {/* Vertex markers */}
                  {zone.points.map((point, index) => (
                    <Marker
                      key={`vertex-${index}`}
                      position={[point.lat, point.lng]}
                      icon={VertexIcon}
                      draggable={true}
                      eventHandlers={{
                        click: (e) => {
                          if (removingVertex && zone.points.length > 3) {
                            e.originalEvent.stopPropagation();
                            onZoneRemoveVertex(zone.id, index);
                          }
                        },
                        dragend: (e) => {
                          const marker = e.target;
                          const position = marker.getLatLng();
                          const newPoints = [...zone.points];
                          newPoints[index] = { lat: position.lat, lng: position.lng };
                          onZoneEdit(zone.id, { points: newPoints });
                        }
                      }}
                    />
                  ))}
                  {/* Mid-point markers for adding vertices */}
                  {!addingVertex && !removingVertex && !rotating && zone.points.map((point, index) => {
                    const nextPoint = zone.points[(index + 1) % zone.points.length];
                    const midPoint = {
                      lat: (point.lat + nextPoint.lat) / 2,
                      lng: (point.lng + nextPoint.lng) / 2
                    };
                    return (
                      <Marker
                        key={`midpoint-${index}`}
                        position={[midPoint.lat, midPoint.lng]}
                        icon={AddVertexIcon}
                        eventHandlers={{
                          click: (e) => {
                            e.originalEvent.stopPropagation();
                            const newPoints = [...zone.points];
                            newPoints.splice(index + 1, 0, midPoint);
                            onZoneEdit(zone.id, { points: newPoints });
                          }
                        }}
                      />
                    );
                  })}
                </>
              )}
            </React.Fragment>
          );
        }
      })}
    </>
  );
};

export default ZoneMarkers; 