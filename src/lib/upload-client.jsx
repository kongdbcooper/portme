'use client'

async function readJsonResponse(response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}

async function uploadFileViaServer({ file, folder }) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('folder', folder)

  const response = await fetch('/api/upload', {
    method: 'POST',
    credentials: 'include',
    body: formData,
  })

  const data = await readJsonResponse(response)

  if (!response.ok) {
    throw new Error(data?.error || `Server upload failed (HTTP ${response.status})`)
  }

  return data
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
    if (presignResponse.status === 400 || presignResponse.status === 403) {
      throw new Error(presignData?.error || `Could not prepare upload (HTTP ${presignResponse.status})`)
    }

    const fallbackData = await uploadFileViaServer({ file, folder })
    return {
      url: fallbackData.url,
      key: fallbackData.key,
    }
  }

  console.log('PRESIGN DATA:', presignData)
  console.log('UPLOAD URL:', presignData.uploadUrl) 

  try {
    const uploadResponse = await fetch(presignData.uploadUrl, {
      method: 'PUT',
      headers: presignData.headers || { 'Content-Type': file.type },
      body: file,
    })

    if (!uploadResponse.ok) {
      throw new Error(`Upload to storage failed (HTTP ${uploadResponse.status})`)
    }
  } catch (directUploadError) {
    console.warn('[Upload Client] Direct R2 upload failed, falling back to server upload:', directUploadError)

    const fallbackData = await uploadFileViaServer({ file, folder })
    return {
      url: fallbackData.url,
      key: fallbackData.key,
    }
  }

  return {
    url: presignData.publicUrl,
    key: presignData.key,
  }
}
