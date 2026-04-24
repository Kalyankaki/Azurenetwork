// Shared application status mappings

export const APPLICATION_STATUS_LABELS = {
  pending: 'Pending',
  under_review: 'Under Review',
  shortlisted: 'Shortlisted',
  accepted: 'Accepted',
  offered: 'Offer Sent',
  offer_accepted: 'Offer Accepted',
  offer_declined: 'Offer Declined',
  rejected: 'Rejected',
}

// Maps application status to CSS badge class suffix
export const APPLICATION_BADGE_CLASS = {
  pending: 'pending',
  under_review: 'pending',
  shortlisted: 'open',
  accepted: 'filled',
  offered: 'open',
  offer_accepted: 'filled',
  offer_declined: 'closed',
  rejected: 'closed',
}

export function statusLabel(status) {
  return APPLICATION_STATUS_LABELS[status] || 'Pending'
}

export function statusBadgeClass(status) {
  return APPLICATION_BADGE_CLASS[status] || 'pending'
}

export function statusDisplay(status) {
  return (status || 'pending').replace(/_/g, ' ')
}
