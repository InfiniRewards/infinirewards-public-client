import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Package, ExternalLink, Image as ImageIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { getCollectibleDetails } from '../services/contractService';

// Combined interface for all collectible details
interface CollectibleData {
  name: string;
  metadata: any; 
  pointsContract: string;
  tokenIds: string[];
  prices: string[];
  expiryTimes: number[];
  tokenMetadata: any[];
  supplies: string[];
}

export function CollectibleContract() {
  const { address } = useParams<{ address: string }>();
  const [collectibleData, setCollectibleData] = useState<CollectibleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDetails() {
      try {
        if (!address) return;
        
        const data = await getCollectibleDetails(address);
        
        if (!data) {
          setError('Failed to fetch collectible contract details');
          return;
        }
        
        // Store the entire data object as received from the service
        setCollectibleData(data);
      } catch (err) {
        console.error('Error fetching collectible contract details:', err);
        setError('Failed to fetch collectible contract details');
      } finally {
        setLoading(false);
      }
    }

    if (address) {
      fetchDetails();
    }
  }, [address]);

  // Helper function to format metadata for display
  const formatMetadata = (metadata: any): string => {
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

  // Function to convert metadata to a hierarchical object structure for the UI
  const getMetadataStructure = (metadata: any): [string, any][] => {
    if (!metadata || typeof metadata !== 'object') return [];
    
    return Object.entries(metadata).filter(([key]) => 
      // Filter out keys that we display elsewhere to avoid duplication
      !['name', 'image', 'banner_image', 'description', 'external_link'].includes(key)
    );
  };

  const MetadataTree = ({ data, level = 0 }: { data: any, level?: number }) => {
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    
    const toggleExpand = (key: string) => {
      setExpanded(prev => ({
        ...prev,
        [key]: !prev[key]
      }));
    };
    
    if (Array.isArray(data)) {
      return (
        <div className="ml-4">
          {data.map((item, index) => (
            <div key={index} className="mb-1">
              {typeof item === 'object' && item !== null ? (
                <div>
                  <div 
                    className="flex items-center cursor-pointer text-indigo-600"
                    onClick={() => toggleExpand(`array-${index}`)}
                  >
                    {expanded[`array-${index}`] ? 
                      <ChevronUp className="h-4 w-4 mr-1" /> : 
                      <ChevronDown className="h-4 w-4 mr-1" />
                    }
                    <span className="font-medium">[{index}]</span>
                  </div>
                  {expanded[`array-${index}`] && (
                    <div className="ml-4 mt-1 border-l-2 border-gray-200 pl-3">
                      <MetadataTree data={item} level={level + 1} />
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex ml-4">
                  <span className="text-gray-500 mr-2">[{index}]:</span>
                  <span>{String(item)}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      );
    }
    
    return (
      <div>
        {Object.entries(data || {}).map(([key, value]) => (
          <div key={key} className="mb-2">
            {typeof value === 'object' && value !== null ? (
              <div>
                <div 
                  className="flex items-center cursor-pointer text-indigo-600"
                  onClick={() => toggleExpand(key)}
                >
                  {expanded[key] ? 
                    <ChevronUp className="h-4 w-4 mr-1" /> : 
                    <ChevronDown className="h-4 w-4 mr-1" />
                  }
                  <span className="font-medium">{key}</span>
                </div>
                {expanded[key] && (
                  <div className="ml-4 mt-1 border-l-2 border-gray-200 pl-3">
                    <MetadataTree data={value} level={level + 1} />
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-wrap">
                <span className="text-gray-500 mr-2 font-medium">{key}:</span>
                {typeof value === 'string' && (value.startsWith('http://') || value.startsWith('https://')) ? (
                  <a 
                    href={value} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-indigo-600 hover:text-indigo-500 break-all"
                  >
                    {value}
                  </a>
                ) : (
                  <span className="break-all">{String(value)}</span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    );
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

  if (!collectibleData) {
    return null;
  }

  // Get metadata values for display
  const { name: displayName, metadata: collectionMetadata = {} } = collectibleData;

  return (
    <div className="space-y-6">
      {/* Banner image if available */}
      {collectionMetadata.banner_image && (
        <div className="relative h-40 sm:h-60 overflow-hidden rounded-lg shadow-md">
          <img 
            src={typeof collectionMetadata.banner_image === 'string' 
                ? collectionMetadata.banner_image 
                : ''}
            alt={`${displayName} banner`}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      )}
    
      <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
        {/* Collection image/logo if available */}
        {collectionMetadata.image ? (
          <img 
            src={typeof collectionMetadata.image === 'string' 
                ? collectionMetadata.image 
                : ''}
            alt={displayName}
            className="h-20 w-20 rounded-lg shadow-md object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.parentElement?.classList.remove('sm:space-x-6');
            }}
          />
        ) : (
          <Package className="h-16 w-16 text-indigo-600" />
        )}
        
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{displayName}</h1>
          <div className="flex items-center space-x-4 mt-1">
            <Link 
              to={`/points/${collectibleData.pointsContract}`} 
              className="text-indigo-600 hover:text-indigo-500 flex items-center"
            >
              Points Contract <ExternalLink className="ml-1 h-4 w-4" />
            </Link>
            
            {collectionMetadata.external_link && (
              <a 
                href={typeof collectionMetadata.external_link === 'string' 
                    ? collectionMetadata.external_link 
                    : '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-500 flex items-center"
              >
                External Website <ExternalLink className="ml-1 h-4 w-4" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Collection description if available */}
      {collectionMetadata.description && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">About this collection</h3>
            <p className="text-gray-700">
              {typeof collectionMetadata.description === 'string'
                ? collectionMetadata.description
                : JSON.stringify(collectionMetadata.description)}
            </p>
          </div>
        </div>
      )}

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Contract Address</dt>
              <dd className="mt-1 text-sm text-gray-900 break-all">{address}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Metadata</dt>
              <dd className="mt-2 text-sm text-gray-900 bg-white rounded-md p-4 border border-gray-200">
                {collectibleData.metadata && Object.keys(collectibleData.metadata).length > 0 ? (
                  <MetadataTree data={collectibleData.metadata} />
                ) : (
                  <div className="text-gray-500 italic">No metadata available</div>
                )}
                {/* Show view raw JSON option */}
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm text-indigo-600 hover:text-indigo-500">
                    View raw JSON
                  </summary>
                  <pre className="mt-2 whitespace-pre-wrap font-mono bg-gray-50 p-4 rounded-md overflow-auto max-h-64 text-xs">
                    {formatMetadata(collectibleData.metadata)}
                  </pre>
                </details>
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Collectible Tokens</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {collectibleData.tokenIds.map((tokenId, index) => {
              const tokenMetadata = collectibleData.tokenMetadata[index] || {};
              let tokenImage = '';
              let tokenName = `Token #${tokenId}`;
              
              if (tokenMetadata) {
                if (tokenMetadata.image && typeof tokenMetadata.image === 'string') {
                  tokenImage = tokenMetadata.image;
                }
                
                if (tokenMetadata.name) {
                  tokenName = typeof tokenMetadata.name === 'string' 
                    ? tokenMetadata.name 
                    : `Token #${tokenId}`;
                }
              }
              
              return (
                <Link
                  key={tokenId}
                  to={`/collectibles/${address}/token/${tokenId}`}
                  className="block p-4 rounded-lg border border-gray-200 hover:border-indigo-500 transition-colors"
                >
                  {tokenImage && (
                    <div className="mb-3 h-32 rounded overflow-hidden bg-gray-50">
                      <img 
                        src={tokenImage} 
                        alt={tokenName}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const placeholder = document.createElement('div');
                          placeholder.className = 'flex items-center justify-center h-full';
                          placeholder.innerHTML = '<svg class="h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>';
                          e.currentTarget.parentNode?.appendChild(placeholder);
                        }}
                      />
                    </div>
                  )}
                  <div className="font-medium text-gray-900">{tokenName}</div>
                  <div className="text-sm text-gray-500">
                    Price: {collectibleData.prices[index]} points
                  </div>
                  <div className="text-sm text-gray-500">
                    Supply: {collectibleData.supplies[index]}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}