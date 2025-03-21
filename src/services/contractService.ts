import { Contract, Provider } from 'starknet';
import { decode } from 'cbor2';

const RPC_URL = 'https://starknet-sepolia.public.blastapi.io/rpc/v0_7';

export const provider = new Provider({  nodeUrl: RPC_URL  });

export async function getContractAbi(address: string): Promise<any> {
  try {
    const classHash = await provider.getClassHashAt(address);
    if (!classHash) throw new Error('Contract not found');

    const contractClass = await provider.getClassByHash(classHash);
    if (!contractClass) throw new Error('Contract class not found');

    return contractClass.abi;
  } catch (error) {
    console.error('Error fetching contract ABI:', error);
    throw error;
  }
}

export async function getContract(address: string): Promise<Contract> {
  const abi = await getContractAbi(address);
  return new Contract(abi, address, provider);
}

/**
 * Helper function to convert a string to Uint8Array for CBOR decoding
 */
export function stringToUint8Array(str: string) {
  const uint8Array = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) {
    uint8Array[i] = str.charCodeAt(i);
  }
  return uint8Array;
}

export async function getCollectibleDetails(
  collectiblesContractAddress: string,
): Promise<{
  name: string;
  metadata: any;
  pointsContract: string;
  tokenIds: string[];
  prices: string[];
  expiryTimes: number[];
  tokenMetadata: any[];
  supplies: string[];
} | null> {
  try {
    // Get the collectibles contract
    const collectiblesContract = await getContract(collectiblesContractAddress);
    
    // Get details - this matches the interface in InfiniRewardsCollectible
    const result = await collectiblesContract.call("get_details");
    
    // The result is already parsed by the contract.call method
    // Cast to any to access array elements
    const resultArray = result as any[];
    
    const name = resultArray[0];
    
    // Decode metadata using CBOR
    const metadataBytes = stringToUint8Array(resultArray[1]);
    let metadata;
    try {
      metadata = decode(metadataBytes);
    } catch (error) {
      console.error("Error decoding metadata:", error);
      metadata = {metadata: resultArray[1]}; // Fallback to raw value
    }
    
    const pointsContract = resultArray[2].toString();
    
    // Process arrays
    const tokenIds = (resultArray[3] || []).map((id: any) => id.toString());
    const prices = (resultArray[4] || []).map((price: any) => price.toString());
    const expiryTimes = (resultArray[5] || []).map((time: any) => Number(time));
    
    // Process token metadata array - each item needs CBOR decoding
    const tokenMetadataArray = resultArray[6] || [];
    const tokenMetadata = tokenMetadataArray.map((item: any) => {
      try {
        const bytes = stringToUint8Array(item);
        return decode(bytes);
      } catch (error) {
        console.error("Error decoding token metadata item:", error);
        return {metadata: item}; // Fallback to raw value
      }
    });
    
    const supplies = (resultArray[7] || []).map((supply: any) => supply.toString());
    
    return {
      name,
      metadata,
      pointsContract,
      tokenIds,
      prices,
      expiryTimes,
      tokenMetadata,
      supplies
    };
  } catch (error) {
    console.error("Error getting collectible details:", error);
    return null;
  }
}


export async function getTokenData(
  tokenId: string,
  collectiblesContractAddress: string,
): Promise<{
  pointsContract: string;
  price: string;
  expiry: number;
  metadata: any;
  supply: number;
} | null> {
  try {
    // Get the collectibles contract
    const collectiblesContract = await getContract(collectiblesContractAddress);
    
    // Get token data
    const result = await collectiblesContract.call("get_token_data", [tokenId]);
    
    // The result is already parsed by the contract.call method
    // Cast to any to access array elements
    const resultArray = result as any[];
    
    const pointsContract = resultArray[0].toString();
    const price = resultArray[1].toString();
    const expiry = Number(resultArray[2]);
    
    // Decode metadata using CBOR
    const metadataBytes = stringToUint8Array(resultArray[3]);
    let metadata;
    try {
      metadata = decode(metadataBytes);
    } catch (error) {
      console.error("Error decoding metadata:", error);
      metadata = {metadata: resultArray[3]}; // Fallback to raw value
    }
    
    const supply = Number(resultArray[4]);
    
    return {
      pointsContract,
      price,
      expiry,
      metadata,
      supply
    };
  } catch (error) {
    console.error("Error getting token data for tokenId:", tokenId, "and contract address:", collectiblesContractAddress, error);
    return null;
  }
}

export async function getPointsDetails(
  pointsContractAddress: string
): Promise<{
  name: string;
  symbol: string;
  metadata: any;
  decimals: number;
  totalSupply: number;
} | null> {
  try {
    // Get the points contract
    const pointsContract = await getContract(pointsContractAddress);
    
    // Get details
    const rawResult = await pointsContract.call("get_details");

    const result = rawResult as any;

    const metadata = stringToUint8Array(result[2]);

    const decodedMetadata = decode(metadata);
    
    // Use our serialization utility to parse the result
    return {
      name: result[0],
      symbol: result[1],
      metadata: decodedMetadata as any,
      decimals: Number(result[3]),
      totalSupply: Number(result[4])
    };
  } catch (error) {
    console.error("Error getting points details:", error, (error as Error).stack);
    throw error;
  }
}