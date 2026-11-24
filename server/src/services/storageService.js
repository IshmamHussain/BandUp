// Supabase Storage wrapper for private audio uploads.
// Files go into the "speaking-audio" bucket which must be created as PRIVATE
// in your Supabase dashboard (Storage → New bucket → toggle Public OFF).
//
// Signed URLs are generated per-request so the audio is never world-readable
// and survives Render's ephemeral filesystem restarts.
import { createClient } from '@supabase/supabase-js';

const BUCKET = 'speaking-audio';
const MAX_AUDIO_BYTES = 25 * 1024 * 1024; // keep in sync with multer's limit

// Audio formats browsers' MediaRecorder produces (plus common uploads).
// Maps the base MIME type to the extension we store it under.
const AUDIO_TYPES = {
  'audio/webm': '.webm',
  'audio/ogg': '.ogg',
  'audio/mp4': '.mp4',
  'audio/x-m4a': '.m4a',
  'audio/aac': '.aac',
  'audio/mpeg': '.mp3',
  'audio/wav': '.wav',
  'audio/x-wav': '.wav',
};
const EXT_TO_TYPE = Object.fromEntries(
  Object.entries(AUDIO_TYPES).map(([type, ext]) => [ext, type])
);

/**
 * Normalise a client-reported MIME type ("audio/webm;codecs=opus") to one of
 * AUDIO_TYPES, or return null if it is not an accepted audio format.
 * Chromium sometimes labels audio-only recordings "video/webm".
 */
export function normalizeAudioMime(mime) {
  const base = String(mime || '').split(';')[0].trim().toLowerCase();
  if (base === 'video/webm') return 'audio/webm';
  return AUDIO_TYPES[base] ? base : null;
}

export function extensionForMime(mime) {
  return AUDIO_TYPES[mime] || '.webm';
}

/** MIME type for a stored path, from its extension (for re-evaluation). */
export function mimeForPath(storagePath) {
  const ext = String(storagePath).slice(String(storagePath).lastIndexOf('.')).toLowerCase();
  return EXT_TO_TYPE[ext] || 'audio/webm';
}

let supabase = null;

function getClient() {
  if (supabase) return supabase;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for audio storage.');
  }
  supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
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
      contentType: normalizeAudioMime(mimeType) || 'audio/webm',
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

/**
 * Delete every recording a user owns (all files under "<userId>/").
 * Used when an admin deletes a student so no voice data is left behind.
 * Throws on failure so the caller can stop before deleting the account.
 */
export async function deleteUserAudio(userId) {
  const client = getClient();
  const folder = String(userId);
  for (;;) {
    const { data, error } = await client.storage.from(BUCKET).list(folder, { limit: 100 });
    if (error) throw new Error(`Could not list audio for user ${userId}: ${error.message}`);
    if (!data || data.length === 0) return;
    const paths = data.map((f) => `${folder}/${f.name}`);
    const { error: rmError } = await client.storage.from(BUCKET).remove(paths);
    if (rmError) throw new Error(`Could not delete audio for user ${userId}: ${rmError.message}`);
    if (data.length < 100) return;
  }
}

/**
 * Startup check: make sure the bucket exists and is PRIVATE.
 * Creates it (private, audio-only, size-limited) if missing; if someone has
 * switched it to public, logs a loud error because every recording would be
 * world-readable. Never throws - storage problems must not stop the server.
 */
export async function ensureAudioBucket() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('Audio storage: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing - speaking uploads will fail.');
    return;
  }
  try {
    const client = getClient();
    const { data, error } = await client.storage.getBucket(BUCKET);
    if (error || !data) {
      const { error: createError } = await client.storage.createBucket(BUCKET, {
        public: false,
        fileSizeLimit: MAX_AUDIO_BYTES,
        allowedMimeTypes: Object.keys(AUDIO_TYPES),
      });
      if (createError) throw createError;
      console.log(`Audio storage: created private bucket "${BUCKET}".`);
      return;
    }
    if (data.public) {
      console.error(`SECURITY: Supabase bucket "${BUCKET}" is PUBLIC - every speaking recording is world-readable. ` +
        'Set it to private in Supabase → Storage → Edit bucket.');
    }
  } catch (err) {
    console.error('Audio storage check failed:', err.message || err);
  }
}
