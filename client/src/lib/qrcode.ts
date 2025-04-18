import QRCode from 'qrcode';

/**
 * Generate a QR code as a data URL
 * @param text - The text to encode in the QR code
 * @param options - Options for QR code generation
 * @returns A Promise that resolves to a data URL string
 */
export const generateQRCode = async (
  text: string,
  options: {
    width?: number;
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
    dark?: string;
    light?: string;
  } = {}
): Promise<string> => {
  const defaultOptions = {
    width: 300,
    errorCorrectionLevel: 'M' as const,
    dark: '#000000',
    light: '#ffffff',
    margin: 1,
  };

  const mergedOptions = { ...defaultOptions, ...options };

  try {
    return await QRCode.toDataURL(text, mergedOptions);
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
};

/**
 * Generate a QR code as an SVG string
 * @param text - The text to encode in the QR code
 * @param options - Options for QR code generation
 * @returns A Promise that resolves to an SVG string
 */
export const generateQRCodeSVG = async (
  text: string,
  options: {
    width?: number;
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
    dark?: string;
    light?: string;
  } = {}
): Promise<string> => {
  const defaultOptions = {
    width: 300,
    errorCorrectionLevel: 'M' as const,
    dark: '#000000',
    light: '#ffffff',
    margin: 1,
  };

  const mergedOptions = { ...defaultOptions, ...options };

  try {
    return await QRCode.toString(text, {
      ...mergedOptions,
      type: 'svg',
    });
  } catch (error) {
    console.error('Error generating QR code SVG:', error);
    throw new Error('Failed to generate QR code SVG');
  }
};

/**
 * Extract QR code data from an image using a scanner
 * @param imageData - The image data to scan
 * @returns The decoded QR code data
 * 
 * Note: This is a placeholder for client-side QR scanning.
 * In a real implementation, you would use a library like jsQR
 * or integrate with a mobile device's camera API.
 */
export const scanQRCode = async (imageData: ImageData): Promise<string> => {
  // This function is a placeholder. In production, you would use 
  // a library like jsQR to decode QR codes from image data.
  
  // Example implementation:
  // const code = jsQR(imageData.data, imageData.width, imageData.height);
  // if (code) {
  //   return code.data;
  // }
  
  // For now, we'll throw an error to indicate this needs implementation
  throw new Error('QR code scanning not implemented');
};
