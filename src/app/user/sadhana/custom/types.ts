export type CustomFieldType = "option" | "number";
export type CustomFieldCategory = "soul" | "body";

export interface CustomOption {
  id: string;
  label: string;
  marks: number;
}

export interface CustomRange {
  id: string;
  min: number;
  max: number;
  marks: number;
}

export interface CustomSadhanaField {
  id: string;
  question: string;
  type: CustomFieldType;
  category: CustomFieldCategory;
  required: boolean;
  options?: CustomOption[];
  ranges?: CustomRange[];
}

export interface CustomSadhanaCard {
  id: string;
  title: string;
  description: string;
  batchIds?: string[];
  batchNames?: string[];
  fields: CustomSadhanaField[];
  active: boolean;
  createdBy: string;
  createdAt?: unknown;
}

export interface CustomSadhanaResponse {
  cardId: string;
  userId: string;
  date: string;
  values: Record<string, string | number>;
  score: number;
  totalMarks: number;
}