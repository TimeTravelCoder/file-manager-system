import { useState, useEffect } from 'react';
import { Search, Filter, FileText, Table, Presentation, FileType, Code, Plus, Clock } from 'lucide-react';
import { clsx } from 'clsx';

interface FileRecord {
    id: number;
    filename: string;
    extension: string;
    created_at: string;
    status: string;
    tags: string[];
}

export function Dashboard({ onCreateClick }: { onCreateClick: () => void }) {
    const [files, setFiles] = useState<FileRecord[]>([]);
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('');

    const loadFiles = async () => {
        try {
            // @ts-ignore
            const result = await window.electron.ipcRenderer.invoke('get-files', { search, type: filterType });
            setFiles(result);
        } catch (error) {
            console.error('Failed to load files:', error);
        }
    };

    useEffect(() => {
        loadFiles();
    }, [search, filterType]);

    const getIcon = (ext: string) => {
        switch (ext) {
            case '.docx': return <FileText className="w-5 h-5 text-blue-600" />;
            case '.xlsx': return <Table className="w-5 h-5 text-green-600" />;
            case '.pptx': return <Presentation className="w-5 h-5 text-orange-600" />;
            case '.md': return <FileType className="w-5 h-5 text-slate-600" />;
            case '.js': case '.ts': case '.py': case '.java': case '.cpp': case '.json': return <Code className="w-5 h-5 text-yellow-600" />;
            case '.html': case '.css': return <Code className="w-5 h-5 text-blue-500" />;
            default: return <FileType className="w-5 h-5 text-gray-500" />;
        }
    };

    return (
        <div className="p-8 max-w-5xl mx-auto bg-gray-50 min-h-screen">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800">我的文件</h1>
                <button
                    onClick={onCreateClick}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    新建文件
                </button>
            </div>

            <div className="flex gap-4 mb-6">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 p-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="搜索文件..."
                    />
                </div>
                <div className="relative">
                    <Filter className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="pl-10 pr-8 p-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                    >
                        <option value="">所有类型</option>
                        <option value=".docx">Word</option>
                        <option value=".xlsx">Excel</option>
                        <option value=".pptx">PowerPoint</option>
                        <option value=".md">Markdown</option>
                        <option value=".js">JavaScript</option>
                        <option value=".py">Python</option>
                        <option value=".java">Java</option>
                        <option value=".cpp">C++</option>
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">名称</th>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">标签</th>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">日期</th>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {files.map((file) => (
                            <tr key={file.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-3">
                                        {getIcon(file.extension)}
                                        <span className="font-medium text-gray-900">{file.filename}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-wrap gap-1">
                                        {file.tags.map((tag, i) => (
                                            <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <div className="flex items-center gap-1">
                                        <Clock className="w-4 h-4" />
                                        {new Date(file.created_at).toLocaleDateString()}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={clsx(
                                        "px-2 py-1 rounded-full text-xs font-medium",
                                        file.status === 'active' ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                                    )}>
                                        {file.status === 'active' ? '活跃' : '已归档'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 hover:text-blue-800 cursor-pointer">
                                    打开
                                </td>
                            </tr>
                        ))}
                        {files.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                    未找到文件。创建一个新文件开始吧！
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
