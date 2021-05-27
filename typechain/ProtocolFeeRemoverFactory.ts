/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Signer } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import { Contract, ContractFactory, Overrides } from "@ethersproject/contracts";

import type { ProtocolFeeRemover } from "./ProtocolFeeRemover";

export class ProtocolFeeRemoverFactory extends ContractFactory {
  constructor(signer?: Signer) {
    super(_abi, _bytecode, signer);
  }

  deploy(overrides?: Overrides): Promise<ProtocolFeeRemover> {
    return super.deploy(overrides || {}) as Promise<ProtocolFeeRemover>;
  }
  getDeployTransaction(overrides?: Overrides): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  attach(address: string): ProtocolFeeRemover {
    return super.attach(address) as ProtocolFeeRemover;
  }
  connect(signer: Signer): ProtocolFeeRemoverFactory {
    return super.connect(signer) as ProtocolFeeRemoverFactory;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): ProtocolFeeRemover {
    return new Contract(address, _abi, signerOrProvider) as ProtocolFeeRemover;
  }
}

const _abi = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "pair",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "token0",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "token1",
        type: "uint256",
      },
    ],
    name: "RemoveLiquidity",
    type: "event",
  },
  {
    inputs: [],
    name: "governance",
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
    inputs: [],
    name: "receiver",
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
        internalType: "address[]",
        name: "pairs",
        type: "address[]",
      },
    ],
    name: "remove",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_governance",
        type: "address",
      },
    ],
    name: "setGovernance",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_receiver",
        type: "address",
      },
    ],
    name: "setReceiver",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_token",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_value",
        type: "uint256",
      },
    ],
    name: "transfer",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

const _bytecode =
  "0x608060405234801561001057600080fd5b50600180546001600160a01b031916331790556109e4806100326000396000f3fe608060405234801561001057600080fd5b50600436106100725760003560e01c8063a9059cbb11610050578063a9059cbb1461014d578063ab033ea914610186578063f7260d3e146101b957610072565b80635aa6e675146100775780635e4ba17c146100a8578063718da7ee1461011a575b600080fd5b61007f6101c1565b6040805173ffffffffffffffffffffffffffffffffffffffff9092168252519081900360200190f35b610118600480360360208110156100be57600080fd5b8101906020810181356401000000008111156100d957600080fd5b8201836020820111156100eb57600080fd5b8035906020019184602083028401116401000000008311171561010d57600080fd5b5090925090506101dd565b005b6101186004803603602081101561013057600080fd5b503573ffffffffffffffffffffffffffffffffffffffff166104d2565b6101186004803603604081101561016357600080fd5b5073ffffffffffffffffffffffffffffffffffffffff813516906020013561059f565b6101186004803603602081101561019c57600080fd5b503573ffffffffffffffffffffffffffffffffffffffff166106bc565b61007f610789565b60015473ffffffffffffffffffffffffffffffffffffffff1681565b60005473ffffffffffffffffffffffffffffffffffffffff168061024c576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252602c815260200180610983602c913960400191505060405180910390fd5b60005b828110156104cc57600084848381811061026557fe5b9050602002013573ffffffffffffffffffffffffffffffffffffffff16905060008173ffffffffffffffffffffffffffffffffffffffff166370a08231306040518263ffffffff1660e01b8152600401808273ffffffffffffffffffffffffffffffffffffffff16815260200191505060206040518083038186803b1580156102ed57600080fd5b505afa158015610301573d6000803e3d6000fd5b505050506040513d602081101561031757600080fd5b5051905080156104c257604080517fa9059cbb00000000000000000000000000000000000000000000000000000000815273ffffffffffffffffffffffffffffffffffffffff84166004820181905260248201849052915163a9059cbb916044808201926020929091908290030181600087803b15801561039757600080fd5b505af11580156103ab573d6000803e3d6000fd5b505050506040513d60208110156103c157600080fd5b5050604080517f89afcb4400000000000000000000000000000000000000000000000000000000815273ffffffffffffffffffffffffffffffffffffffff868116600483015282516000938493928716926389afcb44926024808301939282900301818787803b15801561043457600080fd5b505af1158015610448573d6000803e3d6000fd5b505050506040513d604081101561045e57600080fd5b50805160209182015160408051838152938401829052805192955090935073ffffffffffffffffffffffffffffffffffffffff8716927f0fbf06c058b90cb038a618f8c2acbf6145f8b3570fd1fa56abb8f0f3f05b36e8929081900390910190a250505b505060010161024f565b50505050565b60015473ffffffffffffffffffffffffffffffffffffffff16331461055857604080517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152601d60248201527f50726f746f636f6c46656552656d6f7665723a20464f5242494444454e000000604482015290519081900360640190fd5b600080547fffffffffffffffffffffffff00000000000000000000000000000000000000001673ffffffffffffffffffffffffffffffffffffffff92909216919091179055565b60015473ffffffffffffffffffffffffffffffffffffffff16331461062557604080517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152601d60248201527f50726f746f636f6c46656552656d6f7665723a20464f5242494444454e000000604482015290519081900360640190fd5b60005473ffffffffffffffffffffffffffffffffffffffff16610693576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252602c815260200180610983602c913960400191505060405180910390fd5b6000546106b890839073ffffffffffffffffffffffffffffffffffffffff16836107a5565b5050565b60015473ffffffffffffffffffffffffffffffffffffffff16331461074257604080517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152601d60248201527f50726f746f636f6c46656552656d6f7665723a20464f5242494444454e000000604482015290519081900360640190fd5b600180547fffffffffffffffffffffffff00000000000000000000000000000000000000001673ffffffffffffffffffffffffffffffffffffffff92909216919091179055565b60005473ffffffffffffffffffffffffffffffffffffffff1681565b6040805173ffffffffffffffffffffffffffffffffffffffff8481166024830152604480830185905283518084039091018152606490920183526020820180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff167fa9059cbb00000000000000000000000000000000000000000000000000000000178152925182516000946060949389169392918291908083835b6020831061087b57805182527fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0909201916020918201910161083e565b6001836020036101000a0380198251168184511680821785525050505050509050019150506000604051808303816000865af19150503d80600081146108dd576040519150601f19603f3d011682016040523d82523d6000602084013e6108e2565b606091505b5091509150818015610910575080511580610910575080806020019051602081101561090d57600080fd5b50515b61097b57604080517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152601f60248201527f5472616e7366657248656c7065723a205452414e534645525f4641494c454400604482015290519081900360640190fd5b505050505056fe50726f746f636f6c46656552656d6f7665723a20496e76616c69642052656365697665722061646472657373a2646970667358221220f62780b6a82abfa5f8f0cd730b8a073f33e29726e1de542ceaa3319b38de9a7264736f6c634300060c0033";