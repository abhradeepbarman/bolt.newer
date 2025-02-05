import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
    getSystemPrompt,
    NEXT_BASE_PROMPT,
    REACT_BASE_PROMPT,
} from "./prompts";
import express, { Request, RequestHandler, Response } from "express";
import { basePrompt as reactBaseCodePrompt } from "./defaults/react";
import { basePrompt as nextBaseCodePrompt } from "./defaults/next";

const app = express();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: getSystemPrompt(),
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post("/template", async (req: Request, res: Response): Promise<void> => {
    const prompt = req.body.prompt;

    try {
        const result = await model.generateContent({
            contents: [
                {
                    role: "user",
                    parts: [
                        {
                            text: prompt,
                        },
                    ],
                },
            ],
            systemInstruction:
                "Return either node or react based on what do you think this project should be. Only return a single word 'next' or 'react'. Do not return anything extra",
            generationConfig: {
                maxOutputTokens: 8000,
                temperature: 0,
            },
        });

        const answer = result.response.text().trim();

        if (answer !== "react" && answer !== "next") {
            res.status(403).json({
                message: "You can't access this",
            });
            return;
        }

        if (answer === "react") {
            res.status(200).json({
                prompts: [
                    REACT_BASE_PROMPT,
                    `Project Files:\n\nThe following is a list of all project files and their complete contents that are currently visible and accessible to you.\n\n${reactBaseCodePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n  - .bolt/prompt`,
                ],
                uiPrompt: [reactBaseCodePrompt],
            });
            return;
        }

        if (answer === "next") {
            res.status(200).json({
                prompts: [
                    NEXT_BASE_PROMPT,
                    `Project Files:\n\nThe following is a list of all project files and their complete contents that are currently visible and accessible to you.\n\n${nextBaseCodePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n  - .bolt/prompt`,
                ],
                uiPrompt: [nextBaseCodePrompt],
            });
            return;
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "An error occurred" });
    }
});

// async function main() {
//     const prompt = "write code for a TODO application in reactjs";
//     const result = await model.generateContentStream({
//         contents: [
//             {
//                 role: "user",
//                 parts: [
//                     {
//                         text: "Project Files:\n\nThe following is a list of all project files and their complete contents that are currently visible and accessible to you.\n\n{{BASE_PROMPT}}\n\n```\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n  - .bolt/prompt",
//                     },
//                 ],
//             },
//             {
//                 role: "user",
//                 parts: [
//                     {
//                         text: "For all designs I ask you to make, have them be beautiful, not cookie cutter. Make webpages that are fully featured and worthy for production.\n\nBy default, this template supports JSX syntax with Tailwind CSS classes, React hooks, and Lucide React for icons. Do not install other packages for UI themes, icons, etc unless absolutely necessary or I request them.\n\nUse icons from lucide-react for logos.\n\nUse stock photos from unsplash where appropriate, only valid URLs you know exist. Do not download the images, only link to them in image tags.",
//                     },
//                 ],
//             },
//             {
//                 role: "user",
//                 parts: [
//                     {
//                         text: "<bolt_running_commands>\n</bolt_running_commands>\n\nCurrent Message:\n\ncreate a simple todo app\n\nFile Changes:\n\nHere is a list of all files that have been modified since the start of the conversation.\nThis information serves as the true contents of these files!\n\nThe contents include either the full file contents or a diff (when changes are smaller and localized).\n\nUse it to:\n - Understand the latest file modifications\n - Ensure your suggestions build upon the most recent version of the files\n - Make informed decisions about changes\n - Ensure suggestions are compatible with existing code\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - /home/project/.bolt/config.json",
//                     },
//                 ],
//             },
//         ],
//         generationConfig: {
//             maxOutputTokens: 8000,
//             temperature: 0,
//         },
//     });

//     for await (const chunk of result.stream) {
//         const chunkText = chunk.text();
//         process.stdout.write(chunkText);
//     }
// }

// main();

app.listen(3000, () => {
    console.log("Server started on port 3000");
});
