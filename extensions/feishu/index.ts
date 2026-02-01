import { feishuPlugin } from "./src/channel.js";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk";

export const definition = {
  id: "feishu",
  name: "Feishu",
  description: "Feishu/Lark channel plugin",
  version: "1.0.0",
  kind: "channel",
};

export function register(api: OpenClawPluginApi) {
  api.registerChannel({
    plugin: feishuPlugin,
  });
}

export default { definition, register };
