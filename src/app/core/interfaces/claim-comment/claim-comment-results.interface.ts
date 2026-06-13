import { ClaimCommentInterface } from "./claim-comment.interface";

export interface ClaimCommentResults {
  item: number;
  itemOf: number;
  numElements: number;
  totalPages: number;
  data: ClaimCommentInterface[]
}