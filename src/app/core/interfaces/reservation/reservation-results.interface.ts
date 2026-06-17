import { ReservationInterface } from "./reservation.interface";

export interface ReservationResults {
  item: number;
  itemOf: number;
  numElements: number;
  totalPages: number;
  data: ReservationInterface[]
}