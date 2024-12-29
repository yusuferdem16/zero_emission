import { LatLng, Zone, CircleZone, PolygonZone, ParkingLot } from '../types';

export function isPointInCircle(point: LatLng, circle: CircleZone): boolean {
  const distance = getDistance(point, circle.center);
  return distance <= circle.radius;
}

export function isPointInPolygon(point: LatLng, polygon: PolygonZone): boolean {
  let inside = false;
  const { points } = polygon;
  
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const xi = points[i].lng;
    const yi = points[i].lat;
    const xj = points[j].lng;
    const yj = points[j].lat;
    
    const intersect = ((yi > point.lat) !== (yj > point.lat))
        && (point.lng < (xj - xi) * (point.lat - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  
  return inside;
}

export function isPointInZone(point: LatLng, zone: Zone): boolean {
  if (zone.shape === 'circle') {
    return isPointInCircle(point, zone);
  } else {
    return isPointInPolygon(point, zone);
  }
}

export function getDistance(point1: LatLng, point2: LatLng): number {
  const R = 6371000; // Earth's radius in meters
  const lat1 = toRad(point1.lat);
  const lat2 = toRad(point2.lat);
  const deltaLat = toRad(point2.lat - point1.lat);
  const deltaLng = toRad(point2.lng - point1.lng);

  const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
          Math.cos(lat1) * Math.cos(lat2) *
          Math.sin(deltaLng/2) * Math.sin(deltaLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}

function toRad(degrees: number): number {
  return degrees * Math.PI / 180;
}

export function findNearestParkingLot(point: LatLng, parkingLots: ParkingLot[]): ParkingLot | null {
  if (parkingLots.length === 0) return null;

  return parkingLots.reduce((nearest, current) => {
    const distanceToCurrent = getDistance(point, current.position);
    const distanceToNearest = getDistance(point, nearest.position);
    return distanceToCurrent < distanceToNearest ? current : nearest;
  }, parkingLots[0]);
}

function lineIntersectsCircle(start: LatLng, end: LatLng, circle: CircleZone): boolean {
  // Get the closest point on the line to the circle's center
  const dx = end.lng - start.lng;
  const dy = end.lat - start.lat;
  const len = Math.sqrt(dx * dx + dy * dy);
  
  // Normalize direction vector
  const nx = dx / len;
  const ny = dy / len;
  
  // Vector from start to circle center
  const cx = circle.center.lng - start.lng;
  const cy = circle.center.lat - start.lat;
  
  // Project circle center onto line
  const projection = cx * nx + cy * ny;
  const projectionPoint = {
    lng: start.lng + nx * Math.max(0, Math.min(len, projection)),
    lat: start.lat + ny * Math.max(0, Math.min(len, projection))
  };
  
  // Check if the closest point is within the circle's radius
  return getDistance(projectionPoint, circle.center) <= circle.radius;
}

function lineIntersectsPolygon(start: LatLng, end: LatLng, polygon: PolygonZone): boolean {
  const { points } = polygon;
  
  // Check if line segment intersects with any polygon edge
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    
    if (lineSegmentsIntersect(
      start.lng, start.lat,
      end.lng, end.lat,
      points[i].lng, points[i].lat,
      points[j].lng, points[j].lat
    )) {
      return true;
    }
  }
  
  // Also check if either endpoint is inside the polygon
  return isPointInPolygon(start, polygon) || isPointInPolygon(end, polygon);
}

function lineSegmentsIntersect(
  x1: number, y1: number,
  x2: number, y2: number,
  x3: number, y3: number,
  x4: number, y4: number
): boolean {
  const denominator = ((x2 - x1) * (y4 - y3)) - ((y2 - y1) * (x4 - x3));
  if (denominator === 0) return false;
  
  const ua = (((x4 - x3) * (y1 - y3)) - ((y4 - y3) * (x1 - x3))) / denominator;
  const ub = (((x2 - x1) * (y1 - y3)) - ((y2 - y1) * (x1 - x3))) / denominator;
  
  return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
}

export function routeIntersectsZone(start: LatLng, end: LatLng, zone: Zone): boolean {
  if (zone.shape === 'circle') {
    return lineIntersectsCircle(start, end, zone);
  } else {
    return lineIntersectsPolygon(start, end, zone);
  }
}

export function routeIntersectsAnyZone(start: LatLng, end: LatLng, zones: Zone[]): boolean {
  return zones.some(zone => routeIntersectsZone(start, end, zone));
}

export function findBestParkingLot(start: LatLng, end: LatLng, parkingLots: ParkingLot[], zones: Zone[]): ParkingLot | null {
  if (parkingLots.length === 0) return null;

  // Filter parking lots that don't create routes through restricted zones
  const validParkingLots = parkingLots.filter(lot => 
    !routeIntersectsAnyZone(start, lot.position, zones) &&
    !routeIntersectsAnyZone(lot.position, end, zones)
  );

  if (validParkingLots.length === 0) return null;

  // Among valid parking lots, find the one that minimizes total travel distance
  return validParkingLots.reduce((best, current) => {
    const currentTotalDistance = 
      getDistance(start, current.position) + 
      getDistance(current.position, end);
    const bestTotalDistance = 
      getDistance(start, best.position) + 
      getDistance(best.position, end);
    
    return currentTotalDistance < bestTotalDistance ? current : best;
  }, validParkingLots[0]);
} 