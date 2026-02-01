import React from 'react';
import { FixedSizeList as List, ListChildComponentProps } from 'react-window';

type ItemRenderer<T> = (item: T, index: number) => React.ReactNode;

export default function VirtualizedList<T>({
  items,
  height = 400,
  itemHeight = 40,
  width = '100%',
  renderItem,
}: {
  items: T[];
  height?: number;
  itemHeight?: number;
  width?: number | string;
  renderItem: ItemRenderer<T>;
}) {
  const Row = ({ index, style }: ListChildComponentProps) => (
    <div style={style}>
      {renderItem(items[index], index)}
    </div>
  );

  return (
    <List
      height={height}
      itemCount={items.length}
      itemSize={itemHeight}
      width={width}
    >
      {Row}
    </List>
  );
}
