import { NextResponse } from 'next/server';
import { uploadImage } from '@/lib/cloudinary';

const MAX_BYTES = 8 * 1024 * 1024; // 8MB, matches typical Cloudinary free-tier friendly limit

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const image = body?.image as string | undefined;
    const folder = (body?.folder as string | undefined) || 'portfolio';

    if (!image || typeof image !== 'string') {
      return NextResponse.json({ error: 'No image data provided.' }, { status: 400 });
    }

    if (!image.startsWith('data:')) {
      return NextResponse.json({ error: 'Expected a base64 data URI.' }, { status: 400 });
    }

    // Rough size check on the base64 payload before sending it upstream.
    const approxBytes = (image.length * 3) / 4;
    if (approxBytes > MAX_BYTES) {
      return NextResponse.json({ error: 'Image is too large (max 8MB).' }, { status: 413 });
    }

    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return NextResponse.json(
        { error: 'Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in your environment.' },
        { status: 500 }
      );
    }

    const url = await uploadImage(image, folder);
    return NextResponse.json({ success: true, url });
  } catch (error: any) {
    console.error('Image upload failed:', error);
    return NextResponse.json({ error: error?.message || 'Image upload failed.' }, { status: 500 });
  }
}
