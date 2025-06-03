export type NotificationType = "success" | "error" | "info" | "warning";
export type Notification = {
  id: number;
  type: NotificationType;
  message: string;
  timeout?: number; // en ms
  visible: boolean;
};
