import {
  headShaFromContentsUrl,
  pickProposalFile,
  type PullRequestFile,
} from "../pickProposalFile";
import { resolveRepoConfig, SGP_REPO, SIMD_REPO } from "../proposalUrl";

const HEAD_SHA = "27bca51e5c0fc34ddbea6904faf86f5098225316";

const sgpConfig = resolveRepoConfig({
  owner: "solana-foundation",
  repo: "solana-governance-proposals",
});
const simdConfig = resolveRepoConfig({
  owner: "solana-foundation",
  repo: "solana-improvement-documents",
});
const unknownConfig = resolveRepoConfig({ owner: "someone", repo: "fork" });

function file(
  filename: string,
  status = "added",
  repo = SGP_REPO,
  sha = HEAD_SHA,
): PullRequestFile {
  return {
    filename,
    status,
    contents_url: `https://api.github.com/repos/${repo}/contents/${encodeURIComponent(filename)}?ref=${sha}`,
  };
}

describe("pickProposalFile", () => {
  // The real payload of https://api.github.com/repos/solana-foundation/solana-governance-proposals/pulls/3/files
  const realPr3: PullRequestFile[] = [
    file("README.md", "modified"),
    file("XXXX-sgp-template.md", "modified"),
    file("proposals/sgp-0001-solana-constitution.md", "added"),
  ];

  it("picks the proposal document out of the real PR #3 payload", () => {
    expect(pickProposalFile(realPr3, sgpConfig)).toEqual({
      path: "proposals/sgp-0001-solana-constitution.md",
      headSha: HEAD_SHA,
      ref: { number: "0001", kind: "sgp", label: "SGP-0001" },
    });
  });

  it("excludes the root-level template even though it mentions sgp", () => {
    expect(
      pickProposalFile([file("XXXX-sgp-template.md", "modified")], sgpConfig),
    ).toBeUndefined();
  });

  it("excludes a proposal-shaped file outside the proposals directory", () => {
    expect(
      pickProposalFile([file("drafts/sgp-0009-thing.md")], sgpConfig),
    ).toBeUndefined();
  });

  it("prefers an added file over a modified one", () => {
    const picked = pickProposalFile(
      [
        file("proposals/sgp-0002-existing.md", "modified"),
        file("proposals/sgp-0003-new.md", "added"),
      ],
      sgpConfig,
    );
    expect(picked?.path).toBe("proposals/sgp-0003-new.md");
  });

  it("falls back to the lowest number when statuses tie", () => {
    const picked = pickProposalFile(
      [
        file("proposals/sgp-0009-b.md", "added"),
        file("proposals/sgp-0004-a.md", "added"),
      ],
      sgpConfig,
    );
    expect(picked?.path).toBe("proposals/sgp-0004-a.md");
  });

  it("skips removed files", () => {
    expect(
      pickProposalFile([file("proposals/sgp-0001-x.md", "removed")], sgpConfig),
    ).toBeUndefined();
  });

  it("returns undefined when a PR touches no proposal file", () => {
    expect(
      pickProposalFile([file("README.md", "modified")], sgpConfig),
    ).toBeUndefined();
  });

  it("returns undefined for an empty file list", () => {
    expect(pickProposalFile([], sgpConfig)).toBeUndefined();
  });

  it("handles a SIMD-repo pull request", () => {
    const picked = pickProposalFile(
      [
        file("README.md", "modified", SIMD_REPO),
        file("proposals/0099-new-thing.md", "added", SIMD_REPO),
      ],
      simdConfig,
    );
    expect(picked).toEqual({
      path: "proposals/0099-new-thing.md",
      headSha: HEAD_SHA,
      ref: { number: "0099", kind: "simd", label: "SIMD-0099" },
    });
  });

  it("allows any directory for an unknown repo", () => {
    const picked = pickProposalFile(
      [file("docs/0007-idea.md", "added", "someone/fork")],
      unknownConfig,
    );
    expect(picked?.path).toBe("docs/0007-idea.md");
  });

  it("skips a file whose contents_url carries no ref", () => {
    expect(
      pickProposalFile(
        [
          {
            filename: "proposals/sgp-0001-x.md",
            status: "added",
            contents_url: `https://api.github.com/repos/${SGP_REPO}/contents/proposals%2Fsgp-0001-x.md`,
          },
        ],
        sgpConfig,
      ),
    ).toBeUndefined();
  });
});

describe("headShaFromContentsUrl", () => {
  it("reads the ref query parameter", () => {
    expect(
      headShaFromContentsUrl(
        `https://api.github.com/repos/${SGP_REPO}/contents/proposals%2Fsgp-0001-solana-constitution.md?ref=${HEAD_SHA}`,
      ),
    ).toBe(HEAD_SHA);
  });

  it("returns undefined for a malformed URL", () => {
    expect(headShaFromContentsUrl("not a url")).toBeUndefined();
  });
});
