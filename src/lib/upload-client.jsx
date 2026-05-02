'use client'

async function readJsonResponse(response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}

export async function uploadFileWithPresignedUrl({ file, folder }) {
  const presignResponse = await fetch('/api/upload/presign', {
    method: 'POST',
    // include credentials so the presign endpoint can validate admin session
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type,
      size: file.size,
      folder,
    }),
  })

  const presignData = await readJsonResponse(presignResponse)

  if (!presignResponse.ok) {
    throw new Error(presignData?.error || `Could not prepare upload (HTTP ${presignResponse.status})`)
  }

  console.log('PRESIGN DATA:', presignData)
  console.log('UPLOAD URL:', presignData.uploadUrl) 

  const uploadResponse = await fetch(presignData.uploadUrl, {
    method: 'PUT',
    headers: presignData.headers || { 'Content-Type': file.type },
    body: file,
  })

  if (!uploadResponse.ok) {
    throw new Error(`Upload to storage failed (HTTP ${uploadResponse.status})`)
  }

  return {
    url: presignData.publicUrl,
    key: presignData.key,
  }
}
