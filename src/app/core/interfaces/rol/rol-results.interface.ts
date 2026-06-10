import { RolInterface } from "./rol.interface";

export interface RolResults {
  item: number;
  itemOf: number;
  numElements: number;
  totalPages: number;
  data: RolInterface[]
}