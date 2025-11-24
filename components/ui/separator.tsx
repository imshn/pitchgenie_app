import * as React from 'react';

export function Separator({ className }: { className?: string }) {
  return <hr className={className ?? 'my-4 border-t border-muted'} />;
}

export default Separator;
