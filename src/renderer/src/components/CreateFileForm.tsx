import React, { useState, useEffect } from 'react';
import { FileText, Table, Presentation, FileType, Code, Plus, Tag, Calendar } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const fileTypes = [
    { id: 'docx', name: 'Word', icon: FileText, ext: '.docx', color: 'text-blue-600' },
    { id: 'xlsx', name: 'Excel', icon: Table, ext: '.xlsx', color: 'text-green-600' },
    { id: 'pptx', name: 'PowerPoint', icon: Presentation, ext: '.pptx', color: 'text-orange-600' },
    { id: 'md', name: 'Markdown', icon: FileType, ext: '.md', color: 'text-slate-600' },
    { id: 'txt', name: 'Text', icon: FileType, ext: '.txt', color: 'text-gray-500' },
    { id: 'code', name: 'Code', icon: Code, ext: '.js', color: 'text-yellow-600' },
];

export function CreateFileForm() {
    const [selectedType, setSelectedType] = useState(fileTypes[0]);
    const [filename, setFilename] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');
    const [availableTags, setAvailableTags] = useState<{ name: string }[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    useEffect(() => {
        loadTags();
    }, []);

    const loadTags = async () => {
        try {
            // @ts-ignore
            const result = await window.electron.ipcRenderer.invoke('get-tags');
            setAvailableTags(result);
        } catch (error) {
            console.error('Failed to load tags:', error);
        }
    };

    const handleAddTag = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            e.preventDefault();
            addTag(tagInput.trim());
        }
    };

    const addTag = (tag: string) => {
        if (!tags.includes(tag)) {
            setTags([...tags, tag]);
        }
        setTagInput('');
        setShowSuggestions(false);
    };

    const filteredTags = availableTags.filter(t =>
        t.name.toLowerCase().includes(tagInput.toLowerCase()) &&
        !tags.includes(t.name)
    );

    const handleCreate = async () => {
        if (!filename.trim()) {
            alert('请输入文件名 (Please enter a filename)');
            return;
        }

        try {
            console.log('Creating file:', { type: selectedType, filename, date, tags });
            // @ts-ignore
            const result = await window.electron.ipcRenderer.invoke('create-file', {
                type: {
                    id: selectedType.id,
                    name: selectedType.name,
                    ext: selectedType.ext
                },
                filename,
                date,
                tags
            });
            console.log('File created:', result);
            alert('文件创建成功 (File created successfully)!');

            // Optional: Show success notification or clear form
            setFilename('');
            setTags([]);
            loadTags(); // Refresh tags to include new ones
        } catch (error) {
            console.error('Failed to create file:', error);
            alert(`创建失败 (Failed to create): ${error}`);
        }
    };

    return (
        <div className="p-8 max-w-2xl mx-auto bg-white min-h-screen">
            <h1 className="text-3xl font-bold mb-8 text-gray-800">新建文件</h1>

            <div className="space-y-6">
                {/* File Type Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">文件类型</label>
                    <div className="grid grid-cols-3 gap-4">
                        {fileTypes.map((type) => (
                            <button
                                key={type.id}
                                onClick={() => {
                                    setSelectedType(type);
                                    if (type.id === 'code') {
                                        // Default to JS if code is selected
                                        // Logic handled in render or state
                                    }
                                }}
                                className={twMerge(
                                    "flex flex-col items-center p-4 border rounded-xl transition-all",
                                    selectedType.id === type.id
                                        ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                )}
                            >
                                <type.icon className={clsx("w-8 h-8 mb-2", type.color)} />
                                <span className="text-sm font-medium text-gray-700">{type.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Code Language Selection (Only if Code is selected) */}
                {selectedType.id === 'code' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">编程语言</label>
                        <div className="grid grid-cols-4 gap-2">
                            {[
                                { name: 'JavaScript', ext: '.js' },
                                { name: 'TypeScript', ext: '.ts' },
                                { name: 'Python', ext: '.py' },
                                { name: 'Java', ext: '.java' },
                                { name: 'C++', ext: '.cpp' },
                                { name: 'HTML', ext: '.html' },
                                { name: 'CSS', ext: '.css' },
                                { name: 'JSON', ext: '.json' },
                            ].map((lang) => (
                                <button
                                    key={lang.ext}
                                    onClick={() => setSelectedType({ ...selectedType, ext: lang.ext, name: lang.name })}
                                    className={twMerge(
                                        "px-3 py-2 text-sm border rounded-lg transition-all",
                                        selectedType.ext === lang.ext
                                            ? "bg-yellow-50 border-yellow-500 text-yellow-700"
                                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                    )}
                                >
                                    {lang.name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Filename */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">文件名</label>
                    <div className="relative">
                        <input
                            type="text"
                            value={filename}
                            onChange={(e) => setFilename(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            placeholder="输入文件名..."
                        />
                        <span className="absolute right-3 top-3 text-gray-400">{selectedType.ext}</span>
                    </div>
                </div>

                {/* Date and Tags */}
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">日期</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 mb-2">标签</label>
                        <div className="relative">
                            <Tag className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={tagInput}
                                onChange={(e) => {
                                    setTagInput(e.target.value);
                                    setShowSuggestions(true);
                                }}
                                onFocus={() => setShowSuggestions(true)}
                                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                onKeyDown={handleAddTag}
                                className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="按回车添加..."
                            />
                        </div>
                        {/* Suggestions Dropdown */}
                        {showSuggestions && tagInput && filteredTags.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-auto">
                                {filteredTags.map((tag, index) => (
                                    <button
                                        key={index}
                                        onClick={() => addTag(tag.name)}
                                        className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700"
                                    >
                                        {tag.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Tag List */}
                {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {tags.map((tag, index) => (
                            <span key={index} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-1">
                                {tag}
                                <button onClick={() => setTags(tags.filter((_, i) => i !== index))} className="hover:text-blue-900">×</button>
                            </span>
                        ))}
                    </div>
                )}

                {/* Submit Button */}
                <button
                    onClick={handleCreate}
                    className="w-full py-4 bg-blue-600 text-white rounded-xl font-semibold text-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
                >
                    <Plus className="w-6 h-6" />
                    创建文件
                </button>
            </div>
        </div>
    );
}
