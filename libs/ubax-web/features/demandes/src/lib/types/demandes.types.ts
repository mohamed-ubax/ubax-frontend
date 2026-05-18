export type CommercialRequestDetail = {
  readonly firstName: string;
  readonly lastName: string;
  readonly phone: string;
  readonly property: string;
  readonly requestType: string;
  readonly date: string;
  readonly requestTitle: string;
  readonly requestMessage: readonly string[];
  readonly replyTitle: string;
  readonly replyMessage: string;
};
