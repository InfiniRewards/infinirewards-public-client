import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Package, ArrowLeft, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { format } from 'date-fns';
import { getTokenData } from '../services/contractService';
import { byteArrayToString, decodeCborMetadata, isCairoByteArray, decodeCairoByteArray, decodeCairoByteArrayContent } from '../utils/stringUtils';
import { decode as decodeCbor } from 'cbor2';

interface TokenData {
  pointsContract: string;
  price: string;
  expiry: number;
  metadata: any;
  supply: number;
}

// Interface for decoded token metadata format
interface TokenMetadata {
  name?: string;
  description?: string;
  image?: string;
  attributes?: Array<{ trait_type: string; value: string | number }>;
  [key: string]: any; // Allow additional properties
}

export function CollectibleToken() {
  const { address, tokenId } = useParams<{ address: string; tokenId: string }>();
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [decodedMetadata, setDecodedMetadata] = useState<TokenMetadata | null>(null);

  useEffect(() => {
    async function fetchTokenData() {
      try {
        if (!address || !tokenId) return;
        
        const data = await getTokenData(tokenId, address);
        
        if (!data) {
          setError('Failed to fetch token details');
          return;
        }
        
        // Set our token data from the service response
        setTokenData(data);
        
        // Set the decoded metadata for display
        if (data.metadata) {
          setDecodedMetadata(data.metadata as TokenMetadata);
        } else {
          setDecodedMetadata({ name: `Token #${tokenId}` });
        }
      } catch (err) {
        console.error('Error fetching token details:', err);
        setError('Failed to fetch token details');
      } finally {
        setLoading(false);
      }
    }

    if (address && tokenId) {
      fetchTokenData();
    }
  }, [address, tokenId]);

  // Helper function to format raw metadata for display
  const formatRawMetadata = (metadata: any): string => {
    if (!metadata) return '';
    
    // Custom replacer function to handle BigInt
    const replacer = (key: string, value: any) => {
      // Convert BigInt to string
      if (typeof value === 'bigint') {
        return value.toString();
      }
      return value;
    };
    
    if (typeof metadata === 'string') {
      // Check if it's already a JSON string
      try {
        const parsed = JSON.parse(metadata);
        return JSON.stringify(parsed, replacer, 2);
      } catch (e) {
        // If it's not valid JSON, return as is
        return metadata;
      }
    }
    
    // If it's an object, stringify it nicely with our custom replacer
    try {
      return JSON.stringify(metadata, replacer, 2);
    } catch (e) {
      console.error('Error stringifying metadata:', e);
      return String(metadata);
    }
  };

  // Get a display name as a string, handling object values
  const getDisplayName = (): string => {
    if (!decodedMetadata?.name) {
      return `Token #${tokenId}`;
    }
    
    if (typeof decodedMetadata.name === 'string') {
      return decodedMetadata.name;
    }
    
    // If name is an object, try to convert it to a string
    return JSON.stringify(decodedMetadata.name);
  };

  // Get image URL as a string or empty
  const getImageUrl = (): string => {
    if (!decodedMetadata?.image) {
      return '';
    }
    
    if (typeof decodedMetadata.image === 'string') {
      return decodedMetadata.image;
    }
    
    return '';
  };

  // Get description as a string
  const getDescription = (): string => {
    if (!decodedMetadata?.description) {
      return '';
    }
    
    if (typeof decodedMetadata.description === 'string') {
      return decodedMetadata.description;
    }
    
    return JSON.stringify(decodedMetadata.description);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-lg">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  if (!tokenData) {
    return null;
  }

  const expiryDate = new Date(tokenData.expiry * 1000);
  const displayName = getDisplayName();
  const imageUrl = getImageUrl();
  const description = getDescription();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to={`/collectibles/${address}`}
          className="flex items-center text-indigo-600 hover:text-indigo-500"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Collection
        </Link>
      </div>

      <div className="flex items-center space-x-4">
        <Package className="h-12 w-12 text-indigo-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{displayName}</h1>
          <Link 
            to={`/points/${tokenData.pointsContract}`} 
            className="text-indigo-600 hover:text-indigo-500 flex items-center"
          >
            Points Contract <ExternalLink className="ml-1 h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Token image if available */}
      {imageUrl && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="flex justify-center p-6">
            <img 
              src={imageUrl} 
              alt={displayName}
              className="max-h-80 rounded-md"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = '';
                e.currentTarget.classList.add('hidden');
                // Show placeholder when image fails to load
                const placeholder = document.createElement('div');
                placeholder.className = 'h-64 w-64 flex items-center justify-center bg-gray-100 rounded-md';
                placeholder.innerHTML = '<svg class="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>';
                e.currentTarget.parentNode?.appendChild(placeholder);
              }}
            />
          </div>
        </div>
      )}

      {/* Description if available */}
      {description && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Description</h3>
            <p className="text-gray-700">{description}</p>
          </div>
        </div>
      )}

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Price</dt>
              <dd className="mt-1 text-sm text-gray-900">{tokenData.price} points</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Current Supply</dt>
              <dd className="mt-1 text-sm text-gray-900">{tokenData.supply}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Expiry Date</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {format(expiryDate, 'PPP')}
              </dd>
            </div>
            
            {/* Token Attributes/Traits */}
            {decodedMetadata?.attributes && Array.isArray(decodedMetadata.attributes) && decodedMetadata.attributes.length > 0 && (
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500 mb-3">Attributes</dt>
                <dd className="mt-1">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {decodedMetadata.attributes.map((attr, index) => {
                      // Ensure we have valid attribute data
                      const traitType = typeof attr.trait_type === 'string' 
                        ? attr.trait_type 
                        : `Attribute ${index}`;
                      
                      let traitValue = '';
                      if (attr.value !== undefined) {
                        traitValue = typeof attr.value === 'string' || typeof attr.value === 'number'
                          ? String(attr.value)
                          : JSON.stringify(attr.value);
                      }
                      
                      return (
                        <div key={index} className="bg-gray-50 px-4 py-3 rounded-md">
                          <div className="text-xs font-medium text-gray-500 uppercase">
                            {traitType}
                          </div>
                          <div className="text-sm font-medium text-gray-900">
                            {traitValue}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </dd>
              </div>
            )}
            
            {/* Raw Metadata for debugging/transparency */}
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Raw Metadata</dt>
              <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap font-mono bg-gray-50 p-4 rounded-md overflow-auto max-h-64">
                {formatRawMetadata(tokenData.metadata)}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}