export interface LatLng {
  lat: number;
  lng: number;
}

export interface BaseZone {
  id: string;
}

export interface CircleZone extends BaseZone {
  shape: 'circle';
  center: LatLng;
  radius: number;
  points?: never;
}

export interface PolygonZone extends BaseZone {
  shape: 'polygon';
  points: LatLng[];
  center?: never;
  radius?: never;
}

export type Zone = CircleZone | PolygonZone;

export interface Car {
  id: string;
  position: LatLng;
  type: 'allowed' | 'notAllowed';
}

export interface ParkingLot {
  id: string;
  position: LatLng;
  name: string;
}

export interface MapState {
  zones: Zone[];
  cars: Car[];
  parkingLots: ParkingLot[];
  selectedCar: Car | null;
  userLocation: LatLng | null;
} 