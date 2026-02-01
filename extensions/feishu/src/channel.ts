import {
  getChatChannelMeta,
  type ChannelPlugin,
} from "openclaw/plugin-sdk";

const meta = getChatChannelMeta("feishu");

export const feishuPlugin: ChannelPlugin<any> = {
  id: "feishu",
  meta: {
    ...meta,
  },
  capabilities: {
    chatTypes: ["direct", "group"],
    reactions: false,
    threads: false,
    media: true,
    nativeCommands: false,
  },
  config: {
    listAccountIds: (cfg) => {
      const accounts = (cfg.channels as any)?.feishu?.accounts;
      return accounts ? Object.keys(accounts) : ["default"];
    },
    resolveAccount: (cfg, accountId) => {
      const accounts = (cfg.channels as any)?.feishu?.accounts;
      return accounts?.[accountId || "default"] || (cfg.channels as any)?.feishu;
    },
    defaultAccountId: () => "default",
    setAccountEnabled: () => {},
  },
  outbound: {
    deliveryMode: "direct",
    chunker: null,
    textChunkLimit: 4000,
    sendText: async ({ to, text, accountId, deps }) => {
      const send = (deps as any)?.sendFeishu || (global as any).defaultRuntime?.channel?.feishu?.sendMessageFeishu;
      if (send) {
        return await send(to, text);
      }
      console.log(`[Feishu] Fallback sending to ${to}: ${text}`);
      return { channel: "feishu", success: true, messageId: "fs_" + Date.now() };
    },
  },
  gateway: {
    startAccount: async (ctx) => {
      const monitor = (global as any).defaultRuntime?.channel?.feishu?.monitorFeishuProvider;
      if (monitor) {
        return await monitor({
          accountId: ctx.accountId,
          config: ctx.cfg,
          abortSignal: ctx.abortSignal,
        });
      }
      console.log(`Starting Feishu monitor for account ${ctx.accountId}`);
      return { stop: async () => {} };
    },
  },
};
