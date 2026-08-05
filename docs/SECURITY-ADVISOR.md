# Security Advisor — Stage 4E

Located at `advisors/security/`. The third real Advisor. Static security
analysis: dangerous eval/Function usage, unsanitized command construction,
hardcoded credentials, insecure HTTP/SSL patterns, weak randomness,
wildcard CORS, ReDoS-prone regex, insecure temp paths, permissive file
modes, leftover debugger statements, and security-relevant TODO/FIXME
markers.

## Framework: no promotion needed, one already-justified reuse

inputRequirements: ["sourceFiles"] proved sufficient -- no second input
was ever needed. This is the third real consumer of source-analysis.js's
findDebtMarkers() (promoted in Stage 4D); no new promotion was required,
since that module was already justified by two prior advisors. No
advisors/framework/* file was touched.

## Two real bugs found via manual smoke testing (both fixed, not just documented)

Bug 1 -- RegExp.prototype.exec() misclassified as child_process usage.
The first version's EXEC_CALL_PATTERN matched any exec(/execSync(/
spawn(/spawnSync( call regardless of what it was called on. Running
against this repository's own real source (47 files) produced 14
child-process-usage findings -- every single one a false positive,
matching ordinary somePattern.exec(str) calls (a completely standard,
safe JS regex idiom used throughout this very codebase's own analysis
code). Fixed with a negative lookbehind excluding dotted calls, narrowing
detection to bare (non-dotted) calls -- the actual shape of a directly-
imported child_process function call. Known, accepted limitation: a
dotted call on an explicitly child_process-derived handle (e.g.
childProcess.exec(...)) would not be caught by this narrowed pattern --
reliably distinguishing that from regex.exec(...) isn't solvable via
regex alone, and the false-positive rate of matching all dotted calls was
unacceptable (14 false positives out of 14 total matches).

Bug 2 -- ReDoS heuristic flagged a genuinely safe pattern. The nested-
quantifier check flagged naming-validator.js's slug-validation pattern
(-[a-z0-9]+)* -- which is actually safe, since the required "-" literal
between repetitions prevents the ambiguous backtracking that makes
patterns like (a+)+ dangerous. Rather than try to build a real ReDoS
analyzer (disproportionate complexity for this check's scope), the
finding's severity was downgraded from warning to suggestion and its
message reworded to state plainly that this is a low-confidence heuristic
requiring manual confirmation -- an honest calibration of confidence
rather than a false claim of certainty.

A minor regex-shape bug, also caught and fixed: the wildcard-CORS pattern
only matched object colon/equals syntax
('Access-Control-Allow-Origin': '*') and missed the equally common
function-call comma style (res.setHeader('Access-Control-Allow-Origin',
'*')) -- caught by its own unit test, fixed by accepting a comma as an
additional valid separator.

## Accepted, unfixed self-matching (consistent with prior precedent)

3 dangerous-eval-usage and 1 function-constructor-usage finding occur
against this advisor's OWN source file -- its recommendation messages
literally contain the strings "eval()" and "new Function()" as part of
describing what the checks do. Same accepted category as the Architecture
Advisor's TODO/FIXME self-matching (Stage 4C) -- not fixed, since avoiding
it would require distinguishing "code" from "string content describing
code," a real-parser concern out of scope for a regex-based advisor.

## Real, correctly-detected finding (not a bug)

mcp-server/wp-client.js's rejectUnauthorized: false is correctly and
accurately flagged as disabled-ssl-verification -- this is a genuine,
already-documented, intentional pattern (Local by Flywheel's self-signed
certificates, accepted since Stage 1). The finding's recommendation
explicitly notes it "may be intentional for local development... confirm
it never reaches a production code path" -- reporting the fact accurately
without presuming it's wrong, exactly matching this project's evidence
discipline.

## Two checks deliberately not implemented

Per the requirements list's "path traversal" and generic "unsafe
filesystem writes" categories: a draft path-traversal regex (flagging
template literals containing both ".." and "${...}") was evaluated
against this repository's own real source during design and would have
produced predictable false positives on legitimate PHP-code-generation
strings in elementor-widget-generator.js/gutenberg-block-generator.js
(fully validated, internally-computed paths embedded via template
interpolation -- not attacker input). Rather than ship a noisy or
incorrect check, both categories are left unimplemented.

## Usage

```js
import { runAdvisorWithReport } from "./advisors/index.js";

const report = await runAdvisorWithReport("security", { sourceFiles });
report.findings; // dangerous-eval-usage, function-constructor-usage, child-process-usage,
                  // unsanitized-command-construction, hardcoded-credential, insecure-http-url,
                  // disabled-ssl-verification, weak-randomness, wildcard-cors,
                  // dangerous-regex-pattern, insecure-temp-path, insecure-permission-setting,
                  // leftover-debugger-statement, security-debt-marker, security-scan-summary
```

## Explicitly out of scope for this stage

- Path traversal and generic unsafe-filesystem-write detection (see above).
- Real entropy-based secret scanning (only named-key-pattern matching is
  done -- a generic "any long random-looking string" scanner was
  considered and rejected as too speculative/false-positive-prone).
- Distinguishing a child_process handle's .exec() from any other
  object's .exec() -- a real parser/type-analysis concern.
