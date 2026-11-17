// Supabase Storage wrapper for private audio uploads.
// Files go into the "speaking-audio" bucket which must be created as PRIVATE
// in your Supabase dashboard (Storage → New bucket → toggle Public OFF).
//
// Signed URLs are generated per-request so the audio is never world-readable
// and survives Render's ephemeral filesystem restarts.
import { createClient } from '@supabase/supabase-js';

const BUCKET = 'speaking-audio';

let supabase = null;

function getClient() {
  if (supabase) return supabase;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for audio storage.');
  }
  supabase = createClient(url, key);
  return supabase;
}

/**
 * Upload an audio buffer to Supabase Storage.
 * @param {Buffer} buffer  - The raw file bytes (from multer memoryStorage)
 * @param {string} filename - e.g. "audio-1700000000000-123456789.webm"
 * @param {string} mimeType - e.g. "audio/webm"
 * @param {number} userId   - owning user, used in the storage path
 * @returns {string} The storage path (e.g. "4/audio-1700000000000-123456789.webm")
 */
export async function uploadAudio(buffer, filename, mimeType, userId) {
  const client = getClient();
  const storagePath = `${userId}/${filename}`;

  const { error } = await client.storage
    .from(BUCKET)
    .upload(storagePath, buffer, {
      contentType: (mimeType || 'audio/webm').split(';')[0],
      upsert: false,
    });

  if (error) {
    console.error('Supabase Storage upload error:', error);
    throw new Error(`Audio upload failed: ${error.message}`);
  }

  return storagePath;
}

/**
 * Generate a short-lived signed URL for a private audio file.
 * @param {string} storagePath - e.g. "4/audio-1700000000000-123456789.webm"
 * @param {number} [expiresIn=300] - seconds until the URL expires (default 5 min)
 * @returns {string} A signed URL the browser can fetch directly
 */
export async function getSignedUrl(storagePath, expiresIn = 300) {
  const client = getClient();

  const { data, error } = await client.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, expiresIn);

  if (error) {
    console.error('Supabase Storage signed URL error:', error);
    throw new Error(`Failed to generate audio URL: ${error.message}`);
  }

  return data.signedUrl;
}

/**
 * Delete an audio file from Supabase Storage.
 * @param {string} storagePath - e.g. "4/audio-1700000000000-123456789.webm"
 */
export async function deleteAudio(storagePath) {
  if (!storagePath || storagePath.startsWith('/media/')) {
    // Legacy local path — nothing to delete from Supabase
    return;
  }
  const client = getClient();
  const { error } = await client.storage.from(BUCKET).remove([storagePath]);
  if (error) {
    console.error('Supabase Storage delete error (non-fatal):', error);
  }
}

/**
 * Download an audio file from Supabase Storage as a Buffer.
 * Used by the AI evaluator which needs the raw bytes.
 * @param {string} storagePath
 * @returns {Buffer}
 */
export async function downloadAudio(storagePath) {
  const client = getClient();
  const { data, error } = await client.storage.from(BUCKET).download(storagePath);
  if (error) {
    console.error('Supabase Storage download error:', error);
    throw new Error(`Failed to download audio: ${error.message}`);
  }
  // data is a Blob in the JS SDK — convert to Buffer
  const arrayBuffer = await data.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
