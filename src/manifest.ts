import { defineManifest } from "@crxjs/vite-plugin";

export default defineManifest({
  manifest_version: 3,
  name: "Pomodoro Biblique",
  description:
    "Un verset biblique à chaque clic, ou à intervalle régulier comme un pomodoro.",
  version: "0.1.0",
  minimum_chrome_version: "127",
  action: {
    default_popup: "src/popup/index.html",
    default_title: "Pomodoro Biblique",
  },
  background: {
    service_worker: "src/background/service-worker.ts",
    type: "module",
  },
  permissions: ["storage", "alarms"],
  host_permissions: ["https://bible.helloao.org/*"],
});
