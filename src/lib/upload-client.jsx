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

export async function uploadFileWithPresignedUrl({ file, folder, onProgress }) {
  const presignResponse = await fetch('/api/upload/presign', {
    method: 'POST',
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
    throw new Error(presignData?.error || `Could not prepare upload (HTTP ${presignResponse.status}). Check if R2 is configured correctly.`)
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    
    xhr.open('PUT', presignData.uploadUrl)
    
    // Set headers
    const headers = presignData.headers || { 'Content-Type': file.type }
    Object.entries(headers).forEach(([key, value]) => {
      xhr.setRequestHeader(key, value)
    })

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 100)
          onProgress(percentComplete)
        }
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve({
          url: presignData.publicUrl,
          key: presignData.key,
        })
      } else {
        reject(new Error(`Upload to storage failed (HTTP ${xhr.status})`))
      }
    }

    xhr.onerror = () => {
      console.error('[Upload Client] Direct R2 upload failed (Network Error)')
      reject(new Error('Direct R2 upload failed. This could be due to CORS settings or network issues.'))
    }

    xhr.send(file)
  })
}
