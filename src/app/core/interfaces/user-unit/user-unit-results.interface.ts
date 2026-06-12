import { UserUnitInterface } from "./user-unit.interface";

export interface UserUnitResults {
  item: number;
  itemOf: number;
  numElements: number;
  totalPages: number;
  data: UserUnitInterface[]
}