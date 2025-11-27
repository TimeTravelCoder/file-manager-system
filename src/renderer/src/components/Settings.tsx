import { useState, useEffect } from 'react';
import { Save, FolderOpen } from 'lucide-react';

interface AppSettings {
    archivePath: string;
    namingTemplate: string;
    autoArchiveDelay: number;
}

export function Settings() {
    const [settings, setSettings] = useState<AppSettings>({
        archivePath: '',
        namingTemplate: '',
        autoArchiveDelay: 5
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            // @ts-ignore
            const result = await window.electron.ipcRenderer.invoke('get-settings');
            setSettings(result);
        } catch (error) {
            console.error('Failed to load settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // @ts-ignore
            await window.electron.ipcRenderer.invoke('save-settings', settings);
            // Show success feedback
        } catch (error) {
            console.error('Failed to save settings:', error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8">正在加载设置...</div>;

    return (
        <div className="p-8 max-w-3xl mx-auto bg-white min-h-screen">
            <h1 className="text-3xl font-bold mb-8 text-gray-800">设置</h1>

            <div className="space-y-8">
                {/* Archive Path */}
                <section>
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">归档设置</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">归档位置</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={settings.archivePath}
                                    onChange={(e) => setSettings({ ...settings, archivePath: e.target.value })}
                                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="C:\Users\Documents\FileArchive"
                                />
                                <button
                                    onClick={async () => {
                                        // @ts-ignore
                                        const path = await window.electron.ipcRenderer.invoke('select-directory');
                                        if (path) {
                                            setSettings({ ...settings, archivePath: path });
                                        }
                                    }}
                                    className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600"
                                >
                                    <FolderOpen className="w-5 h-5" />
                                </button>
                            </div>
                            <p className="mt-1 text-sm text-gray-500">文件编辑完成后将移至此处。</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">自动归档延迟 (秒)</label>
                            <input
                                type="number"
                                value={settings.autoArchiveDelay}
                                onChange={(e) => setSettings({ ...settings, autoArchiveDelay: parseInt(e.target.value) || 0 })}
                                className="w-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>
                </section>

                <hr className="border-gray-200" />

                {/* Naming Template */}
                <section>
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">文件命名</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">默认模板</label>
                            <input
                                type="text"
                                value={settings.namingTemplate}
                                onChange={(e) => setSettings({ ...settings, namingTemplate: e.target.value })}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                                placeholder="{date}_{title}.{extension}"
                            />
                            <div className="mt-2 text-sm text-gray-500">
                                可用变量: <code className="bg-gray-100 px-1 rounded">{'{date}'}</code>, <code className="bg-gray-100 px-1 rounded">{'{time}'}</code>, <code className="bg-gray-100 px-1 rounded">{'{title}'}</code>, <code className="bg-gray-100 px-1 rounded">{'{extension}'}</code>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Save Button */}
                <div className="pt-4">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        <Save className="w-5 h-5" />
                        {saving ? '保存中...' : '保存设置'}
                    </button>
                </div>
            </div>
        </div>
    );
}
