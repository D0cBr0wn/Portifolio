// stores/notification.ts
import { defineStore } from "pinia";
import type { NotificationType } from "~/model/types/Notification";

let _id = 0;

export const useNotificationStore = defineStore("notification", {
  state: () => ({
    list: [] as Notification[],
  }),
  actions: {
    notify(
      type: NotificationType,
      message: string,
      timeout = 3000,
      visible: boolean
    ) {
      const id = _id++;
      this.list.push({ id, type, message, timeout, visible });

      if (timeout > 0) {
        setTimeout(() => {
          this.remove(id);
        }, timeout);
      }
    },
    remove(id: number) {
      this.list = this.list.filter((n) => n.id !== id);
    },
    clearAll() {
      this.list = [];
    },
  },
});
