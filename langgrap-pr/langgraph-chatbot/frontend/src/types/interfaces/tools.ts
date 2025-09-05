export interface ToolMessageMeta {
  tool_name?: string;
  args?: any;
  result?: any;
  phase?: "started" | "finished" | string;
  toolCallId?: string;
  raw?: any;
}

export interface ToolMessage {
  id: string;
  type: "tool";
  content: string;
  isFinal?: boolean;
  meta?: ToolMessageMeta;
}