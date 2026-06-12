import { UnitInterface } from "./unit.interface";

export interface UnitResults {
  item: number;
  itemOf: number;
  numElements: number;
  totalPages: number;
  data: UnitInterface[]
}