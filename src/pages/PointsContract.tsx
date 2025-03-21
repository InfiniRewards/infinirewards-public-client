import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Coins } from 'lucide-react';
import { getPointsDetails } from '../services/contractService';
import { 
  byteArrayToString, 
  decodeCborMetadata, 
  isCairoByteArray, 
  decodeCairoByteArray,
  decodeCairoByteArrayContent 
} from '../utils/stringUtils';

interface PointsDetails {
  name: string;
  symbol: string;
  metadata: any; // Change to any to handle complex objects
  decimals: number;
  totalSupply: number;
}

export function PointsContract() {
  const { address } = useParams<{ address: string }>();
  const [details, setDetails] = useState<PointsDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDetails() {
      try {
        if (!address) return;
        
        const pointsDetails = await getPointsDetails(address);
        setDetails(pointsDetails);
      } catch (err) {
        console.error('Error fetching points contract details:', err);
        setError('Failed to fetch points contract details');
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

  // Helper to ensure we display string values
  const getDisplayString = (value: any, defaultValue: string = ''): string => {
    if (value === undefined || value === null) return defaultValue;
    
    if (typeof value === 'string') return value;
    
    try {
      return JSON.stringify(value);
    } catch (e) {
      return String(value);
    }
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

  if (!details) {
    return null;
  }

  const displayName = getDisplayString(details.name, 'Points Contract');
  const displaySymbol = getDisplayString(details.symbol, '');

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Coins className="h-12 w-12 text-indigo-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{displayName}</h1>
          <p className="text-gray-500">{displaySymbol}</p>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Contract Address</dt>
              <dd className="mt-1 text-sm text-gray-900 break-all">{address}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Decimals</dt>
              <dd className="mt-1 text-sm text-gray-900">{details.decimals}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Total Supply</dt>
              <dd className="mt-1 text-sm text-gray-900">{details.totalSupply}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Metadata</dt>
              <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap font-mono bg-gray-50 p-4 rounded-md overflow-auto max-h-64">
                {formatMetadata(details.metadata)}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}