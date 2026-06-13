import { CompanyInterface } from "./company.interface";

export interface CompanyResults {
  item: number;
  itemOf: number;
  numElements: number;
  totalPages: number;
  data: CompanyInterface[]
}