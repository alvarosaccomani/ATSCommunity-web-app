import { TransactionInterface } from "./transaction.interface";

export interface TransactionResults {
  item: number;
  itemOf: number;
  numElements: number;
  totalPages: number;
  data: TransactionInterface[]
}