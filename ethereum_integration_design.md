# OpenClaw 以太坊集成与能力交易金融模块架构设计

## 1. 概述

本设计文档旨在阐述如何将 OpenClaw 代理框架与以太坊区块链集成，以实现代理能力的交易和金融化。通过引入智能合约和相应的 OpenClaw 插件，我们将使 OpenClaw 代理能够注册、发现、交易其提供的服务，并实现价值的流转。

## 2. 核心概念

*   **能力（Capability）**：OpenClaw 代理提供的具体服务，例如 Web 搜索、图像生成、数据分析等。每个能力都将有一个唯一的标识符和定价模型。
*   **能力提供者（Capability Provider）**：提供能力的 OpenClaw 代理，通过以太坊地址标识。
*   **能力消费者（Capability Consumer）**：使用能力的 OpenClaw 代理或外部用户，通过以太坊地址标识。
*   **金融模块（Financial Module）**：负责处理能力交易中的支付、结算和记账逻辑。

## 3. 智能合约设计

我们将设计以下智能合约来支持能力交易：

### 3.1. `CapabilityRegistry` 合约

该合约用于管理 OpenClaw 代理注册的能力信息。

**功能：**

*   **注册能力**：允许 OpenClaw 代理注册其提供的能力，包括能力名称、描述、定价模型（例如，固定费用、按次计费、订阅模式）、提供者地址等。
*   **更新能力**：允许能力提供者更新其已注册的能力信息。
*   **查询能力**：允许能力消费者查询可用的能力列表及其详细信息。
*   **撤销能力**：允许能力提供者撤销其已注册的能力。

**关键数据结构：**

```solidity
struct Capability {
    bytes32 id; // 能力的唯一标识符
    address provider; // 能力提供者的以太坊地址
    string name; // 能力名称
    string description; // 能力描述
    uint256 price; // 固定价格（如果适用）
    // ... 其他定价模型参数，例如订阅周期、按使用量计费的费率等
    bool isActive; // 能力是否活跃
}

mapping(bytes32 => Capability) public capabilities;
mapping(address => bytes32[]) public providerCapabilities;
```

**关键函数：**

*   `registerCapability(bytes32 _id, string _name, string _description, uint256 _price)`
*   `updateCapability(bytes32 _id, string _name, string _description, uint256 _price)`
*   `getCapability(bytes32 _id) returns (Capability)`
*   `getCapabilitiesByProvider(address _provider) returns (bytes32[])`
*   `revokeCapability(bytes32 _id)`

### 3.2. `CapabilityExchange` 合约

该合约用于处理能力交易的支付和结算逻辑。

**功能：**

*   **购买能力**：允许能力消费者向能力提供者支付 ETH 或 ERC-20 代币以购买指定能力。
*   **结算**：根据能力的使用情况和定价模型，将资金从消费者转移到提供者。
*   **争议解决**：可选，引入简单的争议解决机制，例如，在一定时间内允许消费者退款或提供者拒绝服务。

**关键数据结构：**

```solidity
struct Order {
    bytes32 capabilityId; // 购买的能力ID
    address buyer; // 购买者地址
    address seller; // 销售者地址
    uint256 amount; // 支付金额
    uint256 timestamp; // 交易时间
    bool fulfilled; // 是否已履行
    // ... 其他交易状态，例如支付通道相关信息
}

mapping(bytes32 => Order) public orders;
```

**关键函数：**

*   `buyCapability(bytes32 _capabilityId) payable`
*   `fulfillOrder(bytes32 _orderId)`
*   `withdrawFunds()`

### 3.3. `ReputationSystem` 合约 (可选)

用于跟踪代理的能力使用情况和用户反馈，以建立代理的声誉。

**功能：**

*   **提交反馈**：允许能力消费者对已使用的能力提交评分和评论。
*   **查询声誉**：允许查询特定能力提供者的声誉分数。

**关键数据结构：**

```solidity
struct Feedback {
    bytes32 capabilityId;
    address consumer;
    uint8 rating; // 1-5星评分
    string comment; // 评论
    uint256 timestamp;
}

mapping(address => uint256) public reputationScores;
mapping(bytes32 => Feedback[]) public capabilityFeedbacks;
```

**关键函数：**

*   `submitFeedback(bytes32 _capabilityId, uint8 _rating, string _comment)`
*   `getReputation(address _provider) returns (uint256)`

## 4. OpenClaw 内部集成

为了实现与以太坊的交互，我们将在 OpenClaw 框架内进行以下集成和开发：

### 4.1. 以太坊客户端集成

OpenClaw 代理需要能够与以太坊网络进行交互。我们将集成 `ethers.js` 或 `web3.js` 库来实现这一功能。

*   **依赖管理**：在 OpenClaw 项目的 `package.json` 中添加 `ethers` 或 `web3` 依赖。
*   **客户端初始化**：在 OpenClaw 启动时，根据配置（例如，以太坊节点 URL、私钥等）初始化以太坊客户端。

### 4.2. 钱包管理

代理需要一个以太坊钱包来接收支付和支付 Gas 费用。这涉及到密钥的安全存储和管理。

*   **配置项**：在 OpenClaw 的配置中增加以太坊钱包私钥或助记词的配置项（加密存储）。
*   **钱包实例**：在以太坊客户端初始化时，使用配置的私钥创建钱包实例。

### 4.3. 新建 `ethereum-financial-plugin` 插件

我们将创建一个新的 OpenClaw 插件，命名为 `ethereum-financial-plugin`，用于封装所有与以太坊金融模块相关的逻辑。

**插件结构：**

```
ethereum-financial-plugin/
├── index.ts // 插件入口文件，注册工具、钩子和服务
├── src/
│   ├── contracts/ // 智能合约的 ABI 和地址
│   │   ├── CapabilityRegistry.json
│   │   └── CapabilityExchange.json
│   ├── services/ // 以太坊交互服务，例如发送交易、查询合约
│   │   └── EthereumService.ts
│   ├── tools/ // 新增的 OpenClaw 工具
│   │   ├── register-capability-tool.ts
│   │   ├── buy-capability-tool.ts
│   │   └── get-balance-tool.ts
│   └── utils/ // 辅助函数
│       └── wallet.ts
└── package.json
```

**插件入口文件 (`index.ts`) 职责：**

*   **配置解析**：解析插件的配置，包括智能合约地址、以太坊节点 URL、钱包私钥等。
*   **注册工具**：通过 `api.registerTool()` 方法注册新的 OpenClaw 工具，例如：
    *   `ethereum_register_capability`：用于代理注册其能力到 `CapabilityRegistry` 合约。
    *   `ethereum_update_capability`：用于代理更新其能力信息。
    *   `ethereum_get_capabilities`：用于代理查询可用的能力列表。
    *   `ethereum_buy_capability`：用于代理购买其他代理的能力。
    *   `ethereum_get_balance`：用于查询代理的以太坊余额。
    *   `ethereum_withdraw_funds`：用于代理从 `CapabilityExchange` 合约中提取收入。
*   **注册钩子**：通过 `api.registerHook()` 注册内部钩子，例如：
    *   `before_tool_call`：在代理调用工具之前，检查是否需要支付，并触发支付流程。
    *   `after_tool_call`：在代理工具调用完成后，处理支付结算或声誉更新。
*   **注册服务**：注册后台服务，例如监听以太坊事件。

### 4.4. 能力提供者模块

*   **能力注册工具 (`register-capability-tool.ts`)**：
    *   接收能力名称、描述、定价等参数。
    *   调用 `EthereumService` 与 `CapabilityRegistry` 合约交互，发送注册交易。
*   **定价模型配置**：在 OpenClaw 的配置中增加能力定价的设置，例如：

    ```json
    {
      "capabilities": {
        "web_search": {
          "price": "0.001 ETH",
          "pricing_model": "per_use"
        },
        "image_generation": {
          "price": "0.01 ETH",
          "pricing_model": "per_use"
        }
      }
    }
    ```

*   **能力执行与支付验证**：
    *   在 `src/agents/pi-embedded-runner/run.ts` 中，当代理决定调用一个需要付费的能力时，在实际执行工具之前，通过 `before_tool_call` 钩子触发支付验证。
    *   `EthereumService` 查询 `CapabilityExchange` 合约，验证消费者是否已支付或拥有有效订阅。
    *   如果支付不足或无效，阻止工具执行并返回错误信息。
*   **收入结算**：
    *   在 `after_tool_call` 钩子中，当能力成功执行后，调用 `EthereumService` 与 `CapabilityExchange` 合约交互，记录能力使用情况并触发收入结算。
    *   代理可以定期调用 `ethereum_withdraw_funds` 工具来提取累积的收入。

### 4.5. 能力消费者模块

*   **能力发现工具 (`get-capabilities-tool.ts`)**：
    *   允许代理查询 `CapabilityRegistry` 合约，发现其他代理提供的能力。
    *   返回能力列表及其详细信息，供代理决策使用。
*   **能力购买工具 (`buy-capability-tool.ts`)**：
    *   接收目标能力 ID 和支付金额等参数。
    *   调用 `EthereumService` 与 `CapabilityExchange` 合约交互，发送购买交易。
*   **支付接口**：当代理需要使用其他代理的能力时，通过 `ethereum_buy_capability` 工具进行支付。

### 4.6. 事件监听

`ethereum-financial-plugin` 插件将包含一个后台服务，监听 `CapabilityExchange` 合约发出的事件，例如 `CapabilityPurchased`、`OrderFulfilled` 等，以便代理能够及时响应，例如更新本地状态或通知用户。

## 5. 代码修订与实现路线图

### 5.1. 阶段一：基础以太坊集成与能力注册

1.  **智能合约开发与部署**：
    *   编写 `CapabilityRegistry.sol` 和 `CapabilityExchange.sol` 智能合约。
    *   使用 Hardhat 或 Truffle 进行测试和部署到测试网络（如 Sepolia）。
    *   生成合约 ABI 和地址。
2.  **OpenClaw 依赖添加**：
    *   在 OpenClaw 项目的 `package.json` 中添加 `ethers` 或 `web3` 库。
3.  **创建 `ethereum-financial-plugin` 插件**：
    *   创建插件目录结构。
    *   实现 `EthereumService.ts`，封装以太坊客户端初始化、合约交互等基础功能。
    *   实现 `ethereum_register_capability` 和 `ethereum_get_capabilities` 工具。
    *   在 `index.ts` 中注册这些工具。
4.  **测试**：
    *   编写单元测试，验证智能合约的功能。
    *   编写集成测试，验证 OpenClaw 代理能够成功注册和查询能力。

### 5.2. 阶段二：能力交易与支付流程

1.  **完善智能合约**：
    *   完善 `CapabilityExchange` 合约的 `buyCapability` 和 `fulfillOrder` 函数。
2.  **实现能力购买工具**：
    *   实现 `ethereum_buy_capability` 工具，允许代理购买其他代理的能力。
3.  **集成支付验证钩子**：
    *   在 `ethereum-financial-plugin/index.ts` 中注册 `before_tool_call` 钩子。
    *   在钩子中实现支付验证逻辑，调用 `EthereumService` 查询 `CapabilityExchange` 合约。
    *   如果支付不足，阻止工具执行。
4.  **实现收入结算工具**：
    *   实现 `ethereum_withdraw_funds` 工具，允许代理提取收入。
5.  **测试**：
    *   编写单元测试和集成测试，验证能力购买、支付验证和收入结算流程。

### 5.3. 阶段三：高级功能与优化 (可选)

1.  **声誉系统**：
    *   实现 `ReputationSystem` 合约和相应的 OpenClaw 工具。
    *   在 `after_tool_call` 钩子中集成反馈提交逻辑。
2.  **支付通道集成**：
    *   研究 Raiden Network 或其他状态通道解决方案，评估其与 OpenClaw 集成的可行性。
    *   如果可行，设计并实现支付通道的集成。
3.  **ERC-20 代币支持**：
    *   扩展智能合约和 OpenClaw 插件，支持使用 ERC-20 代币进行能力交易。
4.  **用户界面/配置工具**：
    *   开发命令行工具或 Web UI，方便用户配置代理的以太坊钱包、查看交易记录等。

## 6. 安全考虑

*   **私钥管理**：代理的以太坊私钥必须安全存储，建议使用加密方式或硬件钱包。
*   **智能合约审计**：所有智能合约在部署到主网之前必须经过专业的安全审计。
*   **交易验证**：在执行任何能力之前，必须严格验证链上交易的有效性。
*   **Gas 费用管理**：代理需要有足够的 ETH 来支付交易的 Gas 费用，并考虑 Gas 价格波动的影响。
*   **重放攻击防护**：确保交易具有唯一的 nonce，防止重放攻击。

## 7. 结论

通过上述设计和实现路线图，我们将能够成功地将 OpenClaw 与以太坊结合，引入能力交易的金融模块，为 OpenClaw 代理的自我净化和盈利能力提供坚实的基础。这将极大地扩展 OpenClaw 的应用场景和生态系统。
