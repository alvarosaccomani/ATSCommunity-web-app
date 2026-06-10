import { UserInterface } from "./user.interface";

export interface UserResults {
  item: number;
  itemOf: number;
  numElements: number;
  totalPages: number;
  data: UserInterface[]
}