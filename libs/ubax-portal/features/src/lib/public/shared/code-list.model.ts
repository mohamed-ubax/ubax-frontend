export interface LaCodeListDto {
  id: string;
  type: string;
  value: string;
  description: string;
  systemAssign: boolean;
}

export interface CodeListResponse {
  status: string;
  statusCode: number;
  message: string;
  data: LaCodeListDto[];
}
