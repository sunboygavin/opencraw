import type { 
  GroupPolicy, 
  MarkdownConfig, 
  ReplyToMode,
  GroupToolPolicyConfig,
  GroupToolPolicyBySenderConfig,
  DmConfig
} from "./types.base.js";
import type { ChannelHeartbeatVisibilityConfig } from "./types.channels.js";

export type FeishuAccountConfig = {
  name?: string;
  enabled?: boolean;
  appId: string;
  appSecret: string;
  encryptKey?: string;
  verificationToken?: string;
  /** Feishu Events API webhook path (default: /feishu/events). */
  webhookPath?: string;
  groupPolicy?: GroupPolicy;
  requireMention?: boolean;
  historyLimit?: number;
  dmHistoryLimit?: number;
  textChunkLimit?: number;
  mediaMaxMb?: number;
  replyToMode?: ReplyToMode;
  markdown?: MarkdownConfig;
  heartbeat?: ChannelHeartbeatVisibilityConfig;
  dms?: Record<string, DmConfig>;
};

export type FeishuConfig = {
  accounts?: Record<string, FeishuAccountConfig>;
} & Partial<FeishuAccountConfig>;
