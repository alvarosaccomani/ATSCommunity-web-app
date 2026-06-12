import { FeeInterface } from "./fee.interface";

export interface FeeResults {
  item: number;
  itemOf: number;
  numElements: number;
  totalPages: number;
  data: FeeInterface[]
}