# OpenCraw 安装手册与飞书接入指南

## 1. 安装手册

### 1.1 环境准备

在开始安装 OpenCraw 之前，请确保您的系统已安装以下软件：

*   **Node.js**: 推荐使用 LTS 版本。
*   **npm/yarn/pnpm**: 任意一个包管理器即可，推荐 pnpm。
*   **Git**: 用于克隆 OpenCraw 仓库。

您可以通过以下命令检查是否已安装：

```bash
node -v
npm -v
git -v
```

### 1.2 克隆仓库

使用 Git 克隆 OpenCraw 仓库到您的本地：

```bash
git clone https://github.com/sunboygavin/opencraw.git
cd opencraw
```

### 1.3 安装依赖

进入项目目录后，使用您偏好的包管理器安装项目依赖：

```bash
pnpm install
# 或者 npm install
# 或者 yarn install
```

### 1.4 构建项目

安装完依赖后，构建项目：

```bash
pnpm run build
# 或者 npm run build
# 或者 yarn build
```

### 1.5 运行项目

项目构建完成后，您可以通过以下命令启动 OpenCraw：

```bash
pnpm start
# 或者 npm start
# 或者 yarn start
```

## 2. 飞书接入指南

本节将指导您如何在 OpenCraw 中配置飞书（Lark）机器人，实现消息的发送和接收。

### 2.1 创建飞书应用

1.  访问 [飞书开放平台](https://open.feishu.cn/) 并登录您的账号。
2.  点击 **“创建应用”**，填写应用名称、描述等信息。
3.  进入应用详情页，在 **“凭证与基础信息”** 中获取 **App ID** 和 **App Secret**，这些将在 OpenCraw 配置中使用。
4.  在 **“事件订阅”** 中，启用 **“事件订阅”** 功能。
    *   **请求网址 URL**：填写您的 OpenCraw 服务地址，例如 `http://your-opencraw-server.com/feishu/events`。请确保该地址可以被飞书服务器访问到。
    *   **Verification Token**：飞书会自动生成一个 Verification Token，请记录下来，它将用于 OpenCraw 配置。
    *   订阅以下事件：
        *   **消息与互动** -> **接收消息** -> `message.receive_v1`
5.  在 **“机器人”** 功能中，启用 **“机器人”** 功能。
6.  在 **“权限管理”** 中，为您的应用添加以下权限：
    *   `im:message` (发送消息)
    *   `im:message.group_at_bot` (获取群聊中@机器人的消息)
    *   `im:message.p2p_at_bot` (获取单聊中@机器人的消息)
    *   `im:message.send_as_bot` (机器人发送消息)
    *   `im:message.receive_v1` (接收消息事件)
7.  发布您的应用，使其上线。

### 2.2 OpenCraw 配置

在 OpenCraw 的配置文件（通常是 `config.yaml` 或 `config.json`）中，添加或修改 `channels` 部分，以启用飞书通道：

```yaml
channels:
  feishu:
    appId: "YOUR_FEISHU_APP_ID" # 替换为您的飞书 App ID
    appSecret: "YOUR_FEISHU_APP_SECRET" # 替换为您的飞书 App Secret
    verificationToken: "YOUR_FEISHU_VERIFICATION_TOKEN" # 替换为您的飞书 Verification Token
    # webhookPath: "/feishu/events" # 如果您修改了默认的 webhook 路径，请在此处指定
    # enabled: true # 默认为 true，如果需要禁用可设置为 false
```

### 2.3 测试接入

1.  启动 OpenCraw 服务。
2.  在飞书应用中，向您的机器人发送一条消息。
3.  检查 OpenCraw 的控制台输出，您应该能看到接收到消息的日志。
4.  如果 OpenCraw 配置了自动回复功能，机器人应该会回复您的消息。

