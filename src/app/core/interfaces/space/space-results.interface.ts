import { SpaceInterface } from "./space.interface";

export interface SpaceResults {
  item: number;
  itemOf: number;
  numElements: number;
  totalPages: number;
  data: SpaceInterface[]
}