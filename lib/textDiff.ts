// Utility function to create a diff between two texts
export function createDiff(original: string, improved: string): Array<{ type: 'add' | 'remove' | 'same', text: string }> {
  const originalLines = original.split('\n');
  const improvedLines = improved.split('\n');
  
  const diff: Array<{ type: 'add' | 'remove' | 'same', text: string }> = [];
  
  let i = 0, j = 0;
  
  while (i < originalLines.length || j < improvedLines.length) {
    const origLine = originalLines[i];
    const impLine = improvedLines[j];
    
    if (i >= originalLines.length) {
      // Only improved lines left
      diff.push({ type: 'add', text: impLine });
      j++;
    } else if (j >= improvedLines.length) {
      // Only original lines left
      diff.push({ type: 'remove', text: origLine });
      i++;
    } else if (origLine === impLine) {
      // Lines are the same
      diff.push({ type: 'same', text: origLine });
      i++;
      j++;
    } else {
      // Lines are different - check if it's a modification or add/remove
      const nextOrigIndex = improvedLines.indexOf(origLine, j);
      const nextImpIndex = originalLines.indexOf(impLine, i);
      
      if (nextOrigIndex !== -1 && (nextImpIndex === -1 || nextOrigIndex < nextImpIndex)) {
        // Original line appears later in improved, so current improved line is added
        diff.push({ type: 'add', text: impLine });
        j++;
      } else if (nextImpIndex !== -1) {
        // Improved line appears later in original, so current original line is removed
        diff.push({ type: 'remove', text: origLine });
        i++;
      } else {
        // Both lines are unique - treat as remove then add
        diff.push({ type: 'remove', text: origLine });
        diff.push({ type: 'add', text: impLine });
        i++;
        j++;
      }
    }
  }
  
  return diff;
}
