export interface ReminderAction {
  type: "reminder_created";
  id: string;
  title: string;
  scheduledAt: string;
  status: "active";
}

export interface ChatRequest {
  message: string;
  conversationId?: string;
}

export interface ChatResponse {
  conversationId: string;
  message: {
    role: "assistant";
    content: string;
  };
  action?: ReminderAction;
}

export interface TranscriptionResponse {
  text: string;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
  };
}

export interface DemoResponse {
  message: string;
}

export interface HealthResponse {
  status: "ok" | "degraded";
  database: "connected" | "disconnected" | "not_configured";
}
