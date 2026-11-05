
export type LocationState =
  | { status: "idle" }
  | { status: "requesting_permission" }
  | { status: "fetching" }
  | { status: "permission_denied"; message: string; canAskAgain: boolean }
  | { status: "services_disabled"; message: string }
  | { status: "error"; message: string }
  | {
      status: "available";
      coordinates: Coordinates;
      address?: string;
      accuracy?: number;
      timestamp: number;
    };

export type LocationStatus = LocationState["status"];

export interface LocationOptions {
  fetchAddress?: boolean;
  highAccuracy?: boolean;
}

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export interface LocationResult {
  coordinates: Coordinates;
  address?: string;
  accuracy?: number;
  timestamp: number;
}
