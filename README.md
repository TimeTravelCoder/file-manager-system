# 文件管理系统 (File Management System)

这是一个基于 Electron + React + TypeScript 构建的智能文件管理应用，旨在简化文件的创建、分类、归档和检索流程。

---

## 📚 目录 (Table of Contents)

1. [快速开始 (Quick Start)](#-快速开始-quick-start)
2. [功能操作手册 (User Manual)](#-功能操作手册-user-manual)
3. [打包与部署 (Packaging & Deployment)](#-打包与部署-packaging--deployment)
4. [技术文档 (Technical Documentation)](#-技术文档-technical-documentation)
5. [常见问题 (FAQ)](#-常见问题-faq)

---

## 🚀 快速开始 (Quick Start)

### 1. 环境准备
确保您的电脑已安装 [Node.js](https://nodejs.org/) (建议版本 v16+)。

### 2. 安装依赖
在项目根目录下打开终端 (Terminal/PowerShell)，运行：
```bash
npm install
```

### 3. 启动应用
运行以下命令启动开发模式：
```bash
npm run dev
```
应用启动后，您将看到主界面。

---

## 📖 功能操作手册 (User Manual)

### 1. 新建文件 (Create File)
- 点击侧边栏的 **"新建文件"**。
- **选择类型**：
    - **文档**：Word (.docx), Excel (.xlsx), PowerPoint (.pptx), Markdown (.md), 文本 (.txt)。
    - **代码**：选择 "Code" 后，可进一步选择 JavaScript, Python, Java, C++, HTML, CSS 等语言。
- **输入文件名**：无需输入后缀。
- **选择日期**：默认为今天。
- **添加标签**：输入标签名称（如 "工作", "会议"）并按回车。系统会自动记录并推荐常用标签。
- 点击 **"创建文件"** 按钮。文件将创建在您的 "文档" 文件夹中，并自动打开供您编辑。

### 2. 自动归档 (Auto Archiving)
- 当您完成编辑并 **关闭文件** 后，系统会自动检测。
- 文件将被自动移动到归档目录（默认为 `Documents/FileArchive/年份/月份/类型/`）。
- 归档后的文件状态将变更为 "已归档"。

### 3. 我的文件 (Dashboard)
- 点击侧边栏的 **"我的文件"** 查看所有记录。
- **搜索**：在顶部搜索框输入文件名或标签进行检索。
- **筛选**：通过下拉菜单筛选文件类型（如仅显示 Word 文档或 Python 脚本）。
- **打开**：点击列表右侧的 "打开" 按钮可直接打开文件或其所在文件夹。

### 4. 设置 (Settings)
- 点击侧边栏的 **"设置"**。
- **归档位置**：自定义文件归档的存储路径。
- **自动归档延迟**：设置文件关闭后多少秒执行归档（默认 5 秒）。
- **文件命名模板**：自定义文件命名规则，支持变量：
    - `{title}`: 文件名
    - `{date}`: 日期
    - `{time}`: 时间
    - `{extension}`: 后缀
    - 示例：`{date}_{title}.{extension}` -> `2023-10-27_会议记录.docx`

---

## 📦 打包与部署 (Packaging & Deployment)

### ⚠️ 重要提示：路径问题
由于打包工具 `electron-builder` 在 Windows 上对**中文路径**支持不佳，打包前**必须**将项目移动到**全英文路径**下。
- ❌ 错误路径：`D:\Trae\文件管理系统`
- ✅ 正确路径：`D:\Trae\FileManager`

### 打包步骤
1. 移动项目文件夹到英文路径。
2. 在新路径下打开终端。
3. 运行以下命令生成安装包：
```bash
# 生成 Windows 安装包 (EXE 和 MSI)
npm run build:win
```
4. 打包完成后，安装文件将位于 `dist` 或 `out` 目录下。

---

## 🛠 技术文档 (Technical Documentation)

### 技术栈
- **核心框架**: Electron, React, TypeScript
- **构建工具**: Vite, Electron-Vite
- **样式库**: TailwindCSS (v4)
- **数据库**: SQLite (better-sqlite3)
- **图标库**: Lucide React

### 目录结构
```
src/
├── main/           # Electron 主进程 (Node.js)
│   ├── index.ts    # 入口文件
│   ├── db.ts       # 数据库管理
│   ├── fileMonitor.ts # 文件监控服务
│   └── ...
├── preload/        # 预加载脚本 (IPC 桥接)
└── renderer/       # React 渲染进程 (UI)
    ├── src/
    │   ├── components/ # UI 组件
    │   └── assets/     # 静态资源
    └── ...
```

---

## ❓ 常见问题 (FAQ)

**Q: 为什么文件关闭后没有立即归档？**
A: 系统默认有 5 秒的延迟，以防止误操作。此外，某些软件（如记事本）可能不会立即释放文件锁，请确保完全关闭编辑软件。

**Q: 启动时报错 "SqliteError"？**
A: 请尝试删除 `C:\Users\您的用户名\AppData\Roaming\file_manager.db` 文件，然后重启应用以重建数据库。

**Q: 界面显示英文？**
A: 我们已全面汉化。如果仍显示英文，请尝试重启应用。

**Q: 打包时报错？**
A: 请务必检查项目路径是否包含中文。请参考 [打包与部署](#-打包与部署-packaging--deployment) 章节。
