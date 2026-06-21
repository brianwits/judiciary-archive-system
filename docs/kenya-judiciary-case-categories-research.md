# Kenya Judiciary Case Categories, eFiling Fields, and Archive Recommendations

## 1. Executive Summary

This research pass identified 24 category/registry combinations and 20 interface fields that matter for an archive system. The public Judiciary surface is enough to confirm broad court-group coverage, but not enough to verify every registry-specific prefix. The safe implementation strategy is:

- preserve the original case number exactly as entered,
- store a normalized case category/code alongside it,
- resolve aliases and legacy prefixes through a mapping table,
- treat probate/succession and criminal matters as first-class archive categories,
- keep login-required eFiling fields separate from public fields until registry validation confirms them.

Coverage observed in public sources:

- Court levels: Magistrates’ Court, High Court, Court of Appeal, ELRC, ELC, Small Claims Court, Kadhis Courts, and tribunals.
- Registry groups: criminal, civil, traffic, succession/probate, judicial review, petitions, appeals, and miscellaneous applications.
- Public eFiling surfaces: login, probate search, order validation, receipt validation, deposit tracking, and complaint tracking.

Primary source anchors:

- Kenya Law cause lists: https://new.kenyalaw.org/causelists/
- Judiciary eFiling login: https://efiling.court.go.ke/auth/login
- Validate court order: https://efiling.court.go.ke/orders/validate_orders
- Validate receipt: https://efiling.court.go.ke/auth/validate_receipts
- Probate & Administration: https://efiling.court.go.ke/auth/probate_matters
- Track deposits: https://efiling.court.go.ke/Deposits/track_deposits
- High Court registry overview: https://highcourt.judiciary.go.ke/court-registry/

## 2. Master Case Category Table

| Court Level | Division / Registry | Case Category Name | Common Prefix | Alternative Prefixes | Example Case Number | Example Kenya Law Reference | Source URL | Suggested System Code | Parent Category | Confidence | Archive Indexing Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Magistrates Court | Criminal | Magistrates Criminal Case | MCCR | MCCr, MC CR, MCCR/E format | MCCR/E377/2025 | Kakuma Law Courts cause list | https://new.kenyalaw.org/akn/ke/doc/cause-list-weekly/kemc/2025-10-13/24/eng%402025-10-13/source.pdf | MC_CRIMINAL | Criminal | High | Accused, offence, station, year, ODPP/police reference |
| Magistrates Court | Civil | Magistrates Civil Case | MCCC | MCCc, MC Civil, Civil Case | MCCC E001 of 2024 | Registry pattern seen in Magistrates Court cause lists | https://new.kenyalaw.org/causelists/ | MC_CIVIL | Civil | Medium | Plaintiff/defendant, claim type, amount, station, year |
| Magistrates Court | Traffic | Magistrates Traffic Case | MCTR | MCT, MC Traffic | MCTR/E057/2026 | Kenya Law cause list snippet | https://new.kenyalaw.org/akn/ke/doc/cause-list-daily/kemc/2026-06-10/1/eng%402026-06-10 | MC_TRAFFIC | Traffic | High | Vehicle registration, traffic offence, station, year |
| Magistrates Court | Succession | Magistrates Succession Cause | MCSUCC | MCSucc, Succession Cause | MCSUCC/E254/2025 | Githunguri Law Courts cause list | https://new.kenyalaw.org/akn/ke/doc/cause-list-daily/kemc/2026-05-29/1/eng%402026-05-29 | MC_SUCCESSION | Succession | High | Deceased, petitioner, objector, grant status, filing year |
| Magistrates Court | Sexual Offence | Magistrates Sexual Offence Case | MCSO | MC SO, Sexual Offence Case | MCSO/E019/2023 | Butere Law Courts cause list snippet | https://new.kenyalaw.org/akn/ke/doc/cause-list-daily/kemc/2026-02-18/1/eng%402026-02-18 | MC_SEXUAL_OFFENCE | Criminal | Medium | Confidential flag, complainant protection, accused, year |
| Magistrates Court | Environment and Land | Magistrates ELC-related Matter | MCELRC | MCELC, MELC | MCELRC/E008/2025 | Cause list snippet with MCELRC | https://new.kenyalaw.org/akn/ke/doc/cause-list-weekly/kemc/2026-02-16/12/eng%402026-02-16/source.pdf | MC_ELC | ELC | Medium | Parcel number, land registry, subject property, station |
| Magistrates Court | Miscellaneous | Magistrates Miscellaneous Case | MCMisc | MC Misc, MCMC, Misc. | MCMisc E012 of 2024 | Registry-derived pattern | https://new.kenyalaw.org/causelists/ | MC_MISC | Miscellaneous | Low | Treat as registry bucket until station confirms subtype |
| Magistrates Court | Children / Family | Children’s / Maintenance Matter | varies | Child, Maintenance, CC | CC E004 of 2024 | Judiciary children-user guidance context | https://judiciary.go.ke/ | MC_CHILDREN | Family / Protected | Low | Confidential party names, ward/minor protection, maintenance status |
| High Court | Civil | High Court Civil Case | HCCC | HCCc, Civil Case | HCCC No. 71 of 2012 | Nairobi HCCC judgment reference | https://new.kenyalaw.org/akn/ke/judgment/kehc/2014/2807/eng%402014-09-26/source | HC_CIVIL | Civil | High | Parties, claim type, subject matter, station, year |
| High Court | Criminal | High Court Criminal Case | HCCR | HCR, HCr, Criminal Case | HCCR NO. 13 OF 2014 | Republic v David Mwaki Kalunge | https://new.kenyalaw.org/akn/ke/judgment/kehc/2014/4664/eng%402014-06-05 | HC_CRIMINAL | Criminal | High | Accused, offence, bond/bail, station, judge, year |
| High Court | Criminal Revision | Criminal Revision | HCR REV | HCR Rev, Revision | HCR REV 5 OF 2017 | Maulidi K. Diwayu v Republic | https://new.kenyalaw.org/akn/ke/judgment/kehc/2019/6649/eng%402019-06-13/source | HC_CRIMINAL_REVISION | Criminal | High | Revision number, original case, judge, outcome |
| High Court | Civil Appeal | Civil Appeal | HCA | HCCA, Appeal | HCA No. 48 of 2013 | Civil appeal references in Kenya Law judgments | https://kenyalaw.org/akn/ke/judgment/keca/2014/616/eng%402014-05-02 | HC_CIVIL_APPEAL | Appeal | Medium | Appellant/respondent, lower-court origin, year |
| High Court | Criminal Appeal | Criminal Appeal | HCRA | HCCR(A), HCRA | HCRA No. 25 of 2017 | HCR case references in cause/judgment snippets | https://new.kenyalaw.org/akn/ke/judgment/kehc/2018/2593/eng%402018-10-04 | HC_CRIMINAL_APPEAL | Appeal | Medium | Accused/appellant, offence, originating court, year |
| High Court | Miscellaneous / JR | Miscellaneous Application / Judicial Review | HCMisc | HC Misc, HCMISC, JR | HCMISC APP No. 99 of 2013 | Judicial review judgment snippet | https://new.kenyalaw.org/akn/ke/judgment/kehc/2014/6817/eng%402014-03-03/source.pdf | HC_MISC | Miscellaneous | High | Application subtype, relief sought, station, year |
| High Court | Petition | Constitutional / Human Rights Petition | HCPet | HC Petition, HCEP, Petition | H.C.E.P. No. 1 of 2017 | Election petition / petition references | https://new.kenyalaw.org/akn/ke/judgment/keca/2018/536/eng%402018-06-14 | HC_PETITION | Petition | Medium | Petition subtype, constitutional issue, parties, judge |
| High Court | Succession / Probate | Succession Cause / Probate & Administration | HCSC | HCS C, Probate Cause | HCSC No. 1346 of 2006 | In re Estate of Jared Angelo Ondieki | https://new.kenyalaw.org/akn/ke/judgment/kehc/2015/1680/eng%402015-10-23 | HC_SUCCESSION | Succession | High | Deceased, personal representative, grant status, assets |
| High Court | Election Petition | Election Petition | HCEP | Election Petition, HC EP | HCEP No. 1 of 2017 | Election petition snippet | https://new.kenyalaw.org/akn/ke/judgment/kehc/2013/5775/eng%402013-06-18 | HC_ELECTION_PETITION | Petition | Medium | Constituency, candidate, election cycle, outcome |
| Related Court | Environment and Land Court | ELC Matter | ELC | HCC/ELC legacy forms | ELC No. 1389 of 2004 | ELC references in civil judgments | https://new.kenyalaw.org/akn/ke/judgment/kehc/2021/12692/eng%402021-03-05 | ELC_MATTER | Land | Medium | Parcel numbers, land registry, boundary dispute, year |
| Related Court | Employment and Labour Relations Court | ELRC Matter | KEELRC | ELRC, Industrial Court legacy | ELRC Nairobi Daily Cause List | ELRC cause list archive | https://new.kenyalaw.org/causelists/KEELRC/ | ELRC_MATTER | Labour | High | Claimants/respondents, division, station, hearing date |
| Related Court | Small Claims Court | Small Claims Matter | SCC | Small Claims, SCC Civil Division | SCC / Civil Division cause list | Small Claims Court cause lists | https://new.kenyalaw.org/causelists/SCC/ | SCC_MATTER | Civil | High | Claim amount, parties, station, date, decision |
| Related Court | Kadhis’ Court | Kadhis’ Matter | KEKC | Kadhi, Kadhis Court | Kadhi’s Court cause list | Kadhis Courts cause lists | https://new.kenyalaw.org/causelists/KEKC/ | KADHI_MATTER | Family / Religious | High | Family law, inheritance, parties, station, date |
| Related Court | Tribunals / Appeals | Tribunal Matter | varies | Appeal, Review, Tribunal-specific | Tribunal cause list entry | Kenya Law tribunal cause list archive | https://new.kenyalaw.org/causelists/ | TRIBUNAL_MATTER | Tribunal | Medium | Original forum, appeal path, division, date, officer |

## 3. eFiling / Interface Field Matrix

| Field Name | Observed Source | Interface Area | Classification | Required | Data Type | Recommended DB Column | Validation | Archive Use | Notes |
|---|---|---|---|---|---|---|---|---|---|
| email | eFiling login page | Login | Observed public | Yes | string | auth email | Validate email format | Authentication | Public login page shows email/password fields |
| password | eFiling login page | Login | Observed public | Yes | string | auth password | Secret input | Authentication | No storage in app DB |
| remember_me | eFiling login page | Login | Observed public | Optional | boolean | session preference | Boolean only | Session persistence | Visible on login form |
| case_number | Kenya Law / eFiling kiosk / search | Filing, search, kiosk | Observed + inferred | Yes | string | cases.case_number | Preserve original text, parse prefix/year | Primary lookup | Must support old and new formats |
| court_station | Cause lists / eFiling public pages | Filing, search, cause list | Inferred public | Yes | FK/string | court_stations | Must match station master | Routing and archive location | Normalize station names/codes |
| court_rank | Cause list / registry hierarchy | Filing, search | Inferred public | Optional | string | court_rank | Must match rank lookup | Filtering | Useful for subordinate courts |
| court_level | Judiciary / cause list hierarchy | Filing, search | Inferred public | Optional | string | court_level | Must match court-level enum | Filtering | Magistrates, High Court, ELC, ELRC, etc. |
| court_division | Cause list / filing context | Filing, search | Observed + inferred | Optional | string | court_division | Must match division lookup | Filtering | Civil, Criminal, Judicial Review, etc. |
| registry | Registry guidance / court registry pages | Filing, search | Inferred public | Optional | string | registry | Normalize to registry table | Routing | Separate from division if the station uses both |
| case_category | eFiling filing flow / Kenya Law cause-list taxonomy | Filing | Inferred public | Yes | FK/string | case_category_id | Alias-aware resolver | Classification | Should not be free text only |
| case_status | eFiling and archive status views | Search, tracking | Inferred public | Optional | enum | case_status | Enum validation | Work queue and archive | Open, closed, archived, missing, pending return |
| party_name | Kenya Law cause lists / eFiling public search | Search | Observed + inferred | Optional | string | case_parties.party_name | Full-text index | Party lookup | Support multiple parties, not just plaintiff/defendant |
| advocate_name | eFiling filing / registry use | Filing | Inferred public | Optional | string | case_parties.advocate_name | String normalization | Representation lookup | Not currently modeled in repo |
| case_activity | Public kiosk / cause list / tracking descriptions | Kiosk, tracking | Inferred public | Optional | string | case_activities.activity_type | Controlled vocabulary | Timeline view | Mention, hearing, ruling, judgment, mention notice |
| activity_date | Public kiosk / cause list | Kiosk, cause list | Inferred public | Optional | date | case_activities.activity_date | ISO date | Timeline view | Critical for scheduled activities |
| judicial_officer | Cause lists | Cause list | Observed public | Optional | string | case_activities.judicial_officer | Normalize names | Schedule lookup | Strongly visible in cause-list portals |
| courtroom | Cause lists | Cause list | Observed public | Optional | string | case_activities.courtroom | String normalization | Room scheduling | Public cause lists usually expose this |
| deceased_name | Probate & Administration public search | Probate search | Observed public | Optional | string | case_special_metadata.deceased_name | Trim and case-fold | Succession lookup | Public probate search explicitly supports this |
| payment_reference_no | Validate receipt page | Validation | Observed public | Optional | string | payments.payment_reference_no | Uniqueness when present | Payment audit | Public receipt validation exposes this |
| receipt_number | Validate receipt page | Validation | Observed public | Optional | string | payments.receipt_number | Uniqueness when present | Payment audit | Public receipt validation exposes this |
| tracking_number | Validate order page | Validation | Observed public | Optional | string | documents.tracking_number | Unique when present | Authenticity audit | Public order validation uses tracking number |
| ticket_number | Track complaint page | Complaint tracking | Observed public | Optional | string | complaints.ticket_number | Unique when present | Support audit | Complaint tracking uses ticket number + email |

## 4. Repo Gap Analysis

1. `src/types/case.ts`
   - Current problem: `CASE_TYPES` is a fixed app enum, and it is too narrow for Kenya Judiciary category aliases.
   - Recommended change: replace the hard-coded category-only worldview with a category resolver backed by aliases and normalized codes.
   - Reason: the current app can only represent a small generic set and will keep collapsing real registry categories.
   - Priority: High

2. `src/contracts/cases.ts`
   - Current problem: case parsing resolves unknown categories too early and does not model alias matching.
   - Recommended change: add a case-number normalizer plus alias-aware resolver; preserve original input and store normalized components.
   - Reason: legacy records and external imports need deterministic normalization.
   - Priority: High

3. `src/app/actions/cases.ts`
   - Current problem: create/update flows only persist a broad `case_type` and infer structure from the case number.
   - Recommended change: accept explicit category selection, persist normalized components, and support registry overrides.
   - Reason: manual registration and imported archive rows should not depend on inference alone.
   - Priority: High

4. `src/lib/data/supabase-queries.ts`
   - Current problem: search is centered on case number, parties, and a few archive fields.
   - Recommended change: expand search to parties, advocate, deceased name, vehicle registration, receipt number, tracking number, and case activities.
   - Reason: Judiciary search and cause-list usage are broader than the current model.
   - Priority: High

5. `src/components/cases/case-form.tsx`
   - Current problem: category input is a generic selector with no alias or registry guidance.
   - Recommended change: add category picker with alias help text and conditional fields for criminal, traffic, probate, and protected matters.
   - Reason: users need a registry-friendly form that reflects real filing practice.
   - Priority: Medium

6. `src/types/database.ts` and Supabase migrations
   - Current problem: the schema has a single `cases.case_type` field and no supporting category/alias tables.
   - Recommended change: add `case_categories`, `case_category_aliases`, `court_stations`, `case_parties`, `case_activities`, and `case_special_metadata`.
   - Reason: the current schema cannot express multiple parties, activities, or registry-specific metadata cleanly.
   - Priority: High

7. `src/components/search/search-results.tsx`
   - Current problem: result display is case-centric but not metadata-rich.
   - Recommended change: surface category, party roles, activity date, and special metadata in search results.
   - Reason: archive staff need rapid disambiguation, not just the primary case number.
   - Priority: Medium

8. `src/lib/archive-code.ts`
   - Current problem: archive code logic only derives a short type code from the current `caseType` string.
   - Recommended change: derive archive codes from normalized category codes and make regeneration idempotent.
   - Reason: category aliases and backfilled records must produce stable codes.
   - Priority: Medium

9. `src/lib/data/mock-store.ts`
   - Current problem: mock data mirrors the simplified model and lacks alias/category metadata.
   - Recommended change: mirror any new normalized fields and seed aliases for realistic test coverage.
   - Reason: mock mode should exercise the same classification paths as Supabase mode.
   - Priority: Medium

## 5. Implementation Checklist

- Add `case_categories` and `case_category_aliases`.
- Add `court_stations` and `registry`/division lookups.
- Add `case_parties`, `case_documents`, `case_activities`, and `case_special_metadata`.
- Add a case-number normalizer.
- Add alias-aware category resolution.
- Add conditional metadata fields by case type.
- Add full-text search for parties and special metadata.
- Add archive import support for legacy physical files.
- Add a review queue for unknown or unmatched categories.
- Add confidentiality flags for children and sexual-offence matters.
- Add audit logging for metadata edits and reclassification.

## 6. Normalized JSON Export

The structured JSON companion is stored in:

- [docs/kenya-judiciary-case-categories-research.json](./kenya-judiciary-case-categories-research.json)

## 7. Source Notes

- Kenya Law cause lists confirm that Magistrates’ Court, High Court, ELRC, ELC, Small Claims Court, Kadhi’s Court, and multiple tribunal groups are active public categories.
- Public eFiling pages confirm login, probate search, receipt validation, order validation, deposit tracking, and complaint tracking surfaces.
- The current repository still uses a limited hard-coded `CASE_TYPES` list in `src/types/case.ts` and stores only one `plaintiff` and one `defendant`, so it does not yet model the full registry reality described above.
