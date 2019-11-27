/**
 * Stamp.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

    attributes: {

        started: {
            type: 'datetime',
            defaultsTo: new Date()
        },
        
        ended: {
            type: 'datetime'
        },

        /**
         * @ORM({association: 'many to one', model: 'node'})
         * @type node.js
         */
        node: {
            model: 'node',
            required: true
        },

        /**
         * @ORM({association: 'many to one', model: 'user'})
         * @type user.js
         */
        user: {
            model: 'user',
            required: true
        },
        
        /**
         * @ORM({association: 'one to many', model: 'Stamp'})
         * @type Stamp.js
         */
        stamps: {
            collection: 'stamp',
            via: 'shift'
        }
    },

    afterDestroy: [
        function destroyStamps(deletedValues, done) {
            deletedValues.forEach(deletedValue => {
                console.log('eliminando stamps del shift: ' + deletedValue.id);
                Stamp.destroy({
                    shift: deletedValue.id
                }).exec(function (err) {
                    if (err)
                        console.error('error eliminando stamp', err);
                    done();
                });
            });
        }
    ]
};

