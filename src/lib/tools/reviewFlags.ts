// Automatic review triage for client tool submissions.
//
// The problem this solves: every form, worksheet and checklist used to be
// approved automatically, on a flag the browser itself supplied, so nothing
// a client submitted ever reached a human. Sending all of it to review
// instead would mean six to eight reviews per client per kit, which is not
// survivable for a small team.
//
// So the server checks each submission against the failure patterns the
// Certified Advisor Training already names, and only the submissions that
// trip one of them are held for a person. A clean submission is approved
// on the spot. A flagged one arrives with the reason attached, so the
// reviewer opens it already knowing what to look at.
//
// This is triage, not judgement. It catches the mechanical failures a
// person should not have to hunt for. It cannot tell whether an authority
// structure is sound, which is exactly why flagged work still goes to a
// human and why any reviewer can still pull an approved submission back.

export type ReviewFlag = {
  code: string;
  message: string;
};

// Answers that look like an answer but govern nothing.
const PLACEHOLDER_PATTERNS = [
  /^n\/?a$/i,
  /^tbd$/i,
  /^tba$/i,
  /^none$/i,
  /^no$/i,
  /^pending$/i,
  /^later$/i,
  /^\?+$/,
  /^-+$/,
  /^same$/i,
  /^same as above$/i,
  /^see above$/i,
  /^will do$/i,
  /^not yet$/i,
  /^unknown$/i,
  /^test$/i,
];

// Founder dependency, the Tier 4 and Tier 3 failure pattern. A governance
// answer names a role. These name a person or nobody at all.
const FOUNDER_DEPENDENT_PATTERNS = [
  /\bjust me\b/i,
  /\bonly me\b/i,
  /\bme\b.*\bonly\b/i,
  /\bmyself\b/i,
  /\bi do (it|them|this|everything)\b/i,
  /\bi handle (it|this|everything)\b/i,
  /\beveryone\b/i,
  /\bwhoever\b/i,
  /\banyone\b/i,
];

// Words that signal the answer is about approving or spending money. If an
// answer is about a threshold and carries no number, it is not a threshold.
const THRESHOLD_CONTEXT = /\b(approv|spend|threshold|limit|authori[sz]|sign|purchase|withdraw|reimburse)/i;

const MIN_GOVERNING_LENGTH = 15;

function isBlank(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

function isPlaceholder(value: string): boolean {
  const trimmed = value.trim();
  return PLACEHOLDER_PATTERNS.some((p) => p.test(trimmed));
}

// Walks every written answer in a submission, whatever shape it arrived in.
// Forms save a flat object, worksheets save { entries: [] }, checklists save
// { items: [] }, uploads save { sections: {} }. Rather than special casing
// each, collect every string value with the key that carried it.
// Storage bookkeeping, not answers a client wrote. Walking into these
// produced nonsense flags, such as a file path being called too brief to
// govern.
const NON_ANSWER_KEYS = new Set(["path", "fileName", "file_name", "file_path", "id", "uploaded_at"]);

function collectAnswers(data: any, keyPath = ""): { key: string; value: string }[] {
  if (data === null || data === undefined) return [];
  if (NON_ANSWER_KEYS.has(keyPath)) return [];

  if (typeof data === "string") {
    return [{ key: keyPath, value: data }];
  }

  if (Array.isArray(data)) {
    return data.flatMap((entry) => collectAnswers(entry, keyPath));
  }

  if (typeof data === "object") {
    return Object.entries(data).flatMap(([key, value]) =>
      collectAnswers(value, key)
    );
  }

  return [];
}

// Booleans a client set to false, and selects that name a practice as absent.
// On the SOP Independence Test a single No is a documented failure, and on
// the Inconsistency Audit anything short of Happens Every Time is the gap
// the tool exists to surface.
function collectSelfDeclaredGaps(data: any): string[] {
  const gaps: string[] = [];

  const walk = (node: any) => {
    if (node === null || node === undefined) return;
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (typeof node !== "object") return;

    for (const [key, value] of Object.entries(node)) {
      if (typeof value === "boolean" && value === false) {
        gaps.push(key);
      } else if (typeof value === "string") {
        if (/does not happen|happens sometimes|not documented|no evidence/i.test(value)) {
          gaps.push(key);
        }
      } else {
        walk(value);
      }
    }
  };

  walk(data);
  return gaps;
}

export function flagSubmission(params: {
  toolName: string;
  submittedData: any;
}): ReviewFlag[] {
  const { toolName, submittedData } = params;
  const flags: ReviewFlag[] = [];

  const answers = collectAnswers(submittedData);
  const written = answers.filter((a) => typeof a.value === "string");

  // An upload tool's submission is the files, so silence on the written
  // side is expected there and is not a finding.
  const carriesDocuments = Boolean(submittedData?.sections);

  // Nothing written at all. Completeness is the floor, not the standard.
  if (written.length === 0 && !carriesDocuments) {
    flags.push({
      code: "empty_submission",
      message: "The submission contains no written answers.",
    });
  }

  const blankKeys = answers
    .filter((a) => isBlank(a.value))
    .map((a) => a.key)
    .filter(Boolean);
  if (blankKeys.length > 0) {
    flags.push({
      code: "blank_answers",
      message: `${blankKeys.length} field(s) left blank: ${[...new Set(blankKeys)].slice(0, 6).join(", ")}.`,
    });
  }

  const placeholderKeys = written
    .filter((a) => !isBlank(a.value) && isPlaceholder(a.value))
    .map((a) => a.key);
  if (placeholderKeys.length > 0) {
    flags.push({
      code: "placeholder_answers",
      message: `Placeholder text where a governing answer belongs: ${[...new Set(placeholderKeys)].slice(0, 6).join(", ")}.`,
    });
  }

  const tooShort = written
    .filter(
      (a) =>
        !isBlank(a.value) &&
        !isPlaceholder(a.value) &&
        a.value.trim().length > 0 &&
        a.value.trim().length < MIN_GOVERNING_LENGTH &&
        // Short is fine for a name, a date, a role title or a dollar figure.
        !/^\$?[\d,.]+$/.test(a.value.trim()) &&
        !/(name|role|title|date|owner|amount|threshold|account)/i.test(a.key)
    )
    .map((a) => a.key);
  if (tooShort.length > 0) {
    flags.push({
      code: "answer_too_short",
      message: `Answer too brief to govern: ${[...new Set(tooShort)].slice(0, 6).join(", ")}.`,
    });
  }

  // The named failure from the advisor training: an approval rule with no
  // number in it is not a rule.
  const thresholdWithoutNumber = written.filter(
    (a) =>
      !isBlank(a.value) &&
      (THRESHOLD_CONTEXT.test(a.key) || THRESHOLD_CONTEXT.test(a.value)) &&
      !/\d/.test(a.value)
  );
  if (thresholdWithoutNumber.length > 0) {
    flags.push({
      code: "threshold_without_figure",
      message:
        "An approval or spending answer carries no figure. A threshold without a number cannot be enforced.",
    });
  }

  const founderDependent = written.filter(
    (a) => !isBlank(a.value) && FOUNDER_DEPENDENT_PATTERNS.some((p) => p.test(a.value))
  );
  if (founderDependent.length > 0) {
    flags.push({
      code: "founder_dependent",
      message:
        "An answer assigns responsibility to a person or to nobody in particular rather than to a role.",
    });
  }

  const gaps = collectSelfDeclaredGaps(submittedData);
  if (gaps.length > 0) {
    flags.push({
      code: "self_declared_gap",
      message: `The client marked ${gaps.length} item(s) as not met or inconsistent. These are the gaps the tool exists to surface.`,
    });
  }

  // Governance Binder and anything else carrying uploaded documents always
  // goes to a person. A file cannot be triaged by pattern.
  if (carriesDocuments) {
    flags.push({
      code: "documents_attached",
      message: "Uploaded documents require review.",
    });
  }

  return flags;
}

// A submission is approved automatically only when nothing tripped.
export function shouldAutoApprove(flags: ReviewFlag[]): boolean {
  return flags.length === 0;
}
