# BatchCall-tool

基于 **EIP-7702** 与 **MetaMask 智能账户** 的批量交易前端应用，一次交易即可执行多笔操作，降低 Gas 成本并提升效率。

## 特性

- 一次提交多笔交易，原子性执行（全成或全败）
- 支持多种交易类型：原生代币转账、ERC20 转账、ERC20 授权、自定义调用
- 与 MetaMask 智能账户深度集成
- 基于 Next.js 15 + Wagmi + Viem 构建

## 技术栈

- Next.js 15
- React 19
- Wagmi v2
- Viem v2
- TypeScript
- Tailwind CSS 4

## 环境要求

- Node.js 18+
- npm 9+（或兼容的包管理器）
- MetaMask 浏览器插件：Windows（[Chrome](https://chromewebstore.google.com/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn?hl=zh-CN&utm_source=ext_sidebar) / [Edge](https://microsoftedge.microsoft.com/addons/detail/metamask/ejbalbakoplchlghecdalmeeeajnimhm)），macOS（[Chrome](https://chromewebstore.google.com/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn?hl=zh-CN&utm_source=ext_sidebar)）

## 快速开始

### 📌 Linux / macOS / WSL 用户
（确保你已安装 `git`，如果未安装请参考➡️[安装git教程](./安装git教程.md)）

```bash
# 克隆仓库并进入项目目录
git clone https://github.com/oxmoei/BatchCall-dapp.git && cd BatchCall-dapp

# 自动配置环境和安装缺少的依赖
./install.sh

# 启动开发服务器
npm run dev
```

启动后使用浏览器访问：`http://localhost:3000`

### 📌 Windows 用户
（确保你已安装 `git`，如果未安装请参考➡️[安装git教程](./doc/安装git教程.md)）

```powershell
# 以管理员身份运行 PowerShell，然后在项目根目录执行
git clone https://github.com/oxmoei/BatchCall-dapp.git

# 进入项目目录
cd BatchCall-dapp

# 设置允许当前用户运行脚本
Set-ExecutionPolicy Bypass -Scope CurrentUser

# 自动配置环境和安装缺少的依赖
.\install.ps1

# 启动开发服务器
npm run dev
```

启动后使用浏览器访问：`http://localhost:3000`

## 使用说明（简要）

1. 打开页面并连接钱包  
2. 选择网络  
3. 添加多笔交易（原生转账 / ERC20 转账 / 授权 / 自定义调用）  
4. 一次签名提交，等待执行结果  

更详细内容请参考 ➡️[批量转账实现原理和用户使用方法](./doc/批量转账实现原理和用户使用方法.md)

## 目录结构

```text
BatchCall-dapp/
├─ public/                 # 静态资源
├─ src/                    # 应用源码
├─ package.json            # 依赖与脚本
├─ next.config.ts          # Next.js 配置
└─ 批量转账实现原理和用户使用方法.md
```

## 常用脚本

- `npm run dev`：本地开发
- `npm run build`：构建生产包
- `npm run start`：启动生产服务
- `npm run lint`：代码检查

## 注意事项

- EIP-7702 批量调用通常限制最多 10 笔交易，超过会被截取
- 如果交易总 Gas 过高，MetaMask 可能拒绝执行
- 移动端请在 MetaMask 应用内置浏览器打开

## 贡献

欢迎提交 Issue 与 PR。请在提交前确保本地通过 `npm run lint`。

## License

尚未设置 License（如需开源协议请补充）。
