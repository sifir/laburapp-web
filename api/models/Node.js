/**
 * Node.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

    attributes: {
        name: {
            type: 'string',
            required: true
        },

        tag: {
            type: 'string',
            required: true
        },

        dias: {
            type: 'array'
        },

        geolocation: {
            type: 'string'
        },

        isGPSenabled: {
            type: 'boolean'
        },

        isFingerEnabled: {
            type: 'boolean'
        },

        shift_starts: {
            type: 'int'
        },

        shift_ends: {
            type: 'int'
        },

        /**
         * @ORM({association: 'many to one', model: 'User'})
         * @type User.js
         */
        administrator: {
            model: 'user',
            required: true
        },
        /**
         * @ORM({association: 'one to many', model: 'User'})
         * @type User.js
         */
        users: {
            collection: 'user',
            via: 'uses'
        },
        /**
         * @ORM({association: 'one to many', model: 'shift'})
         * @type shift.js
         */
        shifts: {
            collection: 'shift',
            via: 'node'
        },
        /**
         * @ORM({association: 'one to many', model: 'Invite'})
         * @type Invite.js
         */
        invites: {
            collection: 'invite',
            via: 'node'
        },
    },

    beforeCreate: [
        function validoElNodo(nodoACrear, cb) {
            // llamar a cb con error para cancelar la creacion
            // cb(new Error('no se pueden crear dos nodos con el mismo nfc'))
            console.log(nodoACrear);
            Node.findOne()
                .where({
                    tag: nodoACrear.tag,
                    administrator: nodoACrear.administrator
                }).exec(function (err, node) {
                    if (err)
                        return cb(err);
                    if (node)
                        return cb({ status: 422, message: 'Ya existe un nodo con este tag'});
                    
                    return cb();
                });
        }
    ],

    afterDestroy: [
        function destroyInvites(deletedValues, done) {
            deletedValues.forEach(deletedValue => {
                console.log('eliminando invites del nodo: ' + deletedValue.id);
                Invite.destroy({
                    node: deletedValue.id
                }).exec(function (err) {
                    if (err)
                        console.error('error eliminando invites', err);
                    done();
                });
            });
        },
        function destroyShifts(deletedValues, done) {
            deletedValues.forEach(deletedValue => {
                console.log('eliminando shifts del nodo: ' + deletedValue.id);
                Shift.destroy({
                    node: deletedValue.id
                }).exec(function (err) {
                    if (err)
                        console.error('error eliminando shifts', err);
                    done();
                });
            });
        }
    ]
};

