export interface PromptParams {
  newPrompt: string;
  promptIndex?: number;
}

export interface ModelSelection {
  id: string;
  name: string;
  provider: string;
}

export interface StreamingStatus {
  isStreaming: boolean;
  progress: number;
}

export interface ResultCardProps {
  result: string;
  model: ModelSelection;
  status: StreamingStatus;
}
