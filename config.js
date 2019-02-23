// module.exports = {
//     firehose: {
//         httpPort: 1337
//     },
//     eos: {
//         contracts: ['eosio.token'],
//         chainId: "e70aaab8997e1dfce58fbfac80cbbb8fecec7b99cf982a9444273cbc64c41473",
//         endpoint: 'http://jungle2.eosdac.io:8882',
//         wsEndpoint: 'ws://jungle2.eosdac.io:8080'
//     }
// }
module.exports = {
    firehose: {
        httpHost: '127.0.0.1',
        httpPort: 1337
    },
    eos: {
        chainId: "e70aaab8997e1dfce58fbfac80cbbb8fecec7b99cf982a9444273cbc64c41473",
        endpoint: 'http://eu.eosdac.io',
        wsEndpoint: 'ws://ex2.eosdac.io:8080'
    }
}
