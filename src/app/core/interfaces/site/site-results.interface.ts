import { SiteInterface } from "./site.interface";

export interface SiteResults {
  item: number;
  itemOf: number;
  numElements: number;
  totalPages: number;
  data: SiteInterface[]
}