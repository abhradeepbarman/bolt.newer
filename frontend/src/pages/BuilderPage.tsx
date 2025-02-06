import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
    ChevronRight,
    ChevronDown,
    File,
    Folder,
    Code,
    Eye,
    Menu,
    X,
} from "lucide-react";
import Editor from "@monaco-editor/react";
import axios from "axios";
import { BACKEND_URL } from "../config/config";

interface FileStructure {
    name: string;
    type: "file" | "folder";
    content?: string;
    children?: FileStructure[];
    isOpen?: boolean;
}

type Tab = "code" | "preview";

export default function BuilderPage() {
    const location = useLocation();
    const { prompt: UserPrompt } = location.state as { prompt: string };
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>("code");
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isFileExplorerOpen, setIsFileExplorerOpen] = useState(true);
    const [fileStructure, setFileStructure] = useState<FileStructure[]>([
        {
            name: "src",
            type: "folder",
            isOpen: true,
            children: [
                {
                    name: "App.tsx",
                    type: "file",
                    content: "// Your App code here",
                },
                {
                    name: "components",
                    type: "folder",
                    isOpen: false,
                    children: [],
                },
            ],
        },
        {
            name: "package.json",
            type: "file",
            content: '{\n  "name": "my-project"\n}',
        },
    ]);
    const [steps, setSteps] = useState([{}]);

    const FileExplorer = ({
        items,
        level = 0,
    }: {
        items: FileStructure[];
        level?: number;
    }) => {
        return (
            <div style={{ paddingLeft: level ? "1.5rem" : "0" }}>
                {items.map((item) => (
                    <div key={item.name}>
                        <div
                            className={`flex items-center py-1 px-2 hover:bg-gray-700/50 cursor-pointer ${
                                selectedFile === item.name
                                    ? "bg-gray-700/50"
                                    : ""
                            }`}
                            onClick={() => {
                                if (item.type === "file") {
                                    setSelectedFile(item.name);
                                    if (window.innerWidth < 768) {
                                        setIsFileExplorerOpen(false);
                                    }
                                } else {
                                    const updateStructure = (
                                        items: FileStructure[]
                                    ): FileStructure[] => {
                                        return items.map((i) => {
                                            if (i === item) {
                                                return {
                                                    ...i,
                                                    isOpen: !i.isOpen,
                                                };
                                            }
                                            if (i.children) {
                                                return {
                                                    ...i,
                                                    children: updateStructure(
                                                        i.children
                                                    ),
                                                };
                                            }
                                            return i;
                                        });
                                    };
                                    setFileStructure(
                                        updateStructure(fileStructure)
                                    );
                                }
                            }}
                        >
                            {item.type === "folder" ? (
                                <>
                                    {item.isOpen ? (
                                        <ChevronDown className="w-4 h-4 mr-1 text-gray-400" />
                                    ) : (
                                        <ChevronRight className="w-4 h-4 mr-1 text-gray-400" />
                                    )}
                                    <Folder className="w-4 h-4 mr-2 text-indigo-400" />
                                </>
                            ) : (
                                <File className="w-4 h-4 mr-2 text-gray-400" />
                            )}
                            <span className="text-gray-200 text-sm">
                                {item.name}
                            </span>
                        </div>
                        {item.type === "folder" &&
                            item.isOpen &&
                            item.children && (
                                <FileExplorer
                                    items={item.children}
                                    level={level + 1}
                                />
                            )}
                    </div>
                ))}
            </div>
        );
    };


    async function init() {
        const response = await axios.post(`${BACKEND_URL}/template`, {
            prompt,
        });

        const { prompts, uiPrompts } = response.data;

        const stepsResponse = await axios.post(`${BACKEND_URL}/chat`, {
            messages: [...prompts, UserPrompt].map((content) => ({
                role: "user",
                parts: [
                    {
                        text: content,
                    },
                ],
            })),
        });
    }

    useEffect(() => {
        init();
    }, []);

    return (
        <div className="h-screen flex flex-col md:flex-row bg-gray-900 text-gray-100">
            {/* Mobile Header */}
            <div className="md:hidden flex items-center justify-between p-4 border-b border-gray-700">
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="p-2 hover:bg-gray-800 rounded-lg"
                >
                    <Menu className="w-6 h-6 text-gray-400" />
                </button>
                <div className="flex space-x-2">
                    <button
                        className={`px-3 py-1 rounded-lg ${
                            activeTab === "code"
                                ? "bg-indigo-900/50 text-indigo-400"
                                : "text-gray-400"
                        }`}
                        onClick={() => setActiveTab("code")}
                    >
                        <Code className="w-4 h-4" />
                    </button>
                    <button
                        className={`px-3 py-1 rounded-lg ${
                            activeTab === "preview"
                                ? "bg-indigo-900/50 text-indigo-400"
                                : "text-gray-400"
                        }`}
                        onClick={() => setActiveTab("preview")}
                    >
                        <Eye className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Left Sidebar - Steps */}
            <div
                className={`fixed md:static inset-0 bg-gray-900 md:bg-transparent z-30 transform ${
                    isSidebarOpen ? "translate-x-0" : "-translate-x-full"
                } md:translate-x-0 transition-transform duration-200 ease-in-out`}
            >
                <div className="h-full w-64 bg-gray-800/50 border-r border-gray-700 overflow-y-auto">
                    <div className="flex justify-between items-center p-4 md:hidden">
                        <h2 className="text-lg font-semibold text-gray-100">
                            Build Steps
                        </h2>
                        <button
                            onClick={() => setIsSidebarOpen(false)}
                            className="p-2 hover:bg-gray-700 rounded-lg"
                        >
                            <X className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>
                    <div className="p-4 space-y-2">
                        <div className="p-2 bg-indigo-900/50 text-indigo-300 rounded border border-indigo-800/50">
                            1. Initialize Project
                        </div>
                        <div className="p-2 bg-gray-800/50 rounded border border-gray-700/50">
                            2. Create Components
                        </div>
                        <div className="p-2 bg-gray-800/50 rounded border border-gray-700/50">
                            3. Add Styling
                        </div>
                        <div className="p-2 bg-gray-800/50 rounded border border-gray-700/50">
                            4. Configure Routes
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Desktop Tabs */}
                <div className="hidden md:flex border-b border-gray-700">
                    <button
                        className={`flex items-center px-4 py-2 border-b-2 ${
                            activeTab === "code"
                                ? "border-indigo-500 text-indigo-400"
                                : "border-transparent text-gray-400 hover:text-gray-300"
                        }`}
                        onClick={() => setActiveTab("code")}
                    >
                        <Code className="w-4 h-4 mr-2" />
                        Code
                    </button>
                    <button
                        className={`flex items-center px-4 py-2 border-b-2 ${
                            activeTab === "preview"
                                ? "border-indigo-500 text-indigo-400"
                                : "border-transparent text-gray-400 hover:text-gray-300"
                        }`}
                        onClick={() => setActiveTab("preview")}
                    >
                        <Eye className="w-4 h-4 mr-2" />
                        Preview
                    </button>
                </div>

                {/* Tab Content */}
                <div className="flex-1 flex min-h-0">
                    {activeTab === "code" ? (
                        <>
                            {/* File Explorer */}
                            <div
                                className={`${
                                    isFileExplorerOpen ? "w-64" : "w-0"
                                } md:w-64 border-r border-gray-700 bg-gray-800/30 transition-all duration-200 overflow-hidden`}
                            >
                                <div className="p-4">
                                    <h3 className="text-sm font-semibold mb-4 text-gray-300">
                                        File Explorer
                                    </h3>
                                    <FileExplorer items={fileStructure} />
                                </div>
                            </div>

                            {/* Code Editor */}
                            <div className="flex-1 bg-gray-900 min-w-0">
                                {selectedFile ? (
                                    <Editor
                                        height="100%"
                                        defaultLanguage="typescript"
                                        theme="vs-dark"
                                        value={
                                            fileStructure.find(
                                                (f) => f.name === selectedFile
                                            )?.content ||
                                            "// Select a file to edit"
                                        }
                                        options={{
                                            minimap: { enabled: false },
                                            fontSize: 14,
                                            wordWrap: "on",
                                            theme: "vs-dark",
                                        }}
                                    />
                                ) : (
                                    <div className="h-full flex items-center justify-center text-gray-500 p-4 text-center">
                                        <div>
                                            <p className="mb-2">
                                                Select a file to start editing
                                            </p>
                                            {!isFileExplorerOpen && (
                                                <button
                                                    onClick={() =>
                                                        setIsFileExplorerOpen(
                                                            true
                                                        )
                                                    }
                                                    className="text-indigo-400 hover:text-indigo-300"
                                                >
                                                    Open File Explorer
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 bg-gray-900">
                            <iframe
                                title="Website Preview"
                                className="w-full h-full border-none"
                                src="/preview"
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
