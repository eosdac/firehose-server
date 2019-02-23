const {Serialize} = require('eosjs')
const {TextDecoder, TextEncoder} = require('text-encoding')

class FirehoseDeltaHandler {
    constructor({config}) {
        this.config = config
    }

    async getTableType (code, table){
        const contract = await this.api.getContract(code)
        const abi = await this.api.getAbi(code)

        // console.log(abi)

        let this_table, type
        for (let t of abi.tables) {
            if (t.name == table) {
                this_table = t
                break
            }
        }

        if (this_table) {
            type = this_table.type
        } else {
            console.error(`Could not find table "${table}" in the abi`)
            return
        }

        return contract.types.get(type)
    }

    queueDelta(block_num, deltas) {}

    async processDelta(block_num, deltas, types) {

        for (const delta of deltas) {
            switch (delta[0]) {
                case 'table_delta_v0':
                    if (delta[1].name == 'generated_transaction') {
                        for (const row of delta[1].rows) {
                            const type = types.get(delta[1].name)
                            const data_sb = new Serialize.SerialBuffer({
                                textEncoder: new TextEncoder,
                                textDecoder: new TextDecoder,
                                array: row.data
                            })
                            const data = type.deserialize(data_sb, new Serialize.SerializerState({ bytesAsUint8Array: true }))

                        }
                    }
                    else if (delta[1].name == 'contract_row') {
                        for (const row of delta[1].rows) {
                            const type = types.get(delta[1].name);
                            const sb = new Serialize.SerialBuffer({
                                textEncoder: new TextEncoder,
                                textDecoder: new TextDecoder,
                                array: row.data
                            });


                            const row_version = sb.get(); // ?
                            const code = sb.getName();
                            const scope = sb.getName();
                            const table = sb.getName();

                            // console.log(`Got table state change for ${code}:${table}`, global.clients)

                            global.clients.forEach((client) => {
                                if (client && client.interested('contract_row', {code, scope, table})){
                                    console.log(`Client is interested in ${code}:${table}`)
                                    const data_str = Buffer.from(row.data).toString('hex')
                                    client.connection.send(JSON.stringify({type:'contract_row', data:data_str, block_num}))
                                }
                            })
                        }
                    }
                    break;
            }
        }
    }
}


class FirehoseTraceHandler {
    queueTrace(block_num, traces){

    }

    processTrace(block_num, traces){
        for (const trace of traces) {
            switch (trace[0]) {
                case 'transaction_trace_v0':
                    const trx = trace[1];
                    for (let action of trx.action_traces) {
                        //console.log(action)
                        switch (action[0]) {
                            case 'action_trace_v0':
                                // console.log(action[1])

                                const receiver = action[1].receipt[1].receiver
                                const code = action[1].act.account
                                const name = action[1].act.name

                                global.clients.forEach((client) => {
                                    if (client && client.interested('action_trace', {receiver, code, name})){
                                        console.log(`Client is interested in ${code}:${name}`)

                                        let act = action[1].act

                                        // For some reason, data_str is updated globally
                                        if (typeof act.data !== 'string'){
                                            const data_str = Buffer.from(act.data).toString('hex')
                                            act.data = data_str
                                        }

                                        act.trx = {
                                            id: trx.id,
                                            status: trx.status
                                        }
                                        client.connection.send(JSON.stringify({type:'action_trace', data:JSON.stringify(act), block_num}))
                                    }
                                })
                                // this.action_handler.queueAction(block_num, action[1]);
                                break;
                        }
                    }
                    break;
            }
        }
    }
}


module.exports = {FirehoseDeltaHandler, FirehoseTraceHandler}