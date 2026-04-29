// Storage-trigger Cloud Function that scans uploaded resumes for malware
// using the VirusTotal v3 API. Triggered on resumes/{uid}/{filename}.
//
// Behavior:
//   1. On finalize, download the file bytes (max 5 MB enforced by storage rules).
//   2. POST to VirusTotal /files endpoint, poll the analysis briefly.
//   3. If 'malicious' or 'suspicious' counts > 0:
//        - delete the file from Storage
//        - set users/{uid}.resumeQuarantined = true and clear resumeUrl/resumeName
//        - write an admin-only notifications doc
//   4. Otherwise stamp object metadata { virusScanStatus: 'clean', virusScanAt }.
//
// Configure: set the API key with `firebase functions:config:set virustotal.key="..."`
// or with the secret manager:
//   firebase functions:secrets:set VIRUSTOTAL_KEY
//
// If no key is configured, the function logs a warning and exits cleanly so
// uploads still work (defense-in-depth, not a hard gate).

import { onObjectFinalized } from 'firebase-functions/v2/storage'
import { logger } from 'firebase-functions'
import { defineSecret } from 'firebase-functions/params'
import { getStorage } from 'firebase-admin/storage'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'

const VIRUSTOTAL_KEY = defineSecret('VIRUSTOTAL_KEY')

export const scanResume = onObjectFinalized(
  {
    region: 'us-central1',
    secrets: [VIRUSTOTAL_KEY],
    memory: '512MiB',
    timeoutSeconds: 120,
  },
  async (event) => {
    const filePath = event.data.name || ''
    if (!filePath.startsWith('resumes/')) return

    // Skip files we already scanned (re-finalize on metadata update).
    if (event.data.metadata?.virusScanStatus === 'clean') {
      logger.debug('skip already-scanned', filePath)
      return
    }

    const key = VIRUSTOTAL_KEY.value()
    if (!key) {
      logger.warn('VIRUSTOTAL_KEY not set; skipping scan for', filePath)
      return
    }

    const parts = filePath.split('/')
    const uid = parts[1]
    if (!uid) {
      logger.warn('cannot parse uid from', filePath)
      return
    }

    const bucket = getStorage().bucket(event.data.bucket)
    const file = bucket.file(filePath)
    const [bytes] = await file.download()

    // 1) Submit file to VirusTotal
    const form = new FormData()
    form.append('file', new Blob([bytes]), parts[parts.length - 1])
    const submitRes = await fetch('https://www.virustotal.com/api/v3/files', {
      method: 'POST',
      headers: { 'x-apikey': key },
      body: form,
    })
    if (!submitRes.ok) {
      logger.warn('vt submit failed', submitRes.status, await submitRes.text().catch(() => ''))
      return
    }
    const submit = await submitRes.json()
    const analysisId = submit?.data?.id
    if (!analysisId) {
      logger.warn('no analysis id from vt', submit)
      return
    }

    // 2) Poll the analysis (a few times with backoff)
    let stats = null
    for (let i = 0; i < 8; i++) {
      await sleep(1500 + i * 500)
      const r = await fetch(`https://www.virustotal.com/api/v3/analyses/${analysisId}`, {
        headers: { 'x-apikey': key },
      })
      if (!r.ok) continue
      const j = await r.json()
      const status = j?.data?.attributes?.status
      stats = j?.data?.attributes?.stats
      if (status === 'completed') break
    }

    const malicious = stats?.malicious || 0
    const suspicious = stats?.suspicious || 0
    logger.log('vt scan result', { filePath, malicious, suspicious })

    if (malicious > 0 || suspicious > 0) {
      // 3a) Quarantine: delete file and flag user.
      try { await file.delete() } catch (e) { logger.warn('delete failed', e?.message) }
      const fsdb = getFirestore()
      await fsdb.collection('users').doc(uid).set({
        resumeQuarantined: true,
        resumeUrl: null,
        resumeName: null,
        resumeQuarantinedAt: FieldValue.serverTimestamp(),
      }, { merge: true })
      await fsdb.collection('notifications').add({
        type: 'resume_quarantined',
        userUid: uid,
        filePath,
        stats,
        createdAt: FieldValue.serverTimestamp(),
        expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      })
      return
    }

    // 3b) Clean: stamp object metadata so we don't rescan.
    try {
      await file.setMetadata({
        metadata: {
          virusScanStatus: 'clean',
          virusScanAt: new Date().toISOString(),
        },
      })
    } catch (e) {
      logger.warn('setMetadata failed', e?.message)
    }
  }
)

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
