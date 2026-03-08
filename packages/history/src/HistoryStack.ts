import type { Operation } from './operations';

export class HistoryStack {
  private undoStack: Operation[] = [];
  private redoStack: Operation[] = [];
  private maxDepth: number;
  private batchOperations: Operation[] | null = null;

  constructor(maxDepth = 100) {
    this.maxDepth = maxDepth;
  }

  push(operation: Operation): void {
    if (this.batchOperations) {
      this.batchOperations.push(operation);
      return;
    }

    this.undoStack.push(operation);
    this.redoStack = []; // Clear redo stack on new operation

    // Trim if exceeds max depth
    if (this.undoStack.length > this.maxDepth) {
      this.undoStack.shift();
    }
  }

  undo(): Operation | undefined {
    const operation = this.undoStack.pop();
    if (operation) {
      this.redoStack.push(operation);
    }
    return operation;
  }

  redo(): Operation | undefined {
    const operation = this.redoStack.pop();
    if (operation) {
      this.undoStack.push(operation);
    }
    return operation;
  }

  startBatch(): void {
    this.batchOperations = [];
  }

  endBatch(label?: string): void {
    if (!this.batchOperations) return;

    if (this.batchOperations.length > 0) {
      const batchOp: Operation = {
        type: 'batch',
        timestamp: Date.now(),
        data: { operations: this.batchOperations },
        inverse: {
          operations: this.batchOperations
            .map((op) => ({
              ...op,
              data: op.inverse,
              inverse: op.data,
            }))
            .reverse(),
        },
      };
      this.batchOperations = null;
      this.push(batchOp);
    } else {
      this.batchOperations = null;
    }
  }

  get canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  get canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  get undoCount(): number {
    return this.undoStack.length;
  }

  get redoCount(): number {
    return this.redoStack.length;
  }

  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
    this.batchOperations = null;
  }
}
