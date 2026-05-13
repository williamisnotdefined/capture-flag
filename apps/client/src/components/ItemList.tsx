type ItemListProps = {
  empty: string;
  items: string[];
};

export function ItemList({ empty, items }: ItemListProps) {
  if (items.length === 0) {
    return <p className="mt-4 text-sm text-stone-600">{empty}</p>;
  }

  return (
    <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-slate-800">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
