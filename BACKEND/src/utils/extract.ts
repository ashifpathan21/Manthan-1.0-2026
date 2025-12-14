import { promises as fs } from "fs";
import { PDFParse, type TextResult } from "pdf-parse";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

export async function extractTextAndMetadata(filePath: string) {
    const buffer = await fs.readFile(filePath);
    const parser = new PDFParse({ data: buffer });
    const result: TextResult = await parser.getText();
    const metadata = await parser.getInfo()
    const rawLinks = result.text?.match(/https?:\/\/[^\s)>"']+/g) || [];

    const uniqueLinks = Array.from(
        new Set(
            rawLinks
                .map(link => link.trim())
        )
    );

    return {
        text: result.text || "",
        metadata,
        textLinks: uniqueLinks || []
    };
}


export async function extractHyperlinks(filePath: string): Promise<string[]> {
    const buffer = new Uint8Array(await fs.readFile(filePath));

    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

    const uniqueLinks = new Set<string>();

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const annotations = await page.getAnnotations();

        for (const ann of annotations) {
            if (ann.subtype === "Link" && ann.url) {
                uniqueLinks.add(ann.url);
            }
        }
    }

    return [...uniqueLinks];
}
