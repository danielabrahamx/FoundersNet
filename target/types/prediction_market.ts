/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/prediction_market.json`.
 */
export type PredictionMarket = {
  "address": "Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS",
  "metadata": {
    "name": "predictionMarket",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Prediction Market Smart Contract"
  },
  "instructions": [
    {
      "name": "initialize",
      "discriminator": [
        175,
        175,
        109,
        31,
        13,
        152,
        155,
        237
      ],
      "accounts": [
        {
          "name": "programState",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  103,
                  114,
                  97,
                  109,
                  95,
                  115,
                  116,
                  97,
                  116,
                  101
                ]
              }
            ]
          }
        },
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "admin",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "createEvent",
      "discriminator": [
        27,
        198,
        137,
        82,
        7,
        50,
        148,
        52
      ],
      "accounts": [
        {
          "name": "programState",
          "writable": true
        },
        {
          "name": "event",
          "writable": true
        },
        {
          "name": "eventEscrow"
        },
        {
          "name": "admin",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "name",
          "type": "string"
        },
        {
          "name": "endTime",
          "type": "i64"
        }
      ]
    },
    {
      "name": "placeBet",
      "discriminator": [
        118,
        243,
        96,
        185,
        89,
        68,
        80,
        146
      ],
      "accounts": [
        {
          "name": "programState",
          "writable": true
        },
        {
          "name": "event",
          "writable": true
        },
        {
          "name": "bet",
          "writable": true
        },
        {
          "name": "eventEscrow",
          "writable": true
        },
        {
          "name": "bettor",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "eventId",
          "type": "u64"
        },
        {
          "name": "outcome",
          "type": "bool"
        },
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "resolveEvent",
      "discriminator": [
        230,
        143,
        29,
        109,
        152,
        216,
        210,
        52
      ],
      "accounts": [
        {
          "name": "programState"
        },
        {
          "name": "event",
          "writable": true
        },
        {
          "name": "admin",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "eventId",
          "type": "u64"
        },
        {
          "name": "outcome",
          "type": "bool"
        }
      ]
    },
    {
      "name": "claimWinnings",
      "discriminator": [
        149,
        95,
        181,
        242,
        94,
        90,
        158,
        162
      ],
      "accounts": [
        {
          "name": "event"
        },
        {
          "name": "bet",
          "writable": true
        },
        {
          "name": "eventEscrow",
          "writable": true
        },
        {
          "name": "bettor",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "eventId",
          "type": "u64"
        },
        {
          "name": "betId",
          "type": "u64"
        }
      ]
    },
    {
      "name": "emergencyWithdraw",
      "discriminator": [
        99,
        153,
        125,
        205,
        178,
        245,
        207,
        175
      ],
      "accounts": [
        {
          "name": "programState"
        },
        {
          "name": "eventEscrow",
          "writable": true
        },
        {
          "name": "admin",
          "writable": true,
          "signer": true
        }
      ],
      "args": [
        {
          "name": "eventId",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "programState",
      "discriminator": [
        216,
        146,
        107,
        94,
        104,
        75,
        182,
        177
      ]
    },
    {
      "name": "event",
      "discriminator": [
        125,
        48,
        155,
        111,
        168,
        37,
        124,
        85
      ]
    },
    {
      "name": "bet",
      "discriminator": [
        206,
        60,
        243,
        223,
        57,
        93,
        50,
        25
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "unauthorized",
      "msg": "Only admin can perform this action"
    },
    {
      "code": 6001,
      "name": "eventAlreadyResolved",
      "msg": "Event has already been resolved"
    },
    {
      "code": 6002,
      "name": "eventNotResolved",
      "msg": "Event has not been resolved yet"
    },
    {
      "code": 6003,
      "name": "alreadyClaimed",
      "msg": "Winnings have already been claimed"
    },
    {
      "code": 6004,
      "name": "losingBet",
      "msg": "This bet is on the losing outcome"
    },
    {
      "code": 6005,
      "name": "eventDoesNotExist",
      "msg": "Event does not exist"
    },
    {
      "code": 6006,
      "name": "bettingPeriodEnded",
      "msg": "Betting period has ended"
    },
    {
      "code": 6007,
      "name": "betAmountMustBeGreaterThanZero",
      "msg": "Bet amount must be greater than zero"
    },
    {
      "code": 6008,
      "name": "endTimeMustBeInFuture",
      "msg": "End time must be in the future"
    },
    {
      "code": 6009,
      "name": "noBalanceToWithdraw",
      "msg": "No balance to withdraw"
    }
  ],
  "types": [
    {
      "name": "programState",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "admin",
            "type": "pubkey"
          },
          {
            "name": "eventCounter",
            "type": "u64"
          },
          {
            "name": "betCounter",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "event",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "eventId",
            "type": "u64"
          },
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "endTime",
            "type": "i64"
          },
          {
            "name": "resolved",
            "type": "bool"
          },
          {
            "name": "outcome",
            "type": "bool"
          },
          {
            "name": "totalYesBets",
            "type": "u64"
          },
          {
            "name": "totalNoBets",
            "type": "u64"
          },
          {
            "name": "totalYesAmount",
            "type": "u64"
          },
          {
            "name": "totalNoAmount",
            "type": "u64"
          },
          {
            "name": "creator",
            "type": "pubkey"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "bet",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "betId",
            "type": "u64"
          },
          {
            "name": "eventId",
            "type": "u64"
          },
          {
            "name": "bettor",
            "type": "pubkey"
          },
          {
            "name": "outcome",
            "type": "bool"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "claimed",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ]
};

export const IDL: PredictionMarket = {
  "address": "Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS",
  "metadata": {
    "name": "predictionMarket",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Prediction Market Smart Contract"
  },
  "instructions": [
    {
      "name": "initialize",
      "discriminator": [
        175,
        175,
        109,
        31,
        13,
        152,
        155,
        237
      ],
      "accounts": [
        {
          "name": "programState",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  103,
                  114,
                  97,
                  109,
                  95,
                  115,
                  116,
                  97,
                  116,
                  101
                ]
              }
            ]
          }
        },
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "admin",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "createEvent",
      "discriminator": [
        27,
        198,
        137,
        82,
        7,
        50,
        148,
        52
      ],
      "accounts": [
        {
          "name": "programState",
          "writable": true
        },
        {
          "name": "event",
          "writable": true
        },
        {
          "name": "eventEscrow"
        },
        {
          "name": "admin",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "name",
          "type": "string"
        },
        {
          "name": "endTime",
          "type": "i64"
        }
      ]
    },
    {
      "name": "placeBet",
      "discriminator": [
        118,
        243,
        96,
        185,
        89,
        68,
        80,
        146
      ],
      "accounts": [
        {
          "name": "programState",
          "writable": true
        },
        {
          "name": "event",
          "writable": true
        },
        {
          "name": "bet",
          "writable": true
        },
        {
          "name": "eventEscrow",
          "writable": true
        },
        {
          "name": "bettor",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "eventId",
          "type": "u64"
        },
        {
          "name": "outcome",
          "type": "bool"
        },
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "resolveEvent",
      "discriminator": [
        230,
        143,
        29,
        109,
        152,
        216,
        210,
        52
      ],
      "accounts": [
        {
          "name": "programState"
        },
        {
          "name": "event",
          "writable": true
        },
        {
          "name": "admin",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "eventId",
          "type": "u64"
        },
        {
          "name": "outcome",
          "type": "bool"
        }
      ]
    },
    {
      "name": "claimWinnings",
      "discriminator": [
        149,
        95,
        181,
        242,
        94,
        90,
        158,
        162
      ],
      "accounts": [
        {
          "name": "event"
        },
        {
          "name": "bet",
          "writable": true
        },
        {
          "name": "eventEscrow",
          "writable": true
        },
        {
          "name": "bettor",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "eventId",
          "type": "u64"
        },
        {
          "name": "betId",
          "type": "u64"
        }
      ]
    },
    {
      "name": "emergencyWithdraw",
      "discriminator": [
        99,
        153,
        125,
        205,
        178,
        245,
        207,
        175
      ],
      "accounts": [
        {
          "name": "programState"
        },
        {
          "name": "eventEscrow",
          "writable": true
        },
        {
          "name": "admin",
          "writable": true,
          "signer": true
        }
      ],
      "args": [
        {
          "name": "eventId",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "programState",
      "discriminator": [
        216,
        146,
        107,
        94,
        104,
        75,
        182,
        177
      ]
    },
    {
      "name": "event",
      "discriminator": [
        125,
        48,
        155,
        111,
        168,
        37,
        124,
        85
      ]
    },
    {
      "name": "bet",
      "discriminator": [
        206,
        60,
        243,
        223,
        57,
        93,
        50,
        25
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "unauthorized",
      "msg": "Only admin can perform this action"
    },
    {
      "code": 6001,
      "name": "eventAlreadyResolved",
      "msg": "Event has already been resolved"
    },
    {
      "code": 6002,
      "name": "eventNotResolved",
      "msg": "Event has not been resolved yet"
    },
    {
      "code": 6003,
      "name": "alreadyClaimed",
      "msg": "Winnings have already been claimed"
    },
    {
      "code": 6004,
      "name": "losingBet",
      "msg": "This bet is on the losing outcome"
    },
    {
      "code": 6005,
      "name": "eventDoesNotExist",
      "msg": "Event does not exist"
    },
    {
      "code": 6006,
      "name": "bettingPeriodEnded",
      "msg": "Betting period has ended"
    },
    {
      "code": 6007,
      "name": "betAmountMustBeGreaterThanZero",
      "msg": "Bet amount must be greater than zero"
    },
    {
      "code": 6008,
      "name": "endTimeMustBeInFuture",
      "msg": "End time must be in the future"
    },
    {
      "code": 6009,
      "name": "noBalanceToWithdraw",
      "msg": "No balance to withdraw"
    }
  ],
  "types": [
    {
      "name": "programState",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "admin",
            "type": "pubkey"
          },
          {
            "name": "eventCounter",
            "type": "u64"
          },
          {
            "name": "betCounter",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "event",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "eventId",
            "type": "u64"
          },
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "endTime",
            "type": "i64"
          },
          {
            "name": "resolved",
            "type": "bool"
          },
          {
            "name": "outcome",
            "type": "bool"
          },
          {
            "name": "totalYesBets",
            "type": "u64"
          },
          {
            "name": "totalNoBets",
            "type": "u64"
          },
          {
            "name": "totalYesAmount",
            "type": "u64"
          },
          {
            "name": "totalNoAmount",
            "type": "u64"
          },
          {
            "name": "creator",
            "type": "pubkey"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "bet",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "betId",
            "type": "u64"
          },
          {
            "name": "eventId",
            "type": "u64"
          },
          {
            "name": "bettor",
            "type": "pubkey"
          },
          {
            "name": "outcome",
            "type": "bool"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "claimed",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ]
};
