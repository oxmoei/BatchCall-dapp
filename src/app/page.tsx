"use client";

import Image from "next/image";
import { metaMask } from "wagmi/connectors";
import { useAccount, useConnect, useDisconnect, useSendCalls, useChainId, useSwitchChain } from "wagmi";
import { useState, useEffect, useRef, useCallback } from "react";
import { getCallsStatus } from "@wagmi/core";
import { wagmiConfig as config } from "@/providers/AppProvider";
import { parseEther } from "viem";
import { mainnet, polygon, bsc, arbitrum, base, sepolia, optimism } from "viem/chains";
import { monad } from "@/providers/AppProvider";

// Supported chain configuration
const SUPPORTED_CHAINS = [
  { id: mainnet.id, name: 'Ethereum', logo: '/ethereum-logo.svg' },
  { id: polygon.id, name: 'Polygon', logo: '/polygon-logo.svg' },
  { id: bsc.id, name: 'BNB Chain', logo: '/bnb-logo.svg' },
  { id: arbitrum.id, name: 'Arbitrum', logo: '/arbitrum-logo.svg' },
  { id: base.id, name: 'Base', logo: '/base-logo.svg' },
  { id: optimism.id, name: 'Optimism', logo: '/optimism-logo.svg' },
  { id: monad.id, name: 'Monad', logo: '/monad-logo.svg' },
  { id: sepolia.id, name: 'Sepolia', logo: '/ethereum2-logo.svg' },
];

// Chain ID to chain name mapping
const CHAIN_NAMES = {
  1: 'Ethereum',
  137: 'Polygon',
  56: 'BNB Chain',
  42161: 'Arbitrum',
  8453: 'Base',
  10: 'Optimism',
  11155111: 'Sepolia',
  143: 'Monad'
};

// Get block explorer URL based on chain ID
function getExplorerUrl(chainId: number, txHash: string): string {
  const explorerUrls = {
    1: `https://etherscan.io/tx/${txHash}`, // Ethereum
    137: `https://polygonscan.com/tx/${txHash}`, // Polygon
    56: `https://bscscan.com/tx/${txHash}`, // BNB Chain
    42161: `https://arbiscan.io/tx/${txHash}`, // Arbitrum
    8453: `https://basescan.org/tx/${txHash}`, // Base
    10: `https://optimistic.etherscan.io/tx/${txHash}`, // Optimism
    11155111: `https://sepolia.etherscan.io/tx/${txHash}`, // Sepolia
    143: `https://monad.socialscan.io/tx/${txHash}`, // Monad
  };
  return explorerUrls[chainId as keyof typeof explorerUrls] || `https://etherscan.io/tx/${txHash}`;
}

// Language type
type Language = 'zh' | 'en';

// Transaction type
type Transaction = {
  type: 'native_transfer' | 'erc20_transfer' | 'erc20_approve' | 'erc721_transfer' | 'erc1155_transfer' | 'custom_data';
  to: string;
  value: string;
  data: string;
};

// Text mapping
const texts = {
  zh: {
    title: '批量调用器',
    subtitle: '基于Metamask智能账户，让批量交易更安全、更便捷、更高效、更节省Gas费！',
    connectWallet: '连接钱包',
    disconnect: '断开连接',
    switchNetwork: '切换网络',
    configureTransactions: '配置批量交易',
    addTransaction: '添加交易',
    transactionType: '交易类型',
    nativeTransfer: '原生代币转账',
    erc20Transfer: 'ERC20 转账',
    erc20Approve: 'ERC20 授权',
    erc721Transfer: 'ERC721 转账',
    erc1155Transfer: 'ERC1155 转账',
    customTransaction: '自定义交易',
    recipient: '接收地址',
    amount: '数量',
    tokenAddress: '代币合约地址',
    data: '数据',
    add: '添加',
    transactionList: '☰ 构建交易列表',
    noTransactions: '暂无交易',
    sendBatchTransaction: '发送批量交易',
    sendBatchTransactionWithGas: '发送批量交易',
    sendingTransaction: '正在发送交易...',
    transactionSubmitted: '交易已成功提交！',
    transactionConfirmed: '✅ 交易已确认！🎉',
    checkStatus: '🔍 检查交易状态',
    checkingStatus: '正在检查状态...',
    transactionHash: '交易哈希',
    status: '状态',
    viewOnExplorer: '在区块浏览器中查看',
    error: '错误',
    success: '成功',
    pending: '等待中',
    failed: '失败',
    gasLimitExceeded: 'Gas Limit 超限',
    gasLimitExceededDesc: '该笔交易可能含有一些特殊的代币合约导致该笔批量交易所需 Gas 异常偏高，建议移除这类交易后重试（或分批发送）。',
    smartAccountError: '需要关闭智能账户功能',
    smartAccountErrorDesc: '检测到账户已升级为不支持的合约版本。请按照以下步骤操作：',
    solutionSteps: '解决步骤：',
    openMetaMask: '打开 MetaMask 钱包',
    clickAccountIcon: '点击右上角 "☰"',
    selectAccountDetails: '点击 "Open full screen"',
    findSmartAccount: '选择"账户详情" → 设置 "智能账户"',
    clickDisableSmartAccount: '关闭相关链的智能账户（需支付Gas费）',
    returnAndRetry: '返回此页面重新尝试批量调用',
    smartAccountTip: '提示：你的账户将会自动重新升级为 MetaMask Smart Account，并进行批量交易。',
    addTransactionFirst: '请先添加交易',
    addTransactionFirstDesc: '在上方"配置批量交易"区域添加至少一笔交易后才能执行批量操作',
    checkDataField: '请检查 data 字段：应为 138 字符（含 0x 前缀）',
    transactionCount: '笔交易',
    showFirst: '仅显示前',
    originalCount: '原交易数量',
    actualSent: '实际发送',
    addressRequired: '请输入有效的接收地址',
    amountRequired: '请输入有效的数量',
    tokenAddressRequired: '请输入有效的代币地址',
    dataRequired: '请输入有效的十六进制数据',
    invalidAddress: '地址格式无效（需要 0x 开头的 42 位字符）',
    invalidAmount: '数量必须大于 0',
    invalidData: '数据格式无效（需要 0x 开头的十六进制字符串）',
    enterRecipientAddress: '请输入接收地址',
    enterAmount: '请输入转账金额',
    enterTokenAddress: '请输入代币合约地址',
    enterRecipient: '请输入接收地址',
    enterAmount2: '请输入转账数量',
    enterSpenderAddress: '请输入 spender 地址',
    enterDataField: '请输入 Data 字段',
    addAtLeastOneTransaction: '请先添加至少一笔交易',
    addressFormatError: '接收地址格式错误，应为 0x 开头的42位字符',
    tokenAddressFormatError: '代币合约地址格式错误，应为 0x 开头的42位字符',
    spenderAddressFormatError: 'Spender 地址格式错误，应为 0x 开头的42位字符',
    enterValidAmount: '请输入有效的金额（大于0）',
    enterValidAmount2: '请输入有效的数量（大于0）',
    dataFieldMustStartWith0x: 'Data 字段必须以 0x 开头',
    // 新增的文本
    switchChainFailed: '切换链失败',
    validateAddressFormat: '验证地址格式',
    validateAmount: '验证金额',
    validateQuantity: '验证数量',
    calculateAmountWithDecimals: '计算带小数位的数量，使用更精确的方式',
    useStringToAvoidPrecision: '使用字符串避免浮点精度问题',
    convertToBigIntToAvoidPrecision: '转换为 BigInt 避免精度损失',
    generateTransferData: '生成 transfer(address to, uint256 amount) 的 data',
    functionSelector: '函数选择器',
    erc20TransferValueMustBeZero: 'ERC20 转账 value 必须为 0',
    erc20ApproveValueMustBeZero: 'ERC20 授权 value 必须为 0',
    unlimitedApproval: '无限授权',
    hasInputAmount: '有输入数量，计算带小数位的数量，使用精确方式',
    clearForm: '清空表单',
    onlyUseCustomConfig: '只使用自定义配置',
    eip7702MaxSupport: 'EIP-7702 最多支持10笔交易，自动截取前10笔',
    batchTransactionCount: '批量交易数量为',
    automaticallyTruncated: '笔，已自动截取前',
    remainingUnprocessed: '笔执行。剩余',
    unprocessed: '笔未处理。',
    originalTransactionCount: '原交易数量',
    actuallySent: '实际发送',
    networkSwitchedMessage: '网络已切换',
    hideNetworkSwitchMessage: '3秒后隐藏网络切换提示',
    clickOutsideToClose: '点击外部关闭下拉菜单',
    switchChainFailedMessage: '切换链失败',
    detectMetaMaskAvailable: '检测 MetaMask 是否可用',
    listenToChainChanges: '监听链变化',
    chainChanged: '链发生了变化',
    consoleLogNetworkSwitch: '网络已切换',
    hideNetworkSwitchAfter3Seconds: '3秒后隐藏网络切换提示',
    clickOutsideToCloseDropdown: '点击外部关闭下拉菜单',
    consoleErrorSwitchChainFailed: '切换链失败',
    manualTransactionConfig: '手动输入交易配置',
    erc20TransferAndApproveFields: 'ERC20 转账和授权专用字段',
    default18Decimals: '默认18位小数',
    detectMetaMaskAvailability: '检测 MetaMask 是否可用',
    consoleLogNetworkSwitched: '网络已切换',
    hideNetworkSwitchMessageAfter3Seconds: '3秒后隐藏网络切换提示',
    clickOutsideToCloseDropdownMenu: '点击外部关闭下拉菜单',
    // 新增的UI文本
    topNavigationBar: '顶部导航栏',
    rightButtonGroup: '右侧按钮组',
    languageSwitchButton: '语言切换按钮',
    chainSelectionDropdown: '链选择下拉菜单',
    dropdownMenuTrigger: '下拉菜单触发器',
    dropdownMenuOptions: '下拉菜单选项',
    walletConnectionButton: '钱包连接按钮',
    mainContentArea: '主要内容区域',
    metamaskErrorPrompt: 'MetaMask 错误提示',
    cannotConnectToMetamask: '无法连接到 MetaMask',
    metamaskNotInstalled: 'MetaMask 未安装或未启用。请先安装 MetaMask 扩展。',
    connectionFailed: '连接失败',
    unknownError: '未知错误',
    cannotConnectToMetamaskWithError: '无法连接到MetaMask',
    pleaseInstallMetamaskFirst: '请先安装 MetaMask 扩展',
    // Header/status and network info
    connectedTo: '已连接到',
    networkInfoTitle: '网络信息',
    networkChangedPrompt: '网络已切换',
    currentChainLabel: '当前链',
    unknownChain: '未知链',
    chainIdLabel: '链ID',
    addressLabel: '地址',
    copyAddress: '复制地址',
    addressCopied: '已复制',
    // Form labels and helpers
    transferAmountLabel: '转账数量',
    decimalsSuffix: '位小数',
    autoFillDecimalsTip: '系统会自动补充小数位，例如输入 1 表示 1 个完整代币',
    spenderAddressLabel: 'Spender 地址',
    approvalAmountLabel: '授权数量',
    unlimitedApprovalPlaceholder: '留空表示无限授权',
    unlimitedApprovalNote: '留空将设置为无限授权 (max uint256)',
    amountEthLabel: '金额',
    dataFieldLabel: 'Data 字段',
    clearList: '清空列表',
    batchTransactionsTitle: '执行原子批量交易',
    // 分享功能
    share: '分享',
    tweet: '推文',
    copy: '复制',
    tweetTitle: '【批量调用器】',
    tweetText: '基于Metamask智能账户，让批量交易更安全、更便捷、更高效、更节省Gas费！',
    shareTitle: '批量调用器',
    gasFeeReminder: '请确保该钱包中保留有足够的 {currency} 用于支付Gas费。如果 {currency} 不足，交易将失败！',
    // ERC721 and ERC1155 related texts
    nftContractAddress: 'NFT 合约地址',
    tokenId: 'Token ID',
    enterTokenId: '请输入 Token ID',
    enterNftContractAddress: '请输入 NFT 合约地址',
    nftContractAddressFormatError: 'NFT 合约地址格式错误，应为 0x 开头的42位字符',
    tokenIdRequired: '请输入有效的 Token ID',
    invalidTokenId: 'Token ID 必须大于等于 0',
    transferAmount: '转账数量',
    enterTransferAmount: '请输入转账数量',
    enterValidTransferAmount: '请输入有效的转账数量（大于0）',
  },
  en: {
    title: 'Batch Caller',
    subtitle: 'Powered by Metamask Smart Accounts, making batch transactions safer, easier, more efficient and more gas-saving!',
    connectWallet: 'ConnectWallet',
    disconnect: 'Disconnect',
    switchNetwork: 'Switch Network',
    configureTransactions: 'Configure Batch Transactions',
    addTransaction: 'Add Transaction',
    transactionType: 'Transaction Type',
    nativeTransfer: 'Native token Transfer',
    erc20Transfer: 'ERC20 Transfer',
    erc20Approve: 'ERC20 Approve',
    erc721Transfer: 'ERC721 Transfer',
    erc1155Transfer: 'ERC1155 Transfer',
    customTransaction: 'Custom Transaction',
    recipient: 'Recipient Address',
    amount: 'Amount',
    tokenAddress: 'Token Address',
    data: 'Data',
    add: 'Add',
    transactionList: '☰ Build Transaction List',
    noTransactions: 'No transactions',
    sendBatchTransaction: 'Send Batch Transaction',
    sendBatchTransactionWithGas: 'Send Batch Transaction',
    sendingTransaction: 'Sending Transaction...',
    transactionSubmitted: 'Transaction submitted successfully!',
    transactionConfirmed: '✅ Transaction Confirmed! 🎉',
    checkStatus: '🔍️ Check Transaction Status',
    checkingStatus: 'Checking Status...',
    transactionHash: 'Transaction Hash',
    status: 'Status',
    viewOnExplorer: 'View on Explorer',
    error: 'Error',
    success: 'Success',
    pending: 'Pending',
    failed: 'Failed',
    gasLimitExceeded: 'Gas Limit Exceeded',
    gasLimitExceededDesc: 'This transaction may contain some special token contracts, causing the gas required for this batch transaction to be unusually high. Please remove those transactions and retry (or split into smaller batches).',
    smartAccountError: 'Need to disable smart account feature',
    smartAccountErrorDesc: 'Detected that the account has been upgraded to an unsupported contract version. Please follow these steps:',
    solutionSteps: 'Solution Steps:',
    openMetaMask: 'Open MetaMask wallet',
    clickAccountIcon: 'Click the "☰" in the top right corner',
    selectAccountDetails: 'Tap "Open full screen"',
    findSmartAccount: 'Select "Account Details" → set up "Smart Account"',
    clickDisableSmartAccount: 'Close the smart account related to the chain (requires gas fee)',
    returnAndRetry: 'Return to this page and retry batch calls',
    smartAccountTip: 'Tip: Your account will be automatically upgraded to a MetaMask Smart Account and will be able to perform batch transactions.',
    addTransactionFirst: 'Please add transactions first',
    addTransactionFirstDesc: 'Add at least one transaction in the "Configure Batch Transactions" area above before executing batch operations',
    checkDataField: 'Please check the data field: should be 138 characters (including 0x prefix)',
    transactionCount: 'transactions',
    showFirst: 'Show first',
    originalCount: 'Original count',
    actualSent: 'Actually sent',
    addressRequired: 'Please enter a valid recipient address',
    amountRequired: 'Please enter a valid amount',
    tokenAddressRequired: 'Please enter a valid token address',
    dataRequired: 'Please enter valid hexadecimal data',
    invalidAddress: 'Invalid address format (needs 0x prefix and 42 characters)',
    invalidAmount: 'Amount must be greater than 0',
    invalidData: 'Invalid data format (needs 0x prefix hexadecimal string)',
    enterRecipientAddress: 'Please enter recipient address',
    enterAmount: 'Please enter amount',
    enterTokenAddress: 'Please enter token contract address',
    enterRecipient: 'Please enter recipient address',
    enterAmount2: 'Please enter amount',
    enterSpenderAddress: 'Please enter spender address',
    enterDataField: 'Please enter Data field',
    addAtLeastOneTransaction: 'Please add at least one transaction',
    addressFormatError: 'Recipient address format error, should be 0x prefix with 42 characters',
    tokenAddressFormatError: 'Token contract address format error, should be 0x prefix with 42 characters',
    spenderAddressFormatError: 'Spender address format error, should be 0x prefix with 42 characters',
    enterValidAmount: 'Please enter valid amount (greater than 0)',
    enterValidAmount2: 'Please enter valid amount (greater than 0)',
    dataFieldMustStartWith0x: 'Data field must start with 0x',
    // 新增的文本
    switchChainFailed: 'Failed to switch chain',
    validateAddressFormat: 'Validate address format',
    validateAmount: 'Validate amount',
    validateQuantity: 'Validate quantity',
    calculateAmountWithDecimals: 'Calculate amount with decimals using more precise method',
    useStringToAvoidPrecision: 'Use string to avoid floating point precision issues',
    convertToBigIntToAvoidPrecision: 'Convert to BigInt to avoid precision loss',
    generateTransferData: 'Generate transfer(address to, uint256 amount) data',
    functionSelector: 'Function selector',
    erc20TransferValueMustBeZero: 'ERC20 transfer value must be 0',
    erc20ApproveValueMustBeZero: 'ERC20 approve value must be 0',
    unlimitedApproval: 'Unlimited approval',
    hasInputAmount: 'Has input amount, calculate amount with decimals using precise method',
    clearForm: 'Clear form',
    onlyUseCustomConfig: 'Only use custom configuration',
    eip7702MaxSupport: 'EIP-7702 supports maximum 10 transactions, automatically truncate first 10',
    batchTransactionCount: 'Batch transaction count is',
    automaticallyTruncated: 'transactions, automatically truncated first',
    remainingUnprocessed: 'transactions executed. Remaining',
    unprocessed: 'transactions unprocessed.',
    originalTransactionCount: 'Original transaction count',
    actuallySent: 'Actually sent',
    networkSwitchedMessage: 'Network switched',
    hideNetworkSwitchMessage: 'Hide network switch message after 3 seconds',
    clickOutsideToClose: 'Click outside to close dropdown menu',
    switchChainFailedMessage: 'Failed to switch chain',
    detectMetaMaskAvailable: 'Detect if MetaMask is available',
    listenToChainChanges: 'Listen to chain changes',
    chainChanged: 'Chain has changed',
    consoleLogNetworkSwitch: 'Network switched',
    hideNetworkSwitchAfter3Seconds: 'Hide network switch message after 3 seconds',
    clickOutsideToCloseDropdown: 'Click outside to close dropdown menu',
    consoleErrorSwitchChainFailed: 'Failed to switch chain',
    manualTransactionConfig: 'Manual transaction configuration',
    erc20TransferAndApproveFields: 'ERC20 transfer and approve specific fields',
    default18Decimals: 'Default 18 decimals',
    detectMetaMaskAvailability: 'Detect MetaMask availability',
    consoleLogNetworkSwitched: 'Network switched',
    hideNetworkSwitchMessageAfter3Seconds: 'Hide network switch message after 3 seconds',
    clickOutsideToCloseDropdownMenu: 'Click outside to close dropdown menu',
    // 新增的UI文本
    topNavigationBar: 'Top navigation bar',
    rightButtonGroup: 'Right button group',
    languageSwitchButton: 'Language switch button',
    chainSelectionDropdown: 'Chain selection dropdown',
    dropdownMenuTrigger: 'Dropdown menu trigger',
    dropdownMenuOptions: 'Dropdown menu options',
    walletConnectionButton: 'Wallet connection button',
    mainContentArea: 'Main content area',
    metamaskErrorPrompt: 'MetaMask error prompt',
    cannotConnectToMetamask: 'Cannot connect to MetaMask',
    metamaskNotInstalled: 'MetaMask not installed or not enabled. Please install MetaMask extension first.',
    connectionFailed: 'Connection failed',
    unknownError: 'Unknown error',
    cannotConnectToMetamaskWithError: 'Cannot connect to MetaMask',
    pleaseInstallMetamaskFirst: 'Please install MetaMask extension first',
    // Header/status and network info
    connectedTo: 'Connected to',
    networkInfoTitle: 'Network Info',
    networkChangedPrompt: 'Network switched',
    currentChainLabel: 'Current chain',
    unknownChain: 'Unknown chain',
    chainIdLabel: 'Chain ID',
    addressLabel: 'Address',
    copyAddress: 'Copy address',
    addressCopied: 'Copied',
    // Form labels and helpers
    transferAmountLabel: 'Transfer amount',
    decimalsSuffix: ' decimals',
    autoFillDecimalsTip: 'Decimals will be auto-filled, e.g. 1 means 1 whole token',
    spenderAddressLabel: 'Spender address',
    approvalAmountLabel: 'Approval amount',
    unlimitedApprovalPlaceholder: 'Leave empty for unlimited approval',
    unlimitedApprovalNote: 'Empty means unlimited approval (max uint256)',
    amountEthLabel: 'Amount',
    dataFieldLabel: 'Data field',
    clearList: 'Clear list',
    batchTransactionsTitle: 'Execute atomic batch transactions',
    // 分享功能
    share: 'Share',
    tweet: 'Tweet',
    copy: 'Copy',
    tweetTitle: '【Batch Caller】',
    tweetText: 'Powered by Metamask Smart Account (EIP-7702), making batch transactions safer, easier, more efficient and more gas-saving!',
    shareTitle: 'Batch Caller',
    gasFeeReminder: 'Please ensure your wallet keep enough {currency} to pay for gas fees. If {currency} is insufficient, the transaction will fail!',
    // ERC721 and ERC1155 related texts
    nftContractAddress: 'NFT Contract Address',
    tokenId: 'Token ID',
    enterTokenId: 'Please enter Token ID',
    enterNftContractAddress: 'Please enter NFT contract address',
    nftContractAddressFormatError: 'NFT contract address format error, should be 42 characters starting with 0x',
    tokenIdRequired: 'Please enter a valid Token ID',
    invalidTokenId: 'Token ID must be greater than or equal to 0',
    transferAmount: 'Transfer Amount',
    enterTransferAmount: 'Please enter transfer amount',
    enterValidTransferAmount: 'Please enter a valid transfer amount (greater than 0)',
  }
};

// Get native currency name based on chain ID
function getNativeCurrencyName(chainId: number | undefined): string {
  if (!chainId) return 'ETH';
  switch (chainId) {
    case 56: // BNB Chain
      return 'BNB';
    case 137: // Polygon
      return 'POL';
    case 143: // Monad
      return 'MON';
    default:
      return 'ETH';
  }
}

// Get token standard name based on chain ID (ERC20 or BEP20)
function getTokenStandardName(chainId: number | undefined): string {
  if (chainId === 56) { // BNB Chain
    return 'BEP20';
  }
  return 'ERC20';
}

// 检测是否为移动设备
function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

// 检测是否在 MetaMask 应用内浏览器
function isInMetaMaskBrowser(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window.ethereum?.isMetaMask && window.ethereum?.isMetaMask);
}

export default function Home() {
  const { connect, error: connectError } = useConnect();
  const { disconnect } = useDisconnect();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { sendCalls, error, isPending, isSuccess, data, reset } = useSendCalls();
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [networkChanged, setNetworkChanged] = useState(false);
  const [previousChainId, setPreviousChainId] = useState<number | null>(null);
  const [language, setLanguage] = useState<Language>('en');
  const [isChainDropdownOpen, setIsChainDropdownOpen] = useState(false);
  const chainDropdownRef = useRef<HTMLDivElement>(null);
  const [isTransactionTypeDropdownOpen, setIsTransactionTypeDropdownOpen] = useState(false);
  const transactionTypeDropdownRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isInMetaMask, setIsInMetaMask] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [addressCopied, setAddressCopied] = useState(false);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showFlowModal, setShowFlowModal] = useState(false);
  const t = texts[language];
  
  // Get token transfer text based on chain ID
  const getTokenTransferText = () => {
    const tokenStandard = getTokenStandardName(chainId);
    if (language === 'zh') {
      return `${tokenStandard} 转账`;
    }
    return `${tokenStandard} Transfer`;
  };
  
  // Get token approve text based on chain ID
  const getTokenApproveText = () => {
    const tokenStandard = getTokenStandardName(chainId);
    if (language === 'zh') {
      return `${tokenStandard} 授权`;
    }
    return `${tokenStandard} Approve`;
  };
  
  // 分享功能
  const handleShare = async () => {
    const url = window.location.href;
    const title = t.shareTitle;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          url: url,
        });
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.log('Share cancelled or failed:', err);
        }
      }
    } else {
      // 降级到复制链接
      handleCopy();
    }
  };

  const handleTweet = () => {
    const url = window.location.href;
    const title = t.tweetTitle;
    const text = t.tweetText;
    const tweetContent = `${title}\n${text}`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetContent)}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCopyAddress = async (address: string) => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(address);
        // 显示已复制提示
        setAddressCopied(true);
        // 2秒后恢复原始状态
        setTimeout(() => {
          setAddressCopied(false);
        }, 2000);
      }
    } catch (err) {
      console.error('Copy address failed:', err);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      // 可以添加一个简单的提示
      if (process.env.NODE_ENV === 'development') {
        console.log('Link copied to clipboard');
      }
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };
  
  // Manual transaction configuration
  const [customTransactions, setCustomTransactions] = useState<Transaction[]>([]);
  const [customTo, setCustomTo] = useState('');
  const [customValue, setCustomValue] = useState('');
  const [customData, setCustomData] = useState('');
  const [selectedTransactionType, setSelectedTransactionType] = useState<'native' | 'erc20_transfer' | 'erc20_approve' | 'erc721_transfer' | 'erc1155_transfer' | 'custom'>('native');
  
  // ERC20 transfer and approve specific fields
  const [erc20TokenAddress, setErc20TokenAddress] = useState('');
  const [erc20Amount, setErc20Amount] = useState('');
  const [erc20Recipient, setErc20Recipient] = useState('');
  const [erc20Decimals, setErc20Decimals] = useState(18); // Default 18 decimals
  const [erc20Spender, setErc20Spender] = useState('');
  
  // ERC721 and ERC1155 specific fields
  const [erc721ContractAddress, setErc721ContractAddress] = useState('');
  const [erc721TokenId, setErc721TokenId] = useState('');
  const [erc721Recipient, setErc721Recipient] = useState('');
  const [erc1155ContractAddress, setErc1155ContractAddress] = useState('');
  const [erc1155TokenId, setErc1155TokenId] = useState('');
  const [erc1155Recipient, setErc1155Recipient] = useState('');
  const [erc1155Amount, setErc1155Amount] = useState('');
  
  // Track if component is mounted on client to prevent hydration errors
  const [isMounted, setIsMounted] = useState(false);
  
  // 检测设备类型
  useEffect(() => {
    setIsMounted(true);
    setIsMobile(isMobileDevice());
    setIsInMetaMask(isInMetaMaskBrowser());
  }, []);

  // 监听连接状态变化
  useEffect(() => {
    if (isConnected) {
      setConnecting(false);
      setStatusError(null);
      // 清除连接超时
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }
      if (process.env.NODE_ENV === 'development') {
        console.log('Connection status updated: connected');
      }
    }
  }, [isConnected]);

  // 监听连接错误
  useEffect(() => {
    if (connectError && connecting && !isConnected) {
      setStatusError(
        language === 'zh'
          ? `连接失败: ${connectError.message}。如果从 MetaMask 返回后未连接，请重试。`
          : `Connection failed: ${connectError.message}. If not connected after returning from MetaMask, please try again.`
      );
      setConnecting(false);
    }
  }, [connectError, connecting, isConnected, language]);

  // 监听页面可见性变化，当页面重新获得焦点时检查连接状态
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isConnected && connecting) {
        // 页面重新可见且之前正在连接，检查是否已连接
        setTimeout(() => {
          if (window.ethereum?.selectedAddress) {
            // 检测到地址，尝试重新连接
            if (process.env.NODE_ENV === 'development') {
              console.log('Page regained focus with address detected, attempting to reconnect...');
            }
            if (!isConnected) {
              // 如果 wagmi 还未连接，尝试重新连接
              try {
                connect({ connector: metaMask() });
              } catch (error) {
                console.error('Reconnection error:', error);
                setConnecting(false);
              }
            } else {
              setConnecting(false);
            }
          } else {
            setConnecting(false);
          }
        }, 1500); // 给 MetaMask 一些时间初始化
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [isConnected, connecting, connect]);

  // 统一的重置函数：重置所有数据
  const resetAllData = useCallback(() => {
    console.log('🔄 Resetting all data');
    // 重置交易相关状态
    setCustomTransactions([]);
    setTransactionHash(null);
    setStatusError(null);
    setStatusLoading(false);
    
    // 重置表单字段
    setCustomTo('');
    setCustomValue('');
    setCustomData('');
    setErc20TokenAddress('');
    setErc20Amount('');
    setErc20Recipient('');
    setErc20Spender('');
    
    // 重置 wagmi 交易状态
    reset();
  }, [reset]);

  // 监听连接状态变化，断开连接时重置所有数据
  useEffect(() => {
    if (!isConnected) {
      // 钱包已断开连接，重置所有数据
      console.log('🔌 Wallet disconnected, resetting all data');
      resetAllData();
    }
  }, [isConnected, resetAllData]);

  // Listen to chain changes
  useEffect(() => {
    if (chainId && previousChainId && chainId !== previousChainId) {
      // Chain has changed
      console.log('🔄 Network switched', { from: previousChainId, to: chainId });
      setNetworkChanged(true);
      // Hide network switch message after 3 seconds
      setTimeout(() => setNetworkChanged(false), 3000);
      // 重置所有数据
      resetAllData();
    }
    setPreviousChainId(chainId);
  }, [chainId, previousChainId, resetAllData]);

  const handleSwitchChain = async (targetChainId: number) => {
    try {
      await switchChain({ chainId: targetChainId });
      setIsChainDropdownOpen(false);
    } catch (error) {
      console.error(t.consoleErrorSwitchChainFailed, error);
    }
  };

  // Click outside to close dropdown menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (chainDropdownRef.current && !chainDropdownRef.current.contains(event.target as Node)) {
        setIsChainDropdownOpen(false);
      }
      if (transactionTypeDropdownRef.current && !transactionTypeDropdownRef.current.contains(event.target as Node)) {
        setIsTransactionTypeDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 处理钱包连接
  const handleConnectWallet = async () => {
    try {
      setConnecting(true);
      setStatusError(null);
      
      // 移动端特殊处理
      if (isMobile && !isInMetaMask) {
        // 不在 MetaMask 应用内浏览器，提示用户
        setStatusError(
          language === 'zh' 
            ? '请在 MetaMask 应用的浏览器中打开此页面后再连接'
            : 'Please open this page in MetaMask app browser first'
        );
        setConnecting(false);
        return;
      }
      
      connect({ connector: metaMask() });
      
      // 清除之前的超时
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
      }
      
      // 设置超时，如果连接失败
      connectionTimeoutRef.current = setTimeout(() => {
        if (!isConnected) {
          setConnecting(false);
          // 如果在移动端且检测到 ethereum 地址，提示用户可能需要在应用内浏览器中打开
          if (isMobile && window.ethereum?.selectedAddress) {
            setStatusError(
              language === 'zh'
                ? '检测到钱包地址但未完成连接。请确保在 MetaMask 应用内浏览器中打开此页面，然后重试。'
                : 'Wallet address detected but connection incomplete. Please ensure you are in MetaMask in-app browser, then retry.'
            );
          } else {
            setStatusError(
              language === 'zh'
                ? '连接超时。如果从 MetaMask 返回后未连接，请重试。'
                : 'Connection timeout. If not connected after returning from MetaMask, please retry.'
            );
          }
        }
      }, 15000);
    } catch (error: unknown) {
      console.error('Wallet connection error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setStatusError(
        language === 'zh'
          ? `连接异常: ${errorMessage}`
          : `Connection error: ${errorMessage}`
      );
      setConnecting(false);
    }
  };

  const handleAddCustomTransaction = () => {
    let toAddress = '';
    let value = '0';
    let data = undefined;
    
    if (selectedTransactionType === 'native') {
      // Native token transfer
      if (!customTo) {
        alert(t.enterRecipientAddress);
        return;
      }
      if (!customValue) {
        alert(t.enterAmount2);
        return;
      }
      
      // Validate address format
      if (!customTo.startsWith('0x') || customTo.length !== 42) {
        alert(t.addressFormatError);
        return;
      }
      
      // Validate amount
      if (parseFloat(customValue) <= 0 || isNaN(parseFloat(customValue))) {
        alert(t.enterValidAmount);
        return;
      }
      
      // Use actual recipient for all chains
      toAddress = customTo;
      value = customValue;
      data = '0x'; // Native transfer doesn't need data
    } else if (selectedTransactionType === 'erc20_transfer') {
      // ERC20 transfer
      if (!erc20TokenAddress) {
        alert(t.enterTokenAddress);
        return;
      }
      if (!erc20Recipient) {
        alert(t.enterRecipientAddress);
        return;
      }
      if (!erc20Amount) {
        alert(t.enterAmount2);
        return;
      }
      
      // Validate address format
      if (!erc20TokenAddress.startsWith('0x') || erc20TokenAddress.length !== 42) {
        alert(t.tokenAddressFormatError);
        return;
      }
      if (!erc20Recipient.startsWith('0x') || erc20Recipient.length !== 42) {
        alert(t.addressFormatError);
        return;
      }
      
      // Validate quantity
      if (parseFloat(erc20Amount) <= 0 || isNaN(parseFloat(erc20Amount))) {
        alert(t.enterValidAmount2);
        return;
      }
      
      // Calculate amount with decimals using more precise method
      const amount = parseFloat(erc20Amount);
      // Use string to avoid floating point precision issues
      const amountStr = amount.toString();
      const [integerPart, decimalPart = ''] = amountStr.split('.');
      
      // Convert to BigInt to avoid precision loss
      const integer = BigInt(integerPart) * BigInt(10 ** erc20Decimals);
      const decimal = BigInt((decimalPart.padEnd(erc20Decimals, '0').substring(0, erc20Decimals)));
      const amountWithDecimals = integer + decimal;
      
      const amountHex = '0x' + amountWithDecimals.toString(16).padStart(64, '0');
      
      // Generate transfer(address to, uint256 amount) data
      // Function selector: transfer(address,uint256) = 0xa9059cbb
      // Use actual recipient for all chains
      const recipientAddress = erc20Recipient;
      const recipientPadded = recipientAddress.slice(2).padStart(64, '0');
      data = '0xa9059cbb' + recipientPadded + amountHex.slice(2);
      
      toAddress = erc20TokenAddress;
      value = '0'; // ERC20 transfer value must be 0
    } else if (selectedTransactionType === 'erc20_approve') {
      // ERC20 approve
      if (!erc20TokenAddress) {
        alert(t.enterTokenAddress);
        return;
      }
      if (!erc20Spender) {
        alert(t.enterSpenderAddress);
        return;
      }
      
      // Validate address format
      if (!erc20TokenAddress.startsWith('0x') || erc20TokenAddress.length !== 42) {
        alert(t.tokenAddressFormatError);
        return;
      }
      if (!erc20Spender.startsWith('0x') || erc20Spender.length !== 42) {
        alert(t.spenderAddressFormatError);
        return;
      }
      
      // approve(address spender, uint256 amount)
      // Function selector: approve(address,uint256) = 0x095ea7b3
      let amountHex = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'; // Unlimited approval
      
      if (erc20Amount) {
        // Has input amount, calculate amount with decimals using precise method
        const amount = parseFloat(erc20Amount);
        const amountStr = amount.toString();
        const [integerPart, decimalPart = ''] = amountStr.split('.');
        
        // Convert to BigInt to avoid precision loss
        const integer = BigInt(integerPart) * BigInt(10 ** erc20Decimals);
        const decimal = BigInt((decimalPart.padEnd(erc20Decimals, '0').substring(0, erc20Decimals)));
        const amountWithDecimals = integer + decimal;
        
        amountHex = '0x' + amountWithDecimals.toString(16).padStart(64, '0');
      }
      
      // Use actual spender for all chains
      const spenderAddress = erc20Spender;
      const spenderPadded = spenderAddress.slice(2).padStart(64, '0');
      data = '0x095ea7b3' + spenderPadded + amountHex.slice(2);
      
      toAddress = erc20TokenAddress;
      value = '0'; // ERC20 approve value must be 0
    } else if (selectedTransactionType === 'erc721_transfer') {
      // ERC721 transfer
      if (!erc721ContractAddress) {
        alert(t.enterNftContractAddress);
        return;
      }
      if (!erc721Recipient) {
        alert(t.enterRecipientAddress);
        return;
      }
      if (!erc721TokenId) {
        alert(t.enterTokenId);
        return;
      }
      
      // Validate address format
      if (!erc721ContractAddress.startsWith('0x') || erc721ContractAddress.length !== 42) {
        alert(t.nftContractAddressFormatError);
        return;
      }
      if (!erc721Recipient.startsWith('0x') || erc721Recipient.length !== 42) {
        alert(t.addressFormatError);
        return;
      }
      
      // Validate token ID
      const tokenIdNum = parseInt(erc721TokenId);
      if (isNaN(tokenIdNum) || tokenIdNum < 0) {
        alert(t.invalidTokenId);
        return;
      }
      
      // safeTransferFrom(address from, address to, uint256 tokenId)
      // Function selector: safeTransferFrom(address,address,uint256) = 0x42842e0e
      // Use actual recipient for all chains
      const recipientAddress = erc721Recipient;
      const fromAddress = address || '0x0000000000000000000000000000000000000000';
      const fromPadded = fromAddress.slice(2).padStart(64, '0');
      const recipientPadded = recipientAddress.slice(2).padStart(64, '0');
      const tokenIdHex = '0x' + BigInt(tokenIdNum).toString(16).padStart(64, '0');
      data = '0x42842e0e' + fromPadded + recipientPadded + tokenIdHex.slice(2);
      
      toAddress = erc721ContractAddress;
      value = '0'; // ERC721 transfer value must be 0
    } else if (selectedTransactionType === 'erc1155_transfer') {
      // ERC1155 transfer
      if (!erc1155ContractAddress) {
        alert(t.enterNftContractAddress);
        return;
      }
      if (!erc1155Recipient) {
        alert(t.enterRecipientAddress);
        return;
      }
      if (!erc1155TokenId) {
        alert(t.enterTokenId);
        return;
      }
      if (!erc1155Amount) {
        alert(t.enterTransferAmount);
        return;
      }
      
      // Validate address format
      if (!erc1155ContractAddress.startsWith('0x') || erc1155ContractAddress.length !== 42) {
        alert(t.nftContractAddressFormatError);
        return;
      }
      if (!erc1155Recipient.startsWith('0x') || erc1155Recipient.length !== 42) {
        alert(t.addressFormatError);
        return;
      }
      
      // Validate token ID and amount
      const tokenIdNum = parseInt(erc1155TokenId);
      if (isNaN(tokenIdNum) || tokenIdNum < 0) {
        alert(t.invalidTokenId);
        return;
      }
      const amountNum = parseInt(erc1155Amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        alert(t.enterValidTransferAmount);
        return;
      }
      
      // safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes data)
      // Function selector: safeTransferFrom(address,address,uint256,uint256,bytes) = 0xf242432a
      // Use actual recipient for all chains
      const recipientAddress = erc1155Recipient;
      const fromAddress = address || '0x0000000000000000000000000000000000000000';
      const fromPadded = fromAddress.slice(2).padStart(64, '0');
      const recipientPadded = recipientAddress.slice(2).padStart(64, '0');
      const tokenIdHex = '0x' + BigInt(tokenIdNum).toString(16).padStart(64, '0');
      const amountHex = '0x' + BigInt(amountNum).toString(16).padStart(64, '0');
      // bytes data is empty (0x), so we need to encode it as offset + length
      // offset to data: 0xa0 (160 in decimal, which is 5 * 32 bytes for the first 4 params)
      // length of data: 0x00 (0, because data is empty)
      const dataOffset = '0x00000000000000000000000000000000000000000000000000000000000000a0';
      const dataLength = '0x0000000000000000000000000000000000000000000000000000000000000000';
      data = '0xf242432a' + fromPadded + recipientPadded + tokenIdHex.slice(2) + amountHex.slice(2) + dataOffset.slice(2) + dataLength.slice(2);
      
      toAddress = erc1155ContractAddress;
      value = '0'; // ERC1155 transfer value must be 0
    } else if (selectedTransactionType === 'custom') {
      // Custom transaction
      if (!customTo) {
        alert(t.enterRecipientAddress);
        return;
      }
      if (!customData) {
        alert(t.enterDataField);
        return;
      }
      
      // Validate address format
      if (!customTo.startsWith('0x') || customTo.length !== 42) {
        alert(t.addressFormatError);
        return;
      }
      
      // Validate data format
      if (!customData.startsWith('0x')) {
        alert(t.dataFieldMustStartWith0x);
        return;
      }
      
      toAddress = customTo;
      value = customValue || '0';
      data = customData;
    }
    
    const transaction: Transaction = {
      type: selectedTransactionType === 'native' ? 'native_transfer' :
            selectedTransactionType === 'erc20_transfer' ? 'erc20_transfer' :
            selectedTransactionType === 'erc20_approve' ? 'erc20_approve' :
            selectedTransactionType === 'erc721_transfer' ? 'erc721_transfer' :
            selectedTransactionType === 'erc1155_transfer' ? 'erc1155_transfer' : 'custom_data',
      to: toAddress,
      value: value,
      data: data || '0x' // Ensure data is always a string
    };
    
    setCustomTransactions([...customTransactions, transaction]);
    
    // Clear form
    setCustomTo('');
    setCustomValue('');
    setCustomData('');
    setErc20TokenAddress('');
    setErc20Amount('');
    setErc20Recipient('');
    setErc20Spender('');
    setErc721ContractAddress('');
    setErc721TokenId('');
    setErc721Recipient('');
    setErc1155ContractAddress('');
    setErc1155TokenId('');
    setErc1155Recipient('');
    setErc1155Amount('');
  };

  const handleRemoveTransaction = (index: number) => {
    setCustomTransactions(customTransactions.filter((_, i) => i !== index));
  };

  const handleClearCustomTransactions = () => {
    setCustomTransactions([]);
  };


  const handleSendTransaction = () => {
    if (!isConnected || !address) return;

    // Reset previous states
    setTransactionHash(null);
    setStatusError(null);
    reset();

    // Only use custom configuration
    if (customTransactions.length === 0) {
        alert(t.addAtLeastOneTransaction);
      return;
    }

    // EIP-7702 supports maximum 10 transactions, automatically truncate first 10
    const MAX_BATCH_SIZE = 10;
    const truncatedTransactions = customTransactions.slice(0, MAX_BATCH_SIZE);
    const wasTruncated = customTransactions.length > MAX_BATCH_SIZE;
    
    if (wasTruncated) {
      setStatusError(`⚠️ ${t.batchTransactionCount} ${customTransactions.length} ${t.transactionCount}，${t.automaticallyTruncated} ${MAX_BATCH_SIZE} ${t.transactionCount}${t.remainingUnprocessed} ${customTransactions.length - MAX_BATCH_SIZE} ${t.transactionCount}${t.unprocessed}`);
    }

    const calls = truncatedTransactions.map(call => ({
      to: call.to as `0x${string}`,
      value: parseEther(call.value),
      ...(call.data && call.data !== '0x' && call.data.length > 2 && { data: call.data as `0x${string}` })
    }));
    
    if (process.env.NODE_ENV === 'development') {
      console.log("Sending batch transaction with calls:", calls);
      console.log(`${t.originalTransactionCount}: ${customTransactions.length}，${t.actuallySent}: ${truncatedTransactions.length}`);
    }

    if (!chainId) {
      console.error("Failed to send batch transaction: missing chain ID");
      setStatusError("当前网络信息缺失，请重新连接钱包后再试。");
      return;
    }

    // Send batch transaction
    sendCalls({
      chainId,
      calls,
    });
  };

  const handleGetCallsStatus = async () => {
    if (!data?.id) return;

    setStatusLoading(true);
    setStatusError(null);

    try {
      const status = await getCallsStatus(config, { id: data.id });
      if (process.env.NODE_ENV === 'development') {
        console.log("Transaction status:", status);
      }

      if (
        status.status === "success" &&
        status.receipts?.[0]?.transactionHash
      ) {
        setTransactionHash(status.receipts[0].transactionHash);
      } else if (status.status === "failure") {
        setStatusError("Transaction failed");
      }
    } catch (err) {
      console.error("Error getting call status:", err);
      setStatusError(
        err instanceof Error ? err.message : "Failed to get transaction status"
      );
    } finally {
      setStatusLoading(false);
    }
  };

  return (
    <div className="font-sans min-h-screen">
      {/* Top navigation bar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            {/* Logo */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <a
                href="https://docs.metamask.io/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-80 transition-opacity flex-shrink-0"
                title="MetaMask Documentation"
              >
                <Image
                  src="/mm.svg"
                  alt="EIP-7702 Logo"
                  width={40}
                  height={40}
                  className="w-8 h-8 sm:w-10 sm:h-10"
                  priority
                />
              </a>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-base sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent truncate">
                    {t.title}
                  </span>
                  {/* 提示按钮 */}
                  <button
                    onClick={() => setShowFlowModal(true)}
                    className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 hover:bg-yellow-400 dark:hover:bg-yellow-500 text-blue-600 dark:text-blue-400 hover:text-yellow-900 dark:hover:text-yellow-900 transition-colors flex-shrink-0"
                    title={language === 'zh' ? '查看操作流程' : 'View operation flow'}
                  >
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                </div>
                <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                  {t.subtitle}
                </span>
              </div>
            </div>
            
            {/* Right button group */}
            <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 flex-shrink-0">
              {/* Language switch button */}
              <button
                onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                title={language === 'zh' ? 'Switch to English' : '切换到中文'}
              >
                <Image
                  src="/language.svg"
                  alt="Language"
                  width={25}
                  height={25}
                  className="w-4 h-4 sm:w-5 sm:h-5"
                />
                <span className="hidden sm:inline">{language === 'zh' ? 'English' : '中文'}</span>
              </button>


              {/* Chain selection dropdown */}
              {isMounted && isConnected && (
                <div className="relative" ref={chainDropdownRef}>
                  {/* Dropdown menu trigger */}
                  <button
                    onClick={() => setIsChainDropdownOpen(!isChainDropdownOpen)}
                    className="flex items-center gap-1 sm:gap-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[100px] sm:min-w-[140px]"
                  >
                    {chainId && (
                      <>
                        {(() => {
                          const currentChain = SUPPORTED_CHAINS.find(chain => chain.id === chainId);
                          if (currentChain?.logo) {
                            return (
                              <Image
                                src={currentChain.logo}
                                alt="Chain Logo"
                                width={16}
                                height={16}
                                className="w-3 h-3 sm:w-4 sm:h-4"
                              />
                            );
                          } else {
                            return (
                              <span className="text-xs sm:text-sm">⛓️</span>
                            );
                          }
                        })()}
                        <span className="hidden sm:inline whitespace-nowrap">{SUPPORTED_CHAINS.find(chain => chain.id === chainId)?.name}</span>
                        <span className="sm:hidden text-[10px]">{SUPPORTED_CHAINS.find(chain => chain.id === chainId)?.name.slice(0, 3)}</span>
                      </>
                    )}
                    <svg
                      className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform ${isChainDropdownOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown menu options */}
                  {isChainDropdownOpen && (
                    <div className="absolute top-full right-0 sm:left-0 mt-1 w-auto min-w-fit sm:w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50 max-h-[300px] overflow-y-auto">
                      {SUPPORTED_CHAINS.map((chain) => (
                        <button
                          key={chain.id}
                          onClick={() => handleSwitchChain(chain.id)}
                          className={`w-full flex items-center gap-2 sm:gap-3 px-3 py-2 text-xs sm:text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg ${
                            chainId === chain.id ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {chain.logo ? (
                            <Image
                              src={chain.logo}
                              alt={`${chain.name} Logo`}
                              width={16}
                              height={16}
                              className="w-3 h-3 sm:w-4 sm:h-4"
                            />
                          ) : (
                            <span className="text-xs sm:text-sm">⛓️</span>
                          )}
                          <span className="whitespace-nowrap">{chain.name}</span>
                          {chainId === chain.id && (
                            <svg className="w-3 h-3 sm:w-4 sm:h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {/* Wallet connection button */}
              <button
                className={`flex items-center gap-1 sm:gap-2 rounded-lg font-medium text-xs sm:text-sm transition-colors whitespace-nowrap flex-shrink-0 px-2 sm:px-3 py-1.5 sm:py-2 ${
                  isMounted && isConnected
                    ? "bg-red-50 hover:bg-red-100 active:bg-red-200 text-red-700 border border-red-300"
                    : "bg-blue-50 hover:bg-blue-100 active:bg-blue-200 text-blue-700 border border-blue-300"
                }`}
                onClick={() => {
                  if (isConnected) {
                    disconnect();
                    // 断开连接时重置所有数据
                    resetAllData();
                  } else {
                    handleConnectWallet();
                  }
                }}
              >
                <Image
                  src="/MetaMask-icon-fox.svg"
                  alt="MetaMask"
                  width={16}
                  height={16}
                  className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0"
                />
                <span className="truncate">{isMounted && isConnected ? t.disconnect : t.connectWallet}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content area */}
      <main className="pt-16 sm:pt-20 pb-12 sm:pb-20 px-4 sm:px-6 md:px-8 lg:px-20">
        <div className="max-w-4xl mx-auto flex flex-col gap-4 sm:gap-6 md:gap-8">
        {/* 未连接钱包提示 */}
        {isMounted && !isConnected && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-700 rounded-xl p-4 sm:p-6">
            <div className="text-center">
              <div className="mb-4">
                <Image
                  src="/MetaMask-icon-fox.svg"
                  alt="MetaMask"
                  width={64}
                  height={64}
                  className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3"
                />
                <h2 className="text-lg sm:text-xl font-bold text-blue-900 dark:text-blue-100 mb-2">
                  {language === 'zh' ? '未连接钱包' : 'Not Connected'}
                </h2>
                <p className="text-sm sm:text-base text-blue-700 dark:text-blue-300 mb-4">
                  {language === 'zh' ? '请先连接钱包以使用本功能' : 'Please connect your wallet first to use this feature'}
                </p>
                {/* 移动端提示 */}
                {isMobile && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-4">
                    {!isInMetaMask ? (
                      <>
                        <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-200 font-semibold mb-2">
                          {language === 'zh' ? '⚠️ 检测到您不在 MetaMask 应用内浏览器中。请在 MetaMask 应用中打开此页面以确保连接正常。' : '⚠️ Detected you are not in MetaMask in-app browser. Please open this page in MetaMask app to ensure proper connection.'}
                        </p>
                        <p className="text-xs sm:text-sm text-amber-700 dark:text-amber-300">
                          {language === 'zh' ? '移动端连接步骤：1) 打开 MetaMask 应用 2) 点击底部"浏览器"标签 3) 在此浏览器中打开本页面 4) 然后点击连接钱包' : 'Mobile connection steps: 1) Open MetaMask app 2) Tap the "Browser" tab at the bottom 3) Open this page in that browser 4) Then click connect wallet'}
                        </p>
                      </>
                    ) : (
                      <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-200">
                        ✅ {language === 'zh' ? '检测到您在 MetaMask 应用内浏览器中，可以安全连接' : 'Detected you are in MetaMask in-app browser, safe to connect'}
                      </p>
                    )}
                  </div>
                )}
                {connecting && (
                  <div className="mb-4 flex items-center justify-center gap-2 text-blue-600">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm">{language === 'zh' ? '正在连接...' : 'Connecting...'}</span>
                  </div>
                )}
                {statusError && !isConnected && !connecting && (
                  <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-xs sm:text-sm text-red-700 dark:text-red-400 break-words">
                      {statusError}
                    </p>
                    <p className="text-xs text-red-600 dark:text-red-500 mt-2">
                      {language === 'zh' ? '如果返回页面后未连接，请点击下方按钮重新连接' : 'If not connected after returning, please click the button below to reconnect'}
                    </p>
                  </div>
                )}
              </div>
              <button
                className={`w-full sm:w-auto min-w-[200px] min-h-[48px] sm:min-h-[52px] font-semibold text-base sm:text-lg rounded-lg px-6 sm:px-8 py-3 sm:py-3.5 transition-colors shadow-lg hover:shadow-xl flex items-center justify-center gap-3 mx-auto ${
                  connecting || (isMobile && !isInMetaMask)
                    ? 'bg-gray-400 cursor-not-allowed text-white'
                    : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white'
                }`}
                onClick={handleConnectWallet}
                disabled={connecting || (isMobile && !isInMetaMask)}
              >
                <Image
                  src="/MetaMask-icon-fox.svg"
                  alt="MetaMask"
                  width={24}
                  height={24}
                  className="w-6 h-6"
                />
                <span>
                  {connecting 
                    ? (language === 'zh' ? '连接中...' : 'Connecting...')
                    : t.connectWallet
                  }
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Network information section */}
        {isMounted && isConnected && chainId && (
          <div className="bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 rounded-lg w-full">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">🌐 {t.networkInfoTitle}</h2>
            
            {/* 网络切换提示 */}
            {networkChanged && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
                <div className="flex items-center gap-2 text-green-800">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse flex-shrink-0"></div>
                  <span className="font-medium text-sm sm:text-base">{t.networkChangedPrompt}</span>
                </div>
              </div>
            )}

            {/* 链信息显示 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
              <div className="text-xs sm:text-sm text-blue-800 space-y-2">
                <div className="font-medium flex items-center gap-2 break-words">
                  <Image src="/blockchain2.svg" alt="Chain" width={16} height={16} className="w-4 h-4 flex-shrink-0" />
                  <span>{t.currentChainLabel}: {CHAIN_NAMES[chainId as keyof typeof CHAIN_NAMES] || `${t.unknownChain} (${chainId})`}</span>
              </div>
                <div className="flex items-center gap-2">
                  <Image src="/id.svg" alt="Chain ID" width={16} height={16} className="w-4 h-4 flex-shrink-0" />
                  <span>{t.chainIdLabel}: {chainId}</span>
                </div>
                {address && (
                  <div className="flex items-center gap-2 break-words">
                    <Image src="/address.svg" alt="Address" width={16} height={16} className="w-4 h-4 flex-shrink-0" />
                    <span>{t.addressLabel}: {address.slice(0, 6)}...{address.slice(-4)}</span>
                    <div className="relative ml-1">
                      <button
                        onClick={() => handleCopyAddress(address)}
                        className={`relative text-gray-500 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400 transition-all duration-200 ${
                          addressCopied 
                            ? 'text-green-600 dark:text-green-400 scale-110' 
                            : 'hover:scale-105 active:scale-95'
                        }`}
                        title={addressCopied ? (language === 'zh' ? t.addressCopied : t.addressCopied) : (language === 'zh' ? t.copyAddress : t.copyAddress)}
                      >
                        {addressCopied ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                      </button>
                      {/* 已复制提示 */}
                      {addressCopied && (
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-green-600 dark:bg-green-500 text-white text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap z-10 animate-fade-in pointer-events-none">
                          {t.addressCopied}
                          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-green-600 dark:border-t-green-500"></div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Manual transaction configuration section */}
        {isMounted && <>
        <div className="bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 rounded-lg w-full">
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 flex items-center gap-2">
            <Image src="/user-config.svg" alt="Configure" width={24} height={24} className="w-5 h-5 sm:w-6 sm:h-6" />
            {t.configureTransactions}
          </h2>
          <p className="text-xs text-gray-500 mt-[-8px] sm:mt-[-12px] mb-2 sm:mb-3">
            {language === 'zh'
              ? '最多只能添加 10 笔交易，超过部分不会被发送。'
              : 'You can configure up to 10 transactions, any excess will not be sent.'}
          </p>

          {/* 手动输入表单 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4 border border-gray-200 dark:border-gray-700">
            
            {/* 交易类型选择 */}
            <div className="mb-3 sm:mb-4">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                {t.transactionType}
              </label>
              <div className="relative" ref={transactionTypeDropdownRef}>
                {/* Dropdown menu trigger */}
                <button
                  onClick={() => setIsTransactionTypeDropdownOpen(!isTransactionTypeDropdownOpen)}
                  className="w-full flex items-center justify-between gap-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <div className="flex items-center gap-2">
                    {selectedTransactionType === 'native' && (
                      <>
                        <Image src="/ethereum3.svg" alt="Native" width={16} height={16} />
                        <span>{t.nativeTransfer} ({getNativeCurrencyName(chainId)})</span>
                      </>
                    )}
                    {selectedTransactionType === 'erc20_transfer' && (
                      <>
                        <Image src="/coins.svg" alt={getTokenTransferText()} width={16} height={16} />
                        <span>{getTokenTransferText()}</span>
                      </>
                    )}
                    {selectedTransactionType === 'erc20_approve' && (
                      <>
                        <Image src="/permissions.svg" alt={getTokenApproveText()} width={16} height={16} />
                        <span>{getTokenApproveText()}</span>
                      </>
                    )}
                    {selectedTransactionType === 'erc721_transfer' && (
                      <>
                        <Image src="/nft.svg" alt={t.erc721Transfer} width={16} height={16} />
                        <span>{t.erc721Transfer}</span>
                      </>
                    )}
                    {selectedTransactionType === 'erc1155_transfer' && (
                      <>
                        <Image src="/nft.svg" alt={t.erc1155Transfer} width={16} height={16} />
                        <span>{t.erc1155Transfer}</span>
                      </>
                    )}
                    {selectedTransactionType === 'custom' && (
                      <>
                        <Image src="/custom.svg" alt="Custom" width={16} height={16} />
                        <span>{t.customTransaction}</span>
                      </>
                    )}
                  </div>
                  <svg
                    className={`w-4 h-4 transition-transform ${isTransactionTypeDropdownOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown menu options */}
                {isTransactionTypeDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50">
                    <button
                      onClick={() => {
                        setSelectedTransactionType('native');
                        setIsTransactionTypeDropdownOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 first:rounded-t-lg ${
                        selectedTransactionType === 'native' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <Image src="/ethereum3.svg" alt="Native" width={16} height={16} />
                      <span>{t.nativeTransfer} ({getNativeCurrencyName(chainId)})</span>
                      {selectedTransactionType === 'native' && (
                        <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedTransactionType('erc20_transfer');
                        setIsTransactionTypeDropdownOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 ${
                        selectedTransactionType === 'erc20_transfer' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <Image src="/coins.svg" alt={getTokenTransferText()} width={16} height={16} />
                      <span>{getTokenTransferText()}</span>
                      {selectedTransactionType === 'erc20_transfer' && (
                        <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedTransactionType('erc20_approve');
                        setIsTransactionTypeDropdownOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 ${
                        selectedTransactionType === 'erc20_approve' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <Image src="/permissions.svg" alt={getTokenApproveText()} width={16} height={16} />
                      <span>{getTokenApproveText()}</span>
                      {selectedTransactionType === 'erc20_approve' && (
                        <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedTransactionType('erc721_transfer');
                        setIsTransactionTypeDropdownOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 ${
                        selectedTransactionType === 'erc721_transfer' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <Image src="/nft.svg" alt={t.erc721Transfer} width={16} height={16} />
                      <span>{t.erc721Transfer}</span>
                      {selectedTransactionType === 'erc721_transfer' && (
                        <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedTransactionType('erc1155_transfer');
                        setIsTransactionTypeDropdownOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 ${
                        selectedTransactionType === 'erc1155_transfer' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <Image src="/nft.svg" alt={t.erc1155Transfer} width={16} height={16} />
                      <span>{t.erc1155Transfer}</span>
                      {selectedTransactionType === 'erc1155_transfer' && (
                        <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedTransactionType('custom');
                        setIsTransactionTypeDropdownOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 last:rounded-b-lg ${
                        selectedTransactionType === 'custom' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <Image src="/custom.svg" alt="Custom" width={16} height={16} />
                      <span>{t.customTransaction}</span>
                      {selectedTransactionType === 'custom' && (
                        <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2.5 sm:space-y-3">
              {/* 根据交易类型显示不同的输入字段 */}
              {selectedTransactionType === 'native' && (
                <>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t.recipient} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="0x..."
                      value={customTo}
                      onChange={(e) => setCustomTo(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t.amount} ({getNativeCurrencyName(chainId)}) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="0.01"
                      value={customValue}
                      onChange={(e) => setCustomValue(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </>
              )}

              {selectedTransactionType === 'erc20_transfer' && (
                <>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t.tokenAddress} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="0x..."
                      value={erc20TokenAddress}
                      onChange={(e) => setErc20TokenAddress(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t.recipient} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="0x..."
                      value={erc20Recipient}
                      onChange={(e) => setErc20Recipient(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t.transferAmountLabel} <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="100"
                        value={erc20Amount}
                        onChange={(e) => setErc20Amount(e.target.value)}
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                      <select
                        value={erc20Decimals}
                        onChange={(e) => setErc20Decimals(parseInt(e.target.value))}
                        className="px-2 sm:px-3 py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white"
                      >
                        <option value="6">6{t.decimalsSuffix}</option>
                        <option value="8">8{t.decimalsSuffix}</option>
                        <option value="18">18{t.decimalsSuffix}</option>
                      </select>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{t.autoFillDecimalsTip}</p>
                  </div>
                </>
              )}

              {selectedTransactionType === 'erc20_approve' && (
                <>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t.tokenAddress} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="0x..."
                      value={erc20TokenAddress}
                      onChange={(e) => setErc20TokenAddress(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t.spenderAddressLabel} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="0x..."
                      value={erc20Spender}
                      onChange={(e) => setErc20Spender(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t.approvalAmountLabel}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder={t.unlimitedApprovalPlaceholder}
                        value={erc20Amount}
                        onChange={(e) => setErc20Amount(e.target.value)}
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                      <select
                        value={erc20Decimals}
                        onChange={(e) => setErc20Decimals(parseInt(e.target.value))}
                        className="px-2 sm:px-3 py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white"
                      >
                        <option value="6">6{t.decimalsSuffix}</option>
                        <option value="8">8{t.decimalsSuffix}</option>
                        <option value="18">18{t.decimalsSuffix}</option>
                      </select>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{t.unlimitedApprovalNote}</p>
                  </div>
                </>
              )}

              {selectedTransactionType === 'erc721_transfer' && (
                <>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t.nftContractAddress} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="0x..."
                      value={erc721ContractAddress}
                      onChange={(e) => setErc721ContractAddress(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t.recipient} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="0x..."
                      value={erc721Recipient}
                      onChange={(e) => setErc721Recipient(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t.tokenId} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="1"
                      value={erc721TokenId}
                      onChange={(e) => setErc721TokenId(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </>
              )}

              {selectedTransactionType === 'erc1155_transfer' && (
                <>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t.nftContractAddress} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="0x..."
                      value={erc1155ContractAddress}
                      onChange={(e) => setErc1155ContractAddress(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t.recipient} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="0x..."
                      value={erc1155Recipient}
                      onChange={(e) => setErc1155Recipient(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t.tokenId} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="1"
                      value={erc1155TokenId}
                      onChange={(e) => setErc1155TokenId(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t.transferAmount} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="1"
                      value={erc1155Amount}
                      onChange={(e) => setErc1155Amount(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </>
              )}

              {selectedTransactionType === 'custom' && (
                <>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t.recipient} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="0x..."
                      value={customTo}
                      onChange={(e) => setCustomTo(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t.amountEthLabel} ({getNativeCurrencyName(chainId)})
                    </label>
                    <input
                      type="text"
                      placeholder="0"
                      value={customValue}
                      onChange={(e) => setCustomValue(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t.dataFieldLabel} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="0x..."
                      value={customData}
                      onChange={(e) => setCustomData(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </>
              )}

              <button
                onClick={handleAddCustomTransaction}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm sm:text-base font-medium transition-colors"
              >
                ➕ {t.addTransaction}
              </button>
            </div>
          </div>

          {/* 自定义交易列表 */}
          {customTransactions.length > 0 && (
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <h3 className="text-xs sm:text-sm font-medium text-purple-800 dark:text-purple-300">
                  {t.transactionList} ({customTransactions.length})
                </h3>
                <button
                  onClick={handleClearCustomTransactions}
                  className="text-xs text-red-600 hover:text-red-800 dark:text-red-400"
                >
                  {t.clearList}
                </button>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                                 {customTransactions.map((tx, index) => (
                   <div key={index} className="flex items-center justify-between bg-white dark:bg-gray-800 p-2 sm:p-3 rounded border border-purple-200 dark:border-purple-700">
                     <div className="flex-1 min-w-0">
                       <div className="text-xs sm:text-sm font-medium text-purple-900 dark:text-purple-100 flex items-center gap-1 sm:gap-2">
                         <span className="flex-shrink-0">{index + 1}.</span>
                         {tx.type === 'native_transfer' && (
                           <>
                             <Image src="/ethereum3.svg" alt="Native" width={16} height={16} className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                             <span className="truncate">{t.nativeTransfer} ({getNativeCurrencyName(chainId)})</span>
                           </>
                         )}
                         {tx.type === 'erc20_transfer' && (
                           <>
                             <Image src="/coins.svg" alt={getTokenTransferText()} width={16} height={16} className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                             <span className="truncate">{getTokenTransferText()}</span>
                           </>
                         )}
                         {tx.type === 'erc20_approve' && (
                           <>
                             <Image src="/permissions.svg" alt={getTokenApproveText()} width={16} height={16} className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                             <span className="truncate">{getTokenApproveText()}</span>
                           </>
                         )}
                         {tx.type === 'erc721_transfer' && (
                           <>
                             <Image src="/nft.svg" alt={t.erc721Transfer} width={16} height={16} className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                             <span className="truncate">{t.erc721Transfer}</span>
                           </>
                         )}
                         {tx.type === 'erc1155_transfer' && (
                           <>
                             <Image src="/nft.svg" alt={t.erc1155Transfer} width={16} height={16} className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                             <span className="truncate">{t.erc1155Transfer}</span>
                           </>
                         )}
                         {tx.type === 'custom_data' && (
                           <>
                             <Image src="/custom.svg" alt="Custom" width={16} height={16} className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                             <span className="truncate">Custom</span>
                           </>
                         )}
                       </div>
                       <div className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 mt-1 truncate">
                         {tx.type !== 'native_transfer' && (
                           <>To: {tx.to.slice(0, 6)}...{tx.to.slice(-4)}</>
                         )}
                       </div>
                       {tx.value !== '0' && (
                         <div className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 truncate">
                           Value: {tx.value} {getNativeCurrencyName(chainId)}
                         </div>
                       )}
                       {tx.data && (
                         <div className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 truncate">
                           Data: {tx.data.slice(0, 20)}...
                         </div>
                       )}
                     </div>
                     <button
                       onClick={() => handleRemoveTransaction(index)}
                       className="ml-2 sm:ml-3 text-red-600 hover:text-red-800 dark:text-red-400 flex-shrink-0 text-sm sm:text-base"
                     >
                       ✖️
                     </button>
                   </div>
                 ))}
              </div>
              <div className="mt-2 sm:mt-3 text-xs sm:text-sm font-medium text-purple-800 dark:text-purple-300 border-t border-purple-200 dark:border-purple-700 pt-2">
                Total: {customTransactions.reduce((total, tx) => total + parseFloat(tx.value || '0'), 0)} {getNativeCurrencyName(chainId)}
              </div>
            </div>
          )}
        </div>

        {/* Batch transaction section */}
        <div className="bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 rounded-lg w-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-3 sm:mb-4">
            <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
              <Image src="/run.svg" alt="Execute" width={24} height={24} className="w-5 h-5 sm:w-6 sm:h-6" />
              {t.batchTransactionsTitle}
            </h2>
            {(() => {
              const MAX_BATCH_SIZE = 10;
              const isOverLimit = customTransactions.length > MAX_BATCH_SIZE;
              return (
                <div className={`text-xs font-medium px-2 sm:px-3 py-1 rounded whitespace-nowrap ${
                  isOverLimit 
                    ? 'bg-red-100 text-red-700 border border-red-300' 
                    : 'bg-blue-100 text-blue-700 border border-blue-300'
                }`}>
                  {customTransactions.length} / {MAX_BATCH_SIZE} {t.transactionCount}
                  {isOverLimit && ` ⚠️ ${language === 'zh' ? '超出限制' : 'Exceeded limit'}`}
                </div>
              );
            })()}
          </div>

          {/* Transaction details */}
          {customTransactions.length > 0 ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
              {(() => {
                const MAX_BATCH_SIZE = 10;
                const displayedTransactions = customTransactions.slice(0, MAX_BATCH_SIZE);
                const wasTruncated = customTransactions.length > MAX_BATCH_SIZE;
                
                return (
                  <>
                    <h3 className="text-[10px] sm:text-xs font-medium text-blue-800 mb-2 break-words">
                      {language === 'zh' ? (
                        <>将发送 <span style={{ color: '#16a34a', fontWeight: 'bold' }}>{displayedTransactions.length}</span> 笔交易</>
                      ) : (
                        <>Will send <span style={{ color: '#16a34a', fontWeight: 'bold' }}>{displayedTransactions.length}</span> transactions</>
                      )}
                      {wasTruncated && <span className="text-orange-600 text-[10px] sm:text-xs ml-1 sm:ml-2 block sm:inline">⚠️ {language === 'zh' ? `共 ${customTransactions.length} 笔，仅显示前 10 笔` : `Total ${customTransactions.length}, showing first 10`}</span>}
                    </h3>
                    <ul className="text-[10px] sm:text-xs text-blue-700 space-y-1 mb-2 sm:mb-3">
                      {displayedTransactions.map((transaction, index) => (
                  <li key={index} className="flex items-start gap-1.5 sm:gap-2">
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full mt-1.5 sm:mt-1.5 flex-shrink-0"></span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium flex items-center gap-1 sm:gap-2">
                        {transaction.type === 'native_transfer' && (
                          <>
                            <Image src="/ethereum3.svg" alt="Native" width={16} height={16} className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span className="truncate">Native Transfer</span>
                          </>
                        )}
                        {transaction.type === 'erc20_transfer' && (
                          <>
                            <Image src="/coins.svg" alt={getTokenTransferText()} width={16} height={16} className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span className="truncate">{getTokenTransferText()}</span>
                          </>
                        )}
                        {transaction.type === 'erc20_approve' && (
                          <>
                            <Image src="/permissions.svg" alt={getTokenApproveText()} width={16} height={16} className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span className="truncate">{getTokenApproveText()}</span>
                          </>
                        )}
                        {transaction.type === 'erc721_transfer' && (
                          <>
                            <Image src="/nft.svg" alt={t.erc721Transfer} width={16} height={16} className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span className="truncate">{t.erc721Transfer}</span>
                          </>
                        )}
                        {transaction.type === 'erc1155_transfer' && (
                          <>
                            <Image src="/nft.svg" alt={t.erc1155Transfer} width={16} height={16} className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span className="truncate">{t.erc1155Transfer}</span>
                          </>
                        )}
                        {transaction.type === 'custom_data' && (
                          <>
                            <Image src="/custom.svg" alt="Custom" width={16} height={16} className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span className="truncate">Custom Data</span>
                          </>
                        )}
                      </div>
                      <div className="text-[9px] sm:text-[0.65rem] text-gray-500 mt-0.5 sm:mt-1 break-words">
                        {transaction.type !== 'native_transfer' && (
                          <>To: {transaction.to.slice(0, 6)}...{transaction.to.slice(-4)}</>
                        )}
                        {transaction.value !== "0" && <>  Value: {transaction.value} {getNativeCurrencyName(chainId)}</>}
                        {transaction.data && <> | Data: {transaction.data.slice(0, 10)}...</>}
                      </div>
                    </div>
                  </li>
                      ))}
                    </ul>
                    <div className="text-[10px] sm:text-xs font-medium text-purple-800 border-t border-purple-200 pt-2">
                    ✪ Total: {displayedTransactions.reduce((total, tx) => total + parseFloat(tx.value || '0'), 0)} {getNativeCurrencyName(chainId)}
                    </div>
                    <div className="mt-1 sm:mt-1.5 p-2 sm:p-2.5 bg-orange-800 border border-orange-600 rounded-lg">
                      <div className="space-y-1.5 sm:space-y-2">
                        <div className="flex items-start gap-2">
                          <div className="text-sm sm:text-base flex-shrink-0 mt-0.5">💡</div>
                          <div className="flex-1">
                            <p className="text-[10px] sm:text-xs font-semibold text-orange-100 mb-1.5 sm:mb-2">
                              {language === 'zh' ? '须知：' : 'Notice:'}
                            </p>
                            <ul className="space-y-1 sm:space-y-1.5 text-[10px] sm:text-xs text-orange-100 list-disc list-inside">
                              <li className="break-words">
                                {language === 'zh' ? (
                                  <>请确保该钱包中保留有足够的 <span className="text-green-700 dark:text-green-400 font-bold">{getNativeCurrencyName(chainId)}</span> 用于支付Gas费。如果<span className="text-green-700 dark:text-green-400 font-bold"> {getNativeCurrencyName(chainId)} </span>不足，交易将失败！</>
                                ) : (
                                  <>Please ensure your wallet has enough <span className="text-green-700 dark:text-green-400 font-bold">{getNativeCurrencyName(chainId)}</span> to pay for gas fees. If {getNativeCurrencyName(chainId)} is insufficient, the transaction will fail!</>
                                )}
                              </li>
                              <li className="break-words">
                                {language === 'zh' ? (
                                  <>Metamask 钱包须启用智能账户，如果尚未启用将会自动弹窗提示启用</>
                                ) : (
                                  <>MetaMask wallet must have smart accounts enabled. If not enabled, a popup will automatically prompt you to enable it</>
                                )}
                              </li>
                              <li className="break-words">
                                {language === 'zh' ? (
                                  <>批量交易将在同一笔交易中原子执行，只需花费1次Gas费，任何步骤失败，整个交易回滚</>
                                ) : (
                                  <>Batch transactions will be executed atomically in a single transaction, requiring only 1 gas fee payment. If any step fails, the entire transaction will be rolled back</>
                                )}
                              </li>
                              <li className="break-words">
                                {language === 'zh' ? (
                                  <>点击 &quot;发送批量交易&quot;后，可在 MetaMask 钱包中查看交易详情（包括Gas费估算和交易明细）</>
                                ) : (
                                  <>After clicking &quot;Send Batch Transaction&quot;, you can view transaction details in MetaMask wallet (including gas fee estimation and transaction details)</>
                                )}
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
              <div className="flex items-center gap-2 text-yellow-700">
                <span className="text-lg sm:text-xl flex-shrink-0">⚠️</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm sm:text-base">{t.addTransactionFirst}</div>
                  <div className="text-xs sm:text-sm text-yellow-600 mt-1 break-words">
                    {t.addTransactionFirstDesc}
                  </div>
                </div>
              </div>
            </div>
          )}



          {/* Send batch transaction button */}
          <button
            className={`w-full rounded-lg border border-solid px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-medium transition-colors mb-3 sm:mb-4 flex items-center justify-center gap-2 ${
              !isConnected || isPending || customTransactions.length === 0
                ? "bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed"
                : "bg-green-700 hover:bg-green-800 text-yellow-300 border-green-800 cursor-pointer"
            }`}
            onClick={handleSendTransaction}
            disabled={!isConnected || isPending || customTransactions.length === 0}
          >
            {isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-yellow-300 border-t-transparent rounded-full animate-spin"></div>
                <span className="whitespace-nowrap">{t.sendingTransaction}</span>
              </>
            ) : (
              <>
                <Image src="/send.svg" alt="Send" width={20} height={20} className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="break-words text-center">{t.sendBatchTransactionWithGas}</span>
              </>
            )}
          </button>

          {/* Transaction state */}
          {isPending && (
            <div className="flex items-center gap-2 text-blue-600 mb-3 sm:mb-4">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
              <span className="text-sm sm:text-base">Transaction pending...</span>
            </div>
          )}

          {isSuccess && data && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
              <div className="flex items-center gap-2 text-green-700 mb-2">
                <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                <span className="font-medium text-sm sm:text-base">
                  {t.transactionSubmitted}
                </span>
              </div>
              <div className="text-xs sm:text-sm text-gray-600 break-all">
                <p>
                  Data ID:{" "}
                  <code className="bg-gray-100 px-1 rounded text-[10px] sm:text-xs">{data.id}</code>
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
              <div className="text-red-700 font-medium text-xs sm:text-sm">Transaction Error</div>
              <div className="text-[10px] sm:text-xs text-red-600 mt-1 break-words">{error.message}</div>
              
              {/* 检测智能账户错误 */}
              {error.message?.includes('Account upgraded to unsupported contract') && (
                <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="text-lg sm:text-xl flex-shrink-0">⚠️</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-xs sm:text-sm text-orange-800 mb-2">
                        {t.smartAccountError}
                      </div>
                      <div className="text-[10px] sm:text-xs text-orange-700 mb-3 break-words">
                        {t.smartAccountErrorDesc}
                      </div>
                      <div className="text-[10px] sm:text-xs text-orange-700 break-words">
                        <strong>{t.solutionSteps}</strong>
                        <ol className="list-decimal list-inside mt-2 space-y-1 sm:space-y-2 ml-1 sm:ml-2">
                          <li className="break-words">{t.openMetaMask}</li>
                          <li className="break-words">{t.clickAccountIcon}</li>
                          <li className="break-words">{t.selectAccountDetails}</li>
                          <li className="break-words">{t.findSmartAccount}</li>
                          <li className="break-words">{t.clickDisableSmartAccount}</li>
                          <li className="break-words">{t.returnAndRetry}</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 检测 Gas Limit 过高错误 */}
              {error.message?.includes('gas limit too high') && (
                <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="text-xl sm:text-2xl flex-shrink-0">⚠️</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm sm:text-base text-orange-800 mb-2">
                        {t.gasLimitExceeded}
                      </div>
                      <div className="text-xs sm:text-sm text-orange-700 break-words">
                        {t.gasLimitExceededDesc}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Check transaction status button */}
          {data && (
            <button
              className={`w-full rounded-lg border border-solid px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-medium transition-colors ${
                statusLoading
                  ? "bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed"
                  : "bg-green-700 hover:bg-green-800 text-yellow-300 border-green-800 cursor-pointer"
              }`}
              onClick={handleGetCallsStatus}
              disabled={statusLoading || !data.id}
            >
              {statusLoading
                ? t.checkingStatus
                : t.checkStatus}
            </button>
          )}

          {/* Status error */}
          {statusError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 mt-3 sm:mt-4">
              <div className="text-red-700 font-medium text-sm sm:text-base">Status Check Error</div>
              <div className="text-xs sm:text-sm text-red-600 mt-1 break-words">{statusError}</div>
            </div>
          )}

          {/* Transaction hash */}
          {transactionHash && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4 mt-3 sm:mt-4">
              <div className="text-green-700 font-medium mb-2 text-sm sm:text-base">
                {t.transactionConfirmed}
              </div>
              <div className="text-xs sm:text-sm break-all">
                <a
                  href={getExplorerUrl(chainId, transactionHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 hover:underline break-all"
                >
                  {t.viewOnExplorer}: {transactionHash}
                </a>
              </div>
            </div>
          )}
        </div>
        </>}
        </div>
      </main>

      {/* 底部导航栏 */}
      <div className="bg-gray-800 dark:bg-gray-900 py-3 sm:py-4 lg:py-3 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col gap-3 sm:gap-4 lg:gap-3 pt-2 sm:pt-3 lg:pt-2">
            {/* 第一行：左侧内容和分享按钮（桌面端同一行，移动端分开） */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4">
              {/* 左侧：MetaMask Logo 与版权小字 */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
                <div className="text-center">
                  <a
                    href="https://docs.metamask.io/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center hover:opacity-80 transition-opacity"
                    title="MetaMask Documentation"
                  >
                    <Image
                      src="/metamask-logo-dark.svg"
                      alt="MetaMask"
                      width={240}
                      height={80}
                      className="h-10 sm:h-12 md:h-14 lg:h-12 w-auto"
                    />
                  </a>
                  <div className="mt-2 text-[10px] sm:text-xs text-gray-300">© 2025 MetaMask • A Consensys Formation</div>
                </div>

              {/* Quickstart、Tutorials、Help、GitHub 按钮 */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 sm:gap-4 md:gap-5 lg:gap-6">
                  <a
                    href="https://docs.metamask.io/quickstart/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white hover:text-green-400 font-semibold text-sm sm:text-base transition-colors"
                    title="Quickstart"
                  >
                    Quickstart
                  </a>
                  <a
                    href="https://docs.metamask.io/tutorials/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white hover:text-green-400 font-semibold text-sm sm:text-base transition-colors"
                    title="Tutorials"
                  >
                    Tutorials
                  </a>
                  {/* GitHub 链接 */}
                  <a
                    href="https://github.com/MetaMask/7702-livestream-demo"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 sm:gap-2 text-white hover:text-green-400 font-semibold text-sm sm:text-base transition-colors"
                    title="View on GitHub"
                  >
                    <Image
                      src="/github.svg"
                      alt="GitHub"
                      width={20}
                      height={20}
                      className="w-4 h-4 sm:w-5 sm:h-5"
                    />
                    <span className="hidden sm:inline">GitHub</span>
                    <span className="sm:hidden">GitHub</span>
                  </a>
                  <a
                    href="https://builder.metamask.io/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white hover:text-green-400 font-semibold text-sm sm:text-base transition-colors"
                    title="Help"
                  >
                    Help ↗
                  </a>
                </div>
              </div>
            </div>

            {/* 第二行：分享按钮（右下方，并排显示） */}
            <div className="flex items-center justify-center lg:justify-end gap-2 -mt-2 lg:-mt-3">
              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-xs sm:text-sm whitespace-nowrap"
              >
                <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
                </svg>
                <span>{t.share}</span>
              </button>
              <button
                onClick={handleTweet}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-xs sm:text-sm whitespace-nowrap"
              >
                <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                <span>{t.tweet}</span>
              </button>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-xs sm:text-sm whitespace-nowrap"
              >
                <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>{t.copy}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 流程图弹窗 */}
      {showFlowModal && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-sm transition-opacity duration-200"
          onClick={() => setShowFlowModal(false)}
        >
          <div 
            className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-200 scale-100 max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 蓝色标题栏 */}
            <div className="bg-blue-600 dark:bg-blue-700 px-6 sm:px-8 py-2 sm:py-3 rounded-t-2xl">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h2 className="text-xl sm:text-2xl font-bold text-white">
                    {t.title}
                  </h2>
                </div>
                {/* 关闭按钮 */}
                <button
                  onClick={() => setShowFlowModal(false)}
                  className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* 内容区域 */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8">
              {/* 介绍部分 */}
              <div className="mb-8">
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                  {t.subtitle}
                </p>
              </div>

              {/* 操作步骤标题 */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-1 h-6 sm:h-8 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full"></div>
                  <h3 className="text-2xl sm:text-3xl font-bold text-yellow-400 dark:text-yellow-300">
                    {language === 'zh' ? '操作步骤' : 'Operation Steps'}
                  </h3>
                </div>
                <div className="h-px bg-gradient-to-r from-blue-200 via-purple-200 to-blue-200 dark:from-blue-800 dark:via-purple-800 dark:to-blue-800 ml-4"></div>
              </div>

              {/* 流程图 */}
              <div className="space-y-6">
              {/* 步骤1：连接钱包 */}
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg mb-3">
                  <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <div className="text-center">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-1">
                    {language === 'zh' ? '连接钱包' : 'Connect Wallet'}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {language === 'zh' ? '点击连接钱包按钮，授权 MetaMask 连接' : 'Click connect wallet button to authorize MetaMask connection'}
                  </p>
                </div>
              </div>

              {/* 箭头 */}
              <div className="flex justify-center">
                <div className="relative">
                  <div className="w-0.5 h-12 bg-gradient-to-b from-blue-500 to-purple-500"></div>
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-purple-500"></div>
                </div>
              </div>

              {/* 步骤2：配置批量交易 */}
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg mb-3">
                  <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <div className="text-center">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-1">
                    {language === 'zh' ? '配置批量交易' : 'Configure Batch Transactions'}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {language === 'zh' ? '添加需要批量执行的交易，最多支持10笔' : 'Add transactions to batch execute, up to 10 transactions'}
                  </p>
                </div>
              </div>

              {/* 箭头 */}
              <div className="flex justify-center">
                <div className="relative">
                  <div className="w-0.5 h-12 bg-gradient-to-b from-purple-500 to-green-500"></div>
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-green-500"></div>
                </div>
              </div>

              {/* 步骤3：发送批量交易 */}
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg mb-3">
                  <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </div>
                <div className="text-center">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-1">
                    {language === 'zh' ? '发送批量交易' : 'Send Batch Transaction'}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {language === 'zh' ? '确认并发送，所有交易将原子执行' : 'Confirm and send, all transactions will execute atomically'}
                  </p>
                </div>
              </div>
              </div>

              {/* 底部提示 */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs sm:text-sm text-center text-gray-500 dark:text-gray-400">
                  {language === 'zh' ? '💡 提示：批量交易只需支付一次 Gas 费，更节省成本' : '💡 Tip: Batch transactions only require one gas fee payment, more cost-effective'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}