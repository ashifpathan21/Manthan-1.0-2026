import puppeteer from "puppeteer";

export const getHTML = async (
  url: string
): Promise<{ success: boolean; html?: string; error?: string }> => {
  let browser;

  try {
    if (!url || !url.startsWith("http")) {
      return {
        success: false,
        error: "Invalid URL",
      };
    }

    browser = await puppeteer.launch({
      headless: true, 
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(30000);

    await page.goto(url, { waitUntil: "networkidle2" });

    const html = await page.content();

    return {
      success: true,
      html,
    };

  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Unknown error",
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};
