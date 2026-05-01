// Centralised legal-copy constants. Bump TERMS_VERSION whenever Terms.jsx
// changes materially; downstream code stores this version next to user
// acknowledgements so we can detect users on stale Terms in the future.
//
// Wording here is plain-language and is meant as a stop-gap until counsel
// drafts the formal Terms of Service. It is intentionally short and visible
// in-product (footer, public posting page, acknowledgement checkboxes).

export const TERMS_VERSION = '2026-05-01'

export const FACILITATOR_DISCLAIMER_SHORT =
  'NRIVA Foundation facilitates introductions only. We are not a party to any internship and do not vet, endorse, or guarantee any opportunity listed here.'

export const FACILITATOR_DISCLAIMER_LONG =
  'NRIVA Foundation is a non-profit that facilitates introductions between students and employers. We do not employ interns, do not vet or background-check participants, and are not a party to any internship arrangement. Any agreement, supervision, compensation, scheduling, safety, intellectual-property, tax, immigration, and child-labor compliance is solely the responsibility of the intern (and their parent/guardian if a minor) and the employer. By using this portal you release and indemnify NRIVA Foundation from any claims arising out of an internship arranged through it.'

export function buildAcknowledgement() {
  return { version: TERMS_VERSION, acceptedAt: new Date().toISOString() }
}
