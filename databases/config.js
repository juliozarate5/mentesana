const mongoose = require('mongoose')

const mongoConection = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            dbName: 'psicologia',
            autoCreate: true
        })
        console.log('Successful Connect!')
    } catch(e){
        console.log('Error Connecting', e)
        throw new Error('Error Connecting')
    }
}

module.exports = { mongoConection }