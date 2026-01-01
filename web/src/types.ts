export interface RoomType {
  id: number
  typeName: string
  price: number
  imageUrl: string
  bedNumber: number
  availableRoomsNumber: number
}

export interface Availability {
  available: boolean
  remaining: number
}

export interface BookingResult {
  id?: number
  roomNumber?: number
}

export interface TestProbeResponse {
  message: string
  timestamp?: string
}
