# 发布指南 / Publishing Guide

## 发布前准备 / Prerequisites

### 1. 设置 Publisher 名称 / Set Publisher Name

在 `package.json` 中，将 `"publisher": "your-publisher-name"` 替换为你的实际发布者名称。

**Publisher 名称要求：**
- 必须是唯一的（在 VS Code 市场中）
- 只能包含小写字母、数字、连字符和下划线
- 建议使用你的 GitHub 用户名或组织名称

**示例：**
```json
"publisher": "your-github-username"
```

### 2. 获取 Personal Access Token (PAT)

1. 访问 [Azure DevOps](https://dev.azure.com/)
2. 登录你的 Microsoft 账户（如果没有，需要先注册）
3. 创建或选择一个组织
4. 进入 **User Settings** → **Personal Access Tokens**
5. 点击 **New Token**
6. 设置：
   - **Name**: `VSCode Extension Publishing`
   - **Organization**: 选择你的组织
   - **Expiration**: 根据需要设置（建议至少 1 年）
   - **Scopes**: 选择 **Custom defined** → 勾选 **Marketplace** → 选择 **Manage**
7. 点击 **Create**，**复制并保存 Token**（只显示一次）

### 3. 安装 vsce（如果还没有）

```bash
npm install -g @vscode/vsce
```

## 发布步骤 / Publishing Steps

### 方法 1：使用命令行发布（推荐）

```bash
# 1. 确保已编译
npm run compile

# 2. 登录（使用你的 Personal Access Token）
vsce login <your-publisher-name>

# 3. 发布插件
vsce publish
```

### 方法 2：使用 Token 直接发布

```bash
# 直接使用 Token 发布（不需要先登录）
vsce publish -p <your-personal-access-token>
```

### 发布补丁版本

```bash
# 自动递增补丁版本号（0.0.1 → 0.0.2）
vsce publish patch

# 递增次要版本号（0.0.1 → 0.1.0）
vsce publish minor

# 递增主版本号（0.0.1 → 1.0.0）
vsce publish major
```

## 发布后 / After Publishing

1. **等待审核**：首次发布通常需要几分钟到几小时进行审核
2. **查看状态**：访问 [VS Code Marketplace](https://marketplace.visualstudio.com/vscode) 搜索你的插件
3. **更新插件**：使用 `vsce publish` 命令更新版本

## 常见问题 / FAQ

### Q: 如何更新已发布的插件？
A: 修改 `package.json` 中的 `version` 字段，然后运行 `vsce publish`

### Q: 发布失败怎么办？
A: 
- 检查 publisher 名称是否正确
- 确认 Token 是否有效且有正确权限
- 查看错误信息，通常会有具体提示

### Q: 如何撤销发布？
A: 在 [VS Code Marketplace](https://marketplace.visualstudio.com/vscode) 的发布者控制面板中可以取消发布

## 重要提示 / Important Notes

⚠️ **首次发布前请确保：**
- ✅ Publisher 名称已正确设置
- ✅ 所有代码已编译通过
- ✅ README 和描述信息完整
- ✅ LICENSE 文件已添加
- ✅ 版本号符合语义化版本规范

