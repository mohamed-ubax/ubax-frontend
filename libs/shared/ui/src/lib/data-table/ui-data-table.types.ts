export type UiDataTableAlign = 'start' | 'center' | 'end';

type UiDataTableValueResolver<TRow extends object> = {
  bivarianceHack(row: TRow): string | number | null | undefined;
}['bivarianceHack'];

export type UiDataTableColumn<
  TRow extends object = object,
> = {
  readonly key: string;
  readonly header: string;
  readonly width?: string;
  readonly align?: UiDataTableAlign;
  readonly value?: UiDataTableValueResolver<TRow>;
  readonly headerIconSrc?: string;
  readonly rotateHeaderIcon?: boolean;
};

export type UiDataTableCellContext<
  TRow extends object = object,
> = {
  readonly $implicit: TRow;
  readonly row: TRow;
  readonly value: string | number | null | undefined;
  readonly column: UiDataTableColumn<TRow>;
};
