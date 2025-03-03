import Editor from "@monaco-editor/react";
import axios from "axios";
import {
    CheckCircle,
    ChevronDown,
    ChevronRight,
    Code,
    Eye,
    File,
    Folder,
    Menu,
    X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { BACKEND_URL } from "../config/config";
import { Step, StepType } from "../types";
import { parseXmltoSteps } from "../utils/steps";
import { useWebContainer } from "../hooks/useWebContainer";

interface FileStructure {
    name: string;
    type: "file" | "folder";
    content?: string;
    children?: FileStructure[];
    isOpen?: boolean;
    path?: string;
}

interface LocationState {
    prompt: string;
}

type Tab = "code" | "preview";
type StepStatus = "pending" | "in-progress" | "completed";

interface FileExplorerProps {
    items: FileStructure[];
    level?: number;
    onFileSelect: (fileName: string) => void;
    selectedFile: string | null;
    onFolderToggle: (item: FileStructure) => void;
}

interface MountStructure {
    [key: string]: {
        directory?: {
            [key: string]: any;
        };
        file?: {
            contents: string;
        };
    };
}

const FileExplorer: React.FC<FileExplorerProps> = ({
    items,
    level = 0,
    onFileSelect,
    selectedFile,
    onFolderToggle,
}) => (
    <div style={{ paddingLeft: level ? "1.5rem" : "0" }}>
        {items.map((item) => (
            <div key={item.name}>
                <div
                    className={`flex items-center py-1 px-2 hover:bg-gray-700/50 cursor-pointer ${
                        selectedFile === item.name ? "bg-gray-700/50" : ""
                    }`}
                    onClick={() => {
                        if (item.type === "file") {
                            onFileSelect(item.name);
                        } else {
                            onFolderToggle(item);
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
                    <span className="text-gray-200 text-sm">{item.name}</span>
                </div>
                {item.type === "folder" && item.isOpen && item.children && (
                    <FileExplorer
                        items={item.children}
                        level={level + 1}
                        onFileSelect={onFileSelect}
                        selectedFile={selectedFile}
                        onFolderToggle={onFolderToggle}
                    />
                )}
            </div>
        ))}
    </div>
);

export default function BuilderPage() {
    const webcontainer = useWebContainer();

    const location = useLocation();
    const { prompt: userPrompt } = (location.state as LocationState) || {
        prompt: "",
    };
    const [updatePrompt, setUpdatePrompt] = useState("");
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>("code");
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isFileExplorerOpen, setIsFileExplorerOpen] = useState(true);
    const [fileStructure, setFileStructure] = useState<FileStructure[]>([]);
    const [steps, setSteps] = useState<Step[]>([]);
    const [url, setUrl] = useState("");
    const [llmMessages, setLLMMessages] = useState<
        { role: "user" | "assistant"; parts: { text: string }[] }[]
    >([]);

    const handleFileSelect = (fileName: string) => {
        setSelectedFile(fileName);
        if (window.innerWidth < 768) {
            setIsFileExplorerOpen(false);
        }
    };

    const handleFolderToggle = (item: FileStructure) => {
        setFileStructure((prevStructure) => {
            const updateStructure = (
                items: FileStructure[]
            ): FileStructure[] => {
                return items.map((i) => {
                    if (i.name === item.name) {
                        return { ...i, isOpen: !i.isOpen };
                    }
                    if (i.children) {
                        return { ...i, children: updateStructure(i.children) };
                    }
                    return i;
                });
            };
            return updateStructure(prevStructure);
        });
    };

    async function startDevServer() {
        if (!webcontainer) return;

        try {
            console.log("Starting dev server...");

            // First, install dependencies
            console.log("Installing dependencies...");
            const installProcess = await webcontainer.spawn("npm", ["install"]);
            const installExitCode = await installProcess.exit;

            if (installExitCode !== 0) {
                throw new Error("Failed to install dependencies");
            }

            // Start the dev server
            console.log("Starting server...");
            const devProcess = await webcontainer.spawn("npm", ["run", "dev"]);

            // Listen for server output to detect when it's ready
            devProcess.output.pipeTo(
                new WritableStream({
                    write(data) {
                        if (data.includes("Local:")) {
                            console.log("Server is ready!");
                        }
                    },
                })
            );

            // Listen for server-ready event
            webcontainer.on("server-ready", (port, serverUrl) => {
                console.log("Server ready at:", serverUrl);
                setUrl(serverUrl);
            });
        } catch (error) {
            console.error("Failed to start dev server:", error);
            // Add error handling UI if needed
        }
    }

    useEffect(() => {
        let originalFiles = [...fileStructure];
        let updateHappened = false;
        steps
            .filter(({ status }) => status === "pending")
            .map((step) => {
                updateHappened = true;
                if (step?.type === StepType.CreateFile) {
                    let parsedPath = step.path?.split("/") ?? []; // ["src", "components", "App.tsx"]
                    let currentFileStructure = [...originalFiles]; // {}
                    const finalAnswerRef = currentFileStructure;

                    let currentFolder = "";
                    while (parsedPath.length) {
                        currentFolder = `${currentFolder}/${parsedPath[0]}`;
                        const currentFolderName = parsedPath[0];
                        parsedPath = parsedPath.slice(1);

                        if (!parsedPath.length) {
                            // final file
                            const file = currentFileStructure.find(
                                (x) => x.path === currentFolder
                            );
                            if (!file) {
                                currentFileStructure.push({
                                    name: currentFolderName,
                                    type: "file",
                                    path: currentFolder,
                                    content: step.code,
                                });
                            } else {
                                file.content = step.code;
                            }
                        } else {
                            /// in a folder
                            const folder = currentFileStructure.find(
                                (x) => x.path === currentFolder
                            );
                            if (!folder) {
                                // create the folder
                                currentFileStructure.push({
                                    name: currentFolderName,
                                    type: "folder",
                                    path: currentFolder,
                                    children: [],
                                });
                            }

                            currentFileStructure = currentFileStructure.find(
                                (x) => x.path === currentFolder
                            )!.children!;
                        }
                    }
                    originalFiles = finalAnswerRef;
                }
            });

        if (updateHappened) {
            setFileStructure(originalFiles);
            setSteps((steps) =>
                steps.map((s: Step) => {
                    return {
                        ...s,
                        status: "completed",
                    };
                })
            );
        }
    }, [steps, fileStructure]);

    const init = async () => {
        try {
            const response = await axios.post(`${BACKEND_URL}/template`, {
                prompt: userPrompt,
            });

            const { prompts, uiPrompts } = response.data;
            const parsedSteps = parseXmltoSteps(uiPrompts).map((step) => ({
                ...step,
                status: "pending" as StepStatus,
            }));
            setSteps(parsedSteps);

            const stepsResponse = await axios.post(`${BACKEND_URL}/chat`, {
                messages: [...prompts, userPrompt].map((content) => ({
                    role: "user",
                    parts: [{ text: content }],
                })),
            });

            setLLMMessages(
                [...prompts, userPrompt].map((content) => ({
                    role: "user",
                    parts: [{ text: content }],
                }))
            );

            setLLMMessages((x) => [
                ...x,
                {
                    role: "assistant",
                    parts: [{ text: stepsResponse.data.artifect }],
                },
            ]);

            setSteps((s) => [
                ...s,
                ...parseXmltoSteps(stepsResponse.data.artifect).map((x) => ({
                    ...x,
                    status: "pending" as StepStatus,
                })),
            ]);
        } catch (error) {
            console.error("Failed to initialize:", error);
        }
    };

    const convertToMountStructure = (
        files: FileStructure[]
    ): MountStructure => {
        const result: MountStructure = {};

        const processFile = (
            file: FileStructure,
            parentPath: string = ""
        ): MountStructure => {
            const currentPath = parentPath
                ? `${parentPath}/${file.name}`
                : file.name;

            if (file.type === "folder") {
                const directoryContent: MountStructure = {};

                file.children?.forEach((child) => {
                    const childResult = processFile(child, currentPath);
                    Object.assign(directoryContent, childResult);
                });

                return {
                    [file.name]: {
                        directory: directoryContent,
                    },
                };
            } else {
                return {
                    [file.name]: {
                        file: {
                            contents: file.content || "",
                        },
                    },
                };
            }
        };

        files.forEach((file) => {
            const processed = processFile(file);
            Object.assign(result, processed);
        });

        return result;
    };

    const mountFolderToWebContainer = async (mountStructure) => {
        await webcontainer?.mount(mountStructure);
    };

    useEffect(() => {
        const originalFiles = [...fileStructure];
        const mountStructure = convertToMountStructure(originalFiles);
        console.log("mount structure", mountStructure);
        mountFolderToWebContainer(mountStructure);
    }, [fileStructure]);

    useEffect(() => {
        if (userPrompt) {
            init();
        }
    }, [userPrompt]);

    const getSelectedFileContent = () => {
        const findFileContent = (
            items: FileStructure[]
        ): string | undefined => {
            for (const item of items) {
                if (item.name === selectedFile) {
                    return item.content;
                }
                if (item.children) {
                    const content = findFileContent(item.children);
                    if (content) return content;
                }
            }
            return undefined;
        };
        return findFileContent(fileStructure) || "// Select a file to edit";
    };

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
                        onClick={() => {
                            setActiveTab("preview");
                        }}
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
                <div className="h-full w-80 bg-gray-800/50 border-r border-gray-700 overflow-y-auto">
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
                    <div className="p-4 space-y-2 mb-40">
                        {steps.map((step, index) => (
                            <div
                                key={index}
                                className="p-2 bg-gray-800/50 rounded border border-gray-700/50 flex items-center gap-2"
                            >
                                {step.status === "pending" ? (
                                    "🟡"
                                ) : step.status === "in-progress" ? (
                                    "🟢"
                                ) : (
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                )}
                                <span>{step.title}</span>
                            </div>
                        ))}
                    </div>
                    <div className="fixed bottom-0 w-full">
                        <div className="flex">
                            <textarea
                                className="w-full py-5 text-black"
                                onChange={(e) =>
                                    setUpdatePrompt(e.target.value)
                                }
                                placeholder="Enter your prompt here"
                                value={updatePrompt}
                            />
                            <button
                                className="bg-purple-400 px-5 "
                                onClick={async () => {
                                    const newMessage = {
                                        role: "user",
                                        parts: [{ text: updatePrompt }],
                                    };
                                    const stepsUpdateResponse =
                                        await axios.post(
                                            `${BACKEND_URL}/chat`,
                                            {
                                                messages: [
                                                    ...llmMessages,
                                                    newMessage,
                                                ],
                                            }
                                        );

                                    setSteps((s) => [
                                        ...s,
                                        ...parseXmltoSteps(
                                            stepsUpdateResponse.data.artifect
                                        ).map((x) => ({
                                            ...x,
                                            status: "pending" as StepStatus,
                                        })),
                                    ]);
                                }}
                            >
                                Send
                            </button>
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
                        onClick={() => {
                            setActiveTab("preview");
                            startDevServer();
                        }}
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
                                    <FileExplorer
                                        items={fileStructure}
                                        onFileSelect={handleFileSelect}
                                        selectedFile={selectedFile}
                                        onFolderToggle={handleFolderToggle}
                                    />
                                </div>
                            </div>

                            {/* Code Editor */}
                            <div className="flex-1 bg-gray-900 min-w-0">
                                {selectedFile ? (
                                    <Editor
                                        height="100%"
                                        defaultLanguage="typescript"
                                        theme="vs-dark"
                                        value={getSelectedFileContent()}
                                        options={{
                                            minimap: { enabled: false },
                                            fontSize: 14,
                                            wordWrap: "on",
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
                                src={url}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
