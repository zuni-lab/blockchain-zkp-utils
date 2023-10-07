

import {
    ACCOUNT_DISCRIMINATOR_SIZE,
    Program,
    utils,
    web3,
  } from '@coral-xyz/anchor';
  import {sha1} from '@noble/hashes/sha1';
  import {sha256} from '@noble/hashes/sha256';
import { MULTIBASE_PREFIX, VERIFIABLE_DATA_REGISTRY_DISCRIMINATOR, ZUNI_SOLANA_DID_PREFIX } from '../constants';
import { VerifiableDataRegistryType } from '../types';

  
  export const getDidSeed = (did: string): number[] => {
    const hashed = utils.sha256.hash(did);
    const didSeed = [...Buffer.from(hashed).subarray(0, 20)];
    return didSeed;
  };
  
  export const findDidPDA = (programId: web3.PublicKey, did: string) => {
    const didSeed = getDidSeed(did);
    return web3.PublicKey.findProgramAddressSync(
      [Buffer.from(didSeed)],
      programId,
    );
  };
  
  export const getVerificationMethodSeed = (
    did: string,
    keyId: string,
  ): number[] => {
    const data = did + keyId;
    const hashed = utils.sha256.hash(data);
    const verificationSeed = [...Buffer.from(hashed).subarray(0, 20)];
    return verificationSeed;
  };
  
  export const findVerificationMethodPda = (
    programId: web3.PublicKey,
    did: string,
    keyId: string,
  ) => {
    const verificationSeed = getVerificationMethodSeed(did, keyId);
    return web3.PublicKey.findProgramAddressSync(
      [Buffer.from(verificationSeed)],
      programId,
    );
  };
  
  export const getVerificationRelationshipSeeds = (
    did: string,
    keyId: string,
  ) => {
    const authenticationSeed = sha256(
      did + keyId + VERIFIABLE_DATA_REGISTRY_DISCRIMINATOR.authentication,
    );
    const assertionSeed = sha256(
      did + keyId + VERIFIABLE_DATA_REGISTRY_DISCRIMINATOR.assertion,
    );
    const keyAgreementSeed = sha256(
      did + keyId + VERIFIABLE_DATA_REGISTRY_DISCRIMINATOR.keyAgreement,
    );
  
    return {
      authenticationSeed,
      assertionSeed,
      keyAgreementSeed,
    };
  };
  
  export const findVerificationRelationshipPdas = (
    programId: web3.PublicKey,
    did: string,
    keyId: string,
  ) => {
    const {authenticationSeed, assertionSeed, keyAgreementSeed} =
      getVerificationRelationshipSeeds(did, keyId);
  
    const [authenticationPda] = web3.PublicKey.findProgramAddressSync(
      [Buffer.from(authenticationSeed)],
      programId,
    );
    const [assertionPda] = web3.PublicKey.findProgramAddressSync(
      [Buffer.from(assertionSeed)],
      programId,
    );
    const [keyAgreementPda] = web3.PublicKey.findProgramAddressSync(
      [Buffer.from(keyAgreementSeed)],
      programId,
    );
  
    return {
      authenticationPda,
      assertionPda,
      keyAgreementPda,
    };
  };
  
  export const getNumberOfDidsOwnedByController = async (
    verifiableDataRegistryProgram: Program<VerifiableDataRegistryType>,
    controllerPublicKey: web3.PublicKey,
  ): Promise<number> => {
    const accounts = await verifiableDataRegistryProgram.account.didDocument.all([
      {
        memcmp: {
          offset: ACCOUNT_DISCRIMINATOR_SIZE,
          bytes: controllerPublicKey.toBase58(),
        },
      },
    ]);
  
    return accounts.length;
  };
  
  export const deriveDidFromPublicKey = (publicKey: string) => {
    const hashed = sha1(publicKey);
    const buffer = Buffer.from(hashed);
    const did = ZUNI_SOLANA_DID_PREFIX.devnet + buffer.toString('hex');
    return did;
  };
  



  export const decodeMultibase = (data: string): Buffer => {
    const identifier = data[0];
    const encodedData = data.slice(1);

  
    switch (identifier) {
      case MULTIBASE_PREFIX.base64: {
        return Buffer.from(encodedData, 'base64');
      }
      case MULTIBASE_PREFIX.base58btc: {
        return utils.bytes.bs58.decode(encodedData);
      }
      default: {
        throw new Error('Unsupported multibase prefix');
      }
    }
  };
  