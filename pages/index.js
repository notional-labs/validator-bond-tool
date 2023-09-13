import Head from 'next/head';
import { Input, Text, ChakraProvider, Center, Link, Flex, Grid, Button, Heading, Box, useToast } from '@chakra-ui/react';
import { useState } from 'react';
import { MsgValidatorBond } from '@hoangdv2429/liquid_staking/dist/codegen/staking/v1beta1/tx';
import { SigningStargateClient } from "@cosmjs/stargate";
import { AminoConverter } from '@hoangdv2429/liquid_staking/dist/codegen/staking/v1beta1/tx.amino';

const chanId = 'cosmoshub-4'
const defaultGas = '40000'
const rpc = 'https://rpc-cosmoshub-ia.cosmosia.notional.ventures/'
const typeUrl = '/liquidstaking.staking.v1beta1.MsgValidatorBond'

const getOfflineSigner = async (chainId) => {
  try {
    if (!window.getOfflineSigner || !window.keplr) {
      alert("Keplr Wallet not detected, please install extension");
      throw new Error("Keplr not found");
    } else {
      try {
        await window.keplr.enable(chainId);
      } catch (e) {
        const experimentalChain = chainObj[chainId];
        if (!experimentalChain) throw e;
        await window.keplr.experimentalSuggestChain(experimentalChain);
      }
      const offlineSigner = window.keplr.getOfflineSigner(chainId);
      const account = await window.keplr.getKey(chainId);
      return {
        account,
        offlineSigner,
      };
    }
  } catch (e) {
    throw e;
  }
};

const getStargateClient = async (signer, rpc) => {
  const client = await SigningStargateClient.connectWithSigner(rpc, signer);
  client.aminoTypes.register[typeUrl] = {
    aminoType: AminoConverter[typeUrl].aminoType,
    toAmino: AminoConverter[typeUrl].toAmino,
    fromAmino: AminoConverter[typeUrl].fromAmino,
  }

  client.registry.register(typeUrl, MsgValidatorBond)

  return client;
};


export default function Home() {
  const toast = useToast()
  const [info, setInfor] = useState({
    delegatorAddress: '',
    validatorAddress: ''
  })

  const handleChange = (key, value) => {
    let newInfor = info
    newInfor[key] = value
    setInfor({
      ...newInfor
    })
  }

  const validatorBond = async () => {
    try {
      const msgBody = MsgValidatorBond.fromPartial({
        ...info,
      })

      const msg = {
        typeUrl: typeUrl,
        value: msgBody,
      };
      const { account, offlineSigner } = await getOfflineSigner(
        chanId
      );
      const fee = {
        amount: [],
        gas: defaultGas,
      };

      const stargate = await getStargateClient(offlineSigner, rpc);
      if (stargate != null) {
        await stargate.signAndBroadcast(account.bech32Address, [msg], fee, "From Notional with love");
      }
      toast({
        position: 'top-right',
        status: 'success',
        render: () => (
          <Box color='white' p={4} bg='#58ed80'>
            Successful
          </Box>
        ),
      })
    } catch (e) {
      toast({
        position: 'top-right',
        render: () => (
          <Box color='white' p={4} bg='#f5230a'>
            {e.message}
          </Box>
        ),
      })
    }
  }

  const checkDisable = () => {
    if (info.delegatorAddress === '' || info.validatorAddress === '') {
      return true
    }
    return false
  }

  return (
    <ChakraProvider>
      <Head>
        <title>Validator bond</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Flex direction={'column'} justify={'space-between'} height={'100vh'}>
        <Box padding={'2em 0'}>
          <Center>
            <Heading>
              Validator Bond Tool
            </Heading>
          </Center>

          <Center>
            <Grid w={'50%'} gap={'50px'} padding={'2rem'}>
              <Center gap={1}>
                <Text w={'20%'}>
                  Delegator address
                </Text>
                <Input placeholder='address here' onBlur={(e) => handleChange('delegatorAddress', e.target.value)} />
              </Center>
              <Center>
                <Text w={'20%'}>
                  Validator address
                </Text>
                <Input placeholder='address here' onBlur={(e) => handleChange('validatorAddress', e.target.value)} />
              </Center>
              <Button color='white' backgroundColor={'#ff513d'} _hover={{ backgroundColor: '#ad3628' }} onClick={validatorBond} isDisabled={checkDisable()}>
                Validator Bond
              </Button>
            </Grid>
          </Center>
        </Box>

        <footer style={{
          backgroundColor: '#2b2b2b',
          color: 'white'
        }}>
          <Center gap={1}>
            <Text>
              Powered by
            </Text>
            <Link
              href="https://notional.ventures/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#85c8ff'
              }}
            >
              Notional
            </Link>
          </Center>
        </footer>

        <style jsx>{`
        main {
          padding: 5rem 0;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }
        footer {
          width: 100%;
          height: 100px;
          border-top: 1px solid #eaeaea;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        footer img {
          margin-left: 0.5rem;
        }
        footer a {
          display: flex;
          justify-content: center;
          align-items: center;
          text-decoration: none;
          color: inherit;
        }
        code {
          background: #fafafa;
          border-radius: 5px;
          padding: 0.75rem;
          font-size: 1.1rem;
          font-family:
            Menlo,
            Monaco,
            Lucida Console,
            Liberation Mono,
            DejaVu Sans Mono,
            Bitstream Vera Sans Mono,
            Courier New,
            monospace;
        }
      `}</style>

        <style jsx global>{`
        html,
        body {
          padding: 0;
          margin: 0;
          font-family:
            -apple-system,
            BlinkMacSystemFont,
            Segoe UI,
            Roboto,
            Oxygen,
            Ubuntu,
            Cantarell,
            Fira Sans,
            Droid Sans,
            Helvetica Neue,
            sans-serif;
        }
        * {
          box-sizing: border-box;
        }
      `}</style>
      </Flex>
    </ChakraProvider>
  );
}
