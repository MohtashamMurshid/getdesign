import {
  GITHUB_REPO_NAME,
  GITHUB_REPO_OWNER,
  SITE_GITHUB_URL,
  SITE_RELEASES_URL,
} from "./site";

const GH_API = "https://api.github.com";
const STUDIO_TAG_PREFIX = "studio-v";
const REVALIDATE_SECONDS = 60 * 60;

type GithubAsset = {
  name: string;
  browser_download_url: string;
  download_count: number;
  size: number;
};

type GithubRelease = {
  tag_name: string;
  name: string | null;
  html_url: string;
  published_at: string | null;
  prerelease: boolean;
  draft: boolean;
  assets: GithubAsset[];
};

export type StudioRelease = {
  version: string;
  tag: string;
  htmlUrl: string;
  publishedAt: string | null;
  totalDownloads: number;
  mac: { dmg: string | null; zip: string | null };
  win: { exe: string | null };
  linux: { appImage: string | null; deb: string | null };
};

export type RepoStats = {
  stars: number;
  htmlUrl: string;
};

function ghHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  const token = process.env.GITHUB_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

function pickAsset(
  assets: GithubAsset[],
  predicate: (name: string) => boolean,
): GithubAsset | undefined {
  return assets.find((a) => predicate(a.name.toLowerCase()));
}

function mapRelease(release: GithubRelease): StudioRelease {
  const assets = release.assets ?? [];
  const total = assets.reduce((sum, a) => sum + (a.download_count ?? 0), 0);
  const dmg = pickAsset(assets, (n) => n.endsWith(".dmg"));
  const zip = pickAsset(assets, (n) => n.endsWith(".zip") && n.includes("mac"));
  const exe = pickAsset(assets, (n) => n.endsWith(".exe"));
  const appImage = pickAsset(assets, (n) => n.endsWith(".appimage"));
  const deb = pickAsset(assets, (n) => n.endsWith(".deb"));

  return {
    version: release.tag_name.replace(/^studio-v/, ""),
    tag: release.tag_name,
    htmlUrl: release.html_url,
    publishedAt: release.published_at,
    totalDownloads: total,
    mac: {
      dmg: dmg?.browser_download_url ?? null,
      zip: zip?.browser_download_url ?? null,
    },
    win: { exe: exe?.browser_download_url ?? null },
    linux: {
      appImage: appImage?.browser_download_url ?? null,
      deb: deb?.browser_download_url ?? null,
    },
  };
}

function fallbackRelease(): StudioRelease {
  return {
    version: "0.0.0",
    tag: "studio-v0.0.0",
    htmlUrl: SITE_RELEASES_URL,
    publishedAt: null,
    totalDownloads: 0,
    mac: { dmg: SITE_RELEASES_URL, zip: null },
    win: { exe: SITE_RELEASES_URL },
    linux: { appImage: SITE_RELEASES_URL, deb: null },
  };
}

export async function getLatestStudioRelease(): Promise<StudioRelease> {
  try {
    const res = await fetch(
      `${GH_API}/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/releases?per_page=30`,
      {
        headers: ghHeaders(),
        next: { revalidate: REVALIDATE_SECONDS },
      },
    );
    if (!res.ok) return fallbackRelease();
    const releases = (await res.json()) as GithubRelease[];
    const studio = releases
      .filter((r) => !r.draft && !r.prerelease)
      .filter((r) => r.tag_name.startsWith(STUDIO_TAG_PREFIX))
      .sort((a, b) => {
        const ta = a.published_at ? Date.parse(a.published_at) : 0;
        const tb = b.published_at ? Date.parse(b.published_at) : 0;
        return tb - ta;
      })[0];
    if (!studio) return fallbackRelease();
    return mapRelease(studio);
  } catch {
    return fallbackRelease();
  }
}

export async function getRepoStats(): Promise<RepoStats> {
  try {
    const res = await fetch(
      `${GH_API}/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}`,
      {
        headers: ghHeaders(),
        next: { revalidate: REVALIDATE_SECONDS },
      },
    );
    if (!res.ok) return { stars: 0, htmlUrl: SITE_GITHUB_URL };
    const data = (await res.json()) as { stargazers_count?: number };
    return {
      stars: data.stargazers_count ?? 0,
      htmlUrl: SITE_GITHUB_URL,
    };
  } catch {
    return { stars: 0, htmlUrl: SITE_GITHUB_URL };
  }
}

export function formatCount(n: number): string {
  if (n < 1000) return n.toLocaleString();
  if (n < 10_000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return Math.round(n / 1000) + "k";
}
