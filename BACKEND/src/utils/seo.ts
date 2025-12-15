// seo.ts
import axios from 'axios';
import * as cheerio from 'cheerio';

export interface SEOResult {
  url: string;
  timestamp: string;
  score: number;
  basic: {
    title: string;
    description: string;
    keywords: string;
    canonical: string;
    robots: string;
    viewport: string;
    charset: string;
  };
}

// ---------- Helpers (UNCHANGED LOGIC) ----------

function extractTexts($: cheerio.CheerioAPI, selector: string): string[] {
  const texts: string[] = [];
  $(selector).each((_, element) => {
    const text = $(element).text().trim();
    if (text) texts.push(text);
  });
  return texts;
}

function analyzeImages($: cheerio.CheerioAPI) {
  let withoutAlt = 0;
  let withAlt = 0;

  $('img').each((_, element) => {
    const alt = $(element).attr('alt');
    alt ? withAlt++ : withoutAlt++;
  });

  return {
    total: withoutAlt + withAlt,
    withoutAlt,
    withAlt
  };
}

async function analyzeLinks(
  $: cheerio.CheerioAPI,
  url: string,
  baseUrl: string
) {
  const internalLinks = new Set<string>();
  const externalLinks = new Set<string>();

  $('a').each((_, element) => {
    const href = $(element).attr('href');
    if (!href || href.startsWith('#')) return;

    try {
      const absoluteUrl = new URL(href, url).href;
      absoluteUrl.startsWith(baseUrl)
        ? internalLinks.add(absoluteUrl)
        : externalLinks.add(absoluteUrl);
    } catch {}
  });

  return {
    internal: internalLinks.size,
    external: externalLinks.size
  };
}

function analyzeStructuredData($: cheerio.CheerioAPI) {
  let hasJSONLD = false;
  let hasMicrodata = false;

  $('script[type="application/ld+json"]').each(() => {
    hasJSONLD = true;
  });

  $('[itemscope]').each(() => {
    hasMicrodata = true;
  });

  return { hasJSONLD, hasMicrodata };
}

function checkMobileFriendly($: cheerio.CheerioAPI): boolean {
  const viewport = $('meta[name="viewport"]').attr('content') || '';
  return viewport.includes('width=');
}

function calculateScore(
  basic: SEOResult['basic'],
  headings: { h1: string[]; h2: string[]; h3: string[] },
  images: { total: number; withAlt: number },
  structuredData: { hasJSONLD: boolean; hasMicrodata: boolean },
  mobileFriendly: boolean,
  links: { internal: number; external: number }
): number {
  let score = 0;

  if (basic.title.length > 10 && basic.title.length < 60) score += 10;
  if (basic.description !== 'Not found') score += 10;
  if (headings.h1.length === 1) score += 10;
  if (images.total > 0 && images.withAlt === images.total) score += 15;
  if (basic.viewport !== 'Not found') score += 10;
  if (links.internal > 0) score += 5;
  if (links.external > 0) score += 5;
  if (mobileFriendly) score += 10;
  if (structuredData.hasJSONLD) score += 10;
  if (structuredData.hasMicrodata) score += 5;

  return Math.min(score, 65);
}

// ---------- MAIN FUNCTION ----------

export async function analyzeSEO(url: string): Promise<SEOResult> {
  try {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    const urlObj = new URL(url);
    const baseUrl = `${urlObj.protocol}//${urlObj.hostname}`;

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SEOAnalyzer/1.0)'
      },
      timeout: 10000,
      maxRedirects: 5
    });

    const $ = cheerio.load(response.data);

    const basic = {
      title: $('title').text().trim() || 'Not found',
      description: $('meta[name="description"]').attr('content') || 'Not found',
      keywords: $('meta[name="keywords"]').attr('content') || 'Not found',
      canonical: $('link[rel="canonical"]').attr('href') || 'Not found',
      robots: $('meta[name="robots"]').attr('content') || 'Not found',
      viewport: $('meta[name="viewport"]').attr('content') || 'Not found',
      charset:
        $('meta[charset]').attr('charset') ||
        $('meta[http-equiv="Content-Type"]').attr('content') ||
        'Not found'
    };

    const headings = {
      h1: extractTexts($, 'h1'),
      h2: extractTexts($, 'h2'),
      h3: extractTexts($, 'h3')
    };

    const images = analyzeImages($);
    const links = await analyzeLinks($, url, baseUrl);
    const structuredData = analyzeStructuredData($);
    const mobileFriendly = checkMobileFriendly($);

    const rawScore = calculateScore(
      basic,
      headings,
      images,
      structuredData,
      mobileFriendly,
      links
    );

    return {
      url,
      timestamp: new Date().toISOString(),
      score: Math.floor((rawScore / 65) * 100),
      basic
    };

  } catch (error: any) {
    throw new Error(`SEO analysis failed: ${error.message}`);
  }
}
