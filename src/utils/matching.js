// Candidate matching algorithm
// Scores how well an applicant matches an internship (0-100)

const CATEGORY_KEYWORDS = {
  software: ['software', 'developer', 'programming', 'code', 'web', 'app', 'react', 'python', 'javascript'],
  data: ['data', 'analytics', 'sql', 'statistics', 'analysis'],
  marketing: ['marketing', 'social media', 'content', 'brand', 'campaign'],
  design: ['design', 'graphic', 'ui', 'ux', 'figma', 'creative'],
  finance: ['finance', 'accounting', 'budget', 'financial'],
  ai: ['ai', 'machine learning', 'artificial intelligence', 'automation'],
  healthcare: ['health', 'medical', 'clinical', 'patient'],
  sales: ['sales', 'business development', 'revenue'],
  engineering: ['cloud', 'devops', 'infrastructure', 'engineer'],
  media: ['journalism', 'writing', 'editor', 'media', 'news'],
  nonprofit: ['non-profit', 'nonprofit', 'volunteer', 'community'],
}

function normalizeSkill(s) {
  return (s || '').toLowerCase().trim()
}

function skillsOverlap(applicantSkills, requiredSkills) {
  const aSet = new Set((applicantSkills || []).map(normalizeSkill))
  const rSet = new Set((requiredSkills || []).map(normalizeSkill))
  if (rSet.size === 0) return { matched: [], pct: 100 }
  const matched = []
  rSet.forEach(req => {
    for (const a of aSet) {
      if (a.includes(req) || req.includes(a)) {
        matched.push(req)
        break
      }
    }
  })
  return { matched, pct: Math.round((matched.length / rSet.size) * 100) }
}

// Parse hours range "2-4 hours" -> { min: 2, max: 4 }
function parseHoursRange(s) {
  if (!s) return null
  if (/flexible/i.test(s)) return { min: 0, max: 12, flexible: true }
  const match = String(s).match(/(\d+)\s*-\s*(\d+)/)
  if (match) return { min: parseInt(match[1], 10), max: parseInt(match[2], 10) }
  return null
}

function hoursMatch(applicantHours, expectedHours) {
  const a = parseHoursRange(applicantHours)
  const e = parseHoursRange(expectedHours)
  if (!a || !e) return 50 // unknown, neutral
  if (a.flexible) return 100
  // Overlap of ranges
  const overlapMin = Math.max(a.min, e.min)
  const overlapMax = Math.min(a.max, e.max)
  if (overlapMax < overlapMin) return 0
  const overlap = overlapMax - overlapMin
  const needed = e.max - e.min || 1
  return Math.min(100, Math.round((overlap / needed) * 100))
}

function daysBetween(d1, d2) {
  if (!d1 || !d2) return 0
  const t1 = new Date(d1).getTime()
  const t2 = new Date(d2).getTime()
  if (isNaN(t1) || isNaN(t2)) return 0
  return Math.max(0, (t2 - t1) / (1000 * 60 * 60 * 24))
}

function availabilityPct(application, internship) {
  if (!application.availableFrom || !application.availableTo || !internship.deadline) return 70
  const applicantDays = daysBetween(application.availableFrom, application.availableTo)
  if (applicantDays <= 0) return 0

  // Parse duration like "3 months"
  const durMatch = String(internship.duration || '').match(/(\d+)/)
  const durationMonths = durMatch ? parseInt(durMatch[1], 10) : 3
  const neededDays = durationMonths * 30

  return Math.min(100, Math.round((applicantDays / neededDays) * 100))
}

function gradeLevelMatch(application, internship) {
  if (!internship.gradeLevelMin) return 100
  const GRADES = ['10th Grade', '11th Grade', '12th Grade', 'College Freshman', 'College Sophomore', 'College Junior', 'College Senior']
  const appGrade = application.gradeLevel
  if (!appGrade) return 50
  const appIdx = GRADES.indexOf(appGrade)
  const minIdx = GRADES.indexOf(internship.gradeLevelMin)
  const maxIdx = internship.gradeLevelMax ? GRADES.indexOf(internship.gradeLevelMax) : GRADES.length - 1
  if (appIdx < 0 || minIdx < 0) return 50
  if (appIdx >= minIdx && appIdx <= maxIdx) return 100
  // Close to range = partial credit
  const distance = appIdx < minIdx ? minIdx - appIdx : appIdx - maxIdx
  return Math.max(0, 100 - distance * 30)
}

function interestMatch(application, internship) {
  const interests = application.profileInterests || []
  if (interests.length === 0) return 50

  const combined = `${internship.title || ''} ${internship.description || ''} ${(internship.skills || []).join(' ')}`.toLowerCase()
  const matchedCategories = interests.filter(cat => {
    const keywords = CATEGORY_KEYWORDS[cat] || []
    return keywords.some(kw => combined.includes(kw))
  })
  if (matchedCategories.length === 0) return 30
  return Math.min(100, 50 + matchedCategories.length * 25)
}

function experienceRelevance(application, internship) {
  const text = `${application.priorExperience || ''} ${application.profileSkills?.join(' ') || ''}`.toLowerCase()
  const internKeywords = [
    ...(internship.skills || []).map(s => s.toLowerCase()),
    (internship.title || '').toLowerCase(),
  ]
  if (internKeywords.length === 0) return 50
  const matches = internKeywords.filter(kw => kw && text.includes(kw))
  return Math.min(100, Math.round((matches.length / Math.max(internKeywords.length, 1)) * 100))
}

// Main scoring function
export function scoreCandidate(application, internship) {
  // Combine profile skills with any relevant skills listed in this specific application
  const applicantSkills = [
    ...(application.profileSkills || []),
    ...String(application.relevantSkills || '').split(/[,\n]/).map(s => s.trim()).filter(Boolean),
  ]

  const skills = skillsOverlap(applicantSkills, internship.skills)
  const availability = availabilityPct(application, internship)
  const hours = hoursMatch(application.hoursPerDay, internship.expectedHoursPerDay)
  const grade = gradeLevelMatch(application, internship)
  const interest = interestMatch(application, internship)
  const experience = experienceRelevance(application, internship)

  // Weighted overall score
  const overall = Math.round(
    skills.pct * 0.35 +
    availability * 0.20 +
    hours * 0.10 +
    grade * 0.10 +
    interest * 0.15 +
    experience * 0.10
  )

  return {
    overall,
    skills: skills.pct,
    matchedSkills: skills.matched,
    availability,
    hours,
    grade,
    interest,
    experience,
  }
}

export function rankCandidates(applications, internship) {
  return applications
    .map(app => ({ ...app, match: scoreCandidate(app, internship) }))
    .sort((a, b) => b.match.overall - a.match.overall)
}
