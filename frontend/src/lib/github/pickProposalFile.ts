import {
  proposalRefFromFileName,
  type ProposalRef,
  type ProposalRepoConfig,
} from "./proposalUrl";

/** The subset of GitHub's "list pull request files" response that we rely on. */
export interface PullRequestFile {
  /** Repo-relative path, NOT percent-encoded. */
  filename: string;
  status: string;
  /** `.../contents/{encoded path}?ref={head_sha}` — the only place the head SHA appears. */
  contents_url: string;
}

export interface PickedProposalFile {
  path: string;
  headSha: string;
  ref: ProposalRef | undefined;
}

/**
 * Picks the one proposal document out of a pull request's changed files.
 *
 * A real proposal PR touches more than the proposal: PR #3 on solana-governance-proposals
 * changes `README.md` and the root-level `XXXX-sgp-template.md` alongside
 * `proposals/sgp-0001-solana-constitution.md`. Only the last is the document we want.
 */
export function pickProposalFile(
  files: PullRequestFile[],
  config: ProposalRepoConfig,
): PickedProposalFile | undefined {
  const candidates = files
    .filter((file) => file.status !== "removed")
    .map((file) => {
      const fileName = basename(file.filename);
      const ref = proposalRefFromFileName(fileName, config);
      if (!ref) return undefined;
      if (
        config.proposalDir !== undefined &&
        dirname(file.filename) !== config.proposalDir
      ) {
        return undefined;
      }
      const headSha = headShaFromContentsUrl(file.contents_url);
      if (!headSha) return undefined;
      return { file, path: file.filename, headSha, ref };
    })
    .filter((candidate) => candidate !== undefined);

  if (candidates.length === 0) return undefined;

  candidates.sort((a, b) => {
    // A newly added file is the proposal itself; a modified one is more likely an edit
    // to something incidental.
    const added = score(b.file.status === "added") - score(a.file.status === "added");
    if (added !== 0) return added;

    const inProposalsDir =
      score(dirname(b.path) === "proposals") - score(dirname(a.path) === "proposals");
    if (inProposalsDir !== 0) return inProposalsDir;

    const depth = depthOf(a.path) - depthOf(b.path);
    if (depth !== 0) return depth;

    return Number(a.ref.number) - Number(b.ref.number);
  });

  const { path, headSha, ref } = candidates[0];
  return { path, headSha, ref };
}

/**
 * A pull request's files each carry the head SHA in their `contents_url` query string, so it
 * comes free with the file listing — no second API call to `/pulls/{n}` needed.
 */
export function headShaFromContentsUrl(
  contentsUrl: string,
): string | undefined {
  try {
    return new URL(contentsUrl).searchParams.get("ref") ?? undefined;
  } catch {
    return undefined;
  }
}

function basename(path: string): string {
  const parts = path.split("/");
  return parts[parts.length - 1] ?? "";
}

function dirname(path: string): string {
  const index = path.lastIndexOf("/");
  return index === -1 ? "" : path.slice(0, index);
}

function depthOf(path: string): number {
  return path.split("/").length;
}

function score(value: boolean): number {
  return value ? 1 : 0;
}
