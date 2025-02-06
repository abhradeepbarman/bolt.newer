import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";
import express, { Request, Response } from "express";
import { nextBaseFiles } from "./defaults/next";
import { reactBaseFiles } from "./defaults/react";
import {
    getSystemPrompt,
    NEXT_BASE_PROMPT,
    REACT_BASE_PROMPT,
} from "./prompts";
import cors from "cors";

const app = express();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: getSystemPrompt(),
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

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
            generationConfig: {
                maxOutputTokens: 8000,
                temperature: 0,
            },
            systemInstruction:
                "Return either node or react based on what do you think this project should be. Only return a single word 'next' or 'react'. Do not return anything extra",
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
                    `Project Files:\n\nThe following is a list of all project files and their complete contents that are currently visible and accessible to you.\n\n${reactBaseFiles}\n\n \n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n  - .bolt/prompt`,
                ],
                uiPrompts: reactBaseFiles,
            });
            return;
        }

        if (answer === "next") {
            res.status(200).json({
                prompts: [
                    NEXT_BASE_PROMPT,
                    `Project Files:\n\nThe following is a list of all project files and their complete contents that are currently visible and accessible to you.\n\n${nextBaseFiles}`,
                ],
                uiPrompts: nextBaseFiles,
            });
            return;
        }

        res.status(403).json({
            message: "You can't access this",
            error: "You can't access this",
            prompts: [],
            uiPrompts: [],
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "An error occurred" });
    }
});

app.post("/chat", async (req: Request, res: Response) => {
    const messages = req.body.messages;

    try {
        const result = await model.generateContent({
            contents: messages,
            generationConfig: {
                maxOutputTokens: 8000,
                temperature: 0,
            },
        });

        res.status(200).json({
            artifect: result.response.text(),
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "An error occurred" });
    }
});

app.listen(3000, () => {
    console.log("Server started on port 3000");
});
