// Command Pattern: Each operation is reversible

export interface Operation {
  type: string;
  timestamp: number;
  data: any;
  inverse: any; // Data needed to reverse this operation
}

export interface AddElementOperation extends Operation {
  type: 'add-element';
  data: {
    pageId: string;
    element: any;
  };
  inverse: {
    pageId: string;
    elementId: string;
  };
}

export interface RemoveElementOperation extends Operation {
  type: 'remove-element';
  data: {
    pageId: string;
    elementId: string;
  };
  inverse: {
    pageId: string;
    element: any;
  };
}

export interface UpdateElementOperation extends Operation {
  type: 'update-element';
  data: {
    pageId: string;
    elementId: string;
    changes: Record<string, any>;
  };
  inverse: {
    pageId: string;
    elementId: string;
    changes: Record<string, any>;
  };
}

export interface MoveElementOperation extends Operation {
  type: 'move-element';
  data: {
    pageId: string;
    elementId: string;
    x: number;
    y: number;
  };
  inverse: {
    pageId: string;
    elementId: string;
    x: number;
    y: number;
  };
}

export interface BatchOperation extends Operation {
  type: 'batch';
  data: {
    operations: Operation[];
  };
  inverse: {
    operations: Operation[];
  };
}

export type HistoryOperation =
  | AddElementOperation
  | RemoveElementOperation
  | UpdateElementOperation
  | MoveElementOperation
  | BatchOperation;
