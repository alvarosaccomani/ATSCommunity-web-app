import { UserRolCompanyInterface } from "./user-rol-company.interface";

export interface UserRolCompanyResults {
  item: number;
  itemOf: number;
  numElements: number;
  totalPages: number;
  data: UserRolCompanyInterface[]
}