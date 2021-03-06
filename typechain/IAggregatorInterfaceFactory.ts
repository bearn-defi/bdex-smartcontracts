/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Signer } from "ethers";
import { Provider } from "@ethersproject/providers";

import type { IAggregatorInterface } from "./IAggregatorInterface";

export class IAggregatorInterfaceFactory {
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): IAggregatorInterface {
    return new Contract(
      address,
      _abi,
      signerOrProvider
    ) as IAggregatorInterface;
  }
}

const _abi = [
  {
    inputs: [],
    name: "latestAnswer",
    outputs: [
      {
        internalType: "int256",
        name: "",
        type: "int256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];
