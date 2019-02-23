
class FirehoseWSClient {
    constructor({connection}){
        this.connection = connection
        this.registrations = {}
    }

    interested(type, data){
        switch (type) {
            case 'contract_row':
            {
                const code = data.code
                const table = data.table
                const scope = data.scope

                if (this.registrations[type]) {

                    for (let i = 0; i < this.registrations[type].length; i++) {

                        const reg_code = this.registrations[type][i].code
                        const reg_table = this.registrations[type][i].table
                        const reg_scope = this.registrations[type][i].scope

                        if (
                            reg_code === code &&
                            (reg_table === table || reg_table === '*') &&
                            (reg_scope === scope || reg_scope === '*')
                        ) {

                            return true
                        }
                    }
                }
            }
                break;
            case 'action_trace':
            {
                // console.log(data)
                const code = data.code
                const receiver = data.receiver
                const name = data.name

                if (this.registrations[type]){

                    for (let i=0;i<this.registrations[type].length;i++){

                        const reg_code = this.registrations[type][i].code
                        const reg_receiver = this.registrations[type][i].receiver
                        const reg_name = this.registrations[type][i].name

                        if (
                            reg_code === code &&
                            (reg_receiver === receiver || reg_receiver === '*') &&
                            (reg_name === name || reg_name === '*')
                        ){

                            return true
                        }

                    }
                }
            }

                break;
        }

        return false
    }

    register(type, data){
        if (typeof this.registrations[type] == 'undefined'){
            this.registrations[type] = []
        }


        if (type === 'contract_row'){
            data = {
                code: '*',
                table: '*',
                scope: '*',
                ...data
            }
        }
        else if (type === 'action_trace'){
            data = {
                code: '*',
                receiver: '*',
                name: '*',
                ...data
            }
        }

        this.registrations[type].push(data)
    }
}

module.exports = FirehoseWSClient