import { type RecordEnteredBy } from 'src/components/records/types';

type EnteredByLineProps = {
  enteredBy: RecordEnteredBy | null | undefined;
  className?: string;
};

export function EnteredByLine({ enteredBy, className = '' }: EnteredByLineProps) {
  if (!enteredBy?.username) {
    return null;
  }

  return (
    <p className={`text-[10px] leading-tight text-slate-400 ${className}`.trim()}>
      Nhập: {enteredBy.username}
    </p>
  );
}
