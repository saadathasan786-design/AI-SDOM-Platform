# Change Implementation Procedure

**Identifier:** AI-SDOM-PRC-0003-CHANGE-IMPLEMENTATION-PROCEDURE
**Version:** 0.1.0
**Lifecycle State:** Draft
**Layer:** 3
**Dependencies:** [AI-SDOM-ARC-0001-ARCHITECTURE-CONTRACT], [AI-SDOM-GOV-0001-REPOSITORY-GOVERNANCE-POLICY], [AI-SDOM-GOV-0002-CHANGE-MANAGEMENT-POLICY], [AI-SDOM-STD-0001-DOCUMENTATION-STANDARD], [AI-SDOM-STD-0002-DOCUMENT-METADATA-STANDARD], [AI-SDOM-STD-0003-CROSS-REFERENCE-STANDARD]
**ai-assistance:** ChatGPT 2026-08-22: implementation draft

---

## 1. Purpose

1.1 This procedure defines the operational method for implementing an approved change within the AI-SDOM controlled repository.

1.2 This procedure operationalizes the governance requirements established by AI-SDOM-GOV-0002-CHANGE-MANAGEMENT-POLICY.

1.3 This procedure SHALL ensure that approved changes are implemented in a controlled, traceable, validated, and reproducible manner.

---

## 2. Scope

2.1 This procedure applies to changes affecting AI-SDOM controlled documents, repository infrastructure, governed implementation artifacts, and other repository-controlled assets where a governed change process is required.

2.2 This procedure covers:

- change intake and identification;
- change classification;
- impact assessment;
- implementation planning;
- branch and workspace preparation;
- controlled implementation;
- validation;
- review preparation;
- commit and pull request preparation;
- merge and post-merge verification;
- change closure and traceability.

2.3 This procedure SHALL NOT replace:

- governance authority defined by AI-SDOM-GOV-0001;
- change-management policy defined by AI-SDOM-GOV-0002;
- validation and quality gates defined by the QLT class;
- document structure requirements defined by the STD class;
- identifier allocation and registration requirements defined by the REG class.

---

## 3. Preconditions

Before implementation begins, the implementer SHALL confirm:

1. The requested change has a clearly identified objective.
2. The affected document, component, or repository asset has been identified.
3. The change category has been determined.
4. Required impact assessment has been completed.
5. Required approval to implement has been obtained where applicable.
6. Applicable dependencies and downstream consumers have been identified.
7. The implementation workspace is clean or otherwise explicitly controlled.
8. The implementation branch is isolated from unrelated work.

If any mandatory precondition is not satisfied, implementation SHALL NOT proceed.

---

## 4. Change Classification

4.1 The implementer SHALL classify the change according to AI-SDOM-GOV-0002.

4.2 Recognized categories include:

- New Document Creation;
- Correction;
- Addition;
- Revision;
- Deprecation;
- Retraction;
- Urgent Change.

4.3 The classification SHALL determine the required implementation rigor, validation depth, review requirements, and resulting version impact.

4.4 A change SHALL NOT be silently reclassified during implementation. If implementation reveals that the original classification is incorrect, the change SHALL be reassessed before proceeding.

---

## 5. Impact Assessment

5.1 Before implementation, the implementer SHALL identify:

- affected documents or components;
- direct dependencies;
- transitive dependencies where applicable;
- affected interfaces or contracts;
- applicable standards and procedures;
- applicable quality gates;
- required reviewers;
- potential breaking effects.

5.2 The implementation SHALL remain within the assessed change boundary.

5.3 If new impact is discovered during implementation, the impact assessment SHALL be updated before affected work proceeds.

5.4 Changes with material downstream impact SHALL NOT be implemented as though they were isolated changes.

---

## 6. Implementation Planning

6.1 The implementer SHALL define the implementation objective before modifying repository content.

6.2 The implementation plan SHALL identify, as applicable:

- files or components to be changed;
- files or components expected to remain unchanged;
- required tests;
- required documentation updates;
- validation commands;
- expected evidence;
- commit scope;
- review scope.

6.3 Implementation SHALL be performed as the smallest coherent change capable of satisfying the approved objective.

6.4 Unrelated cleanup, refactoring, or feature work SHALL NOT be mixed into the change unless explicitly included in the approved scope.

---

## 7. Workspace and Branch Preparation

7.1 The implementer SHALL verify repository state before modification.

7.2 The implementer SHALL verify:

    git status
    git branch --show-current
    git log -1 --oneline

7.3 A dedicated implementation branch SHALL be used for changes requiring review.

7.4 The branch SHALL begin from the intended current integration baseline.

7.5 Existing unrelated working-tree changes SHALL NOT be overwritten, discarded, or incorporated without explicit authorization.

---

## 8. Controlled Implementation

8.1 The implementer SHALL modify only assets within the approved change boundary.

8.2 Existing architecture, governance, standards, procedures, and dependency contracts SHALL be respected.

8.3 New dependencies SHALL NOT be introduced unless required by the approved change and compliant with the applicable dependency-management standard.

8.4 Cross-references SHALL remain valid after implementation.

8.5 Document metadata SHALL remain compliant with the applicable documentation and metadata standards.

8.6 Generated or temporary artifacts SHALL NOT be committed unless they are explicitly governed repository artifacts.

---

## 9. Validation

9.1 Every implementation SHALL undergo the validation applicable to its change type and affected artifacts.

9.2 Validation SHALL include, as applicable:

- structural validation;
- syntax validation;
- unit tests;
- integration tests;
- contract validation;
- cross-reference validation;
- repository checks;
- documentation checks;
- applicable architecture or quality gates.

9.3 Validation commands SHALL be executed from the repository state containing the implementation.

9.4 Validation results SHALL be retained as implementation evidence where required.

9.5 A failed mandatory validation gate SHALL block completion of the change.

9.6 Validation SHALL NOT be represented as successful when the corresponding command or gate has not actually been executed.

---

## 10. Review Preparation

10.1 Before submitting the implementation for review, the implementer SHALL verify:

- the intended files changed;
- no unrelated files changed;
- tests and validation passed;
- required documentation was updated;
- cross-references remain valid;
- version information is correct;
- change scope matches the approved objective.

10.2 The implementer SHALL inspect the final diff.

10.3 The implementer SHALL verify repository status.

10.4 Review evidence SHALL identify the implemented change and the validation performed.

---

## 11. Commit

11.1 A commit SHALL represent a coherent implementation unit.

11.2 Commit messages SHALL clearly identify the implemented change.

11.3 The implementer SHALL NOT commit unrelated changes.

11.4 Before committing, the implementer SHALL execute:

    git status
    git diff --check
    git diff

11.5 After committing, the implementer SHALL verify:

    git status
    git log -1 --oneline

11.6 The resulting commit identifier SHALL be retained as implementation evidence.

---

## 12. Pull Request and Approval

12.1 Changes requiring governed review SHALL be submitted through the repository's review mechanism.

12.2 The pull request SHALL identify:

- change objective;
- affected artifacts;
- change classification;
- impact assessment summary;
- validation performed;
- relevant evidence;
- review considerations.

12.3 Approval SHALL be recorded through the repository's recognized governance mechanism.

12.4 Unresolved mandatory review findings SHALL block merge.

---

## 13. Merge and Post-Merge Verification

13.1 A change SHALL be merged only after required review and approval conditions have been satisfied.

13.2 After merge, the integration branch SHALL be verified.

13.3 Post-merge verification SHALL confirm:

- the intended commit is present;
- required CI checks have completed successfully;
- the repository remains in the expected state;
- no integration regression is detected.

13.4 Where release or certification tagging is required, the resulting commit SHALL be identified before the tag is created.

---

## 14. Version and Registration

14.1 The resulting document version SHALL comply with the applicable governance and semantic-versioning rules.

14.2 Where a controlled document is changed, its Amendment Record SHALL reflect the implemented change.

14.3 Required repository registration SHALL be completed according to the applicable REG requirements.

14.4 A version SHALL NOT be represented as ratified merely because the implementation has been committed.

---

## 15. Change Closure

15.1 A change may be considered complete only after:

- implementation is complete;
- required validation has passed;
- required review has been completed;
- required approval has been recorded;
- merge has completed;
- post-merge verification has completed;
- required registration has been completed;
- traceability evidence has been retained.

15.2 The final change record SHALL connect:

    Change Request
        ↓
    Impact Assessment
        ↓
    Implementation Branch
        ↓
    Implementation Commit
        ↓
    Validation Evidence
        ↓
    Pull Request / Approval
        ↓
    Merge Commit
        ↓
    Registration / Version
        ↓
    Closure

15.3 A change SHALL remain open if any mandatory closure condition is incomplete.

---

## 16. Exception Handling

16.1 Exceptions SHALL follow AI-SDOM-GOV-0001 and AI-SDOM-GOV-0002.

16.2 Urgent changes SHALL follow the expedited governance path defined by AI-SDOM-GOV-0002.

16.3 An implementation exception SHALL be documented rather than silently bypassing a required control.

16.4 Constitutional requirements SHALL NOT be bypassed through an implementation exception.

---

## 17. Failure Handling

17.1 If implementation fails validation, the implementer SHALL stop completion and determine the cause.

17.2 Failed validation SHALL NOT be concealed by modifying or removing evidence.

17.3 If implementation introduces unexpected downstream impact, implementation SHALL pause until the impact is reassessed.

17.4 If the implementation cannot satisfy the approved objective without materially expanding scope, the change SHALL return to assessment before the expanded work proceeds.

---

## 18. Traceability Evidence

The implementation record SHALL retain, as applicable:

- change identifier;
- affected artifact identifiers;
- change classification;
- impact assessment;
- implementation branch;
- implementation commit;
- validation commands and results;
- pull request;
- approval evidence;
- merge commit;
- resulting version;
- registration status;
- closure evidence.

---

## 19. Procedure Completion Criteria

The procedure is successfully completed when:

1. The approved change has been implemented.
2. The implementation remains within the approved scope.
3. Applicable validation has passed.
4. Required review and approval have been completed.
5. The implementation has been merged.
6. Post-merge verification has passed.
7. Required versioning and registration have been completed.
8. The complete implementation is traceable from proposal through closure.

---

## 20. References

| Reference | Relationship |
|-----------|--------------|
| AI-SDOM-ARC-0001-ARCHITECTURE-CONTRACT | Constitutional authority and change boundaries |
| AI-SDOM-GOV-0001-REPOSITORY-GOVERNANCE-POLICY | Repository governance, roles, approval, lifecycle, and records |
| AI-SDOM-GOV-0002-CHANGE-MANAGEMENT-POLICY | Change-management governance operationalized by this procedure |
| AI-SDOM-STD-0001-DOCUMENTATION-STANDARD | Controlled-document structure and documentation requirements |
| AI-SDOM-STD-0002-DOCUMENT-METADATA-STANDARD | Metadata requirements |
| AI-SDOM-STD-0003-CROSS-REFERENCE-STANDARD | Cross-reference requirements |
| AI-SDOM-STD-0007-DEPENDENCY-MANAGEMENT-STANDARD | Dependency management requirements |
| AI-SDOM-PRC-0002-ARCHITECTURE-DECISION-PROCEDURE | Architecture decision procedure where architectural decisions are required |

---

## Amendment Record

| Version | Date | Author | Description of Change | Approval |
|---------|------|--------|-----------------------|----------|
| 0.1.0 | 2026-08-22 | Saadat Hasan | Initial implementation procedure draft | Pending |

---

## Self-Audit Certification

This procedure SHALL be validated against the applicable Architecture Contract, governance policies, standards, and quality gates before ratification.

**Status:** Draft