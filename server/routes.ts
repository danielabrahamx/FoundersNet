import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import algosdk from "algosdk";
import crypto from "crypto";

/**
 * Type definitions for Event and Bet structures
 */
interface Event {
  eventId: number;
  name: string;
  endTime: number;
  resolved: boolean;
  outcome: boolean;
  totalYesBets: number;
  totalNoBets: number;
  totalYesAmount: string;
  totalNoAmount: string;
}

interface Bet {
  betId: string;
  eventId: string;
  bettor: string;
  outcome: boolean;
  amount: string;
  claimed: boolean;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Algorand client configuration
  const getAlgodClient = (): algosdk.Algodv2 => {
    const network = process.env.VITE_ALGORAND_NETWORK || 'localnet';
    
    if (network === 'localnet') {
      const token = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
      const server = 'http://localhost';
      const port = 4001;
      
      console.log(`🔗 Creating algod client for localnet: ${server}:${port}`);
      return new algosdk.Algodv2(token, server, port);
    } else if (network === 'testnet') {
      console.log('🔗 Creating algod client for testnet');
      return new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '');
    }
    
    throw new Error(`Unsupported network: ${network}`);
  };

  const APP_ID = parseInt(process.env.VITE_ALGORAND_APP_ID || '0');

  /**
   * ABI Type definitions for ARC-4 decoding
   * EventStruct: (uint64,string,uint64,bool,bool,uint64,uint64,uint64,uint64)
   * BetStruct: (uint64,uint64,address,bool,uint64,bool)
   */
  const eventStructType = algosdk.ABIType.from('(uint64,string,uint64,bool,bool,uint64,uint64,uint64,uint64)');
  const betStructType = algosdk.ABIType.from('(uint64,uint64,address,bool,uint64,bool)');

  /**
   * Decode ARC-4 encoded EventStruct from box storage
   */
  const decodeEventStruct = (data: Uint8Array): Event => {
    const decoded = eventStructType.decode(data) as any[];
    
    // ARC-4 Bool type: Check if it has a valueOf() method or compare directly
    const resolvedValue = decoded[3]?.valueOf ? decoded[3].valueOf() : (decoded[3] === 0x80 || decoded[3] === true);
    const outcomeValue = decoded[4]?.valueOf ? decoded[4].valueOf() : (decoded[4] === 0x80 || decoded[4] === true);
    
    return {
      eventId: Number(decoded[0]),
      name: decoded[1],
      endTime: Number(decoded[2]),
      resolved: resolvedValue,
      outcome: outcomeValue,
      totalYesBets: Number(decoded[5]),
      totalNoBets: Number(decoded[6]),
      totalYesAmount: decoded[7].toString(),
      totalNoAmount: decoded[8].toString(),
    };
  };

  /**
   * Decode ARC-4 encoded BetStruct from box storage
   * Manual decoding to ensure correct address parsing
   */
  const decodeBetStruct = (data: Uint8Array): Bet => {
    // BetStruct layout (58 bytes total):
    // 0-7: bet_id (uint64)
    // 8-15: event_id (uint64)
    // 16-47: bettor (address, 32 bytes)
    // 48: outcome (bool, 1 byte)
    // 49-56: amount (uint64)
    // 57: claimed (bool, 1 byte)
    
    const betId = Buffer.from(data.slice(0, 8)).readBigUInt64BE(0).toString();
    const eventId = Buffer.from(data.slice(8, 16)).readBigUInt64BE(0).toString();
    const bettorBytes = data.slice(16, 48);
    const bettor = algosdk.encodeAddress(bettorBytes);
    const outcome = data[48] === 0x80; // ARC-4 bool: 0x80 = true, 0x00 = false
    const amount = Buffer.from(data.slice(49, 57)).readBigUInt64BE(0).toString();
    const claimed = data[57] === 0x80; // ARC-4 bool
    
    return {
      betId,
      eventId,
      bettor,
      outcome,
      amount,
      claimed,
    };
  };

  /**
   * Construct box name for events: "events" + uint64(eventId)
   */
  const getEventBoxName = (eventId: number): Uint8Array => {
    const prefix = Buffer.from('events', 'utf-8');
    const idBytes = Buffer.allocUnsafe(8);
    idBytes.writeBigUInt64BE(BigInt(eventId), 0);
    return new Uint8Array(Buffer.concat([prefix, idBytes]));
  };

  /**
   * Construct box name for event bets: "event_bets" + uint64(eventId)
   */
  const getEventBetsBoxName = (eventId: number): Uint8Array => {
    const prefix = Buffer.from('event_bets', 'utf-8');
    const idBytes = Buffer.allocUnsafe(8);
    idBytes.writeBigUInt64BE(BigInt(eventId), 0);
    return new Uint8Array(Buffer.concat([prefix, idBytes]));
  };

  /**
   * Read global state value by key
   */
  const getGlobalStateValue = (globalState: any[], key: string): number => {
    for (const item of globalState) {
      // In algosdk v3, item.key is a Uint8Array, not a base64 string
      const decodedKey = new TextDecoder().decode(item.key);
      if (decodedKey === key) {
        // item.value.uint returns BigInt in v3, convert to number
        return Number(item.value.uint) || 0;
      }
    }
    return 0;
  };


  // GET /api/events - Get all events from Algorand blockchain
  app.get("/api/events", async (req, res) => {
    console.log('🔵 GET /api/events - Fetching all events');
    
    try {
      if (!APP_ID) {
        console.log('⚠️  No APP_ID configured');
        return res.json([]);
      }

      const algodClient = getAlgodClient();
      console.log('🔗 Algod client created, fetching app info...');
      
      // Fetch application info to get global state
      let appInfo;
      try {
        appInfo = await algodClient.getApplicationByID(APP_ID).do();
        console.log('✅ App info fetched successfully');
      } catch (fetchErr: any) {
        console.error('❌ Failed to fetch app info:', {
          message: fetchErr.message,
          status: fetchErr.status,
          response: fetchErr.response,
        });
        throw fetchErr;
      }
      
      const globalState = appInfo.params.globalState || [];
      
      // Get event counter from global state
      const eventCounter = getGlobalStateValue(globalState, 'event_counter');
      console.log(`📊 Event counter: ${eventCounter}`);

      if (eventCounter === 0) {
        console.log('ℹ️  No events found');
        return res.json([]);
      }

      // Fetch all events from box storage
      const events: Event[] = [];
      const fetchPromises: Promise<void>[] = [];

      for (let i = 1; i <= eventCounter; i++) {
        const fetchPromise = (async (eventId: number) => {
          try {
            const boxName = getEventBoxName(eventId);
            
            console.log(`📦 Fetching event ${eventId}`, {
              boxNameHex: Buffer.from(boxName).toString('hex'),
              boxNameBase64: Buffer.from(boxName).toString('base64'),
            });

            const boxResponse = await algodClient.getApplicationBoxByName(APP_ID, boxName).do();
            
            if (boxResponse?.value) {
              const eventData = decodeEventStruct(new Uint8Array(boxResponse.value));
              events.push(eventData);
              console.log(`✅ Event ${eventId} decoded:`, eventData.name);
            }
          } catch (err: any) {
            // Box not found or decoding error - log but continue
            if (err.status === 404) {
              console.log(`⚠️  Event ${eventId} box not found (may have been deleted)`);
            } else {
              console.error(`❌ Error fetching event ${eventId}:`, {
                message: err.message,
                status: err.status,
              });
            }
          }
        })(i);

        fetchPromises.push(fetchPromise);
      }

      // Wait for all events to be fetched
      await Promise.all(fetchPromises);

      // Sort events by ID
      events.sort((a, b) => a.eventId - b.eventId);

      console.log(`✅ Successfully fetched ${events.length} events`);
      res.json(events);

    } catch (error: any) {
      console.error('❌ Error in /api/events:', {
        message: error.message,
        stack: error.stack,
        cause: error.cause,
        name: error.name,
      });
      res.status(500).json({ 
        error: 'Failed to fetch events',
        message: error.message 
      });
    }
  });


  // GET /api/events/:id - Get specific event by ID
  app.get("/api/events/:id", async (req, res) => {
    console.log(`🔵 GET /api/events/${req.params.id}`);
    
    try {
      const eventId = parseInt(req.params.id);
      
      if (!APP_ID || !eventId || isNaN(eventId) || eventId < 1) {
        return res.status(400).json({ error: 'Invalid event ID' });
      }

      const algodClient = getAlgodClient();
      const boxName = getEventBoxName(eventId);
      
      console.log(`📦 Fetching event ${eventId}`, {
        boxNameHex: Buffer.from(boxName).toString('hex'),
      });

      const boxResponse = await algodClient.getApplicationBoxByName(APP_ID, boxName).do();
      
      if (boxResponse?.value) {
        const eventData = decodeEventStruct(new Uint8Array(boxResponse.value));
        console.log(`✅ Event ${eventId} found:`, eventData.name);
        res.json(eventData);
      } else {
        res.status(404).json({ error: 'Event not found' });
      }
      
    } catch (error: any) {
      if (error.status === 404) {
        console.log(`⚠️  Event ${req.params.id} not found`);
        res.status(404).json({ error: 'Event not found' });
      } else {
        console.error(`❌ Error fetching event ${req.params.id}:`, error.message);
        res.status(500).json({ 
          error: 'Failed to fetch event',
          message: error.message 
        });
      }
    }
  });

  // GET /api/users/:address/bets - Get all bets for a specific user
  app.get("/api/users/:address/bets", async (req, res) => {
    const userAddress = req.params.address;
    console.log(`🔵 GET /api/users/${userAddress}/bets`);
    
    try {
      if (!APP_ID || !userAddress) {
        return res.status(400).json({ error: 'Invalid request' });
      }

      const algodClient = getAlgodClient();
      
      // Construct user_bets box name: "user_bets" + 32-byte address
      const userBetsPrefix = Buffer.from('user_bets', 'utf-8');
      const addressBytes = algosdk.decodeAddress(userAddress).publicKey;
      const boxName = new Uint8Array(Buffer.concat([userBetsPrefix, Buffer.from(addressBytes)]));
      
      console.log(`📦 Fetching user_bets box for ${userAddress.slice(0, 8)}...`);

      try {
        const boxResponse = await algodClient.getApplicationBoxByName(APP_ID, boxName).do();
        
        if (boxResponse?.value) {
          const boxValue = new Uint8Array(boxResponse.value);
          console.log(`✅ Found user_bets box, size: ${boxValue.length} bytes`);
          console.log(`📊 Box value (hex): ${Buffer.from(boxValue).toString('hex')}`);
          
          // Box contains ARC-4 encoded DynamicArray[UInt64]
          // ARC-4 dynamic array format: 2 bytes length prefix + elements
          if (boxValue.length < 2) {
            console.log('⚠️  Box too small to contain array');
            return res.json([]);
          }
          
          const arrayLength = Buffer.from(boxValue.slice(0, 2)).readUInt16BE(0);
          console.log(`📊 Array length from ARC-4: ${arrayLength}`);
          
          const betIds: number[] = [];
          for (let i = 0; i < arrayLength; i++) {
            const offset = 2 + (i * 8); // Skip 2-byte length prefix, each UInt64 is 8 bytes
            if (offset + 8 <= boxValue.length) {
              const betId = Number(Buffer.from(boxValue.slice(offset, offset + 8)).readBigUInt64BE(0));
              betIds.push(betId);
            }
          }
          
          console.log(`📊 Found ${betIds.length} bet IDs:`, betIds);
          
          // Fetch each bet's details from bets boxes
          const bets: Bet[] = [];
          for (const betId of betIds) {
            try {
              const betsPrefix = Buffer.from('bets', 'utf-8');
              const betIdBytes = Buffer.allocUnsafe(8);
              betIdBytes.writeBigUInt64BE(BigInt(betId), 0);
              const betBoxName = new Uint8Array(Buffer.concat([betsPrefix, betIdBytes]));
              
              console.log(`🔍 Looking for bet box with ID ${betId}, boxName hex: ${Buffer.from(betBoxName).toString('hex')}`);
              
              const betBoxResponse = await algodClient.getApplicationBoxByName(APP_ID, betBoxName).do();
              
              if (betBoxResponse?.value) {
                const betData = new Uint8Array(betBoxResponse.value);
                console.log(`📦 Bet box found, size: ${betData.length} bytes`);
                
                // Use ARC-4 decoder
                const bet = decodeBetStruct(betData);
                bets.push(bet);
                console.log(`✅ Decoded bet ${betId}`, bet);
              }
            } catch (betErr: any) {
              console.error(`❌ Error fetching bet ${betId}:`, betErr.message);
            }
          }
          
          console.log(`✅ Returning ${bets.length} bets for user`);
          res.json(bets);
        } else {
          console.log(`ℹ️  No bets found for user`);
          res.json([]);
        }
      } catch (boxErr: any) {
        if (boxErr.status === 404) {
          console.log(`ℹ️  No bets box found for user - user has no bets`);
          res.json([]);
        } else {
          throw boxErr;
        }
      }
      
    } catch (error: any) {
      console.error(`❌ Error fetching user bets:`, error.message);
      res.status(500).json({ 
        error: 'Failed to fetch user bets',
        message: error.message 
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}

