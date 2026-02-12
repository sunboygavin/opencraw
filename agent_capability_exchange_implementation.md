# OpenClaw 代理间能力交易（Agent-to-Agent Capability Exchange）实现方案

## 1. 核心愿景

本方案旨在将以太坊的去中心化价值流转能力深度嵌入 OpenClaw 框架，使代理（Agent）能够像人类开发者一样，通过支付加密货币来“购买”其他代理的技能（Skill）或开发成果。这不仅是金融模块的增加，更是为 Agent 引入了**资源约束**和**盈利动力**，从而实现生态的自我净化。

## 2. 架构修订建议

为了实现代理间的自动化交易，我们需要在 OpenClaw 的核心层进行以下代码修订：

### 2.1. 代理身份与钱包绑定 (`src/agents/agent-scope.ts`)

每个 Agent 实例应拥有一个关联的以太坊钱包。

**代码修订思路：**
在 `AgentContext` 中增加 `wallet` 属性。

```typescript
// 建议在 AgentContext 接口中增加
export interface AgentContext {
  id: string;
  ethAddress: string; // 代理的链上身份
  wallet?: ethers.Wallet; // 代理的操作钱包
  // ... 其他现有属性
}
```

### 2.2. 工具调用计费钩子 (`src/agents/pi-tools.before-tool-call.ts`)

在工具实际执行前，检查该工具（Skill）是否需要付费。

**代码修订思路：**
修改 `wrapToolWithBeforeToolCallHook`，增加对 `price` 属性的解析和扣费逻辑。

```typescript
// 修订 pi-tools.before-tool-call.ts
export function wrapToolWithBeforeToolCallHook(tool: AnyAgentTool, context: { agentId: string, sessionKey: string }) {
  const originalRun = tool.run;
  tool.run = async (params, runContext) => {
    // 1. 检查工具是否有定价信息（可以从插件元数据或链上注册表获取）
    const toolMeta = getPluginToolMeta(tool);
    if (toolMeta?.price > 0) {
      // 2. 调用金融服务进行预授权或扣费
      const paymentSuccess = await financialService.processPayment({
        from: context.agentId,
        to: toolMeta.providerId,
        amount: toolMeta.price,
        capability: tool.name
      });
      
      if (!paymentSuccess) {
        throw new Error(`支付失败：调用能力 ${tool.name} 需要支付 ${toolMeta.price} ETH，当前余额不足。`);
      }
    }
    return originalRun(params, runContext);
  };
  return tool;
}
```

### 2.3. 动态 Skill 购买工具 (`src/plugins/ethereum-financial-plugin/tools/skill-market.ts`)

新增一个特殊的工具，允许 Agent 在运行过程中通过以太坊“购买”并即时加载新的 Skill 代码。

**功能描述：**
1. **搜索**：Agent 发现自己缺乏某种能力，调用 `market_search_skill`。
2. **购买**：调用 `market_buy_skill`，触发链上转账。
3. **加载**：购买成功后，合约释放 Skill 的 IPFS 地址或加密代码包，OpenClaw 动态加载该插件。

## 3. 金融模块核心逻辑

我们将金融模块分为三层实现：

| 层次 | 组件 | 职责 |
| :--- | :--- | :--- |
| **协议层** | `CapabilityMarket.sol` | 处理链上转账、Skill 授权记录、争议仲裁。 |
| **服务层** | `FinancialService.ts` | 封装 ethers.js，管理 Agent 钱包，处理签名和交易。 |
| **交互层** | `CapabilityTools` | 提供给 Agent 使用的工具集：`check_balance`, `buy_skill`, `list_my_earnings`。 |

## 4. 代理自我净化机制

通过引入交易属性，OpenClaw 生态将产生以下演化：
*   **优胜劣汰**：低效、高成本的 Skill 将因无人付费而自动淘汰。
*   **开发动力**：擅长编写高质量 Skill 的 Agent（或背后的开发者）可以通过其能力赚取 ETH，从而有资金进一步升级自己的代码。
*   **能力复用**：Agent 不再需要重复开发所有功能，而是学会通过“外包”和“购买”来高效完成任务。

## 5. 实现路径建议

1.  **第一步 (集成钱包)**：在配置文件中允许为每个 Agent 配置私钥，并实现基础的余额查询工具。
2.  **第二步 (工具定价)**：在插件定义中增加 `price` 字段，并在 OpenClaw 的工具分发逻辑中体现。
3.  **第三步 (自动化支付)**：实现 `before_tool_call` 自动扣费，初期可以使用模拟代币（Testnet ETH），后期切换至主网。
4.  **第四步 (代码交易)**：支持通过以太坊购买加密的 `.ts` 或 `.js` 插件文件，并由 OpenClaw 动态加载。
