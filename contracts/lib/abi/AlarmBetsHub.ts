export default [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "enum RegisteredAlarmType",
        name: "alarmType",
        type: "uint8",
      },
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "alarmAddr",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
    ],
    name: "AlarmCreation",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "enum RegisteredAlarmType",
        name: "alarmType",
        type: "uint8",
      },
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "alarmId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "pointsEarned",
        type: "uint256",
      },
    ],
    name: "ConfirmationSubmitted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "previousOwner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "OwnershipTransferred",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "enum RegisteredAlarmType",
        name: "alarmType",
        type: "uint8",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "alarmId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "enum CommitmentStatus",
        name: "from",
        type: "uint8",
      },
      {
        indexed: false,
        internalType: "enum CommitmentStatus",
        name: "to",
        type: "uint8",
      },
    ],
    name: "StatusChanged",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        indexed: true,
        internalType: "enum RegisteredAlarmType",
        name: "alarmType",
        type: "uint8",
      },
      {
        indexed: false,
        internalType: "address",
        name: "alarmAddr",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
    ],
    name: "UserJoined",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "alarmBetsPoints",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "alarmId",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "alarmType",
    outputs: [
      {
        internalType: "enum RegisteredAlarmType",
        name: "",
        type: "uint8",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "enum RegisteredAlarmType",
        name: "",
        type: "uint8",
      },
    ],
    name: "alarmTypeRegistry",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "alarms",
    outputs: [
      {
        internalType: "contract BaseCommitment",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "enum RegisteredAlarmType",
        name: "_type",
        type: "uint8",
      },
      {
        internalType: "bytes",
        name: "_initData",
        type: "bytes",
      },
    ],
    name: "createAlarm",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [],
    name: "nextAlarmId",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "submittingUser",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_pointsEarned",
        type: "uint256",
      },
    ],
    name: "onConfirmationSubmitted",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "enum CommitmentStatus",
        name: "oldStatus",
        type: "uint8",
      },
      {
        internalType: "enum CommitmentStatus",
        name: "newStatus",
        type: "uint8",
      },
    ],
    name: "onStatusChanged",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "user",
        type: "address",
      },
    ],
    name: "onUserJoined",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "enum RegisteredAlarmType",
        name: "",
        type: "uint8",
      },
    ],
    name: "pointMultipliers",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "enum RegisteredAlarmType",
        name: "_type",
        type: "uint8",
      },
      {
        internalType: "address",
        name: "deployedAt",
        type: "address",
      },
    ],
    name: "registerAlarmType",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "renounceOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "enum RegisteredAlarmType",
        name: "_type",
        type: "uint8",
      },
      {
        internalType: "uint256",
        name: "multiplier",
        type: "uint256",
      },
    ],
    name: "setPointsMultiplier",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;
