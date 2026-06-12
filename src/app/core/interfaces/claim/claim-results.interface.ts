import { ClaimInterface } from "./claim.interface";

export interface ClaimResults {
  item: number;
  itemOf: number;
  numElements: number;
  totalPages: number;
  data: ClaimInterface[]
}