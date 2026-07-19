/**
 * Cloudinary can store and serve an uploaded file in whatever format it was
 * uploaded in — including formats like HEIC/HEIF (the default photo format
 * on many phones) that Cloudinary happily stores and serves, but that
 * browsers cannot render in a normal <img>/<Image> tag. The image "exists"
 * (the URL is valid, opening it directly in some contexts may even work),
 * it just silently fails to render on the page — showing a broken-image
 * icon with no error.
 *
 * Inserting Cloudinary's f_auto,q_auto transformation into the delivery URL
 * tells Cloudinary to pick a format the requesting browser can actually
 * display (WebP/JPEG/etc, decoding from HEIC or anything else server-side)
 * and a sensible quality — the standard fix Cloudinary itself recommends
 * for this exact problem. This is a pure delivery-URL change: no re-upload
 * needed, and it fixes already-uploaded images retroactively since nothing
 * about the stored file itself changes.
 */
export function optimizeCloudinaryUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (!url.includes('res.cloudinary.com') || !url.includes('/upload/')) return url;
  if (url.includes('f_auto')) return url; // already transformed, don't double up

  return url.replace('/upload/', '/upload/f_auto,q_auto/');
}
