import axios from 'axios';

// Replace with your Pinata API key JWT
const PINATA_JWT = process.env.REACT_APP_PINATA_JWT || '';
const PINATA_GATEWAY = 'https://gateway.pinata.cloud/ipfs/';

if (!PINATA_JWT) {
  console.warn('Pinata JWT is not set in environment variables');
}

/**
 * Uploads a file to IPFS via Pinata
 * @param file - The file to upload
 * @returns The IPFS CID of the uploaded file
 */
export async function uploadToPinata(file: File): Promise<string> {
  if (!PINATA_JWT) {
    throw new Error('Pinata JWT is not configured');
  }

  console.log('Uploading to Pinata:', { fileName: file.name, fileSize: file.size });

  const formData = new FormData();
  formData.append('file', file);

  // Add metadata to identify the upload
  const metadata = JSON.stringify({
    name: `CarryChain-Proof-${Date.now()}`,
    keyvalues: {
      app: 'CarryChain',
      timestamp: Date.now().toString(),
    },
  });
  formData.append('pinataMetadata', metadata);

  // Configure pinning options
  const pinataOptions = JSON.stringify({
    cidVersion: 1,
  });
  formData.append('pinataOptions', pinataOptions);

  try {
    const res = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${PINATA_JWT}`,
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });

    console.log('Pinata upload successful:', res.data.IpfsHash);
    return res.data.IpfsHash;
  } catch (error: any) {
    console.error('Error uploading to Pinata:', error);
    if (error.response) {
      console.error('Pinata response:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers,
      });
      const status = error.response.status;
      const data = error.response.data;

      if (status === 401) {
        throw new Error('Pinata authentication failed. Check your JWT token.');
      } else if (status === 403) {
        throw new Error('Pinata access forbidden. Verify JWT permissions for pinFileToIPFS.');
      } else if (status === 429) {
        throw new Error('Pinata rate limit exceeded. Please try again later.');
      } else if (data && data.error) {
        throw new Error(`Pinata error: ${data.error}`);
      }
    }
    throw new Error('Failed to upload to IPFS via Pinata: ' + (error.message || 'Unknown error'));
  }
}

/**
 * Get the IPFS gateway URL for a CID
 * @param cid - The IPFS CID
 * @returns The gateway URL
 */
export function getPinataGatewayURL(cid: string): string {
  if (!cid) return '';
  const cleanCid = cid.replace('ipfs://', '');
  return `${PINATA_GATEWAY}${cleanCid}`;
}

/**
 * Get image with fallback to other IPFS gateways
 * @param cid - The IPFS CID
 * @param onLoad - Callback when image loads successfully
 * @param onError - Callback when all gateways fail
 */
export function getImageWithFallback(cid: string, onLoad: (url: string) => void, onError: () => void): void {
  const gateways = [
    PINATA_GATEWAY,
    'https://ipfs.io/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/',
    'https://dweb.link/ipfs/',
  ];

  function tryNextGateway(index = 0) {
    if (index >= gateways.length) {
      onError();
      return;
    }

    const gateway = gateways[index];
    const cleanCid = cid.replace('ipfs://', '');
    const url = `${gateway}${cleanCid}`;

    const img = new Image();
    img.onload = () => onLoad(url);
    img.onerror = () => tryNextGateway(index + 1);
    img.src = url;
  }

  tryNextGateway();
}