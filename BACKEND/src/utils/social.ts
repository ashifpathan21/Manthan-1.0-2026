import axios from "axios";
import { config } from "dotenv";
config();

/* ======================= TYPES ======================= */

export type SocialProfile = {
  platform: string;
  username?: string;
  profileUrl: string;
  avatar?: string;
  stats?: Record<string, number | string | object>;
  raw?: any;
  error?: string;
};

/* ======================= HELPERS ======================= */

function extractUsername(url: string): string | null {
  try {
    const u = new URL(url);
    return u.pathname.split("/").filter(Boolean).pop() || null;
  } catch {
    return null;
  }
}

const GITHUB_HEADERS = {
  Accept: "application/vnd.github+json",
  Authorization: `Bearer ${process.env.GITHUB_TOKEN}`
};

/* ======================= GITHUB (ADVANCED TECH ANALYSIS) ======================= */

async function analyzeGitHubRepos(username: string) {
  const reposRes = await axios.get(
    `https://api.github.com/users/${username}/repos?per_page=50`,
    { headers: GITHUB_HEADERS }
  );

  const techFrequency: Record<string, number> = {};

  const bump = (key: string, value = 1) => {
    techFrequency[key] = (techFrequency[key] || 0) + value;
  };

  for (const repo of reposRes.data) {
    if (repo.fork || repo.size < 100) continue;

    let files: string[] = [];

    try {
      const treeRes = await axios.get(
        `https://api.github.com/repos/${username}/${repo.name}/git/trees/${repo.default_branch}?recursive=1`,
        { headers: GITHUB_HEADERS }
      );
      files = treeRes.data.tree.map((f: any) => f.path.toLowerCase());
    } catch {
      continue;
    }

    /* ---------- FILE EXTENSION SIGNAL ---------- */

    for (const file of files) {
      if (file.endsWith(".tsx")) {
        bump("react", 2);
        bump("typescript", 2);
      } else if (file.endsWith(".jsx")) {
        bump("react", 2);
        bump("javascript");
      } else if (file.endsWith(".ts")) {
        bump("typescript");
      } else if (file.endsWith(".js")) {
        bump("javascript");
      } else if (file.endsWith(".cpp") || file.endsWith(".hpp")) {
        bump("c++", 2);
      } else if (file.endsWith(".py")) {
        bump("python");
      } else if (file.endsWith(".java")) {
        bump("java");
      }
    }

    /* ---------- CONFIG FILE SIGNAL ---------- */

    if (files.some(f => f.includes("tailwind.config"))) bump("tailwindcss", 4);
    if (files.some(f => f.includes("next.config"))) bump("nextjs", 4);
    if (files.some(f => f.includes("vite.config"))) bump("vite", 3);
    if (files.some(f => f.includes("webpack.config"))) bump("webpack", 2);
    if (files.some(f => f.includes("tsconfig"))) bump("typescript", 2);
    if (files.some(f => f.includes("dockerfile"))) bump("docker", 2);

    /* ---------- BACKEND SIGNAL ---------- */

    if (files.some(f => f.includes("prisma/schema.prisma"))) bump("prisma", 4);
    if (files.some(f => f.includes("mongoose"))) bump("mongodb");
    if (files.some(f => f.includes("socket.io"))) bump("socket.io", 2);

    /* ---------- PACKAGE.JSON (STRONGEST SIGNAL) ---------- */

    const pkgPaths = files.filter(f => f.endsWith("package.json"));

    for (const pkgPath of pkgPaths) {
      try {
        const pkgRes = await axios.get(
          `https://api.github.com/repos/${username}/${repo.name}/contents/${pkgPath}`,
          { headers: GITHUB_HEADERS }
        );

        const pkg = JSON.parse(
          Buffer.from(pkgRes.data.content, "base64").toString()
        );

        const deps = {
          ...pkg.dependencies,
          ...pkg.devDependencies
        };

        if (deps.react) bump("react", 5);
        if (deps.next) bump("nextjs", 5);
        if (deps.express) bump("express", 4);
        if (deps["@nestjs/core"]) bump("nestjs", 5);
        if (deps.tailwindcss) bump("tailwindcss", 5);
        if (deps.redux || deps["@reduxjs/toolkit"]) bump("redux", 4);
        if (deps.zustand) bump("zustand", 3);
        if (deps.vite) bump("vite", 4);
        if (deps["react-scripts"]) bump("cra", 3);
        if (deps.mongoose) bump("mongodb", 4);
        if (deps.prisma) bump("prisma", 4);
        if (deps["socket.io"]) bump("socket.io", 4);
      } catch {
        continue;
      }
    }

    /* ---------- PYTHON / C++ ---------- */

    if (files.includes("requirements.txt") || files.includes("pyproject.toml")) {
      bump("python", 4);
    }

    if (files.includes("cmakelists.txt")) {
      bump("c++", 4);
    }

    /* ---------- FOLDER HEURISTICS ---------- */

    if (files.some(f => f.startsWith("frontend/") || f.startsWith("client/"))) {
      bump("frontend-architecture", 2);
    }

    if (files.some(f => f.startsWith("backend/") || f.startsWith("server/"))) {
      bump("backend-architecture", 2);
    }
  }

  return techFrequency;
}

async function fetchGitHub(url: string): Promise<SocialProfile> {
  const username = extractUsername(url);
  if (!username) throw new Error("Invalid GitHub URL");

  const profileRes = await axios.get(
    `https://api.github.com/users/${username}`,
    { headers: GITHUB_HEADERS }
  );

  const techFrequency = await analyzeGitHubRepos(username);

  return {
    platform: "github",
    username,
    profileUrl: url,
    avatar: profileRes.data.avatar_url,
    stats: {
      followers: profileRes.data.followers,
      publicRepos: profileRes.data.public_repos,
      techFrequency
    },
    raw: profileRes.data
  };
}

/* ======================= CODEFORCES ======================= */

async function fetchCodeforces(url: string): Promise<SocialProfile> {
  const username = extractUsername(url);
  if (!username) throw new Error("Invalid Codeforces URL");

  const res = await axios.get(
    `https://codeforces.com/api/user.info?handles=${username}`
  );

  const user = res.data.result[0];

  return {
    platform: "codeforces",
    username,
    profileUrl: url,
    avatar: user.avatar,
    stats: {
      rating: user.rating,
      maxRating: user.maxRating,
      rank: user.rank,
      contribution: user.contribution
    },
    raw: user
  };
}

/* ======================= LEETCODE (EASY / MEDIUM / HARD) ======================= */

async function fetchLeetCode(url: string): Promise<SocialProfile> {
  const username = extractUsername(url);
  if (!username) throw new Error("Invalid LeetCode URL");

  const query = {
    query: `
      query userProblemsSolved($username: String!) {
        matchedUser(username: $username) {
          profile {
            userAvatar
          }
          submitStatsGlobal {
            acSubmissionNum {
              difficulty
              count
            }
          }
        }
      }
    `,
    variables: { username }
  };

  const res = await axios.post("https://leetcode.com/graphql", query);
  const data = res.data.data.matchedUser;

  const stats: Record<string, number> = {
    Easy: 0,
    Medium: 0,
    Hard: 0,
    All: 0
  };

  for (const s of data.submitStatsGlobal.acSubmissionNum) {
    stats[s.difficulty] = s.count;
  }

  return {
    platform: "leetcode",
    username,
    profileUrl: url,
    avatar: data.profile?.userAvatar,
    stats,
    raw: data
  };
}

/* ======================= CODECHEF ======================= */

async function fetchCodeChef(url: string): Promise<SocialProfile> {
  const username = extractUsername(url);
  if (!username) throw new Error("Invalid CodeChef URL");

  const res = await axios.get(`https://www.codechef.com/users/${username}`);
  const ratingMatch = res.data.match(/rating-number">(\d+)/);

  return {
    platform: "codechef",
    username,
    profileUrl: url,
    stats: {
      rating: ratingMatch ? Number(ratingMatch[1]) : 0
    }
  };
}

/* ======================= GFG ======================= */

async function fetchGFG(url: string): Promise<SocialProfile> {
  const username = extractUsername(url);
  if (!username) throw new Error("Invalid GFG URL");

  const res = await axios.get(url);
  const scoreMatch = res.data.match(
    /Overall Coding Score<\/div>\s*<div[^>]*>(\d+)/
  );

  return {
    platform: "gfg",
    username,
    profileUrl: url,
    stats: {
      score: scoreMatch ? Number(scoreMatch[1]) : 0
    }
  };
}

/* ======================= LINKEDIN ======================= */

function fetchLinkedIn(url: string): SocialProfile {
  return {
    platform: "linkedin",
    profileUrl: url,
    error: "LinkedIn scraping disabled (ToS & legal risk)"
  };
}

/* ======================= MASTER AGGREGATOR ======================= */

export async function fetchAllSocialProfiles(social: {
  github?: string;
  leetcode?: string;
  codeforces?: string;
  codechef?: string;
  gfg?: string;
  linkedin?: string;
}): Promise<SocialProfile[]> {
  const results: SocialProfile[] = [];
  const tasks: Promise<SocialProfile>[] = [];

  if (social.github) tasks.push(fetchGitHub(social.github));
  if (social.leetcode) tasks.push(fetchLeetCode(social.leetcode));
  if (social.codeforces) tasks.push(fetchCodeforces(social.codeforces));
  if (social.codechef) tasks.push(fetchCodeChef(social.codechef));
  if (social.gfg) tasks.push(fetchGFG(social.gfg));

  if (social.linkedin) {
    results.push(fetchLinkedIn(social.linkedin));
  }

  const settled = await Promise.allSettled(tasks);

  for (const s of settled) {
    if (s.status === "fulfilled") results.push(s.value);
    else
      results.push({
        platform: "unknown",
        profileUrl: "",
        error: s.reason?.message || "Failed to fetch"
      });
  }

  return results;
}
