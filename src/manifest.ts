import { defineManifest } from "@crxjs/vite-plugin";

export default defineManifest({
  manifest_version: 3,
  name: "Selah Time - Christian Pomodoro timer.",
  description:
    "Un Pomodoro classique mais avec un verset biblique à chaque changement de phase.",
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
